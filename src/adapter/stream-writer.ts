import { getPrimaryArgKey } from "../core/execution/agent-tools";
import type { SessionId } from "../core/execution/session";

export type StreamWriterOptions = {
	readonly verbose: boolean;
	readonly output: NodeJS.WritableStream;
	readonly sessionId: SessionId;
};

export type StreamWriter = {
	readonly writeHeader: () => void;
	readonly writeText: (text: string) => void;
	readonly writeToolCall: (toolName: string, args: Record<string, unknown>) => void;
	readonly writeToolResult: (toolName: string, result: unknown) => void;
	readonly writeSummary: (elapsedMs: number, steps: number) => void;
};

export function createStreamWriter(options: StreamWriterOptions): StreamWriter {
	return {
		writeHeader(): void {
			options.output.write(`[session: ${options.sessionId}]\n`);
		},

		writeText(text: string): void {
			options.output.write(text);
		},

		writeToolCall(toolName: string, args: Record<string, unknown>): void {
			const summary = formatToolArgs(toolName, args);
			options.output.write(`\n[tool: ${toolName}] ${summary}\n`);
		},

		writeToolResult(toolName: string, result: unknown): void {
			if (!options.verbose) return;
			const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
			options.output.write(`[result: ${toolName}]\n${text}\n`);
		},

		writeSummary(elapsedMs: number, steps: number): void {
			const seconds = (elapsedMs / 1000).toFixed(1);
			options.output.write(`\nDone in ${seconds}s (${steps} steps) [${options.sessionId}]\n`);
		},
	};
}

function formatToolArgs(toolName: string, args: Record<string, unknown>): string {
	const key = getPrimaryArgKey(toolName);
	if (key) return String(args[key]);
	return JSON.stringify(args);
}
