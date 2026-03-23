import type { ToolCallRepairFunction, ToolSet } from "ai";
import { stepCountIs, streamText } from "ai";
import { buildTools } from "../core/execution/agent-tools";
import { executionError } from "../core/types/errors";
import { err, ok } from "../core/types/result";
import type {
	AgentExecutorInput,
	AgentExecutorPort,
	AgentExecutorResult,
} from "../usecase/port/agent-executor";
import { classifyAgentError, toExecutionError } from "./agent-error-handler";
import type { StreamWriter } from "./stream-writer";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
	const toolsResult = buildTools(input.toolNames, input.buildToolsOptions);
	if (!toolsResult.ok) {
		return toolsResult;
	}
	const tools = toolsResult.value;

	try {
		const result = streamText({
			model: input.model,
			system: input.systemPrompt,
			prompt: input.prompt,
			tools,
			stopWhen: stepCountIs(input.maxSteps),
			experimental_repairToolCall: repairToolCall,
		});

		for await (const part of result.fullStream) {
			switch (part.type) {
				case "text-delta":
					if (part.text) writer.writeText(part.text);
					break;
				case "tool-call": {
					const input = part.input;
					if (!isRecord(input)) {
						return err(
							executionError(
								`Invalid tool input type from AI SDK: expected object, got ${typeof input}`,
							),
						);
					}
					writer.writeToolCall(part.toolName, input);
					break;
				}
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
		const classified = classifyAgentError(error, input.model.provider);
		if (classified.category === "fatal") {
			throw error;
		}
		return err(toExecutionError(classified));
	}
}

/**
 * LLM が不正な JSON（制御文字を含む等）でツール呼び出しを生成した場合に
 * 制御文字をエスケープして再パースを試みる。
 * @internal テスト用にエクスポート
 */
export const repairToolCall: ToolCallRepairFunction<ToolSet> = async (options) => {
	const raw = options.toolCall.input;
	// 制御文字（U+0000〜U+001F）を \uXXXX にエスケープ
	// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional match for JSON control chars
	const escaped = raw.replace(/[\u0000-\u001f]/g, (ch: string) => {
		const hex = ch.codePointAt(0)?.toString(16).padStart(4, "0") ?? "0000";
		return `\\u${hex}`;
	});
	if (escaped === raw) return null; // 制御文字が原因ではない → 修復不可

	try {
		const parsed = JSON.parse(escaped) as Record<string, unknown>;
		return { ...options.toolCall, input: JSON.stringify(parsed) };
	} catch (error) {
		console.debug(
			`[taskp] Tool call repair failed. Original: ${raw}, Escaped: ${escaped}, Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
};
