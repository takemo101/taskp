import type { CommandExecutor } from "../usecase/port/command-executor";
import type { HookContext, HookExecutorPort, HookResult } from "../usecase/port/hook-executor";

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
		TASKP_SKILL_NAME: context.skillName,
		TASKP_ACTION_NAME: context.actionName ?? "",
		TASKP_SKILL_REF: buildSkillRef(context.skillName, context.actionName),
		TASKP_MODE: context.mode,
		TASKP_STATUS: context.status,
		TASKP_DURATION_MS: String(context.durationMs),
		TASKP_ERROR: errorValue.slice(0, MAX_ERROR_LENGTH),
	};
}

export function createHookExecutor(commandExecutor: CommandExecutor): HookExecutorPort {
	return {
		async execute(
			commands: readonly string[],
			context: HookContext,
		): Promise<readonly HookResult[]> {
			if (commands.length === 0) {
				return [];
			}

			const mergedEnv = { ...getParentEnv(), ...buildEnvVars(context) };
			const results: HookResult[] = [];

			for (const command of commands) {
				const result = await commandExecutor.execute(command, {
					env: mergedEnv,
					timeout: TIMEOUT_MS,
				});

				if (result.ok) {
					results.push({ command, success: true });
				} else {
					console.error(`[taskp] hook warning: "${command}" failed: ${result.error.message}`);
					results.push({ command, success: false, error: result.error.message });
				}
			}

			return results;
		},
	};
}
