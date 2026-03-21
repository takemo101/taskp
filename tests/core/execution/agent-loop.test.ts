import type { LanguageModelV3FinishReason, LanguageModelV3StreamPart } from "@ai-sdk/provider";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAgentLoop } from "../../../src/core/execution/agent-loop";

function mockUsage() {
	return {
		inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
		outputTokens: { total: 20, text: 20, reasoning: undefined },
	};
}

function finishChunk(
	unified: LanguageModelV3FinishReason["unified"] = "stop",
): LanguageModelV3StreamPart {
	return {
		type: "finish",
		finishReason: { unified, raw: unified },
		usage: mockUsage(),
	};
}

describe("AgentLoop", () => {
	let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		stdoutWriteSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
	});

	afterEach(() => {
		stdoutWriteSpy.mockRestore();
	});

	describe("simple text response", () => {
		it("returns text output without tool calls", async () => {
			const model = new MockLanguageModelV3({
				doStream: async () => ({
					stream: simulateReadableStream({
						chunks: [
							{ type: "text-start" as const, id: "text-1" },
							{ type: "text-delta" as const, id: "text-1", delta: "Hello, " },
							{ type: "text-delta" as const, id: "text-1", delta: "world!" },
							{ type: "text-end" as const, id: "text-1" },
							finishChunk(),
						],
					}),
				}),
			});

			const loop = createAgentLoop();
			const result = await loop.execute({
				model,
				systemPrompt: "You are helpful.",
				context: "Say hello",
				toolNames: [],
			});

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.output).toBe("Hello, world!");
			expect(result.value.steps).toBe(1);
		});

		it("streams text to stdout", async () => {
			const model = new MockLanguageModelV3({
				doStream: async () => ({
					stream: simulateReadableStream({
						chunks: [
							{ type: "text-start" as const, id: "text-1" },
							{ type: "text-delta" as const, id: "text-1", delta: "chunk1" },
							{ type: "text-delta" as const, id: "text-1", delta: "chunk2" },
							{ type: "text-end" as const, id: "text-1" },
							finishChunk(),
						],
					}),
				}),
			});

			const loop = createAgentLoop();
			await loop.execute({
				model,
				systemPrompt: "test",
				context: "test",
				toolNames: [],
			});

			expect(stdoutWriteSpy).toHaveBeenCalledWith("chunk1");
			expect(stdoutWriteSpy).toHaveBeenCalledWith("chunk2");
		});
	});

	describe("tool call flow", () => {
		it("executes tool call and returns final text response", async () => {
			let callCount = 0;

			const model = new MockLanguageModelV3({
				doStream: async () => {
					callCount++;

					if (callCount === 1) {
						return {
							stream: simulateReadableStream({
								chunks: [
									{
										type: "tool-call" as const,
										id: "tc-1",
										toolCallId: "call-1",
										toolName: "bash",
										input: JSON.stringify({ command: "echo hello" }),
									},
									finishChunk("tool-calls"),
								],
							}),
						};
					}

					return {
						stream: simulateReadableStream({
							chunks: [
								{ type: "text-start" as const, id: "text-1" },
								{ type: "text-delta" as const, id: "text-1", delta: "Done!" },
								{ type: "text-end" as const, id: "text-1" },
								finishChunk(),
							],
						}),
					};
				},
			});

			const loop = createAgentLoop();
			const result = await loop.execute({
				model,
				systemPrompt: "You are an agent.",
				context: "Run echo hello",
				toolNames: ["bash"],
			});

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.output).toBe("Done!");
			expect(result.value.steps).toBe(2);
		});
	});

	describe("maxSteps exceeded", () => {
		it("returns error when last step finishes with tool-calls", async () => {
			const model = new MockLanguageModelV3({
				doStream: async () => ({
					stream: simulateReadableStream({
						chunks: [
							{
								type: "tool-call" as const,
								id: "tc-1",
								toolCallId: "call-1",
								toolName: "bash",
								input: JSON.stringify({ command: "echo loop" }),
							},
							finishChunk("tool-calls"),
						],
					}),
				}),
			});

			const loop = createAgentLoop();
			const result = await loop.execute({
				model,
				systemPrompt: "test",
				context: "test",
				toolNames: ["bash"],
			});

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("maximum steps");
		});
	});
});
