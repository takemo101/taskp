import { describe, expect, it } from "vitest";
import {
	getActionSection,
	parseActionSections,
} from "../../../src/core/skill/action-section-parser";

describe("parseActionSections", () => {
	it("複数のアクションセクションを抽出できる", () => {
		const markdown = [
			"## action:add",
			"",
			"ファイルを追加する",
			"",
			"```bash",
			"touch file.txt",
			"```",
			"",
			"## action:delete",
			"",
			"ファイルを削除する",
			"",
			"```bash",
			"rm file.txt",
			"```",
		].join("\n");

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value).toHaveLength(2);
		expect(result.value[0].name).toBe("add");
		expect(result.value[1].name).toBe("delete");
	});

	it("セクション範囲は次の H2 見出しまで", () => {
		const markdown = [
			"## action:first",
			"",
			"最初のセクション",
			"",
			"## action:second",
			"",
			"次のセクション",
		].join("\n");

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value[0].content).toContain("最初のセクション");
		expect(result.value[0].content).not.toContain("次のセクション");
	});

	it("セクション範囲はファイル末尾まで", () => {
		const markdown = ["## action:only", "", "唯一のセクション", "", "追加テキスト"].join("\n");

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value).toHaveLength(1);
		expect(result.value[0].content).toContain("唯一のセクション");
		expect(result.value[0].content).toContain("追加テキスト");
	});

	it("セクション外のテキスト（冒頭の説明文）は除外される", () => {
		const markdown = [
			"# スキルタイトル",
			"",
			"これは冒頭の説明文です。",
			"",
			"## action:deploy",
			"",
			"デプロイ手順",
		].join("\n");

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value).toHaveLength(1);
		expect(result.value[0].name).toBe("deploy");
		expect(result.value[0].content).not.toContain("冒頭の説明文");
	});

	it("コードブロックがアクション単位で抽出される", () => {
		const markdown = [
			"## action:build",
			"",
			"```bash",
			"npm run build",
			"```",
			"",
			"```bash",
			"npm run test",
			"```",
			"",
			"## action:deploy",
			"",
			"```bash",
			"npm run deploy",
			"```",
		].join("\n");

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value[0].codeBlocks).toHaveLength(2);
		expect(result.value[0].codeBlocks[0].code).toBe("npm run build");
		expect(result.value[0].codeBlocks[1].code).toBe("npm run test");

		expect(result.value[1].codeBlocks).toHaveLength(1);
		expect(result.value[1].codeBlocks[0].code).toBe("npm run deploy");
	});

	it("action: プレフィックスのない H2 は無視される", () => {
		const markdown = [
			"## 概要",
			"",
			"概要テキスト",
			"",
			"## action:run",
			"",
			"実行手順",
			"",
			"## 注意事項",
			"",
			"注意テキスト",
		].join("\n");

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value).toHaveLength(1);
		expect(result.value[0].name).toBe("run");
		expect(result.value[0].content).not.toContain("注意テキスト");
	});

	it("空のアクションセクション", () => {
		const markdown = ["## action:empty", "", "## action:next", "", "次のセクション"].join("\n");

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value).toHaveLength(2);
		expect(result.value[0].name).toBe("empty");
		expect(result.value[0].codeBlocks).toHaveLength(0);
		expect(result.value[1].name).toBe("next");
	});

	it("bash 以外のコードブロックは codeBlocks に含まれない", () => {
		const markdown = [
			"## action:setup",
			"",
			"```javascript",
			"console.log('hello');",
			"```",
			"",
			"```bash",
			"echo hello",
			"```",
		].join("\n");

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value[0].codeBlocks).toHaveLength(1);
		expect(result.value[0].codeBlocks[0].code).toBe("echo hello");
	});

	it("frontmatter がある場合も正しくパースできる", () => {
		const markdown = [
			"---",
			"name: test-skill",
			"description: テスト",
			"---",
			"",
			"## action:run",
			"",
			"実行手順",
		].join("\n");

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value).toHaveLength(1);
		expect(result.value[0].name).toBe("run");
	});
});

describe("getActionSection", () => {
	it("名前でセクションを取得できる", () => {
		const markdown = ["## action:add", "", "追加手順", "", "## action:delete", "", "削除手順"].join(
			"\n",
		);

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const section = getActionSection(result.value, "delete");
		expect(section).toBeDefined();
		expect(section?.name).toBe("delete");
	});

	it("存在しない名前の場合は undefined を返す", () => {
		const markdown = "## action:add\n\n追加手順";

		const result = parseActionSections(markdown);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(getActionSection(result.value, "nonexistent")).toBeUndefined();
	});
});
