import type { StreamWriter } from "../adapter/stream-writer";

export type ExecutionViewPort = {
	readonly appendOutput: (text: string) => void;
	readonly showToolStatus: (toolName: string, args: Record<string, unknown>) => void;
	readonly clearToolStatus: () => void;
	readonly showSummary: (elapsedMs: number, steps: number) => void;
};

export function createTuiStreamWriter(view: ExecutionViewPort): StreamWriter {
	return {
		writeText(text: string): void {
			view.appendOutput(text);
		},
		writeToolCall(toolName: string, args: Record<string, unknown>): void {
			view.showToolStatus(toolName, args);
		},
		writeToolResult(_toolName: string, _result: unknown): void {
			view.clearToolStatus();
		},
		writeSummary(elapsedMs: number, steps: number): void {
			view.showSummary(elapsedMs, steps);
		},
	};
}
