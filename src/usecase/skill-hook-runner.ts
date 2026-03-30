import { resolveActionConfig } from "../core/skill/action";
import type { Skill } from "../core/skill/skill";
import type { SkillHooks } from "../core/skill/skill-metadata";
import { type ExecutionError, executionError } from "../core/types/errors";
import { err, ok, type Result } from "../core/types/result";
import type { AfterHookContext, BeforeHookContext, HookExecutorPort } from "./port/hook-executor";
import type { Logger } from "./port/logger";

export function resolveSkillHooks(
	skill: Skill,
	actionName: string | undefined,
): SkillHooks | undefined {
	if (!actionName) return skill.metadata.hooks;
	const action = skill.metadata.actions?.[actionName];
	if (!action) return skill.metadata.hooks;
	return resolveActionConfig(action, skill.metadata).hooks;
}

type RunBeforeHooksParams = {
	readonly hookExecutor?: HookExecutorPort;
	readonly hooks?: SkillHooks;
	readonly context: BeforeHookContext;
	readonly logger: Logger;
};

type RunAfterHooksParams = {
	readonly hookExecutor?: HookExecutorPort;
	readonly hooks?: SkillHooks;
	readonly context: AfterHookContext;
	readonly logger: Logger;
};

export async function runBeforeHooks(
	params: RunBeforeHooksParams,
): Promise<Result<void, ExecutionError>> {
	const commands = params.hooks?.before;
	if (
		params.hookExecutor === undefined ||
		params.hooks === undefined ||
		commands === undefined ||
		commands.length === 0
	) {
		return ok(undefined);
	}

	try {
		const results = await params.hookExecutor.execute(commands, params.context, "before");
		const failures = results.filter((r) => !r.success);
		if (failures.length > 0) {
			const details = failures
				.map((f) => `"${f.command}": ${f.error ?? "unknown error"}`)
				.join(", ");
			return err(executionError(`Skill before hook failed: ${details}`));
		}
		return ok(undefined);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return err(executionError(`Skill before hook failed: ${message}`));
	}
}

export async function runAfterHooks(params: RunAfterHooksParams): Promise<void> {
	const commands = params.hooks?.after;
	if (
		params.hookExecutor === undefined ||
		params.hooks === undefined ||
		commands === undefined ||
		commands.length === 0
	) {
		return;
	}

	try {
		const results = await params.hookExecutor.execute(commands, params.context, "after");
		const failures = results.filter((r) => !r.success);
		if (failures.length > 0) {
			const details = failures
				.map((f) => `"${f.command}": ${f.error ?? "unknown error"}`)
				.join(", ");
			params.logger.warn(`Skill after hook warning: ${details}`);
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		params.logger.warn(`Skill after hook warning: ${message}`);
	}
}

export async function runOnFailureHooks(params: RunAfterHooksParams): Promise<void> {
	const commands = params.hooks?.on_failure;
	if (
		params.hookExecutor === undefined ||
		params.hooks === undefined ||
		commands === undefined ||
		commands.length === 0
	) {
		return;
	}

	try {
		const results = await params.hookExecutor.execute(commands, params.context, "on_failure");
		const failures = results.filter((r) => !r.success);
		if (failures.length > 0) {
			const details = failures
				.map((f) => `"${f.command}": ${f.error ?? "unknown error"}`)
				.join(", ");
			params.logger.warn(`Skill on_failure hook warning: ${details}`);
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		params.logger.warn(`Skill on_failure hook warning: ${message}`);
	}
}
