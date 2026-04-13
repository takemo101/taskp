import type { Tool, ToolSet } from "ai";
import { z } from "zod";
import type { HooksConfig } from "../../../usecase/hook-runner";
import type { CommandExecutor } from "../../../usecase/port/command-executor";
import type { HookExecutorPort } from "../../../usecase/port/hook-executor";
import type { OutputFileStorePort } from "../../../usecase/port/output-file-store";
import type { PromptCollector } from "../../../usecase/port/prompt-collector";
import type { SkillRepository } from "../../../usecase/port/skill-repository";
import { type RunOutput, runSkill } from "../../../usecase/run-skill";
import type { SessionId } from "../../execution/session";
import type { Action } from "../../skill/action";
import {
	formatDescriptionEntriesWithinBudget,
	type DescriptionBudgetResult,
	type DescriptionBudgetOptions,
	type DescriptionEntry,
} from "../../skill/skill-description-budget";
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
	readonly outputFileStore?: OutputFileStorePort;
	readonly sessionId: SessionId;
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
			sessionId: deps.sessionId,
		},
		{
			skillRepository: deps.skillRepository,
			commandExecutor: deps.commandExecutor,
			promptCollector: deps.promptCollector,
			hookExecutor: deps.hookExecutor,
			hooksConfig: deps.hooksConfig,
			outputFileStore: deps.outputFileStore,
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
	budgetOptions?: DescriptionBudgetOptions,
): string {
	return buildTaskpRunDescriptionResult(skills, currentSkillName, budgetOptions).text;
}

export function buildTaskpRunDescriptionResult(
	skills: readonly Skill[],
	currentSkillName?: string,
	budgetOptions?: DescriptionBudgetOptions,
): DescriptionBudgetResult {
	const entries = collectSkillEntries(skills, currentSkillName);
	const formatted = formatLines(
		entries,
		budgetOptions,
		TASKP_RUN_BASE_DESCRIPTION.length + "\n\nAvailable skills:\n".length,
	);

	if (formatted.lines.length === 0) {
		const baseText = budgetOptions
			? clampText(TASKP_RUN_BASE_DESCRIPTION, budgetOptions.budgetChars)
			: TASKP_RUN_BASE_DESCRIPTION;
		return {
			text: baseText,
			phase: budgetOptions ? 4 : 1,
			truncatedEntryCount: budgetOptions ? entries.length : 0,
			omittedEntryCount: budgetOptions ? entries.length : 0,
		};
	}

	return {
		text: `${TASKP_RUN_BASE_DESCRIPTION}\n\nAvailable skills:\n${formatted.lines.join("\n")}`,
		phase: formatted.phase,
		truncatedEntryCount: formatted.truncatedEntryCount,
		omittedEntryCount: formatted.omittedEntryCount,
	};
}

function clampText(text: string, maxChars: number): string {
	if (text.length <= maxChars) return text;
	if (maxChars <= 1) return "…";
	return `${text.slice(0, maxChars - 1)}…`;
}

function collectSkillEntries(
	skills: readonly Skill[],
	currentSkillName?: string,
): readonly DescriptionEntry[] {
	const entries: DescriptionEntry[] = [];

	for (const skill of skills) {
		if (skill.metadata.name === currentSkillName) continue;

		const hasActions = skill.metadata.actions && Object.keys(skill.metadata.actions).length > 0;

		if (hasActions) {
			appendSkillWithActions(entries, skill);
		} else {
			appendSimpleSkill(entries, skill);
		}
	}

	return entries;
}

function appendSimpleSkill(entries: DescriptionEntry[], skill: Skill): void {
	if (skill.metadata.mode === "agent") return;
	entries.push({ label: `- ${skill.metadata.name}`, description: skill.metadata.description });
}

function appendSkillWithActions(entries: DescriptionEntry[], skill: Skill): void {
	const actions = skill.metadata.actions as Record<string, Action>;
	const actionEntries: DescriptionEntry[] = [];

	for (const [actionName, action] of Object.entries(actions)) {
		const resolved = resolveActionConfig(action, skill.metadata);
		if (resolved.mode === "agent") continue;
		actionEntries.push({
			label: `  - ${skill.metadata.name}:${actionName}`,
			description: resolved.description,
		});
	}

	if (actionEntries.length === 0) return;

	entries.push({ label: `- ${skill.metadata.name}`, description: skill.metadata.description });
	entries.push(...actionEntries);
}

function formatLines(
	entries: readonly DescriptionEntry[],
	budgetOptions?: DescriptionBudgetOptions,
	baseLength = 0,
): {
	readonly lines: readonly string[];
	readonly phase: 1 | 2 | 3 | 4;
	readonly truncatedEntryCount: number;
	readonly omittedEntryCount: number;
} {
	if (budgetOptions === undefined) {
		return {
			lines: entries.map((entry) => `${entry.label}: ${entry.description}`),
			phase: 1,
			truncatedEntryCount: 0,
			omittedEntryCount: 0,
		};
	}

	if (budgetOptions.budgetChars <= baseLength) {
		return {
			lines: [],
			phase: 4,
			truncatedEntryCount: entries.length,
			omittedEntryCount: entries.length,
		};
	}

	const result = formatDescriptionEntriesWithinBudget(entries, {
		...budgetOptions,
		budgetChars: budgetOptions.budgetChars - baseLength,
	});
	return {
		lines: result.text === "" ? [] : result.text.split("\n"),
		phase: result.phase,
		truncatedEntryCount: result.truncatedEntryCount,
		omittedEntryCount: result.omittedEntryCount,
	};
}
