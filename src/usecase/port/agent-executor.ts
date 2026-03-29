import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { ToolSet } from "ai";
import type { TaskpRunDeps, ToolDescriptions } from "../../core/execution/agent-tools";
import type { ContentPart } from "../../core/execution/content-part";
import type { ExecutionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

export type AgentExecutorInput = {
	readonly model: LanguageModelV3;
	readonly systemPrompt: string;
	readonly contentParts: readonly ContentPart[];
	readonly toolNames: readonly string[];
	readonly toolSet?: ToolSet;
	readonly maxSteps: number;
	readonly taskpRunDeps?: TaskpRunDeps;
	readonly toolDescriptions?: ToolDescriptions;
};

export type AgentExecutorResult = {
	readonly output: string;
	readonly steps: number;
	readonly elapsedMs: number;
};

export type AgentExecutorPort = {
	readonly execute: (
		input: AgentExecutorInput,
	) => Promise<Result<AgentExecutorResult, ExecutionError>>;
};
