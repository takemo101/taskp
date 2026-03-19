import type { LanguageModelV3 } from "@ai-sdk/provider";
import { stepCountIs, streamText, type ToolSet, tool } from "ai";
import { z } from "zod";
import { type ExecutionError, executionError } from "../types/errors";
import { err, ok, type Result } from "../types/result";

const MAX_STEPS = 50;
const DEFAULT_TIMEOUT_MS = 30_000;

export type AgentResult = {
	readonly output: string;
	readonly steps: number;
};

export type AgentExecutorDeps = {
	readonly executeCommand: (
		command: string,
		cwd: string,
		timeout: number,
	) => Promise<{ readonly stdout: string; readonly stderr: string; readonly exitCode: number }>;
	readonly readFile: (path: string) => Promise<string>;
	readonly writeFile: (path: string, content: string) => Promise<void>;
};

export type AgentExecutorInput = {
	readonly model: LanguageModelV3;
	readonly systemPrompt: string;
	readonly context: string;
	readonly toolNames: readonly string[];
	readonly cwd: string;
};

export function createAgentExecutor(deps: AgentExecutorDeps) {
	return {
		execute: (input: AgentExecutorInput): Promise<Result<AgentResult, ExecutionError>> =>
			executeAgentLoop(input, deps),
	};
}

async function executeAgentLoop(
	input: AgentExecutorInput,
	deps: AgentExecutorDeps,
): Promise<Result<AgentResult, ExecutionError>> {
	const tools = buildTools(input.toolNames, input.cwd, deps);

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
	const lastStep = steps.at(-1);
	return lastStep?.finishReason === "tool-calls";
}

type ToolFactory = () => ToolSet[string];

function buildTools(toolNames: readonly string[], cwd: string, deps: AgentExecutorDeps): ToolSet {
	const toolMap: Record<string, ToolFactory> = {
		bash: () => createBashTool(cwd, deps),
		read: () => createReadTool(deps),
		write: () => createWriteTool(deps),
	};

	const result: ToolSet = {};
	for (const name of toolNames) {
		const factory = toolMap[name];
		if (factory !== undefined) {
			result[name] = factory();
		}
	}
	return result;
}

function createBashTool(cwd: string, deps: AgentExecutorDeps): ToolSet[string] {
	return tool({
		description: "Run a shell command and return stdout/stderr",
		inputSchema: z.object({
			command: z.string().describe("The shell command to execute"),
			cwd: z.string().optional().describe("Working directory"),
			timeout: z.number().optional().describe("Timeout in milliseconds"),
		}),
		execute: async ({ command, cwd: toolCwd, timeout }) => {
			const result = await deps.executeCommand(
				command,
				toolCwd ?? cwd,
				timeout ?? DEFAULT_TIMEOUT_MS,
			);
			return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
		},
	});
}

function createReadTool(deps: AgentExecutorDeps): ToolSet[string] {
	return tool({
		description: "Read the contents of a file",
		inputSchema: z.object({
			path: z.string().describe("File path to read"),
		}),
		execute: async ({ path }) => {
			return await deps.readFile(path);
		},
	});
}

function createWriteTool(deps: AgentExecutorDeps): ToolSet[string] {
	return tool({
		description: "Write content to a file",
		inputSchema: z.object({
			path: z.string().describe("File path to write"),
			content: z.string().describe("Content to write"),
		}),
		execute: async ({ path, content }) => {
			await deps.writeFile(path, content);
			return `Written to ${path}`;
		},
	});
}
