import matter from "gray-matter";
import remarkParse from "remark-parse";
import { unified } from "unified";

export interface CodeBlock {
	readonly lang: string;
	readonly code: string;
}

export interface SkillBody {
	readonly content: string;
	readonly extractCodeBlocks: (lang?: string) => readonly CodeBlock[];
}

export function createSkillBody(rawMarkdown: string): SkillBody {
	// frontmatter を除いた本文のみを保持する
	// （メタデータは SkillMetadata 側で管理するため分離）
	const { content } = matter(rawMarkdown);

	return {
		content,
		extractCodeBlocks: (lang = "bash") => extractCodeBlocks(content, lang),
	};
}

function extractCodeBlocks(markdownContent: string, lang: string): readonly CodeBlock[] {
	// 正規表現ではなく remark AST を使うことで、
	// ネストされたコードブロックや特殊な Markdown 構文を正確に処理する
	const tree = unified().use(remarkParse).parse(markdownContent);
	const blocks: CodeBlock[] = [];

	for (const node of tree.children) {
		if (node.type === "code" && node.lang === lang) {
			blocks.push({ lang: node.lang, code: node.value });
		}
	}

	return blocks;
}
