import { describe, expect, it } from "vitest";
import { filterSkills, type SkillOption } from "../../../src/tui/components/fuzzy-select";

const skills: SkillOption[] = [
	{ name: "code-review", description: "コードレビューを実行する" },
	{ name: "deploy", description: "アプリケーションをデプロイする" },
	{
		name: "find-refactoring",
		description: "リファクタリング箇所を検出する",
	},
];

describe("filterSkills", () => {
	it("returns all skills when query is empty", () => {
		expect(filterSkills("", skills)).toHaveLength(3);
	});

	it("filters by name match", () => {
		const result = filterSkills("deploy", skills);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("deploy");
	});

	it("supports fuzzy matching", () => {
		const result = filterSkills("cdr", skills);
		expect(result.length).toBeGreaterThanOrEqual(1);
		expect(result[0].name).toBe("code-review");
	});

	it("filters by description match", () => {
		const result = filterSkills("リファクタリング", skills);
		expect(result.length).toBeGreaterThanOrEqual(1);
		expect(result[0].name).toBe("find-refactoring");
	});

	it("returns empty array when no match", () => {
		expect(filterSkills("zzzzzzz", skills)).toHaveLength(0);
	});
});
