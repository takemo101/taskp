import type { Heading, Root, RootContent } from "mdast";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import type { CodeBlock } from "./skill-body";

const ACTION_PREFIX = "action:";

export type ActionSection = {
	readonly name: string;
	readonly content: string;
	readonly codeBlocks: readonly CodeBlock[];
};

export function parseActionSections(content: string): readonly ActionSection[] {
	const tree = unified().use(remarkParse).parse(content);

	const sections: ActionSection[] = [];
	let currentName: string | null = null;
	let currentNodes: RootContent[] = [];

	for (const node of tree.children) {
		const actionName = extractActionName(node);

		if (actionName !== null) {
			if (currentName !== null) {
				sections.push(buildSection(currentName, currentNodes));
			}
			currentName = actionName;
			currentNodes = [node];
			continue;
		}

		if (isH2(node)) {
			if (currentName !== null) {
				sections.push(buildSection(currentName, currentNodes));
				currentName = null;
				currentNodes = [];
			}
			continue;
		}

		if (currentName !== null) {
			currentNodes.push(node);
		}
	}

	if (currentName !== null) {
		sections.push(buildSection(currentName, currentNodes));
	}

	return sections;
}

export function getActionSection(
	sections: readonly ActionSection[],
	name: string,
): ActionSection | undefined {
	return sections.find((s) => s.name === name);
}

function isH2(node: RootContent): node is Heading {
	return node.type === "heading" && (node as Heading).depth === 2;
}

function extractActionName(node: RootContent): string | null {
	if (!isH2(node)) return null;

	const firstChild = node.children[0];
	if (firstChild?.type !== "text") return null;

	const text = firstChild.value;
	if (!text.startsWith(ACTION_PREFIX)) return null;

	return text.slice(ACTION_PREFIX.length).trim();
}

function buildSection(name: string, nodes: readonly RootContent[]): ActionSection {
	const processor = unified().use(remarkParse).use(remarkStringify);
	const tree: Root = { type: "root", children: [...nodes] };
	const content = processor.stringify(tree).trim();

	const codeBlocks: CodeBlock[] = [];
	for (const node of nodes) {
		if (node.type === "code" && node.lang === "bash") {
			codeBlocks.push({ lang: node.lang, code: node.value });
		}
	}

	return { name, content, codeBlocks };
}
