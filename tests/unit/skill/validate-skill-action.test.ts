import { describe, expect, it } from "vitest";
import type { Skill } from "../../../src/core/skill/skill";
import type { SkillBody } from "../../../src/core/skill/skill-body";
import type { SkillMetadata } from "../../../src/core/skill/skill-metadata";
import {
	validateActionExists,
	validateActionRequired,
} from "../../../src/core/skill/validate-skill-action";
import { ErrorType } from "../../../src/core/types/errors";

function createTestSkill(overrides: Partial<SkillMetadata> = {}): Skill {
	return {
		metadata: {
			name: "test-skill",
			description: "A test skill",
			mode: "template",
			inputs: [],
			tools: ["bash"],
			context: [],
			...overrides,
		} as SkillMetadata,
		body: {} as SkillBody,
		location: "/test/SKILL.md",
		scope: "local",
	};
}

describe("validateActionRequired", () => {
	it("アクション定義があり actionName が未指定の場合エラーを返す", () => {
		const skill = createTestSkill({
			actions: {
				build: { description: "Build the project" },
				test: { description: "Run tests" },
			},
		});

		const result = validateActionRequired(skill, undefined);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.Config);
			expect(result.error.message).toContain("requires an action");
			expect(result.error.message).toContain("build, test");
		}
	});

	it("アクション定義があり actionName が指定されている場合は ok を返す", () => {
		const skill = createTestSkill({
			actions: {
				build: { description: "Build the project" },
			},
		});

		const result = validateActionRequired(skill, "build");

		expect(result.ok).toBe(true);
	});

	it("アクション定義がない場合は ok を返す", () => {
		const skill = createTestSkill();

		const result = validateActionRequired(skill, undefined);

		expect(result.ok).toBe(true);
	});
});

describe("validateActionExists", () => {
	it("actionName が未指定の場合は ok(undefined) を返す", () => {
		const skill = createTestSkill();

		const result = validateActionExists(skill, undefined);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBeUndefined();
		}
	});

	it("存在するアクションを指定した場合はそのアクションを返す", () => {
		const action = { description: "Build the project" };
		const skill = createTestSkill({
			actions: { build: action },
		});

		const result = validateActionExists(skill, "build");

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toEqual(action);
		}
	});

	it("存在しないアクションを指定した場合エラーを返す", () => {
		const skill = createTestSkill({
			actions: {
				build: { description: "Build the project" },
			},
		});

		const result = validateActionExists(skill, "deploy");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.SkillNotFound);
			if (result.error.type === ErrorType.SkillNotFound) {
				expect(result.error.name).toContain("deploy");
				expect(result.error.name).toContain("build");
			}
		}
	});

	it("アクション定義自体がない場合エラーを返す", () => {
		const skill = createTestSkill();

		const result = validateActionExists(skill, "build");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.SkillNotFound);
			if (result.error.type === ErrorType.SkillNotFound) {
				expect(result.error.name).toContain("build");
				expect(result.error.name).toContain("none");
			}
		}
	});
});
