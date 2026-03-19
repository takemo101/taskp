import matter from "gray-matter";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

const FIXTURE = `---
title: Test Skill
description: A test skill
---

# Hello

Some text.

\`\`\`bash
echo "hello"
\`\`\`
`;

describe("markdown dependencies smoke test", () => {
	it("gray-matter extracts frontmatter", () => {
		const { data, content } = matter(FIXTURE);

		expect(data).toEqual({
			title: "Test Skill",
			description: "A test skill",
		});
		expect(content).toContain("# Hello");
	});

	it("unified + remark-parse produces AST", () => {
		const { content } = matter(FIXTURE);
		const tree = unified().use(remarkParse).parse(content);

		expect(tree.type).toBe("root");
		expect(tree.children.length).toBeGreaterThan(0);
	});

	it("remark-parse extracts code blocks from AST", () => {
		const { content } = matter(FIXTURE);
		const tree = unified().use(remarkParse).parse(content);

		const codeBlocks = tree.children.filter((node) => node.type === "code");

		expect(codeBlocks).toHaveLength(1);
		expect(codeBlocks[0]).toMatchObject({
			type: "code",
			lang: "bash",
			value: 'echo "hello"',
		});
	});

	it("remark-stringify converts AST back to markdown", () => {
		const { content } = matter(FIXTURE);
		const result = unified().use(remarkParse).use(remarkStringify).processSync(content);

		expect(String(result)).toContain("# Hello");
		expect(String(result)).toContain('echo "hello"');
	});
});
