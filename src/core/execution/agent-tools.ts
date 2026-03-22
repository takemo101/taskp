import { glob as fsGlob, readFile, writeFile } from "node:fs/promises";
import { input } from "@inquirer/prompts";
import type { JSONSchema7, Tool } from "ai";
import { jsonSchema } from "ai";
import { execa } from "execa";
import { toJSONSchema, z } from "zod";
import type { HooksConfig } from "../../usecase/hook-runner";
import type { CommandExecutor } from "../../usecase/port/command-executor";
import type { HookExecutorPort } from "../../usecase/port/hook-executor";
import type { PromptCollector } from "../../usecase/port/prompt-collector";
import type { SkillRepository } from "../../usecase/port/skill-repository";
import { type RunOutput, runSkill } from "../../usecase/run-skill";
import { domainErrorMessage, type ExecutionError, executionError } from "../types/errors";
import { err, ok, type Result } from "../types/result";

// Vercel AI SDK は JSONSchema7 形式のツール定義を要求するが、
// zod スキーマから直接変換する公式 API がないため、
// toJSONSchema → jsonSchema のブリッジが必要
function zodToJsonSchema<T extends z.ZodType>(schema: T) {
	return jsonSchema<z.infer<T>>(toJSONSchema(schema) as JSONSchema7);
}

const TOOL_NAMES = ["bash", "read", "write", "glob", "ask_user", "taskp_run"] as const;
type ToolName = (typeof TOOL_NAMES)[number];

const bashParams = z.object({
	command: z.string().describe("The shell command to execute"),
	cwd: z.string().optional().describe("Working directory"),
	timeout: z.number().optional().describe("Timeout in milliseconds"),
});

const readParams = z.object({
	path: z.string().describe("File path to read"),
	encoding: z.string().optional().describe("File encoding (default: utf-8)"),
});

const writeParams = z.object({
	path: z.string().describe("File path to write"),
	content: z.string().describe("Content to write"),
});

const globParams = z.object({
	pattern: z.string().describe("Glob pattern to match files"),
});

const askUserParams = z.object({
	question: z.string().describe("The question to ask the user"),
});

const taskpRunParams = z.object({
	skill: z.string().describe("Skill reference to run. Format: '<skill>' or '<skill>:<action>'."),
	set: z
		.record(z.string(), z.string())
		.optional()
		.describe("Variables to pass to the skill inputs (skips interactive prompts)."),
});

type BashInput = z.infer<typeof bashParams>;
type BashResult = { readonly stdout: string; readonly stderr: string; readonly exitCode: number };

const bashTool: Tool<BashInput, BashResult> = {
	description: "Run a shell command and return stdout/stderr",
	inputSchema: zodToJsonSchema(bashParams),
	execute: async ({ command, cwd, timeout }) => {
		const result = await execa(command, {
			shell: true,
			cwd: cwd ?? process.cwd(),
			timeout: timeout ?? 30_000,
			reject: false,
		});
		return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode ?? 1 };
	},
};

type ReadInput = z.infer<typeof readParams>;

const readTool: Tool<ReadInput, string> = {
	description: "Read the contents of a file",
	inputSchema: zodToJsonSchema(readParams),
	execute: async ({ path }) => {
		try {
			return await readFile(path, "utf-8");
		} catch (error) {
			throw new Error(`Failed to read file: ${path}`, { cause: error });
		}
	},
};

type WriteInput = z.infer<typeof writeParams>;

const writeTool: Tool<WriteInput, string> = {
	description: "Write content to a file",
	inputSchema: zodToJsonSchema(writeParams),
	execute: async ({ path, content }) => {
		try {
			await writeFile(path, content, "utf-8");
			return `Written to ${path}`;
		} catch (error) {
			throw new Error(`Failed to write file: ${path}`, { cause: error });
		}
	},
};

type GlobInput = z.infer<typeof globParams>;

const globTool: Tool<GlobInput, readonly string[]> = {
	description: "Search for files matching a glob pattern",
	inputSchema: zodToJsonSchema(globParams),
	execute: async ({ pattern }) => {
		try {
			const matches: string[] = [];
			for await (const entry of fsGlob(pattern)) {
				matches.push(entry);
			}
			return matches;
		} catch (error) {
			throw new Error(`Failed to glob pattern: ${pattern}`, { cause: error });
		}
	},
};

type AskUserInput = z.infer<typeof askUserParams>;

const askUserTool: Tool<AskUserInput, string> = {
	description: "Ask the user a question and wait for their response",
	inputSchema: zodToJsonSchema(askUserParams),
	execute: async ({ question }) => {
		return await input({ message: question });
	},
};

// Tool<I, O> のジェネリクスが共変でないため、異なる I/O を持つツールを
// 1つの Record にまとめるには型パラメータを消去する必要がある
type AnyTool = Tool<Record<string, unknown>, unknown>;

// taskp_run 以外の静的ツール
const staticTools: Record<string, AnyTool> = {
	bash: bashTool as AnyTool,
	read: readTool as AnyTool,
	write: writeTool as AnyTool,
	glob: globTool as AnyTool,
	ask_user: askUserTool as AnyTool,
};

const MAX_NESTING_DEPTH = 3;

type TaskpRunInput = z.infer<typeof taskpRunParams>;

type TaskpRunResult = {
	readonly status: "success" | "failed";
	readonly output: string;
	readonly error?: string;
};

type TaskpRunDeps = {
	readonly skillRepository: SkillRepository;
	readonly commandExecutor: CommandExecutor;
	readonly promptCollector: PromptCollector;
	readonly callStack?: readonly string[];
	readonly callerSkillName?: string;
	readonly hookExecutor?: HookExecutorPort;
	readonly hooksConfig?: HooksConfig;
};

function parseSkillRef(ref: string): {
	readonly name: string;
	readonly action: string | undefined;
} {
	const colonIndex = ref.indexOf(":");
	if (colonIndex === -1) {
		return { name: ref, action: undefined };
	}
	return { name: ref.slice(0, colonIndex), action: ref.slice(colonIndex + 1) };
}

function buildTaskpRunOutput(runOutput: RunOutput): string {
	const parts: string[] = [runOutput.rendered];
	for (const cmd of runOutput.commands) {
		if (cmd.result.stdout) parts.push(cmd.result.stdout);
		if (cmd.result.stderr) parts.push(cmd.result.stderr);
	}
	return parts.join("\n");
}

function createTaskpRunTool(deps: TaskpRunDeps): AnyTool {
	const callStack = deps.callStack ?? [];

	const tool: Tool<TaskpRunInput, TaskpRunResult> = {
		description:
			"Run another taskp skill (template mode only). Use to invoke predefined skills with variable inputs.",
		inputSchema: zodToJsonSchema(taskpRunParams),
		execute: async ({ skill, set }) => {
			const ref = parseSkillRef(skill);
			const skillId = ref.action ? `${ref.name}:${ref.action}` : ref.name;

			if (callStack.includes(skillId)) {
				return { status: "failed", output: "", error: `Recursive call detected: ${skillId}` };
			}

			if (callStack.length >= MAX_NESTING_DEPTH) {
				return {
					status: "failed",
					output: "",
					error: `Maximum nesting depth (${MAX_NESTING_DEPTH}) exceeded`,
				};
			}

			const findResult = await deps.skillRepository.findByName(ref.name);
			if (!findResult.ok) {
				return { status: "failed", output: "", error: `Skill not found: ${ref.name}` };
			}

			const foundSkill = findResult.value;

			const effectiveMode = ref.action
				? (foundSkill.metadata.actions?.[ref.action]?.mode ?? foundSkill.metadata.mode)
				: foundSkill.metadata.mode;

			if (effectiveMode === "agent") {
				return {
					status: "failed",
					output: "",
					error: `Cannot call agent mode skill: ${skillId}. Only template mode skills are allowed.`,
				};
			}

			const result = await runSkill(
				{
					name: ref.name,
					action: ref.action,
					presets: (set ?? {}) as Readonly<Record<string, string>>,
					dryRun: false,
					force: false,
					noInput: true,
					callerSkill: deps.callerSkillName,
				},
				{
					skillRepository: deps.skillRepository,
					commandExecutor: deps.commandExecutor,
					promptCollector: deps.promptCollector,
					hookExecutor: deps.hookExecutor,
					hooksConfig: deps.hooksConfig,
				},
			);

			if (!result.ok) {
				return { status: "failed", output: "", error: domainErrorMessage(result.error) };
			}

			return { status: "success", output: buildTaskpRunOutput(result.value) };
		},
	};

	return tool as AnyTool;
}

export type BuildToolsOptions = {
	readonly taskpRunDeps?: TaskpRunDeps;
};

export function buildTools(
	toolNames: readonly string[],
	options?: BuildToolsOptions,
): Result<Record<string, AnyTool>, ExecutionError> {
	const tools: Record<string, AnyTool> = {};
	for (const name of toolNames) {
		if (name === "taskp_run") {
			if (!options?.taskpRunDeps) {
				return err(executionError("taskp_run requires taskpRunDeps in BuildToolsOptions"));
			}
			tools[name] = createTaskpRunTool(options.taskpRunDeps);
			continue;
		}
		const t = staticTools[name];
		if (t === undefined) {
			return err(executionError(`Unknown tool: ${name}`));
		}
		tools[name] = t;
	}
	return ok(tools);
}

/** ツール名からその description を返す。未知のツール名は undefined を返す。 */
export function getToolDescription(name: string): string | undefined {
	if (name === "taskp_run") {
		return "Run another taskp skill (template mode only). Use to invoke predefined skills with variable inputs.";
	}
	return staticTools[name]?.description;
}

export type { AnyTool, TaskpRunDeps, TaskpRunResult, ToolName };
export { TOOL_NAMES };
