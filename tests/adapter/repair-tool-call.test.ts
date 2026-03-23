import type { ToolCallRepairFunction, ToolSet } from "ai";
import { describe, expect, it, vi } from "vitest";
import { createRepairToolCall } from "../../src/adapter/agent-executor";
import type { Logger } from "../../src/usecase/port/logger";

function createSpyLogger(): Logger & { readonly calls: { method: string; args: string[] }[] } {
	const calls: { method: string; args: string[] }[] = [];
	return {
		calls,
		debug: vi.fn((msg: string) => calls.push({ method: "debug", args: [msg] })),
		warn: vi.fn((msg: string) => calls.push({ method: "warn", args: [msg] })),
		error: vi.fn((msg: string) => calls.push({ method: "error", args: [msg] })),
	};
}

function makeOptions(input: string) {
	return {
		system: undefined,
		messages: [],
		toolCall: { type: "tool-call" as const, toolCallId: "call-1", toolName: "bash", input },
		tools: {},
		inputSchema: async () => ({}),
		error: { name: "AI_InvalidToolInputError", message: "invalid input" },
	} as unknown as Parameters<ToolCallRepairFunction<ToolSet>>[0];
}

describe("repairToolCall", () => {
	it("escapes control characters and returns valid JSON", async () => {
		const logger = createSpyLogger();
		const repairToolCall = createRepairToolCall(logger);
		const badInput = '{"command":"echo\\thello"}';
		const inputWithTab = badInput.replace("\\t", "\t");
		const result = await repairToolCall(makeOptions(inputWithTab));
		expect(result).not.toBeNull();
		expect(() => JSON.parse(result?.input ?? "")).not.toThrow();
	});

	it("returns null when no control characters present", async () => {
		const logger = createSpyLogger();
		const repairToolCall = createRepairToolCall(logger);
		const validInput = '{"command":"echo hello"}';
		const result = await repairToolCall(makeOptions(validInput));
		expect(result).toBeNull();
	});

	it("logs debug via logger when escaped JSON is still invalid", async () => {
		const logger = createSpyLogger();
		const repairToolCall = createRepairToolCall(logger);
		const broken = '{"command": \x01';
		const result = await repairToolCall(makeOptions(broken));
		expect(result).toBeNull();
		expect(logger.debug).toHaveBeenCalledOnce();
		expect(logger.calls[0]?.args[0]).toMatch(/Tool call repair failed/);
	});
});
