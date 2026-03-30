/**
 * taskp エージェントの基盤システムプロンプトを構築する。
 * スキルの内容に依存しない共通の指示（ツール使用ルール、出力スタイル、環境情報）を提供する。
 */

import { getToolDescription } from "./agent-tools";
import type { SessionId } from "./session";

export type SystemPromptOptions = {
	/** スキルで有効化されたツール名 */
	readonly toolNames: readonly string[];
	/** 作業ディレクトリ */
	readonly cwd: string;
	/** 現在の日付（ISO 8601 日付文字列） */
	readonly date: string;
	/** セッション ID */
	readonly sessionId: SessionId;
};

/** ツール名の一覧をシステムプロンプト用の文字列に整形する */
export function formatToolsList(toolNames: readonly string[]): string {
	if (toolNames.length === 0) return "(none)";

	return toolNames
		.map((name) => {
			const desc = getToolDescription(name) ?? "Custom tool";
			return `- ${name}: ${desc}`;
		})
		.join("\n");
}

/** 環境情報セクションを生成する */
export function formatEnvironment(cwd: string, date: string, sessionId: SessionId): string {
	return `# Environment

- Working directory: ${cwd}
- Date: ${date}
- Platform: ${process.platform}
- Session ID: ${sessionId}`;
}

export function buildSystemPrompt(options: SystemPromptOptions): string {
	const { toolNames, cwd, date, sessionId } = options;

	return `You are a task execution agent for taskp, a markdown-defined skill runner.
You execute the skill task described in the user message accurately and efficiently.

# Available tools

${formatToolsList(toolNames)}

# Guidelines

- Execute the task immediately without asking clarifying questions
- Use the provided tools to complete the task — especially \`write\` to output files when the task requires file output
- Be concise in your responses — output the result, not explanations of what you did
- Do not add unnecessary preamble or postamble
- If the task specifies an output format, follow it exactly
- Do not modify or extend the task beyond what is described
- When multiple independent tool calls are possible, prefer making them in parallel

${formatEnvironment(cwd, date, sessionId)}`;
}
