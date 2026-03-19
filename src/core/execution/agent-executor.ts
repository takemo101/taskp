import type { LanguageModelV3 } from "@ai-sdk/provider";
import { stepCountIs, streamText } from "ai";
import { type ExecutionError, executionError } from "../types/errors";
import { err, ok, type Result } from "../types/result";
import { buildTools } from "./agent-tools";

// エージェントの無限ループを防ぐための安全装置。
// 50 ステップは複雑なタスクでも十分だが、暴走時のコスト爆発を防げる値
const MAX_STEPS = 50;

export type AgentResult = {
	readonly output: string;
	readonly steps: number;
};

export type AgentExecutorInput = {
	readonly model: LanguageModelV3;
	readonly systemPrompt: string;
	readonly context: string;
	readonly toolNames: readonly string[];
};

export function createAgentExecutor() {
	return {
		execute: (input: AgentExecutorInput): Promise<Result<AgentResult, ExecutionError>> =>
			executeAgentLoop(input),
	};
}

async function executeAgentLoop(
	input: AgentExecutorInput,
): Promise<Result<AgentResult, ExecutionError>> {
	const tools = buildTools(input.toolNames);

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
}

function isMaxStepsExceeded(steps: readonly { readonly finishReason: string }[]): boolean {
	// finishReason が "tool-calls" = モデルがまだツールを呼ぼうとしていた
	// = stepCountIs で強制停止された = 上限到達と判定できる
	const lastStep = steps.at(-1);
	return lastStep?.finishReason === "tool-calls";
}
