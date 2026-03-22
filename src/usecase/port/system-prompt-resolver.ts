import type { SystemPromptOptions } from "../../core/execution/system-prompt";

/**
 * system prompt の解決を担うポート。
 * カスタム SYSTEM.md があればその内容を、なければデフォルトを返す。
 */
export type SystemPromptResolver = {
	readonly resolve: (options: SystemPromptOptions) => Promise<string>;
};
