import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { ToolSet } from "ai";
import { stepCountIs, streamText } from "ai";
import { buildTools } from "../core/execution/agent-tools";
import type { StreamWriter } from "./stream-writer";

export type AgentExecutorInput = {
	readonly model: LanguageModelV3;
	readonly systemPrompt: string;
	readonly context: string;
	readonly toolNames: readonly string[];
	readonly maxSteps: number;
};

export type AgentResult = {
	readonly output: string;
	readonly steps: number;
	readonly elapsedMs: number;
};

export async function executeAgent(
	input: AgentExecutorInput,
	writer: StreamWriter,
): Promise<AgentResult> {
	const startTime = Date.now();
	const tools = buildTools(input.toolNames) as ToolSet;

	const result = streamText({
		model: input.model,
		system: input.systemPrompt,
		prompt: input.context,
		tools,
		stopWhen: stepCountIs(input.maxSteps),
	});

	for await (const part of result.fullStream) {
		switch (part.type) {
			case "text-delta":
				writer.writeText(part.text);
				break;
			case "tool-call":
				writer.writeToolCall(part.toolName, part.input as Record<string, unknown>);
				break;
			case "tool-result":
				writer.writeToolResult(part.toolName, part.output);
				break;
			case "error":
				throw new Error(String(part.error));
		}
	}

	const steps = await result.steps;
	const text = await result.text;
	const elapsedMs = Date.now() - startTime;

	writer.writeSummary(elapsedMs, steps.length);

	return {
		output: text,
		steps: steps.length,
		elapsedMs,
	};
}
