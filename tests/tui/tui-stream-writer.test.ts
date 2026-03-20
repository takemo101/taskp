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
	it("writeText delegates to appendOutput", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);

		writer.writeText("hello");

		expect(view.calls).toEqual(["appendOutput:hello"]);
	});

	it("writeToolCall delegates to showToolStatus", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);

		writer.writeToolCall("bash", { command: "ls -la" });

		expect(view.calls).toEqual(["showToolStatus:bash"]);
	});

	it("writeToolResult delegates to clearToolStatus", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);

		writer.writeToolResult("bash", "output data");

		expect(view.calls).toEqual(["clearToolStatus"]);
	});

	it("writeSummary delegates to showSummary", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);

		writer.writeSummary(1234, 5);

		expect(view.calls).toEqual(["showSummary:1234:5"]);
	});

	it("handles sequential operations correctly", () => {
		const view = createMockView();
		const writer = createTuiStreamWriter(view);

		writer.writeText("starting...");
		writer.writeToolCall("bash", { command: "echo test" });
		writer.writeToolResult("bash", "test");
		writer.writeText("done");
		writer.writeSummary(500, 1);

		expect(view.calls).toEqual([
			"appendOutput:starting...",
			"showToolStatus:bash",
			"clearToolStatus",
			"appendOutput:done",
			"showSummary:500:1",
		]);
	});
});
