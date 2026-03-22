import type { LanguageModelV3 } from "@ai-sdk/provider";
import { stepCountIs, streamText } from "ai";
import { type ExecutionError, executionError } from "../types/errors";
import { err, ok, type Result } from "../types/result";
import type { BuildToolsOptions } from "./agent-tools";
import { buildTools } from "./agent-tools";

// エージェントの無限ループを防ぐための安全装置。
// 50 ステップは複雑なタスクでも十分だが、暴走時のコスト爆発を防げる値
const MAX_STEPS = 50;

export type AgentLoopResult = {
	readonly output: string;
	readonly steps: number;
};

export type AgentLoopInput = {
	readonly model: LanguageModelV3;
	readonly systemPrompt: string;
	readonly context: string;
	readonly toolNames: readonly string[];
	readonly buildToolsOptions?: BuildToolsOptions;
};

export function createAgentLoop() {
	return {
		execute: (input: AgentLoopInput): Promise<Result<AgentLoopResult, ExecutionError>> =>
			executeAgentLoop(input),
	};
}

async function executeAgentLoop(
	input: AgentLoopInput,
): Promise<Result<AgentLoopResult, ExecutionError>> {
	const toolsResult = buildTools(input.toolNames, input.buildToolsOptions);
	if (!toolsResult.ok) {
		return toolsResult;
	}
	const tools = toolsResult.value;

	try {
		const result = streamText({
			model: input.model,
			system: input.systemPrompt,
			prompt: input.context,
			tools,
			stopWhen: stepCountIs(MAX_STEPS),
		});

		const chunks: string[] = [];
		for await (const chunk of result.textStream) {
			chunks.push(chunk);
			process.stdout.write(chunk);
		}

		const finalResult = await result;
		const steps = await finalResult.steps;
		const stepCount = steps.length;

		if (isMaxStepsExceeded(steps)) {
			return err(executionError(`Agent loop exceeded maximum steps (${MAX_STEPS}). Aborting.`));
		}

		return ok({ output: chunks.join(""), steps: stepCount });
	} catch (error) {
		return err(
			executionError(
				`Agent execution failed: ${error instanceof Error ? error.message : String(error)}`,
			),
		);
	}
}

function isMaxStepsExceeded(steps: readonly { readonly finishReason: string }[]): boolean {
	// finishReason が "tool-calls" = モデルがまだツールを呼ぼうとしていた
	// = stepCountIs で強制停止された = 上限到達と判定できる
	const lastStep = steps.at(-1);
	return lastStep?.finishReason === "tool-calls";
}
