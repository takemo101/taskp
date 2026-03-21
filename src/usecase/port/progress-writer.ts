import type { ContextSource } from "../../core/skill/context-source";
import type { SkillInput } from "../../core/skill/skill-input";

/**
 * エージェント実行前のコンテキスト収集状況を通知するポート。
 * CLI / TUI 共通で使い、表示の共通化を実現する。
 */
export type ProgressWriter = {
	/** 入力定義と回答済み変数を表示 */
	readonly writeInputs: (
		inputs: readonly SkillInput[],
		variables: Readonly<Record<string, string>>,
	) => void;
	/** コンテキストソースの一覧を表示 */
	readonly writeContextSources: (sources: readonly ContextSource[]) => void;
};

/** 何も表示しない noop 実装 */
export function createNoopProgressWriter(): ProgressWriter {
	return {
		writeInputs: () => {},
		writeContextSources: () => {},
	};
}
