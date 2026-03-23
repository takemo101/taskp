import { describe, expect, it } from "vitest";
import { createSkillBody } from "../../../src/core/skill/skill-body";

const withActionSections = () =>
	[
		"# Overview",
		"",
		"General description.",
		"",
		"## action:add",
		"",
		"Add something.",
		"",
		"```bash",
		"echo add",
		"```",
		"",
		"## action:delete",
		"",
		"Delete something.",
		"",
		"```bash",
		"echo delete",
		"```",
		"",
		"```python",
		"print('delete')",
		"```",
		"",
	].join("\n");

describe("createSkillBody", () => {
	it("渡されたコンテンツをそのまま保持する", () => {
		const content = "# Title\n\nSome content";
		const body = createSkillBody(content);

		expect(body.content.trim()).toBe("# Title\n\nSome content");
	});
});

describe("extractCodeBlocks", () => {
	it("単一の bash コードブロックを抽出する", () => {
		const body = createSkillBody("# Title\n\n```bash\nnpm run build\n```\n");
		const blocks = body.extractCodeBlocks();

		expect(blocks).toEqual([{ lang: "bash", code: "npm run build" }]);
	});

	it("複数の bash コードブロックを順序通りに抽出する", () => {
		const content = [
			"# Deploy",
			"",
			"```bash",
			"npm run build",
			"```",
			"",
			"Middle text",
			"",
			"```bash",
			"npm run deploy",
			"```",
			"",
		].join("\n");
		const body = createSkillBody(content);
		const blocks = body.extractCodeBlocks();

		expect(blocks).toEqual([
			{ lang: "bash", code: "npm run build" },
			{ lang: "bash", code: "npm run deploy" },
		]);
	});

	it("bash 以外の言語ブロックを除外する", () => {
		const content = [
			"```typescript",
			'const x = "hello";',
			"```",
			"",
			"```bash",
			"echo hello",
			"```",
			"",
			"```python",
			"print('hi')",
			"```",
			"",
		].join("\n");
		const body = createSkillBody(content);
		const blocks = body.extractCodeBlocks();

		expect(blocks).toEqual([{ lang: "bash", code: "echo hello" }]);
	});

	it("コードブロックがない場合は空配列を返す", () => {
		const body = createSkillBody("# Title\n\nNo code blocks here.\n");
		const blocks = body.extractCodeBlocks();

		expect(blocks).toEqual([]);
	});

	it("lang 引数で任意の言語を指定して抽出できる", () => {
		const content = [
			"```bash",
			"echo hello",
			"```",
			"",
			"```python",
			"print('hi')",
			"```",
			"",
		].join("\n");
		const body = createSkillBody(content);
		const blocks = body.extractCodeBlocks("python");

		expect(blocks).toEqual([{ lang: "python", code: "print('hi')" }]);
	});
});

describe("extractActionSection", () => {
	it("指定アクション名のセクション内容を返す", () => {
		const body = createSkillBody(withActionSections());
		const content = body.extractActionSection("add");

		expect(content).toBeDefined();
		expect(content).toContain("Add something.");
		expect(content).toContain("echo add");
	});

	it("存在しないアクション名は undefined を返す", () => {
		const body = createSkillBody(withActionSections());
		const content = body.extractActionSection("nonexistent");

		expect(content).toBeUndefined();
	});
});

describe("extractActionCodeBlocks", () => {
	it("指定アクションの bash コードブロックを返す", () => {
		const body = createSkillBody(withActionSections());
		const blocks = body.extractActionCodeBlocks("add");

		expect(blocks).toEqual([{ lang: "bash", code: "echo add" }]);
	});

	it("lang 引数で任意の言語を指定して抽出できる", () => {
		const body = createSkillBody(withActionSections());
		const blocks = body.extractActionCodeBlocks("delete", "python");

		expect(blocks).toEqual([{ lang: "python", code: "print('delete')" }]);
	});

	it("存在しないアクション名は空配列を返す", () => {
		const body = createSkillBody(withActionSections());
		const blocks = body.extractActionCodeBlocks("nonexistent");

		expect(blocks).toEqual([]);
	});
});
