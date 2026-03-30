import {
	buildSystemPrompt,
	formatEnvironment,
	formatToolsList,
	type SystemPromptOptions,
} from "../core/execution/system-prompt";
import type { SystemPromptResolver } from "../usecase/port/system-prompt-resolver";
import { createSystemPromptLoader } from "./system-prompt-loader";

/**
 * カスタム SYSTEM.md（プロジェクト → グローバル）を探索し、
 * 見つからなければデフォルトの基盤 system prompt を生成する。
 * カスタム SYSTEM.md を使用する場合も、ツール一覧と環境情報を自動付与する。
 */
export function createSystemPromptResolver(projectRoot: string): SystemPromptResolver {
	const loader = createSystemPromptLoader(projectRoot);
	let customPrompt: string | undefined;
	let loaded = false;

	return {
		resolve: async (options: SystemPromptOptions) => {
			if (!loaded) {
				customPrompt = await loader.load();
				loaded = true;
			}

			if (customPrompt === undefined) {
				return buildSystemPrompt(options);
			}

			// カスタム SYSTEM.md にツール一覧と環境情報を自動付与
			return [
				customPrompt,
				`# Available tools\n\n${formatToolsList(options.toolNames)}`,
				formatEnvironment(options.cwd, options.date, options.sessionId),
			].join("\n\n");
		},
	};
}
