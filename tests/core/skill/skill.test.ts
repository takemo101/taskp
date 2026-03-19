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
		expect(result.value.body.raw).toContain("# Deploy");
		expect(result.value.body.raw).toContain("npm run deploy");
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
			expect(result.value.body.raw).toContain("Deploy to {{environment}}");
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
});
