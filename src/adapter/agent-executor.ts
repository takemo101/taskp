import type { ToolSet } from "ai";
import { stepCountIs, streamText } from "ai";
import { buildTools } from "../core/execution/agent-tools";
import { executionError } from "../core/types/errors";
import { err, ok } from "../core/types/result";
import type {
	AgentExecutorInput,
	AgentExecutorPort,
	AgentExecutorResult,
} from "../usecase/port/agent-executor";
import type { StreamWriter } from "./stream-writer";

export function createAgentExecutor(writer: StreamWriter): AgentExecutorPort {
	return {
		execute: async (input) => executeAgentLoop(input, writer),
	};
}

async function executeAgentLoop(
	input: AgentExecutorInput,
	writer: StreamWriter,
): ReturnType<AgentExecutorPort["execute"]> {
	const startTime = Date.now();
	const tools = buildTools(input.toolNames) as ToolSet;

	try {
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
					return err(executionError(String(part.error)));
			}
		}

		const steps = await result.steps;
		const text = await result.text;
		const elapsedMs = Date.now() - startTime;

		writer.writeSummary(elapsedMs, steps.length);

		const agentResult: AgentExecutorResult = {
			output: text,
			steps: steps.length,
			elapsedMs,
		};

		return ok(agentResult);
	} catch (error) {
		return err(
			executionError(
				`Agent execution failed: ${error instanceof Error ? error.message : String(error)}`,
			),
		);
	}
}
