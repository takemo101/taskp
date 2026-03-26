import remarkParse from "remark-parse";
import { unified } from "unified";
import type { DomainError } from "../types/errors";
import { executionError } from "../types/errors";
import type { Result } from "../types/result";
import { err, ok } from "../types/result";
import type { ActionSection } from "./action-section-parser";
import { getActionSection, parseActionSections } from "./action-section-parser";

export interface CodeBlock {
	readonly lang: string;
	readonly code: string;
}

export interface SkillBody {
	readonly content: string;
	/**
	 * @param lang - Code language filter (defaults to "bash")
	 */
	readonly extractCodeBlocks: (lang?: string) => readonly CodeBlock[];
	readonly extractActionSection: (name: string) => Result<string, DomainError>;
	/**
	 * @param name - Action name
	 * @param lang - Code language filter (defaults to "bash")
	 */
	readonly extractActionCodeBlocks: (name: string, lang?: string) => readonly CodeBlock[];
}

export function createSkillBody(content: string): SkillBody {
	// アクションセクションは content から一度だけパースしてキャッシュする
	let cachedSections: readonly ActionSection[] | null = null;
	const getSections = (): readonly ActionSection[] => {
		if (cachedSections === null) {
			cachedSections = parseActionSections(content);
		}
		return cachedSections;
	};

	return {
		content,
		extractCodeBlocks: (lang = "bash") => extractCodeBlocks(content, lang),
		extractActionSection: (name: string): Result<string, DomainError> => {
			const section = getActionSection(getSections(), name);
			if (!section) {
				return err(executionError(`Action section "## action:${name}" not found in skill body`));
			}
			return ok(section.content);
		},
		extractActionCodeBlocks: (name: string, lang = "bash") => {
			const section = getActionSection(getSections(), name);
			if (!section) return [];
			return extractCodeBlocks(section.content, lang);
		},
	};
}

function extractCodeBlocks(markdownContent: string, lang: string): readonly CodeBlock[] {
	// 正規表現ではなく remark AST を使うことで、
	// ネストされたコードブロックや特殊な Markdown 構文を正確に処理する
	const tree = unified().use(remarkParse).parse(markdownContent);
	const blocks: CodeBlock[] = [];

	for (const node of tree.children) {
		if (node.type === "code" && node.lang != null && node.lang === lang) {
			blocks.push({ lang: node.lang, code: node.value });
		}
	}

	return blocks;
}
