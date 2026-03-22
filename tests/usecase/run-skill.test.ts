import { describe, expect, it, vi } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { createSkillBody } from "../../src/core/skill/skill-body";
import { executionError, skillNotFoundError } from "../../src/core/types/errors";
import { err, ok } from "../../src/core/types/result";
import type { CommandExecutor } from "../../src/usecase/port/command-executor";
import type { HookContext, HookExecutorPort } from "../../src/usecase/port/hook-executor";
import { createNoopProgressWriter } from "../../src/usecase/port/progress-writer";
import type { PromptCollector } from "../../src/usecase/port/prompt-collector";
import type { SkillRepository } from "../../src/usecase/port/skill-repository";
import type { RunSkillDeps, RunSkillInput } from "../../src/usecase/run-skill";
import { runSkill } from "../../src/usecase/run-skill";

const TEMPLATE_SKILL_MD = `---
name: deploy
description: Deploy app
mode: template
inputs:
  - name: env
    type: select
    message: "Environment?"
    choices: [staging, production]
---

# Deploy

Deploy to {{env}}.

\`\`\`bash
echo "deploying to {{env}}"
\`\`\`
`;

type MetadataOverrides = {
	readonly timeout?: number;
};

function createTestSkill(
	rawMarkdown: string = TEMPLATE_SKILL_MD,
	overrides?: MetadataOverrides,
): Skill {
	return {
		metadata: {
			name: "deploy",
			description: "Deploy app",
			mode: "template",
			inputs: [
				{
					name: "env",
					type: "select",
					message: "Environment?",
					choices: ["staging", "production"],
				},
			],
			model: undefined,
			tools: ["bash", "read", "write"],
			context: [],
			...overrides,
		},
		body: createSkillBody(rawMarkdown),
		location: "/skills/deploy",
		scope: "global",
	};
}

function stubRepository(skill?: Skill): SkillRepository {
	return {
		findByName: async (name: string) => (skill ? ok(skill) : err(skillNotFoundError(name))),
		listAll: async () => ({ skills: skill ? [skill] : [], failures: [] }),
		listLocal: async () => ({ skills: [], failures: [] }),
		listGlobal: async () => ({ skills: skill ? [skill] : [], failures: [] }),
	};
}

function stubCollector(values: Record<string, string>): PromptCollector {
	return {
		collect: async () => ok(values),
	};
}

function stubExecutor(behavior: "success" | "fail" = "success"): CommandExecutor {
	return {
		execute: async (command: string) => {
			if (behavior === "fail") {
				return err(executionError(`Command failed: ${command}`));
			}
			return ok({ stdout: `ok: ${command}`, stderr: "", exitCode: 0 });
		},
	};
}

function createDeps(overrides?: Partial<RunSkillDeps>): RunSkillDeps {
	return {
		skillRepository: stubRepository(createTestSkill()),
		promptCollector: stubCollector({ env: "staging" }),
		commandExecutor: stubExecutor("success"),
		progressWriter: createNoopProgressWriter(),
		...overrides,
	};
}

function createInput(overrides?: Partial<RunSkillInput>): RunSkillInput {
	return {
		name: "deploy",
		presets: {},
		dryRun: false,
		force: false,
		...overrides,
	};
}

describe("runSkill", () => {
	it("executes a template skill successfully", async () => {
		const result = await runSkill(createInput(), createDeps());

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.skillName).toBe("deploy");
		expect(result.value.dryRun).toBe(false);
		expect(result.value.commands).toHaveLength(1);
		expect(result.value.commands[0].result.exitCode).toBe(0);
		expect(result.value.commands[0].command).toContain("deploying to staging");
	});

	it("returns error for non-existent skill", async () => {
		const deps = createDeps({
			skillRepository: stubRepository(),
		});
		const result = await runSkill(createInput({ name: "nonexistent" }), deps);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("SKILL_NOT_FOUND");
	});

	it("stops on command failure without --force", async () => {
		const multiBlockMd = `---
name: deploy
description: Deploy app
mode: template
inputs:
  - name: env
    type: select
    message: "Environment?"
    choices: [staging, production]
---

# Deploy

\`\`\`bash
echo "step 1 {{env}}"
\`\`\`

\`\`\`bash
echo "step 2 {{env}}"
\`\`\`
`;
		const deps = createDeps({
			skillRepository: stubRepository(createTestSkill(multiBlockMd)),
			commandExecutor: stubExecutor("fail"),
		});

		const result = await runSkill(createInput(), deps);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
	});

	it("continues on command failure with --force", async () => {
		const multiBlockMd = `---
name: deploy
description: Deploy app
mode: template
inputs:
  - name: env
    type: select
    message: "Environment?"
    choices: [staging, production]
---

# Deploy

\`\`\`bash
echo "step 1 {{env}}"
\`\`\`

\`\`\`bash
echo "step 2 {{env}}"
\`\`\`
`;
		const deps = createDeps({
			skillRepository: stubRepository(createTestSkill(multiBlockMd)),
			commandExecutor: stubExecutor("fail"),
		});

		const result = await runSkill(createInput({ force: true }), deps);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.commands).toHaveLength(2);
		expect(result.value.commands[0].result.exitCode).toBe(1);
		expect(result.value.commands[1].result.exitCode).toBe(1);
	});

	it("returns rendered content without executing in --dry-run mode", async () => {
		const result = await runSkill(createInput({ dryRun: true }), createDeps());

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.dryRun).toBe(true);
		expect(result.value.commands).toHaveLength(0);
		expect(result.value.rendered).toContain("Deploy to staging");
	});

	it("uses presets to skip prompt collection", async () => {
		const collectedValues: Record<string, string>[] = [];
		const deps = createDeps({
			promptCollector: {
				collect: async (_inputs, presets) => {
					const merged = { env: "production", ...presets };
					collectedValues.push(merged);
					return ok(merged);
				},
			},
		});

		const result = await runSkill(createInput({ presets: { env: "production" } }), deps);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.commands[0].command).toContain("deploying to production");
	});

	it("metadata の timeout が executor に渡される", async () => {
		let receivedOptions: Record<string, unknown> | undefined;

		const deps = createDeps({
			skillRepository: stubRepository(createTestSkill(TEMPLATE_SKILL_MD, { timeout: 300000 })),
			commandExecutor: {
				execute: async (_command, options) => {
					receivedOptions = options as Record<string, unknown>;
					return ok({ stdout: "ok", stderr: "", exitCode: 0 });
				},
			},
		});

		const result = await runSkill(createInput(), deps);

		expect(result.ok).toBe(true);
		expect(receivedOptions).toBeDefined();
		expect(receivedOptions?.timeout).toBe(300000);
	});

	it("timeout 未設定のとき executor に options が渡されない", async () => {
		let receivedOptions: unknown = "NOT_CALLED";

		const deps = createDeps({
			commandExecutor: {
				execute: async (_command, options) => {
					receivedOptions = options;
					return ok({ stdout: "ok", stderr: "", exitCode: 0 });
				},
			},
		});

		const result = await runSkill(createInput(), deps);

		expect(result.ok).toBe(true);
		expect(receivedOptions).toBeUndefined();
	});

	it("passes noInput option to prompt collector", async () => {
		let receivedOptions: { noInput?: boolean } | undefined;
		const deps = createDeps({
			promptCollector: {
				collect: async (_inputs, _presets, options) => {
					receivedOptions = options;
					return ok({ env: "staging" });
				},
			},
		});

		await runSkill(createInput({ noInput: true }), deps);

		expect(receivedOptions).toEqual({ noInput: true });
	});

	it("calls progressWriter.writeInputs with skill inputs and collected variables", async () => {
		let capturedInputs: unknown;
		let capturedVariables: unknown;
		const deps = createDeps({
			progressWriter: {
				writeInputs(inputs, variables) {
					capturedInputs = inputs;
					capturedVariables = variables;
				},
				writeContextSources() {},
			},
		});

		await runSkill(createInput(), deps);

		expect(capturedInputs).toEqual([
			{ name: "env", type: "select", message: "Environment?", choices: ["staging", "production"] },
		]);
		expect(capturedVariables).toEqual({ env: "staging" });
	});

	it("uses noop progressWriter when not provided", async () => {
		const deps = createDeps();
		delete (deps as Record<string, unknown>).progressWriter;

		const result = await runSkill(createInput(), deps);

		expect(result.ok).toBe(true);
	});

	describe("hooks", () => {
		function stubHookExecutor(): HookExecutorPort & {
			calls: { commands: readonly string[]; context: HookContext }[];
		} {
			const calls: { commands: readonly string[]; context: HookContext }[] = [];
			return {
				calls,
				execute: vi.fn(async (commands, context) => {
					calls.push({ commands, context });
					return commands.map((cmd: string) => ({ command: cmd, success: true }));
				}),
			};
		}

		it("calls on_success hook after successful execution", async () => {
			const hookExecutor = stubHookExecutor();
			const deps = createDeps({
				hookExecutor,
				hooksConfig: { on_success: ["echo done"], on_failure: ["echo fail"] },
			});

			const result = await runSkill(createInput(), deps);

			expect(result.ok).toBe(true);
			expect(hookExecutor.execute).toHaveBeenCalledOnce();
			expect(hookExecutor.calls[0].context.status).toBe("success");
			expect(hookExecutor.calls[0].context.mode).toBe("template");
			expect(hookExecutor.calls[0].context.skillName).toBe("deploy");
			expect(hookExecutor.calls[0].context.durationMs).toBeGreaterThanOrEqual(0);
			expect(hookExecutor.calls[0].commands).toEqual(["echo done"]);
		});

		it("calls on_failure hook after failed execution", async () => {
			const hookExecutor = stubHookExecutor();
			const deps = createDeps({
				commandExecutor: stubExecutor("fail"),
				hookExecutor,
				hooksConfig: { on_success: ["echo done"], on_failure: ["echo fail"] },
			});

			const result = await runSkill(createInput(), deps);

			expect(result.ok).toBe(false);
			expect(hookExecutor.execute).toHaveBeenCalledOnce();
			expect(hookExecutor.calls[0].context.status).toBe("failed");
			expect(hookExecutor.calls[0].context.error).toBeDefined();
			expect(hookExecutor.calls[0].commands).toEqual(["echo fail"]);
		});

		it("works without hookExecutor and hooksConfig (backward compatible)", async () => {
			const deps = createDeps();

			const result = await runSkill(createInput(), deps);

			expect(result.ok).toBe(true);
		});

		it("does not call executor when on_success is empty", async () => {
			const hookExecutor = stubHookExecutor();
			const deps = createDeps({
				hookExecutor,
				hooksConfig: { on_success: [], on_failure: [] },
			});

			await runSkill(createInput(), deps);

			expect(hookExecutor.execute).not.toHaveBeenCalled();
		});

		it("returns original result even when hook returns failure results", async () => {
			const hookExecutor: HookExecutorPort = {
				execute: vi.fn(async (commands: readonly string[]) =>
					commands.map((cmd) => ({ command: cmd, success: false, error: "hook failed" })),
				),
			};
			const deps = createDeps({
				hookExecutor,
				hooksConfig: { on_success: ["failing-hook"] },
			});

			const result = await runSkill(createInput(), deps);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.skillName).toBe("deploy");
		});

		it("does not invoke hooks in dry-run mode", async () => {
			const hookExecutor = stubHookExecutor();
			const deps = createDeps({
				hookExecutor,
				hooksConfig: { on_success: ["echo done"] },
			});

			const result = await runSkill(createInput({ dryRun: true }), deps);

			expect(result.ok).toBe(true);
			expect(hookExecutor.execute).not.toHaveBeenCalled();
		});
	});

	describe("action support", () => {
		const ACTION_SKILL_MD = `---
name: task
description: Task manager
mode: template
actions:
  add:
    description: Add a task
    inputs:
      - name: title
        type: text
        message: "Task title?"
  list:
    description: List tasks
---

## action: add

Add task: {{title}}

\`\`\`bash
echo "adding {{title}}"
\`\`\`

## action: list

\`\`\`bash
echo "listing tasks"
\`\`\`
`;

		function createActionSkill(): Skill {
			return {
				metadata: {
					name: "task",
					description: "Task manager",
					mode: "template",
					inputs: [],
					model: undefined,
					tools: ["bash", "read", "write"],
					context: [],
					actions: {
						add: {
							description: "Add a task",
							inputs: [{ name: "title", type: "text", message: "Task title?" }],
						},
						list: {
							description: "List tasks",
						},
					},
				},
				body: createSkillBody(ACTION_SKILL_MD),
				location: "/skills/task",
				scope: "global",
			};
		}

		it("executes only the specified action's code blocks", async () => {
			const executedCommands: string[] = [];
			const deps = createDeps({
				skillRepository: stubRepository(createActionSkill()),
				promptCollector: stubCollector({}),
				commandExecutor: {
					execute: async (command: string) => {
						executedCommands.push(command);
						return ok({ stdout: `ok: ${command}`, stderr: "", exitCode: 0 });
					},
				},
			});

			const result = await runSkill(createInput({ name: "task", action: "list" }), deps);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.commands).toHaveLength(1);
			expect(result.value.commands[0].command).toContain("listing tasks");
			expect(executedCommands).not.toContain(expect.stringContaining("adding"));
		});

		it("collects action-specific inputs", async () => {
			let collectedInputNames: string[] = [];
			const deps = createDeps({
				skillRepository: stubRepository(createActionSkill()),
				promptCollector: {
					collect: async (inputs, _presets) => {
						collectedInputNames = inputs.map((i) => i.name);
						return ok({ title: "my task" });
					},
				},
			});

			const result = await runSkill(createInput({ name: "task", action: "add" }), deps);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(collectedInputNames).toEqual(["title"]);
			expect(result.value.commands[0].command).toContain("adding my task");
		});

		it("returns error for non-existent action", async () => {
			const deps = createDeps({
				skillRepository: stubRepository(createActionSkill()),
				promptCollector: stubCollector({}),
			});

			const result = await runSkill(createInput({ name: "task", action: "nonexistent" }), deps);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			if (result.error.type !== "EXECUTION_ERROR") return;
			expect(result.error.message).toContain("nonexistent");
		});

		it("returns error when action is not specified for skill with actions", async () => {
			const deps = createDeps({
				skillRepository: stubRepository(createActionSkill()),
				promptCollector: stubCollector({}),
			});

			const result = await runSkill(createInput({ name: "task" }), deps);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			if (result.error.type !== "EXECUTION_ERROR") return;
			expect(result.error.message).toContain("actions defined");
		});

		it("supports --set presets for action variables", async () => {
			const deps = createDeps({
				skillRepository: stubRepository(createActionSkill()),
				promptCollector: {
					collect: async (_inputs, presets) => ok({ title: "default", ...presets }),
				},
			});

			const result = await runSkill(
				createInput({ name: "task", action: "add", presets: { title: "preset task" } }),
				deps,
			);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.commands[0].command).toContain("adding preset task");
		});

		it("returns rendered content without executing in --dry-run mode for action", async () => {
			const deps = createDeps({
				skillRepository: stubRepository(createActionSkill()),
				promptCollector: stubCollector({ title: "dry run task" }),
			});

			const result = await runSkill(
				createInput({ name: "task", action: "add", dryRun: true }),
				deps,
			);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.dryRun).toBe(true);
			expect(result.value.commands).toHaveLength(0);
			expect(result.value.rendered).toContain("adding dry run task");
		});

		it("does not break existing non-action skills", async () => {
			const result = await runSkill(createInput(), createDeps());

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.skillName).toBe("deploy");
			expect(result.value.commands).toHaveLength(1);
		});
	});
});
