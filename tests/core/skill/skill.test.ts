import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseSkill } from "../../../src/core/skill/skill";

const fixturesDir = resolve(__dirname, "../../fixtures/skills");

function readFixture(name: string): string {
	return readFileSync(resolve(fixturesDir, name, "SKILL.md"), "utf-8");
}

describe("parseSkill", () => {
	it("有効な SKILL.md 文字列から Skill を構築できる", () => {
		const raw = [
			"---",
			"name: deploy",
			'description: "アプリケーションをデプロイする"',
			"mode: template",
			"---",
			"",
			"# Deploy",
			"",
			"```bash",
			"npm run deploy",
			"```",
		].join("\n");

		const result = parseSkill(raw, "/home/user/global-skills/deploy/SKILL.md");
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.metadata.name).toBe("deploy");
		expect(result.value.metadata.description).toBe("アプリケーションをデプロイする");
		expect(result.value.metadata.mode).toBe("template");
		expect(result.value.body.content).toContain("# Deploy");
		expect(result.value.body.content).toContain("npm run deploy");
		expect(result.value.location).toBe("/home/user/global-skills/deploy/SKILL.md");
		expect(result.value.scope).toBe("global");
	});

	it("ローカルスキルの scope が local になる", () => {
		const raw = ["---", "name: test", 'description: "テスト"', "---", "", "# Test"].join("\n");

		const result = parseSkill(raw, "/project/.taskp/skills/test/SKILL.md");
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.scope).toBe("local");
	});

	it("フロントマターエラーが伝播する", () => {
		const raw = ["---", "mode: template", "---", "", "# No name or description"].join("\n");

		const result = parseSkill(raw, "/path/to/SKILL.md");
		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.error.type).toBe("PARSE_ERROR");
		expect(result.error.message).toContain("Invalid skill metadata");
	});

	describe("フィクスチャファイルを使ったパース", () => {
		it("valid-template フィクスチャをパースできる", () => {
			const raw = readFixture("valid-template");
			const result = parseSkill(raw, "/project/.taskp/skills/deploy/SKILL.md");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.metadata.name).toBe("deploy");
			expect(result.value.metadata.mode).toBe("template");
			expect(result.value.metadata.inputs).toHaveLength(2);
			expect(result.value.body.content).toContain("Deploy to {{environment}}");
		});

		it("valid-agent フィクスチャをパースできる", () => {
			const raw = readFixture("valid-agent");
			const result = parseSkill(raw, "/home/user/global-skills/code-review/SKILL.md");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.metadata.name).toBe("code-review");
			expect(result.value.metadata.mode).toBe("agent");
			expect(result.value.metadata.model).toBe("claude-sonnet-4-20250514");
			expect(result.value.scope).toBe("global");
		});

		it("with-actions フィクスチャをパースできる", () => {
			const raw = readFixture("with-actions");
			const result = parseSkill(raw, "/project/.taskp/skills/manage/SKILL.md");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.metadata.actions).toBeDefined();
			expect(result.value.body.extractActionCodeBlocks("add", "bash")).toHaveLength(1);
		});

		it("invalid-frontmatter フィクスチャでエラーになる", () => {
			const raw = readFixture("invalid-frontmatter");
			const result = parseSkill(raw, "/path/to/SKILL.md");
			expect(result.ok).toBe(false);
			if (result.ok) return;

			expect(result.error.type).toBe("PARSE_ERROR");
		});

		it("with-context フィクスチャのコンテキストソースがパースされる", () => {
			const raw = readFixture("with-context");
			const result = parseSkill(raw, "/project/.taskp/skills/refactor/SKILL.md");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.metadata.context).toHaveLength(4);
		});
	});

	describe("アクションバリデーション", () => {
		it("actions キーに対応するセクションがない場合エラーになる", () => {
			const raw = [
				"---",
				"name: manage",
				'description: "管理スキル"',
				"actions:",
				"  add:",
				'    description: "追加"',
				"  delete:",
				'    description: "削除"',
				"---",
				"",
				"## action:add",
				"",
				"```bash",
				"echo add",
				"```",
			].join("\n");

			const result = parseSkill(raw, "/path/to/SKILL.md");
			expect(result.ok).toBe(false);
			if (result.ok) return;

			expect(result.error.type).toBe("PARSE_ERROR");
			expect(result.error.message).toContain("delete");
			expect(result.error.message).toContain("no corresponding");
		});

		it("セクションがあるが actions に定義がない場合エラーになる", () => {
			const raw = [
				"---",
				"name: manage",
				'description: "管理スキル"',
				"actions:",
				"  add:",
				'    description: "追加"',
				"---",
				"",
				"## action:add",
				"",
				"```bash",
				"echo add",
				"```",
				"",
				"## action:delete",
				"",
				"```bash",
				"echo delete",
				"```",
			].join("\n");

			const result = parseSkill(raw, "/path/to/SKILL.md");
			expect(result.ok).toBe(false);
			if (result.ok) return;

			expect(result.error.type).toBe("PARSE_ERROR");
			expect(result.error.message).toContain("delete");
			expect(result.error.message).toContain("not defined in actions");
		});

		it("template モードのアクションにコードブロックがない場合エラーになる", () => {
			const raw = [
				"---",
				"name: manage",
				'description: "管理スキル"',
				"mode: template",
				"actions:",
				"  add:",
				'    description: "追加"',
				"---",
				"",
				"## action:add",
				"",
				"No code blocks here.",
			].join("\n");

			const result = parseSkill(raw, "/path/to/SKILL.md");
			expect(result.ok).toBe(false);
			if (result.ok) return;

			expect(result.error.type).toBe("PARSE_ERROR");
			expect(result.error.message).toContain("requires at least one code block");
		});

		it("agent モードのアクションはコードブロックなしでもパースできる", () => {
			const raw = [
				"---",
				"name: manage",
				'description: "管理スキル"',
				"mode: agent",
				"actions:",
				"  review:",
				'    description: "レビュー"',
				"---",
				"",
				"## action:review",
				"",
				"Please review the code.",
			].join("\n");

			const result = parseSkill(raw, "/path/to/SKILL.md");
			expect(result.ok).toBe(true);
		});

		it("アクション個別に agent モードを指定した場合コードブロック不要", () => {
			const raw = [
				"---",
				"name: manage",
				'description: "管理スキル"',
				"mode: template",
				"actions:",
				"  review:",
				'    description: "レビュー"',
				"    mode: agent",
				"---",
				"",
				"## action:review",
				"",
				"Please review the code.",
			].join("\n");

			const result = parseSkill(raw, "/path/to/SKILL.md");
			expect(result.ok).toBe(true);
		});
	});
});
