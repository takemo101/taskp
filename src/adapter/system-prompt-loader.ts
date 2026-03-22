import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";

const SYSTEM_PROMPT_PATH = ".taskp/SYSTEM.md";

export type SystemPromptLoader = {
	/** カスタム SYSTEM.md があればその内容を返し、なければ undefined を返す */
	readonly load: () => Promise<string | undefined>;
};

export function createSystemPromptLoader(
	projectRoot: string,
	globalRoot?: string,
): SystemPromptLoader {
	const globalPath = resolve(globalRoot ?? homedir(), SYSTEM_PROMPT_PATH);
	const projectPath = resolve(projectRoot, SYSTEM_PROMPT_PATH);

	return {
		load: () => resolveSystemPrompt(globalPath, projectPath),
	};
}

/**
 * プロジェクト → グローバルの順で SYSTEM.md を探索する。
 * プロジェクトにあればそちらを優先、なければグローバル、どちらもなければ undefined。
 */
async function resolveSystemPrompt(
	globalPath: string,
	projectPath: string,
): Promise<string | undefined> {
	// プロジェクト設定が優先（config.toml と同じ戦略）
	const projectContent = await readFileSafe(projectPath);
	if (projectContent !== undefined) {
		return projectContent;
	}

	return readFileSafe(globalPath);
}

async function readFileSafe(path: string): Promise<string | undefined> {
	try {
		const content = await readFile(path, "utf-8");
		// 空ファイルは「カスタムなし」と同じ扱い
		return content.trim().length > 0 ? content : undefined;
	} catch {
		return undefined;
	}
}
