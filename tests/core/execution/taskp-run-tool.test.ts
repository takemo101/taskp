import { describe, expect, it } from "vitest";
import type { TaskpRunDeps, TaskpRunResult } from "../../../src/core/execution/agent-tools";
import { buildTools, TOOL_NAMES } from "../../../src/core/execution/agent-tools";
import type { Skill } from "../../../src/core/skill/skill";
import { createSkillBody } from "../../../src/core/skill/skill-body";
import { createInMemorySkillRepository } from "../../stubs/in-memory-skill-repository";
import { createStubCommandExecutor } from "../../stubs/stub-command-executor";
import { createStubPromptCollector } from "../../stubs/stub-prompt-collector";

const TEMPLATE_SKILL_MD = `---
name: greet
description: Greeting skill
mode: template
inputs:
  - name: target
    type: text
    message: "Who?"
---

Hello {{target}}!

\`\`\`bash
echo "Hello {{target}}"
\`\`\`
`;

const AGENT_SKILL_MD = `---
name: agent-skill
description: Agent skill
mode: agent
inputs: []
---

Do agent stuff.
`;

const ACTION_SKILL_MD = `---
name: multi
description: Multi action skill
mode: template
actions:
  list:
    description: List items
    inputs:
      - name: filter
        type: text
        message: "Filter?"
  agent-action:
    description: Agent action
    mode: agent
    inputs: []
---

## action:list

List items with filter={{filter}}.

\`\`\`bash
echo "listing {{filter}}"
\`\`\`

## action:agent-action

Agent action content.
`;

function createSkill(raw: string, nameOverride?: string): Skill {
	const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/);
	const nameMatch = frontmatter?.[1].match(/name:\s*(.+)/);
	const name = nameOverride ?? nameMatch?.[1].trim() ?? "test";

	const descMatch = frontmatter?.[1].match(/description:\s*(.+)/);
	const modeMatch = frontmatter?.[1].match(/mode:\s*(.+)/);
	const mode = (modeMatch?.[1].trim() ?? "template") as "template" | "agent";

	const inputsMatch = frontmatter?.[1].match(/inputs:\n((?:\s+-[\s\S]*?)?)(?=\n\w|\nactions:|$)/);
	const inputs: Skill["metadata"]["inputs"] = [];
	if (inputsMatch?.[1]) {
		const inputBlocks = inputsMatch[1].split(/\n\s+-\s+name:\s+/).filter(Boolean);
		for (const block of inputBlocks) {
			const nameM = block.match(/^(\S+)|name:\s+(\S+)/);
			const inputName = nameM?.[1] ?? nameM?.[2] ?? "";
			inputs.push({
				name: inputName,
				type: "text" as const,
				message: `${inputName}?`,
			});
		}
	}

	const actionsMatch = frontmatter?.[1].match(/actions:\n([\s\S]*?)$/);
	let actions:
		| Record<
				string,
				{ description: string; mode?: "template" | "agent"; inputs: Skill["metadata"]["inputs"] }
		  >
		| undefined;
	if (actionsMatch) {
		actions = {};
		const actionBlocks = actionsMatch[1].split(/\n\s{2}(?=\S)/);
		for (const block of actionBlocks) {
			const lines = block.trim().split("\n");
			const actionName = lines[0].replace(":", "").trim();
			if (!actionName) continue;
			const actionMode = block.match(/mode:\s+(\S+)/)?.[1] as "template" | "agent" | undefined;
			actions[actionName] = {
				description: `${actionName} action`,
				mode: actionMode,
				inputs: [],
			};
		}
	}

	return {
		metadata: {
			name,
			description: descMatch?.[1].trim() ?? "test",
			mode,
			inputs,
			model: undefined,
			tools: ["bash", "read", "write"],
			context: [],
			...(actions ? { actions } : {}),
		},
		body: createSkillBody(raw),
		location: `/skills/${name}`,
		scope: "global",
	};
}

function createDeps(skills: readonly Skill[], callStack?: readonly string[]): TaskpRunDeps {
	return {
		skillRepository: createInMemorySkillRepository(skills),
		commandExecutor: createStubCommandExecutor(),
		promptCollector: createStubPromptCollector({}),
		callStack,
	};
}

function unwrapTaskpRun(deps: TaskpRunDeps) {
	const result = buildTools(["taskp_run"], { taskpRunDeps: deps });
	if (!result.ok) throw new Error(`buildTools failed: ${result.error.message}`);
	return result.value.taskp_run;
}

const toolContext = { toolCallId: "1", messages: [], abortSignal: AbortSignal.timeout(5000) };

describe("TOOL_NAMES", () => {
	it("taskp_run を含む", () => {
		expect(TOOL_NAMES).toContain("taskp_run");
	});
});

describe("buildTools with taskp_run", () => {
	it("taskpRunDeps なしで taskp_run を要求するとエラー", () => {
		const result = buildTools(["taskp_run"]);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.message).toContain("taskpRunDeps");
	});

	it("taskpRunDeps ありで taskp_run を構築できる", () => {
		const deps = createDeps([]);
		const result = buildTools(["taskp_run"], { taskpRunDeps: deps });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.taskp_run).toBeDefined();
		expect(result.value.taskp_run.execute).toBeTypeOf("function");
	});

	it("taskp_run と他のツールを同時に構築できる", () => {
		const deps = createDeps([]);
		const result = buildTools(["bash", "taskp_run"], { taskpRunDeps: deps });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(Object.keys(result.value)).toEqual(["bash", "taskp_run"]);
	});
});

describe("taskp_run tool", () => {
	it("template スキルを実行して success を返す", async () => {
		const skill = createSkill(TEMPLATE_SKILL_MD);
		const deps = createDeps([skill]);
		const tool = unwrapTaskpRun(deps);

		const result = (await tool.execute?.(
			{ skill: "greet", set: { target: "world" } },
			toolContext,
		)) as TaskpRunResult;

		expect(result.status).toBe("success");
		expect(result.output).toContain("Hello world");
	});

	it("skill:action 形式でアクション付きスキルを実行できる", async () => {
		const skill = createSkill(ACTION_SKILL_MD);
		const deps = createDeps([skill]);
		const tool = unwrapTaskpRun(deps);

		const result = (await tool.execute?.(
			{ skill: "multi:list", set: { filter: "done" } },
			toolContext,
		)) as TaskpRunResult;

		expect(result.status).toBe("success");
		expect(result.output).toContain("listing done");
	});

	it("agent モードスキルの呼び出しを拒否する", async () => {
		const skill = createSkill(AGENT_SKILL_MD);
		const deps = createDeps([skill]);
		const tool = unwrapTaskpRun(deps);

		const result = (await tool.execute?.({ skill: "agent-skill" }, toolContext)) as TaskpRunResult;

		expect(result.status).toBe("failed");
		expect(result.error).toContain("Cannot call agent mode skill");
	});

	it("agent モードのアクションの呼び出しを拒否する", async () => {
		const skill = createSkill(ACTION_SKILL_MD);
		const deps = createDeps([skill]);
		const tool = unwrapTaskpRun(deps);

		const result = (await tool.execute?.(
			{ skill: "multi:agent-action" },
			toolContext,
		)) as TaskpRunResult;

		expect(result.status).toBe("failed");
		expect(result.error).toContain("Cannot call agent mode skill");
	});

	it("存在しないスキルでエラーを返す", async () => {
		const deps = createDeps([]);
		const tool = unwrapTaskpRun(deps);

		const result = (await tool.execute?.({ skill: "nonexistent" }, toolContext)) as TaskpRunResult;

		expect(result.status).toBe("failed");
		expect(result.error).toContain("Skill not found");
	});

	it("再帰呼び出しを検出してブロックする", async () => {
		const skill = createSkill(TEMPLATE_SKILL_MD);
		const deps = createDeps([skill], ["greet"]);
		const tool = unwrapTaskpRun(deps);

		const result = (await tool.execute?.({ skill: "greet" }, toolContext)) as TaskpRunResult;

		expect(result.status).toBe("failed");
		expect(result.error).toContain("Recursive call detected");
	});

	it("アクション付き再帰呼び出しも検出する", async () => {
		const skill = createSkill(ACTION_SKILL_MD);
		const deps = createDeps([skill], ["multi:list"]);
		const tool = unwrapTaskpRun(deps);

		const result = (await tool.execute?.(
			{ skill: "multi:list", set: { filter: "x" } },
			toolContext,
		)) as TaskpRunResult;

		expect(result.status).toBe("failed");
		expect(result.error).toContain("Recursive call detected");
	});

	it("ネスト深度3超過でエラーを返す", async () => {
		const skill = createSkill(TEMPLATE_SKILL_MD);
		const deps = createDeps([skill], ["a", "b", "c"]);
		const tool = unwrapTaskpRun(deps);

		const result = (await tool.execute?.(
			{ skill: "greet", set: { target: "x" } },
			toolContext,
		)) as TaskpRunResult;

		expect(result.status).toBe("failed");
		expect(result.error).toContain("Maximum nesting depth");
	});

	it("set で変数を渡せる", async () => {
		const skill = createSkill(TEMPLATE_SKILL_MD);
		const executor = createStubCommandExecutor();
		const deps: TaskpRunDeps = {
			skillRepository: createInMemorySkillRepository([skill]),
			commandExecutor: executor,
			promptCollector: createStubPromptCollector({}),
		};
		const tool = unwrapTaskpRun(deps);

		await tool.execute?.({ skill: "greet", set: { target: "pibot" } }, toolContext);

		expect(executor.executedCommands.length).toBe(1);
		expect(executor.executedCommands[0].command).toContain("pibot");
	});

	it("set なしで required 入力が不足している場合はエラーを返す", async () => {
		const skill = createSkill(TEMPLATE_SKILL_MD);
		const deps = createDeps([skill]);
		const tool = unwrapTaskpRun(deps);

		const result = (await tool.execute?.({ skill: "greet" }, toolContext)) as TaskpRunResult;

		// noInput=true かつ set なしなので、テンプレート変数が未解決でエラー
		expect(result.status).toBe("failed");
	});
});
