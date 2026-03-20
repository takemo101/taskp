import { glob as fsGlob, readFile, writeFile } from "node:fs/promises";
import { input } from "@inquirer/prompts";
import type { JSONSchema7, Tool } from "ai";
import { jsonSchema } from "ai";
import { execa } from "execa";
import { toJSONSchema, z } from "zod";

// Vercel AI SDK は JSONSchema7 形式のツール定義を要求するが、
// zod スキーマから直接変換する公式 API がないため、
// toJSONSchema → jsonSchema のブリッジが必要
function zodToJsonSchema<T extends z.ZodType>(schema: T) {
	return jsonSchema<z.infer<T>>(toJSONSchema(schema) as JSONSchema7);
}

const TOOL_NAMES = ["bash", "read", "write", "glob", "ask_user"] as const;
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
// 1つの Record にまとめるには any が必要（AI SDK の型設計上の制約）
// biome-ignore lint/suspicious/noExplicitAny: Tool generic variance prevents strict typing with Record<ToolName, Tool>
const allTools: Record<ToolName, Tool<any, any>> = {
	bash: bashTool,
	read: readTool,
	write: writeTool,
	glob: globTool,
	ask_user: askUserTool,
};

export function buildTools(
	toolNames: readonly string[],
	// biome-ignore lint/suspicious/noExplicitAny: Tool generic variance prevents strict typing
): Record<string, Tool<any, any>> {
	// biome-ignore lint/suspicious/noExplicitAny: Tool generic variance prevents strict typing
	const tools: Record<string, Tool<any, any>> = {};
	for (const name of toolNames) {
		const t = allTools[name as ToolName];
		if (t === undefined) {
			throw new Error(`Unknown tool: ${name}`);
		}
		tools[name] = t;
	}
	return tools;
}

export type { ToolName };
export { TOOL_NAMES };
