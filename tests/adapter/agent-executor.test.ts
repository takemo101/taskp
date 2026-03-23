import { describe, expect, it, vi } from "vitest";
import { createSilentLogger } from "../../src/adapter/silent-logger";
import type { StreamWriter } from "../../src/adapter/stream-writer";

function createMockWriter(): StreamWriter & {
	calls: { method: string; args: unknown[] }[];
} {
	const calls: { method: string; args: unknown[] }[] = [];
	return {
		calls,
		writeText: vi.fn((...args) => calls.push({ method: "writeText", args })),
		writeToolCall: vi.fn((...args) => calls.push({ method: "writeToolCall", args })),
		writeToolResult: vi.fn((...args) => calls.push({ method: "writeToolResult", args })),
		writeSummary: vi.fn((...args) => calls.push({ method: "writeSummary", args })),
	};
}

describe("agent-executor adapter", () => {
	it("exports createAgentExecutor function", async () => {
		const { createAgentExecutor } = await import("../../src/adapter/agent-executor");
		expect(typeof createAgentExecutor).toBe("function");
	});

	it("createAgentExecutor returns an executor with execute method", async () => {
		const { createAgentExecutor } = await import("../../src/adapter/agent-executor");
		const writer = createMockWriter();
		const executor = createAgentExecutor(writer, createSilentLogger());
		expect(typeof executor.execute).toBe("function");
	});

	it("StreamWriter mock captures calls correctly", () => {
		const writer = createMockWriter();

		writer.writeText("hello");
		writer.writeToolCall("bash", { command: "ls" });
		writer.writeToolResult("bash", "output");
		writer.writeSummary(1000, 2);

		expect(writer.calls).toHaveLength(4);
		expect(writer.calls[0]).toEqual({ method: "writeText", args: ["hello"] });
		expect(writer.calls[1]).toEqual({
			method: "writeToolCall",
			args: ["bash", { command: "ls" }],
		});
		expect(writer.calls[2]).toEqual({ method: "writeToolResult", args: ["bash", "output"] });
		expect(writer.calls[3]).toEqual({ method: "writeSummary", args: [1000, 2] });
	});
});
