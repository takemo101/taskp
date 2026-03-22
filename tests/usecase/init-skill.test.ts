import { describe, expect, it } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { ErrorType } from "../../src/core/types/errors";
import { err, ok } from "../../src/core/types/result";
import { initSkill } from "../../src/usecase/init-skill";
import type { SkillInitializer } from "../../src/usecase/port/skill-initializer";
import type { SkillRepository } from "../../src/usecase/port/skill-repository";

function stubRepository(skills: Skill[] = []): SkillRepository {
	return {
		findByName: () => Promise.resolve(err({ type: ErrorType.SkillNotFound, name: "" })),
		listAll: () => Promise.resolve({ skills, failures: [] }),
		listLocal: () => Promise.resolve({ skills: [], failures: [] }),
		listGlobal: () => Promise.resolve({ skills: [], failures: [] }),
	};
}

function stubInitializer(path: string): SkillInitializer {
	return {
		create: () => Promise.resolve(ok(path)),
	};
}

function makeSkill(name: string): Skill {
	return {
		metadata: {
			name,
			description: "test",
			mode: "template",
			inputs: [],
			tools: [],
			context: [],
		},
		body: {
			content: "",
			extractCodeBlocks: () => [],
			extractActionSection: () => undefined,
			extractActionCodeBlocks: () => [],
		},
		location: `.taskp/skills/${name}/SKILL.md`,
		scope: "local",
	};
}

describe("initSkill", () => {
	it("generates template mode scaffold", async () => {
		const deps = {
			skillRepository: stubRepository(),
			skillInitializer: stubInitializer(".taskp/skills/my-task/SKILL.md"),
		};

		const result = await initSkill(deps, {
			name: "my-task",
			global: false,
			mode: "template",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toEqual({
				name: "my-task",
				path: ".taskp/skills/my-task/SKILL.md",
				mode: "template",
			});
		}
	});

	it("generates agent mode scaffold", async () => {
		const deps = {
			skillRepository: stubRepository(),
			skillInitializer: stubInitializer(".taskp/skills/review/SKILL.md"),
		};

		const result = await initSkill(deps, {
			name: "review",
			global: false,
			mode: "agent",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toEqual({
				name: "review",
				path: ".taskp/skills/review/SKILL.md",
				mode: "agent",
			});
		}
	});

	it("uses global path when --global is specified", async () => {
		const globalPath = "~/.taskp/skills/my-task/SKILL.md";
		const deps = {
			skillRepository: stubRepository(),
			skillInitializer: stubInitializer(globalPath),
		};

		const result = await initSkill(deps, {
			name: "my-task",
			global: true,
			mode: "template",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.path).toBe(globalPath);
		}
	});

	it("returns error when skill name already exists", async () => {
		const deps = {
			skillRepository: stubRepository([makeSkill("existing-skill")]),
			skillInitializer: stubInitializer("unused"),
		};

		const result = await initSkill(deps, {
			name: "existing-skill",
			global: false,
			mode: "template",
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.Config);
			expect(result.error).toHaveProperty("message");
			expect((result.error as { message: string }).message).toContain("already exists");
		}
	});

	it("passes mode and description to initializer", async () => {
		let capturedOptions: { mode: string; description: string } | undefined;
		const deps = {
			skillRepository: stubRepository(),
			skillInitializer: {
				create: (_name: string, options: { mode: string; description: string }) => {
					capturedOptions = options;
					return Promise.resolve(ok(".taskp/skills/test/SKILL.md"));
				},
			},
		};

		await initSkill(deps, {
			name: "test",
			global: false,
			mode: "agent",
		});

		expect(capturedOptions).toEqual({
			mode: "agent",
			description: "test skill",
		});
	});
});
