import type { CommandExecutor } from "../usecase/port/command-executor";
import type {
	AfterHookContext,
	BeforeHookContext,
	HookContext,
	HookExecutorPort,
	HookPhase,
	HookResult,
} from "../usecase/port/hook-executor";
import type { Logger } from "../usecase/port/logger";

const TIMEOUT_MS = 30_000;
const MAX_ERROR_LENGTH = 1024;

function getParentEnv(): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(process.env)) {
		if (value !== undefined) {
			result[key] = value;
		}
	}
	return result;
}

function buildSkillRef(skillName: string, actionName: string | undefined): string {
	return actionName ? `${skillName}:${actionName}` : skillName;
}

function buildEnvVars(context: HookContext): Record<string, string> {
	const errorValue = context.error ?? "";
	return {
		TASKP_SESSION_ID: context.sessionId,
		TASKP_SKILL_NAME: context.skillName,
		TASKP_ACTION_NAME: context.actionName ?? "",
		TASKP_SKILL_REF: buildSkillRef(context.skillName, context.actionName),
		TASKP_MODE: context.mode,
		TASKP_STATUS: context.status,
		TASKP_DURATION_MS: String(context.durationMs),
		TASKP_ERROR: errorValue.slice(0, MAX_ERROR_LENGTH),
		TASKP_CALLER_SKILL: context.callerSkill ?? "",
		TASKP_SKILL_DIR: context.skillDir,
		TASKP_CWD: context.cwd,
		TASKP_DATE: context.date,
		TASKP_TIMESTAMP: context.timestamp,
	};
}

export function buildBaseEnvVars(
	context: BeforeHookContext | AfterHookContext,
	phase: string,
): Record<string, string> {
	return {
		TASKP_SESSION_ID: context.sessionId,
		TASKP_SKILL_NAME: context.skillName,
		TASKP_ACTION_NAME: context.actionName ?? "",
		TASKP_SKILL_REF: buildSkillRef(context.skillName, context.actionName),
		TASKP_MODE: context.mode,
		TASKP_OUTPUT_FILE: context.outputFile,
		TASKP_CALLER_SKILL: context.callerSkill ?? "",
		TASKP_HOOK_PHASE: phase,
		TASKP_SKILL_DIR: context.skillDir,
		TASKP_CWD: context.cwd,
		TASKP_DATE: context.date,
		TASKP_TIMESTAMP: context.timestamp,
	};
}

export function buildAfterEnvVars(
	context: AfterHookContext,
	phase: string,
): Record<string, string> {
	return {
		...buildBaseEnvVars(context, phase),
		TASKP_STATUS: context.status,
		TASKP_DURATION_MS: String(context.durationMs),
		TASKP_ERROR: (context.error ?? "").slice(0, MAX_ERROR_LENGTH),
	};
}

function isSkillHookContext(
	context: HookContext | BeforeHookContext | AfterHookContext,
): context is BeforeHookContext | AfterHookContext {
	return "outputFile" in context;
}

function isAfterHookContext(
	context: BeforeHookContext | AfterHookContext,
): context is AfterHookContext {
	return "status" in context;
}

function buildEnvVarsForContext(
	context: HookContext | BeforeHookContext | AfterHookContext,
	phase: string,
): Record<string, string> {
	if (!isSkillHookContext(context)) {
		return buildEnvVars(context);
	}
	if (isAfterHookContext(context)) {
		return buildAfterEnvVars(context, phase);
	}
	return buildBaseEnvVars(context, phase);
}

export function createHookExecutor(
	commandExecutor: CommandExecutor,
	logger: Logger,
): HookExecutorPort {
	return {
		async execute(
			commands: readonly string[],
			context: HookContext | BeforeHookContext | AfterHookContext,
			phase?: HookPhase,
		): Promise<readonly HookResult[]> {
			if (commands.length === 0) {
				return [];
			}

			const mergedEnv = {
				...getParentEnv(),
				...buildEnvVarsForContext(context, phase ?? ""),
			};
			const results: HookResult[] = [];

			for (const command of commands) {
				const result = await commandExecutor.execute(command, {
					env: mergedEnv,
					timeout: TIMEOUT_MS,
				});

				if (result.ok) {
					results.push({ command, success: true });
				} else {
					const errorMsg = "message" in result.error ? result.error.message : String(result.error);
					logger.error(`hook warning: "${command}" failed: ${errorMsg}`);
					results.push({ command, success: false, error: errorMsg });
				}
			}

			return results;
		},
	};
}
