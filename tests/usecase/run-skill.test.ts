import { describe, expect, it } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { createSkillBody } from "../../src/core/skill/skill-body";
import { executionError, skillNotFoundError } from "../../src/core/types/errors";
import { err, ok } from "../../src/core/types/result";
import type { CommandExecutor } from "../../src/usecase/port/command-executor";
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

function createTestSkill(rawMarkdown: string = TEMPLATE_SKILL_MD): Skill {
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
		},
		body: createSkillBody(rawMarkdown),
		location: "/skills/deploy",
		scope: "global",
	};
}

function stubRepository(skill?: Skill): SkillRepository {
	return {
		findByName: async (name: string) => (skill ? ok(skill) : err(skillNotFoundError(name))),
		listAll: async () => (skill ? [skill] : []),
		listLocal: async () => [],
		listGlobal: async () => (skill ? [skill] : []),
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
});
