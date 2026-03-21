import { describe, expect, it } from "vitest";
import { repairToolCall } from "../../src/adapter/agent-executor";

// repairToolCall は AI SDK の ToolCallRepairFunction 型だが、
// テストでは必要最小限のプロパティのみ渡す
function makeOptions(input: string) {
	return {
		system: undefined,
		messages: [],
		toolCall: { type: "tool-call" as const, toolCallId: "call-1", toolName: "bash", input },
		tools: {},
		inputSchema: async () => ({}),
		error: { name: "AI_InvalidToolInputError", message: "invalid input" },
	} as unknown as Parameters<typeof repairToolCall>[0];
}

describe("repairToolCall", () => {
	it("escapes control characters and returns valid JSON", async () => {
		// タブ文字を含む不正な JSON
		const badInput = '{"command":"echo\\thello"}';
		const inputWithTab = badInput.replace("\\t", "\t");
		const result = await repairToolCall(makeOptions(inputWithTab));
		expect(result).not.toBeNull();
		expect(() => JSON.parse(result?.input ?? "")).not.toThrow();
	});

	it("returns null when no control characters present", async () => {
		const validInput = '{"command":"echo hello"}';
		const result = await repairToolCall(makeOptions(validInput));
		expect(result).toBeNull();
	});

	it("returns null when escaped JSON is still invalid", async () => {
		// 制御文字はあるが JSON 構造自体が壊れている
		const broken = '{"command": \x01';
		const result = await repairToolCall(makeOptions(broken));
		expect(result).toBeNull();
	});
});
