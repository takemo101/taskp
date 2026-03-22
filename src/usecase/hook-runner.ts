import type { HooksConfig } from "../adapter/config-loader";
import { type ExecutionError, executionError } from "../core/types/errors";
import { err, ok, type Result } from "../core/types/result";
import type { HookContext, HookExecutorPort } from "./port/hook-executor";

export type { HooksConfig };

type RunHooksParams = {
	readonly hookExecutor?: HookExecutorPort;
	readonly hooksConfig?: HooksConfig;
	readonly context: HookContext;
};

export async function runHooks(params: RunHooksParams): Promise<Result<void, ExecutionError>> {
	if (params.hookExecutor === undefined || params.hooksConfig === undefined) {
		return ok(undefined);
	}

	const commands =
		params.context.status === "success"
			? params.hooksConfig.on_success
			: params.hooksConfig.on_failure;

	if (commands === undefined || commands.length === 0) {
		return ok(undefined);
	}

	try {
		await params.hookExecutor.execute(commands, params.context);
		return ok(undefined);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return err(executionError(`Hook failed: ${message}`));
	}
}
