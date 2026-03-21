import { formatContextSources, formatInputs } from "../adapter/progress-formatter";
import type { StreamWriter } from "../adapter/stream-writer";
import type { ProgressWriter } from "../usecase/port/progress-writer";

export type ExecutionViewPort = {
	readonly appendContext: (text: string) => void;
	readonly appendOutput: (text: string) => void;
	readonly showToolStatus: (toolName: string, args: Record<string, unknown>) => void;
	readonly clearToolStatus: () => void;
	readonly showSummary: (elapsedMs: number, steps: number) => void;
};

const FLUSH_INTERVAL_MS = 50;

export function createTuiStreamWriter(view: ExecutionViewPort): StreamWriter {
	let buffer = "";
	let flushTimer: ReturnType<typeof setTimeout> | null = null;

	function flush(force: boolean = false): void {
		if (buffer.length === 0) return;
		// 空白・改行のみの場合は flush を遅延し、次の実テキストとまとめて反映する
		if (!force && buffer.trim().length === 0) return;
		view.appendOutput(buffer);
		buffer = "";
	}

	function scheduleFlush(): void {
		if (flushTimer !== null) return;
		flushTimer = setTimeout(() => {
			flushTimer = null;
			flush();
		}, FLUSH_INTERVAL_MS);
	}

	return {
		writeText(text: string): void {
			buffer += text;
			scheduleFlush();
		},
		writeToolCall(toolName: string, args: Record<string, unknown>): void {
			if (flushTimer !== null) {
				clearTimeout(flushTimer);
				flushTimer = null;
			}
			flush(true);
			view.showToolStatus(toolName, args);
		},
		writeToolResult(_toolName: string, _result: unknown): void {
			view.clearToolStatus();
		},
		writeSummary(elapsedMs: number, steps: number): void {
			if (flushTimer !== null) {
				clearTimeout(flushTimer);
				flushTimer = null;
			}
			flush(true);
			view.showSummary(elapsedMs, steps);
		},
	};
}

/** TUI 向けの ProgressWriter。グレーの TextRenderable に書き込む */
export function createTuiProgressWriter(view: ExecutionViewPort): ProgressWriter {
	return {
		writeInputs(inputs, variables) {
			const text = formatInputs(inputs, variables);
			if (text) view.appendContext(text);
		},
		writeContextSources(sources) {
			const text = formatContextSources(sources);
			if (text) view.appendContext(text);
		},
	};
}
