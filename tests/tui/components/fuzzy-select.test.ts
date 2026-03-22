import { describe, expect, it } from "vitest";
import {
	buildSkillOptionsWithActions,
	filterSkills,
	type SkillOption,
} from "../../../src/tui/components/fuzzy-select";

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

	it("excludes low-relevance fuzzy matches", () => {
		const manySkills: SkillOption[] = [
			{ name: "github", description: "Interact with GitHub using the gh CLI" },
			{ name: "commit", description: "Read this skill before making git commits" },
			{ name: "brainstorming", description: "You MUST use this before any creative work" },
			{
				name: "frontend-design",
				description: "Design and implement distinctive frontend interfaces",
			},
		];
		const result = filterSkills("git", manySkills);
		const names = result.map((s) => s.name);
		expect(names).toContain("github");
		expect(names).toContain("commit");
		expect(names).not.toContain("brainstorming");
		expect(names).not.toContain("frontend-design");
	});

	it("matches action names in fuzzy search", () => {
		const optionsWithActions: SkillOption[] = [
			{ name: "task", description: "タスクを管理する" },
			{
				name: "task:add",
				description: "タスクを追加する",
				actionName: "add",
				parentSkillName: "task",
			},
			{
				name: "task:delete",
				description: "タスクを削除する",
				actionName: "delete",
				parentSkillName: "task",
			},
			{ name: "deploy", description: "アプリをデプロイする" },
		];

		const result = filterSkills("add", optionsWithActions);
		const names = result.map((s) => s.name);
		expect(names).toContain("task:add");
	});

	it("matches skill name and includes its actions", () => {
		const optionsWithActions: SkillOption[] = [
			{ name: "task", description: "タスクを管理する" },
			{
				name: "task:add",
				description: "タスクを追加する",
				actionName: "add",
				parentSkillName: "task",
			},
			{
				name: "task:delete",
				description: "タスクを削除する",
				actionName: "delete",
				parentSkillName: "task",
			},
			{ name: "deploy", description: "アプリをデプロイする" },
		];

		const result = filterSkills("task", optionsWithActions);
		const names = result.map((s) => s.name);
		expect(names).toContain("task");
		expect(names).toContain("task:add");
		expect(names).toContain("task:delete");
	});

	it("matches colon-separated action format", () => {
		const optionsWithActions: SkillOption[] = [
			{ name: "task", description: "タスクを管理する" },
			{
				name: "task:add",
				description: "タスクを追加する",
				actionName: "add",
				parentSkillName: "task",
			},
			{
				name: "task:delete",
				description: "タスクを削除する",
				actionName: "delete",
				parentSkillName: "task",
			},
		];

		const result = filterSkills("task:d", optionsWithActions);
		const names = result.map((s) => s.name);
		expect(names).toContain("task:delete");
	});
});

describe("buildSkillOptionsWithActions", () => {
	it("builds flat list for skills without actions", () => {
		const skills = [
			{ name: "deploy", description: "Deploy app" },
			{ name: "test", description: "Run tests" },
		];

		const result = buildSkillOptionsWithActions(skills);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ name: "deploy", description: "Deploy app" });
		expect(result[1]).toEqual({ name: "test", description: "Run tests" });
	});

	it("includes action sub-items for skills with actions", () => {
		const skills = [
			{
				name: "task",
				description: "タスクを管理する",
				actions: {
					add: { description: "タスクを追加する" },
					delete: { description: "タスクを削除する" },
				},
			},
			{ name: "deploy", description: "アプリをデプロイする" },
		];

		const result = buildSkillOptionsWithActions(skills);
		expect(result).toHaveLength(4);
		expect(result[0]).toEqual({ name: "task", description: "タスクを管理する" });
		expect(result[1]).toEqual({
			name: "task:add",
			description: "タスクを追加する",
			actionName: "add",
			parentSkillName: "task",
		});
		expect(result[2]).toEqual({
			name: "task:delete",
			description: "タスクを削除する",
			actionName: "delete",
			parentSkillName: "task",
		});
		expect(result[3]).toEqual({ name: "deploy", description: "アプリをデプロイする" });
	});

	it("returns empty array for empty input", () => {
		const result = buildSkillOptionsWithActions([]);
		expect(result).toHaveLength(0);
	});
});
