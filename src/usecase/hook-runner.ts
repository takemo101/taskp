import type { HooksConfig } from "../adapter/config-loader";
import type { HookContext, HookExecutorPort } from "./port/hook-executor";

export type { HooksConfig };

type RunHooksParams = {
	readonly hookExecutor?: HookExecutorPort;
	readonly hooksConfig?: HooksConfig;
	readonly context: HookContext;
};

export async function runHooks(params: RunHooksParams): Promise<void> {
	if (params.hookExecutor === undefined || params.hooksConfig === undefined) {
		return;
	}

	const commands =
		params.context.status === "success"
			? params.hooksConfig.on_success
			: params.hooksConfig.on_failure;

	if (commands === undefined || commands.length === 0) {
		return;
	}

	try {
		await params.hookExecutor.execute(commands, params.context);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[taskp] hook error: ${message}`);
	}
}
