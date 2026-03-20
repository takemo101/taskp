import { describe, expect, it } from "vitest";
import { createTuiStreamWriter, type ExecutionViewPort } from "../../src/tui/tui-stream-writer";

function createMockView(): ExecutionViewPort & { calls: string[] } {
	const calls: string[] = [];
	return {
		calls,
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
	it("writeText calls appendOutput", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);
		writer.writeText("hello");
		expect(view.calls).toContain("appendOutput:hello");
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
});
