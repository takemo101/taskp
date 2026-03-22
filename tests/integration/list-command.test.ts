import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSkillLoader } from "../../src/adapter/skill-loader";
import { createListSkillsUseCase } from "../../src/usecase/list-skills";

function createSkillFile(baseDir: string, name: string, description: string): void {
	const dir = join(baseDir, ".taskp", "skills", name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, "SKILL.md"),
		[
			"---",
			`name: ${name}`,
			`description: "${description}"`,
			"mode: template",
			"---",
			"",
			`# ${name}`,
		].join("\n"),
	);
}

describe("taskp list E2E", () => {
	let localRoot: string;
	let globalRoot: string;

	beforeEach(() => {
		localRoot = mkdtempSync(join(tmpdir(), "taskp-list-local-"));
		globalRoot = mkdtempSync(join(tmpdir(), "taskp-list-global-"));
	});

	afterEach(() => {
		rmSync(localRoot, { recursive: true, force: true });
		rmSync(globalRoot, { recursive: true, force: true });
	});

	it("ローカルとグローバルのスキルを一覧表示する", async () => {
		createSkillFile(localRoot, "deploy", "アプリをデプロイする");
		createSkillFile(globalRoot, "lint", "コードをリントする");

		const repository = createSkillLoader({ localRoot, globalRoot });
		const usecase = createListSkillsUseCase(repository);
		const { skills } = await usecase.execute({});

		expect(skills).toHaveLength(2);
		const names = skills.map((s) => s.metadata.name);
		expect(names).toContain("deploy");
		expect(names).toContain("lint");
	});

	it("--global フィルタでグローバルスキルのみ表示する", async () => {
		createSkillFile(localRoot, "deploy", "アプリをデプロイする");
		createSkillFile(globalRoot, "lint", "コードをリントする");

		const repository = createSkillLoader({ localRoot, globalRoot });
		const usecase = createListSkillsUseCase(repository);
		const { skills } = await usecase.execute({ scope: "global" });

		expect(skills).toHaveLength(1);
		expect(skills[0].metadata.name).toBe("lint");
	});

	it("--local フィルタでローカルスキルのみ表示する", async () => {
		createSkillFile(localRoot, "deploy", "アプリをデプロイする");
		createSkillFile(globalRoot, "lint", "コードをリントする");

		const repository = createSkillLoader({ localRoot, globalRoot });
		const usecase = createListSkillsUseCase(repository);
		const { skills } = await usecase.execute({ scope: "local" });

		expect(skills).toHaveLength(1);
		expect(skills[0].metadata.name).toBe("deploy");
	});

	it("同名スキルはローカルが優先される", async () => {
		createSkillFile(localRoot, "deploy", "ローカル版デプロイ");
		createSkillFile(globalRoot, "deploy", "グローバル版デプロイ");

		const repository = createSkillLoader({ localRoot, globalRoot });
		const usecase = createListSkillsUseCase(repository);
		const { skills } = await usecase.execute({});

		expect(skills).toHaveLength(1);
		expect(skills[0].scope).toBe("local");
		expect(skills[0].metadata.description).toBe("ローカル版デプロイ");
	});

	it("スキルが存在しない場合は空配列を返す", async () => {
		const repository = createSkillLoader({ localRoot, globalRoot });
		const usecase = createListSkillsUseCase(repository);
		const { skills } = await usecase.execute({});

		expect(skills).toHaveLength(0);
	});

	it("アクション付きスキルの actions フィールドが含まれる", async () => {
		const dir = join(localRoot, ".taskp", "skills", "task");
		mkdirSync(dir, { recursive: true });
		writeFileSync(
			join(dir, "SKILL.md"),
			[
				"---",
				"name: task",
				'description: "タスクを管理する"',
				"mode: template",
				"actions:",
				"  add:",
				'    description: "タスクを追加"',
				"  delete:",
				'    description: "タスクを削除"',
				"  list:",
				'    description: "タスク一覧"',
				"---",
				"",
				"# task",
				"",
				"## action:add",
				"",
				"```bash",
				'echo "add"',
				"```",
				"",
				"## action:delete",
				"",
				"```bash",
				'echo "delete"',
				"```",
				"",
				"## action:list",
				"",
				"```bash",
				'echo "list"',
				"```",
			].join("\n"),
		);

		const repository = createSkillLoader({ localRoot, globalRoot });
		const usecase = createListSkillsUseCase(repository);
		const { skills } = await usecase.execute({});

		expect(skills).toHaveLength(1);
		expect(skills[0].metadata.actions).toBeDefined();
		expect(Object.keys(skills[0].metadata.actions!)).toEqual(["add", "delete", "list"]);
	});
});
