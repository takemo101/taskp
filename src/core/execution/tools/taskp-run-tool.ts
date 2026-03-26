import type { Tool, ToolSet } from "ai";
import { z } from "zod";
import type { HooksConfig } from "../../../usecase/hook-runner";
import type { CommandExecutor } from "../../../usecase/port/command-executor";
import type { HookExecutorPort } from "../../../usecase/port/hook-executor";
import type { PromptCollector } from "../../../usecase/port/prompt-collector";
import type { SkillRepository } from "../../../usecase/port/skill-repository";
import { type RunOutput, runSkill } from "../../../usecase/run-skill";
import type { Action } from "../../skill/action";
import { resolveActionConfig } from "../../skill/action";
import type { Skill } from "../../skill/skill";
import { parseSkillRef } from "../../skill/skill-ref";
import { domainErrorMessage } from "../../types/errors";
import { err, ok, type Result } from "../../types/result";
import { zodToJsonSchema } from "./schema-helper";
import { type ToolResult, toolFailure, toolSuccess } from "./tool-output";

export const MAX_NESTING_DEPTH = 3;

export const taskpRunParams = z.object({
	skill: z.string().describe("Skill reference to run. Format: '<skill>' or '<skill>:<action>'."),
	set: z
		.record(z.string(), z.string())
		.optional()
		.describe("Variables to pass to the skill inputs (skips interactive prompts)."),
});

type TaskpRunInput = z.infer<typeof taskpRunParams>;

type TaskpRunData = {
	readonly output: string;
};

export type TaskpRunResult = ToolResult<TaskpRunData>;

export type TaskpRunDeps = {
	readonly skillRepository: SkillRepository;
	readonly commandExecutor: CommandExecutor;
	readonly promptCollector: PromptCollector;
	readonly callStack?: readonly string[];
	readonly callerSkillName?: string;
	readonly hookExecutor?: HookExecutorPort;
	readonly hooksConfig?: HooksConfig;
};

// Tool<I, O> のジェネリクスが共変でないため、異なる I/O を持つツールを
// 1つの Record にまとめるには Vercel AI SDK の ToolSet 値型を使う
type ToolSetEntry = ToolSet[string];

function buildTaskpRunOutput(runOutput: RunOutput): string {
	const parts: string[] = [runOutput.rendered];
	for (const cmd of runOutput.commands) {
		if (cmd.result.stdout) parts.push(cmd.result.stdout);
		if (cmd.result.stderr) parts.push(cmd.result.stderr);
	}
	return parts.join("\n");
}

export function validateTaskpRunCall(
	skillId: string,
	callStack: readonly string[],
): Result<void, string> {
	if (callStack.includes(skillId)) {
		return err(`Recursive call detected: ${skillId}`);
	}
	if (callStack.length >= MAX_NESTING_DEPTH) {
		return err(`Maximum nesting depth (${MAX_NESTING_DEPTH}) exceeded`);
	}
	return ok(undefined);
}

export function resolveSkillMode(skill: Skill, actionName?: string): "template" | "agent" {
	if (!actionName) return skill.metadata.mode;
	return skill.metadata.actions?.[actionName]?.mode ?? skill.metadata.mode;
}

function failedResult(error: string): TaskpRunResult {
	return toolFailure(error);
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

	return toolSuccess({ output: buildTaskpRunOutput(result.value) });
}

export function createTaskpRunTool(deps: TaskpRunDeps, description: string): ToolSetEntry {
	const callStack = deps.callStack ?? [];

	const tool: Tool<TaskpRunInput, TaskpRunResult> = {
		description,
		inputSchema: zodToJsonSchema(taskpRunParams),
		execute: async ({ skill, set }) =>
			executeTaskpRun(deps, callStack, skill, set as Readonly<Record<string, string>>),
	};

	return tool as ToolSetEntry;
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

	lines.push(`- ${skill.metadata.name}: ${skill.metadata.description}`);
	lines.push(...actionLines);
}
