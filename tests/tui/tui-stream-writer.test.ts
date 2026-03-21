import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTuiStreamWriter, type ExecutionViewPort } from "../../src/tui/tui-stream-writer";

function createMockView(): ExecutionViewPort & { calls: string[] } {
	const calls: string[] = [];
	return {
		calls,
		appendContext(text: string) {
			calls.push(`appendContext:${text}`);
		},
		appendOutput(text: string) {
			calls.push(`appendOutput:${text}`);
		},
		showToolStatus(toolName: string, _args: Record<string, unknown>) {
			calls.push(`showToolStatus:${toolName}`);
		},
		clearToolStatus() {
			calls.push("clearToolStatus");
		},
		showSummary(elapsedMs: number, steps: number) {
			calls.push(`showSummary:${elapsedMs}:${steps}`);
		},
	};
}

describe("createTuiStreamWriter", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("writeText buffers and flushes after interval", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeText("hello");
		expect(view.calls).not.toContain("appendOutput:hello");
		vi.advanceTimersByTime(50);
		expect(view.calls).toContain("appendOutput:hello");
	});

	it("writeText batches multiple writes into one flush", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeText("he");
		writer.writeText("llo");
		vi.advanceTimersByTime(50);
		expect(view.calls).toEqual(["appendOutput:hello"]);
	});

	it("writeText is flushed immediately by writeToolCall", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeText("pending");
		writer.writeToolCall("bash", { command: "ls" });
		expect(view.calls[0]).toBe("appendOutput:pending");
		expect(view.calls[1]).toBe("showToolStatus:bash");
	});

	it("writeText is flushed immediately by writeSummary", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeText("pending");
		writer.writeSummary(1000, 3);
		expect(view.calls[0]).toBe("appendOutput:pending");
		expect(view.calls[1]).toBe("showSummary:1000:3");
	});

	it("writeToolCall calls showToolStatus", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeToolCall("bash", { command: "ls" });
		expect(view.calls).toContain("showToolStatus:bash");
	});

	it("writeToolResult calls clearToolStatus", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeToolResult("bash", "output");
		expect(view.calls).toContain("clearToolStatus");
	});

	it("writeSummary calls showSummary", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeSummary(1234, 5);
		expect(view.calls).toContain("showSummary:1234:5");
	});

	it("whitespace-only text is deferred until next real text", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeText("\n");
		vi.advanceTimersByTime(50);
		expect(view.calls).toEqual([]);
		writer.writeText("hello");
		vi.advanceTimersByTime(50);
		expect(view.calls).toEqual(["appendOutput:\nhello"]);
	});

	it("whitespace-only text is force-flushed by writeToolCall", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeText("  \n");
		writer.writeToolCall("bash", { command: "ls" });
		expect(view.calls[0]).toBe("appendOutput:  \n");
		expect(view.calls[1]).toBe("showToolStatus:bash");
	});

	it("whitespace-only text is force-flushed by writeSummary", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeText("\n\n");
		writer.writeSummary(1000, 2);
		expect(view.calls[0]).toBe("appendOutput:\n\n");
		expect(view.calls[1]).toBe("showSummary:1000:2");
	});
});
