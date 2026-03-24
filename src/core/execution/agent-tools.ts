import type { Stats } from "node:fs";
import { glob as fsGlob, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { input } from "@inquirer/prompts";
import type { JSONSchema7, Tool, ToolSet } from "ai";
import { jsonSchema } from "ai";
import { execa } from "execa";
import { toJSONSchema, z } from "zod";
import type { HooksConfig } from "../../usecase/hook-runner";
import type { CommandExecutor } from "../../usecase/port/command-executor";
import type { HookExecutorPort } from "../../usecase/port/hook-executor";
import type { PromptCollector } from "../../usecase/port/prompt-collector";
import type { SkillRepository } from "../../usecase/port/skill-repository";
import { type RunOutput, runSkill } from "../../usecase/run-skill";
import type { Action } from "../skill/action";
import { resolveActionConfig } from "../skill/action";
import type { Skill } from "../skill/skill";
import { parseSkillRef } from "../skill/skill-ref";
import { domainErrorMessage, type ExecutionError, executionError } from "../types/errors";
import { err, ok, type Result } from "../types/result";

// Vercel AI SDK は JSONSchema7 形式のツール定義を要求するが、
// zod スキーマから直接変換する公式 API がないため、
// toJSONSchema → jsonSchema のブリッジが必要
function zodToJsonSchema<T extends z.ZodType>(schema: T) {
	return jsonSchema<z.infer<T>>(toJSONSchema(schema) as JSONSchema7);
}

const TOOL_NAMES = [
	"bash",
	"read",
	"write",
	"edit",
	"glob",
	"grep",
	"fetch",
	"ask_user",
	"taskp_run",
] as const;
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

const editParams = z.object({
	path: z.string().describe("File path to edit"),
	oldString: z.string().describe("The exact string to find and replace"),
	newString: z.string().describe("The replacement string"),
});

const globParams = z.object({
	pattern: z.string().describe("Glob pattern to match files"),
});

const grepParams = z.object({
	pattern: z.string().describe("Search pattern (regex supported)"),
	path: z.string().optional().describe("File or directory to search (default: cwd)"),
	include: z.string().optional().describe("Glob pattern to filter files (e.g. '*.ts')"),
});

const askUserParams = z.object({
	question: z.string().describe("The question to ask the user"),
});

const fetchParams = z.object({
	url: z.string().url().describe("URL to fetch (http or https only)"),
	maxLength: z
		.number()
		.optional()
		.describe("Maximum response length in characters (default: 50000)"),
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

type EditInput = z.infer<typeof editParams>;

const editTool: Tool<EditInput, string> = {
	description:
		"Replace a specific string in a file. The oldString must match exactly one location in the file.",
	inputSchema: zodToJsonSchema(editParams),
	execute: async ({ path, oldString, newString }) => {
		let content: string;
		try {
			content = await readFile(path, "utf-8");
		} catch (error) {
			throw new Error(`Failed to read file: ${path}`, { cause: error });
		}

		const index = content.indexOf(oldString);
		if (index === -1) {
			throw new Error(`String not found in ${path}`);
		}

		const secondIndex = content.indexOf(oldString, index + 1);
		if (secondIndex !== -1) {
			throw new Error(
				`Multiple matches found in ${path}. Provide more context in oldString to uniquely identify the location.`,
			);
		}

		const updated = content.slice(0, index) + newString + content.slice(index + oldString.length);

		try {
			await writeFile(path, updated, "utf-8");
		} catch (error) {
			throw new Error(`Failed to write file: ${path}`, { cause: error });
		}

		return `Edited ${path}`;
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

const MAX_GREP_MATCHES = 500;

type GrepInput = z.infer<typeof grepParams>;

type GrepResult = {
	readonly matches: string;
	readonly count: number;
	readonly truncated: boolean;
};

async function resolveSearchFiles(
	searchPath: string,
	include: string | undefined,
	cwd: string,
): Promise<readonly string[]> {
	const fullPath = resolve(cwd, searchPath);
	let fileStat: Stats;
	try {
		fileStat = await stat(fullPath);
	} catch {
		throw new Error(`Path not found: ${searchPath}`);
	}

	if (fileStat.isFile()) {
		return [searchPath];
	}

	const globPattern = include ?? "**/*";
	const files: string[] = [];
	for await (const entry of fsGlob(globPattern, { cwd: fullPath })) {
		const entryPath = join(searchPath, entry);
		const entryStat = await stat(resolve(cwd, entryPath)).catch(() => undefined);
		if (entryStat?.isFile()) {
			files.push(entryPath);
		}
	}
	return files;
}

function searchFileContent(
	content: string,
	regex: RegExp,
	filePath: string,
	results: string[],
	limit: number,
): void {
	const lines = content.split("\n");
	for (let i = 0; i < lines.length; i++) {
		if (results.length >= limit) return;
		if (regex.test(lines[i])) {
			results.push(`${filePath}:${i + 1}:${lines[i]}`);
		}
	}
}

const grepTool: Tool<GrepInput, GrepResult> = {
	description:
		"Search file contents for a pattern and return matching lines with file paths and line numbers",
	inputSchema: zodToJsonSchema(grepParams),
	execute: async ({ pattern, path, include }) => {
		const cwd = process.cwd();
		const searchPath = path ?? ".";
		const regex = new RegExp(pattern);

		const files = await resolveSearchFiles(searchPath, include, cwd);

		const results: string[] = [];
		for (const file of files) {
			if (results.length >= MAX_GREP_MATCHES) break;
			const fullFilePath = resolve(cwd, file);
			try {
				const content = await readFile(fullFilePath, "utf-8");
				searchFileContent(content, regex, file, results, MAX_GREP_MATCHES);
			} catch {
				// Skip unreadable files (binary, permission denied, etc.)
			}
		}

		return {
			matches: results.join("\n"),
			count: results.length,
			truncated: results.length >= MAX_GREP_MATCHES,
		};
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

const MAX_FETCH_LENGTH = 50_000;
const FETCH_TIMEOUT_MS = 30_000;

const PRIVATE_IP_PREFIXES = ["10.", "192.168."] as const;
const BLOCKED_HOSTNAMES = [
	"localhost",
	"127.0.0.1",
	"[::1]",
	"0.0.0.0",
	"169.254.169.254",
] as const;

/** RFC 1918: 172.16.0.0/12 (172.16.0.0 – 172.31.255.255) */
function isPrivate172Block(hostname: string): boolean {
	if (!hostname.startsWith("172.")) return false;
	const secondOctet = Number.parseInt(hostname.split(".")[1], 10);
	return secondOctet >= 16 && secondOctet <= 31;
}

function validateFetchUrl(url: string): void {
	const parsed = new URL(url);

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(`Unsupported protocol: ${parsed.protocol}. Only http and https are allowed.`);
	}

	const { hostname } = parsed;
	const isBlocked =
		(BLOCKED_HOSTNAMES as readonly string[]).includes(hostname) ||
		PRIVATE_IP_PREFIXES.some((prefix) => hostname.startsWith(prefix)) ||
		isPrivate172Block(hostname);

	if (isBlocked) {
		throw new Error(`Access to internal/private addresses is not allowed: ${hostname}`);
	}
}

type FetchInput = z.infer<typeof fetchParams>;

type FetchResult = {
	readonly content: string;
	readonly truncated: boolean;
	readonly length: number;
};

function isTextContentType(contentType: string): boolean {
	return (
		contentType.includes("text/") ||
		contentType.includes("application/json") ||
		contentType.includes("application/xml")
	);
}

const fetchTool: Tool<FetchInput, FetchResult> = {
	description:
		"Fetch text content from a URL (http/https only). Useful for reading documentation, API references, or web pages.",
	inputSchema: zodToJsonSchema(fetchParams),
	execute: async ({ url, maxLength }) => {
		validateFetchUrl(url);

		const response = await fetch(url, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			redirect: "error",
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const contentType = response.headers.get("content-type") ?? "";
		if (!isTextContentType(contentType)) {
			throw new Error(`Non-text content type: ${contentType}. Only text content is supported.`);
		}

		const text = await response.text();
		const limit = maxLength ?? MAX_FETCH_LENGTH;
		const truncated = text.length > limit;
		const content = truncated ? text.slice(0, limit) : text;

		return { content, truncated, length: text.length };
	},
};

// Tool<I, O> のジェネリクスが共変でないため、異なる I/O を持つツールを
// 1つの Record にまとめるには Vercel AI SDK の ToolSet 値型を使う
type ToolSetEntry = ToolSet[string];

// taskp_run 以外の静的ツール
const staticTools: Record<string, ToolSetEntry> = {
	bash: bashTool as ToolSetEntry,
	read: readTool as ToolSetEntry,
	write: writeTool as ToolSetEntry,
	edit: editTool as ToolSetEntry,
	glob: globTool as ToolSetEntry,
	grep: grepTool as ToolSetEntry,
	fetch: fetchTool as ToolSetEntry,
	ask_user: askUserTool as ToolSetEntry,
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

function buildTaskpRunOutput(runOutput: RunOutput): string {
	const parts: string[] = [runOutput.rendered];
	for (const cmd of runOutput.commands) {
		if (cmd.result.stdout) parts.push(cmd.result.stdout);
		if (cmd.result.stderr) parts.push(cmd.result.stderr);
	}
	return parts.join("\n");
}

function validateTaskpRunCall(skillId: string, callStack: readonly string[]): Result<void, string> {
	if (callStack.includes(skillId)) {
		return err(`Recursive call detected: ${skillId}`);
	}
	if (callStack.length >= MAX_NESTING_DEPTH) {
		return err(`Maximum nesting depth (${MAX_NESTING_DEPTH}) exceeded`);
	}
	return ok(undefined);
}

function resolveSkillMode(skill: Skill, actionName?: string): "template" | "agent" {
	if (!actionName) return skill.metadata.mode;
	return skill.metadata.actions?.[actionName]?.mode ?? skill.metadata.mode;
}

function failedResult(error: string): TaskpRunResult {
	return { status: "failed", output: "", error };
}

async function executeTaskpRun(
	deps: TaskpRunDeps,
	callStack: readonly string[],
	skill: string,
	set?: Readonly<Record<string, string>>,
): Promise<TaskpRunResult> {
	const refResult = parseSkillRef(skill);
	if (!refResult.ok) return failedResult(refResult.error.message);

	const ref = refResult.value;
	const skillId = ref.action ? `${ref.name}:${ref.action}` : ref.name;

	const validation = validateTaskpRunCall(skillId, callStack);
	if (!validation.ok) return failedResult(validation.error);

	const findResult = await deps.skillRepository.findByName(ref.name);
	if (!findResult.ok) return failedResult(`Skill not found: ${ref.name}`);

	const foundSkill = findResult.value;
	const effectiveMode = resolveSkillMode(foundSkill, ref.action);

	if (effectiveMode === "agent") {
		return failedResult(
			`Cannot call agent mode skill: ${skillId}. Only template mode skills are allowed.`,
		);
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

	if (!result.ok) return failedResult(domainErrorMessage(result.error));

	return { status: "success", output: buildTaskpRunOutput(result.value) };
}

function createTaskpRunTool(deps: TaskpRunDeps, description: string): ToolSetEntry {
	const callStack = deps.callStack ?? [];

	const tool: Tool<TaskpRunInput, TaskpRunResult> = {
		description,
		inputSchema: zodToJsonSchema(taskpRunParams),
		execute: async ({ skill, set }) =>
			executeTaskpRun(deps, callStack, skill, set as Readonly<Record<string, string>>),
	};

	return tool as ToolSetEntry;
}

export type DescriptionOverrides = Readonly<Record<string, string>>;

export type BuildToolsOptions = {
	readonly taskpRunDeps?: TaskpRunDeps;
	readonly descriptionOverrides?: DescriptionOverrides;
};

export function buildTools(
	toolNames: readonly string[],
	options?: BuildToolsOptions,
): Result<ToolSet, ExecutionError> {
	const tools: ToolSet = {};
	for (const name of toolNames) {
		if (name === "taskp_run") {
			if (!options?.taskpRunDeps) {
				return err(executionError("taskp_run requires taskpRunDeps in BuildToolsOptions"));
			}
			const description = options.descriptionOverrides?.taskp_run ?? TASKP_RUN_DEFAULT_DESCRIPTION;
			tools[name] = createTaskpRunTool(options.taskpRunDeps, description);
			continue;
		}
		const t = staticTools[name];
		if (t === undefined) {
			return err(executionError(`Unknown tool: ${name}`));
		}
		const override = options?.descriptionOverrides?.[name];
		tools[name] = override ? { ...t, description: override } : t;
	}
	return ok(tools);
}

const TASKP_RUN_DEFAULT_DESCRIPTION =
	"Run another taskp skill (template mode only). Use to invoke predefined skills with variable inputs.";

/** ツール名からその description を返す。未知のツール名は undefined を返す。 */
export function getToolDescription(name: string): string | undefined {
	if (name === "taskp_run") {
		return TASKP_RUN_DEFAULT_DESCRIPTION;
	}
	return staticTools[name]?.description;
}

const TASKP_RUN_BASE_DESCRIPTION =
	"Run another taskp skill or action. Only template-mode skills can be invoked.";

/**
 * スキル一覧から taskp_run ツールの description を動的構築する。
 * agent モードのスキル/アクションは除外し、template モードのみ表示する。
 */
export function buildTaskpRunDescription(
	skills: readonly Skill[],
	currentSkillName?: string,
): string {
	const lines = collectSkillLines(skills, currentSkillName);

	if (lines.length === 0) {
		return TASKP_RUN_BASE_DESCRIPTION;
	}

	return `${TASKP_RUN_BASE_DESCRIPTION}\n\nAvailable skills:\n${lines.join("\n")}`;
}

function collectSkillLines(skills: readonly Skill[], currentSkillName?: string): readonly string[] {
	const lines: string[] = [];

	for (const skill of skills) {
		if (skill.metadata.name === currentSkillName) continue;

		const hasActions = skill.metadata.actions && Object.keys(skill.metadata.actions).length > 0;

		if (hasActions) {
			appendSkillWithActions(lines, skill);
		} else {
			appendSimpleSkill(lines, skill);
		}
	}

	return lines;
}

function appendSimpleSkill(lines: string[], skill: Skill): void {
	if (skill.metadata.mode === "agent") return;
	lines.push(`- ${skill.metadata.name}: ${skill.metadata.description}`);
}

function appendSkillWithActions(lines: string[], skill: Skill): void {
	const actions = skill.metadata.actions as Record<string, Action>;
	const actionLines: string[] = [];

	for (const [actionName, action] of Object.entries(actions)) {
		const resolved = resolveActionConfig(action, skill.metadata);
		if (resolved.mode === "agent") continue;
		actionLines.push(`  - ${skill.metadata.name}:${actionName}: ${resolved.description}`);
	}

	if (actionLines.length === 0) return;

	// スキル自体が template でもアクションがあればヘッダーを表示
	lines.push(`- ${skill.metadata.name}: ${skill.metadata.description}`);
	lines.push(...actionLines);
}

/**
 * ツールごとの「最も重要な引数キー」。
 * 表示層がツール名で switch-case する代わりに、このマップを参照する。
 */
const PRIMARY_ARG_KEYS: Readonly<Record<ToolName, string | undefined>> = {
	bash: "command",
	read: "path",
	write: "path",
	edit: "path",
	glob: "pattern",
	grep: "pattern",
	fetch: "url",
	ask_user: "question",
	taskp_run: "skill",
};

/** ツール名に対応する primaryArgKey を返す。未知のツール名は undefined。 */
export function getPrimaryArgKey(toolName: string): string | undefined {
	return PRIMARY_ARG_KEYS[toolName as ToolName];
}

export type { TaskpRunDeps, TaskpRunResult, ToolName };
export {
	MAX_FETCH_LENGTH,
	MAX_GREP_MATCHES,
	MAX_NESTING_DEPTH,
	resolveSkillMode,
	TOOL_NAMES,
	validateFetchUrl,
	validateTaskpRunCall,
};
