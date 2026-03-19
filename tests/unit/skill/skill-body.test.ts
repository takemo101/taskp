import { describe, expect, it } from "vitest";
import { createSkillBody } from "../../../src/core/skill/skill-body";

const withFrontmatter = (body: string) => `---\nname: test\ndescription: test skill\n---\n${body}`;

describe("createSkillBody", () => {
	it("フロントマターを除去した本文を保持する", () => {
		const raw = withFrontmatter("\n# Title\n\nSome content\n");
		const body = createSkillBody(raw);

		expect(body.content.trim()).toBe("# Title\n\nSome content");
	});
});

describe("extractCodeBlocks", () => {
	it("単一の bash コードブロックを抽出する", () => {
		const raw = withFrontmatter("\n# Title\n\n```bash\nnpm run build\n```\n");
		const body = createSkillBody(raw);
		const blocks = body.extractCodeBlocks();

		expect(blocks).toEqual([{ lang: "bash", code: "npm run build" }]);
	});

	it("複数の bash コードブロックを順序通りに抽出する", () => {
		const raw = withFrontmatter(
			[
				"",
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
			].join("\n"),
		);
		const body = createSkillBody(raw);
		const blocks = body.extractCodeBlocks();

		expect(blocks).toEqual([
			{ lang: "bash", code: "npm run build" },
			{ lang: "bash", code: "npm run deploy" },
		]);
	});

	it("bash 以外の言語ブロックを除外する", () => {
		const raw = withFrontmatter(
			[
				"",
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
			].join("\n"),
		);
		const body = createSkillBody(raw);
		const blocks = body.extractCodeBlocks();

		expect(blocks).toEqual([{ lang: "bash", code: "echo hello" }]);
	});

	it("コードブロックがない場合は空配列を返す", () => {
		const raw = withFrontmatter("\n# Title\n\nNo code blocks here.\n");
		const body = createSkillBody(raw);
		const blocks = body.extractCodeBlocks();

		expect(blocks).toEqual([]);
	});

	it("lang 引数で任意の言語を指定して抽出できる", () => {
		const raw = withFrontmatter(
			["", "```bash", "echo hello", "```", "", "```python", "print('hi')", "```", ""].join("\n"),
		);
		const body = createSkillBody(raw);
		const blocks = body.extractCodeBlocks("python");

		expect(blocks).toEqual([{ lang: "python", code: "print('hi')" }]);
	});
});
