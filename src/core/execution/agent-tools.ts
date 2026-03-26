import type { Tool, ToolSet } from "ai";
import { type ExecutionError, executionError } from "../types/errors";
import { err, ok, type Result } from "../types/result";
import { askUserTool } from "./tools/ask-user-tool";
import { bashTool } from "./tools/bash-tool";
import { editTool } from "./tools/edit-tool";
import { fetchTool } from "./tools/fetch-tool";
import { globTool } from "./tools/glob-tool";
import { grepTool } from "./tools/grep-tool";
import { readTool } from "./tools/read-tool";
import { createTaskpRunTool, type TaskpRunDeps, type TaskpRunResult } from "./tools/taskp-run-tool";
import { writeTool } from "./tools/write-tool";

export { MAX_FETCH_LENGTH, validateFetchUrl } from "./tools/fetch-tool";
export { MAX_GREP_MATCHES } from "./tools/grep-tool";
export {
	buildTaskpRunDescription,
	MAX_NESTING_DEPTH,
	resolveSkillMode,
	validateTaskpRunCall,
} from "./tools/taskp-run-tool";
export type { ToolError, ToolOutput, ToolResult } from "./tools/tool-output";

export type { TaskpRunDeps, TaskpRunResult };

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

// Tool<I, O> のジェネリクスが共変でないため、異なる I/O を持つツールを
// 1つの Record にまとめるには Vercel AI SDK の ToolSet 値型へ安全に変換する
type ToolSetEntry = ToolSet[string];
type StaticToolName = Exclude<ToolName, "taskp_run">;

/** Tool<I, O> を ToolSetEntry へ型安全に変換する。非 Tool 値はコンパイルエラーになる。 */
function toToolSetEntry<I, O>(tool: Tool<I, O>): ToolSetEntry {
	return tool as ToolSetEntry;
}

const staticTools: Readonly<Record<StaticToolName, ToolSetEntry>> = {
	bash: toToolSetEntry(bashTool),
	read: toToolSetEntry(readTool),
	write: toToolSetEntry(writeTool),
	edit: toToolSetEntry(editTool),
	glob: toToolSetEntry(globTool),
	grep: toToolSetEntry(grepTool),
	fetch: toToolSetEntry(fetchTool),
	ask_user: toToolSetEntry(askUserTool),
};

const TASKP_RUN_DEFAULT_DESCRIPTION =
	"Run another taskp skill (template mode only). Use to invoke predefined skills with variable inputs.";

function isStaticToolName(name: string): name is StaticToolName {
	return name in staticTools;
}

/** ツール名からその description を返す。未知のツール名は undefined を返す。 */
export function getToolDescription(name: string): string | undefined {
	if (name === "taskp_run") {
		return TASKP_RUN_DEFAULT_DESCRIPTION;
	}
	if (!isStaticToolName(name)) return undefined;
	return staticTools[name].description;
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

export type ToolDescriptions = Readonly<Record<string, string>>;

export function buildTools(
	toolNames: readonly string[],
	taskpRunDeps?: TaskpRunDeps,
	toolDescriptions?: ToolDescriptions,
): Result<ToolSet, ExecutionError> {
	const tools: ToolSet = {};
	for (const name of toolNames) {
		if (name === "taskp_run") {
			if (!taskpRunDeps) {
				return err(executionError("taskp_run requires taskpRunDeps"));
			}
			const description = toolDescriptions?.taskp_run ?? TASKP_RUN_DEFAULT_DESCRIPTION;
			tools[name] = createTaskpRunTool(taskpRunDeps, description);
			continue;
		}
		if (!isStaticToolName(name)) {
			return err(executionError(`Unknown tool: ${name}`));
		}
		const t = staticTools[name];
		const override = toolDescriptions?.[name];
		tools[name] = override ? { ...t, description: override } : t;
	}
	return ok(tools);
}

export type { ToolName };
export { TOOL_NAMES };
