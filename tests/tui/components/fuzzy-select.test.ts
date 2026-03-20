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
		const result = filterSkills("", skills);
		expect(result).toHaveLength(3);
	});

	it("filters by exact name match", () => {
		const result = filterSkills("deploy", skills);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("deploy");
	});

	it("supports fuzzy matching on name", () => {
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
		const result = filterSkills("zzzzzzz", skills);
		expect(result).toHaveLength(0);
	});

	it("preserves original skill data in results", () => {
		const result = filterSkills("deploy", skills);
		expect(result[0]).toEqual({
			name: "deploy",
			description: "アプリケーションをデプロイする",
		});
	});

	it("does not mutate the input array", () => {
		const original = [...skills];
		filterSkills("code", skills);
		expect(skills).toEqual(original);
	});
});
