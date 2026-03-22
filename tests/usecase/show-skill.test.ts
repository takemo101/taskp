import { describe, expect, it } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { skillNotFoundError } from "../../src/core/types/errors";
import { err, ok } from "../../src/core/types/result";
import type { SkillRepository } from "../../src/usecase/port/skill-repository";
import { showSkill } from "../../src/usecase/show-skill";

function createSkill(overrides: Partial<Skill["metadata"]> = {}): Skill {
	return {
		metadata: {
			name: "deploy",
			description: "アプリケーションをデプロイする",
			mode: "template",
			inputs: [
				{
					name: "environment",
					type: "select",
					message: "デプロイ先を選んでください",
					choices: ["staging", "production"],
				},
				{
					name: "branch",
					type: "text",
					message: "ブランチ名は？",
					default: "main",
				},
				{
					name: "confirm",
					type: "confirm",
					message: "本当にデプロイしますか？",
				},
			],
			tools: ["bash", "read", "write"],
			context: [
				{ type: "file", path: "./config.yaml" },
				{ type: "command", run: "git branch --show-current" },
			],
			...overrides,
		},
		body: { content: "# deploy", extractCodeBlocks: () => [] },
		location: "/project/.taskp/skills/deploy/SKILL.md",
		scope: "local",
	};
}

function createRepository(skills: readonly Skill[]): SkillRepository {
	return {
		findByName: async (name) => {
			const found = skills.find((s) => s.metadata.name === name);
			return found ? ok(found) : err(skillNotFoundError(name));
		},
		listAll: async () => ({ skills: [...skills], failures: [] }),
		listLocal: async () => ({ skills: skills.filter((s) => s.scope === "local"), failures: [] }),
		listGlobal: async () => ({ skills: skills.filter((s) => s.scope === "global"), failures: [] }),
	};
}

describe("showSkill", () => {
	it("スキルの詳細情報を返す", async () => {
		const skill = createSkill();
		const repo = createRepository([skill]);

		const result = await showSkill("deploy", repo);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.name).toBe("deploy");
		expect(result.value.description).toBe("アプリケーションをデプロイする");
		expect(result.value.mode).toBe("template");
		expect(result.value.location).toBe("/project/.taskp/skills/deploy/SKILL.md");
		expect(result.value.inputs).toHaveLength(3);
		expect(result.value.context).toHaveLength(2);
	});

	it("入力定義の詳細が含まれる", async () => {
		const skill = createSkill();
		const repo = createRepository([skill]);

		const result = await showSkill("deploy", repo);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const selectInput = result.value.inputs[0];
		expect(selectInput.name).toBe("environment");
		expect(selectInput.type).toBe("select");
		expect(selectInput.choices).toEqual(["staging", "production"]);

		const textInput = result.value.inputs[1];
		expect(textInput.name).toBe("branch");
		expect(textInput.default).toBe("main");
	});

	it("コンテキストソースが含まれる", async () => {
		const skill = createSkill();
		const repo = createRepository([skill]);

		const result = await showSkill("deploy", repo);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.context[0]).toEqual({ type: "file", path: "./config.yaml" });
		expect(result.value.context[1]).toEqual({ type: "command", run: "git branch --show-current" });
	});

	it("存在しないスキルはエラーを返す", async () => {
		const repo = createRepository([]);

		const result = await showSkill("nonexistent", repo);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("SKILL_NOT_FOUND");
	});

	it("入力・コンテキストが空のスキルも正常に返す", async () => {
		const skill = createSkill({ inputs: [], context: [] });
		const repo = createRepository([skill]);

		const result = await showSkill("deploy", repo);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.inputs).toHaveLength(0);
		expect(result.value.context).toHaveLength(0);
	});

	it("アクション付きスキルのアクション一覧を返す", async () => {
		const skill = createSkill({
			actions: {
				add: { description: "タスクを追加" },
				delete: { description: "タスクを削除" },
			},
		});
		const repo = createRepository([skill]);

		const result = await showSkill("deploy", repo);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.actions).toHaveLength(2);
		expect(result.value.actions![0].name).toBe("add");
		expect(result.value.actions![0].description).toBe("タスクを追加");
		expect(result.value.actionDetail).toBeUndefined();
	});

	it("アクション指定時はアクション詳細を返す", async () => {
		const skill = createSkill({
			actions: {
				add: {
					description: "タスクを追加",
					mode: "agent",
					inputs: [{ name: "title", type: "text", message: "タスク名は？" }],
				},
			},
		});
		const repo = createRepository([skill]);

		const result = await showSkill("deploy", repo, "add");

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.actionDetail).toBeDefined();
		expect(result.value.actionDetail!.name).toBe("add");
		expect(result.value.actionDetail!.mode).toBe("agent");
		expect(result.value.inputs).toHaveLength(1);
		expect(result.value.inputs[0].name).toBe("title");
	});

	it("存在しないアクション指定時はエラーを返す", async () => {
		const skill = createSkill({
			actions: {
				add: { description: "タスクを追加" },
			},
		});
		const repo = createRepository([skill]);

		const result = await showSkill("deploy", repo, "unknown");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("CONFIG_ERROR");
	});
});
