import type { HookContext, HookExecutorPort } from "./port/hook-executor";

export type HooksConfig = {
	readonly on_success?: readonly string[];
	readonly on_failure?: readonly string[];
};

type RunHooksParams = {
	readonly hookExecutor: HookExecutorPort;
	readonly hooksConfig: HooksConfig;
	readonly context: HookContext;
};

export async function runHooks(params: RunHooksParams): Promise<void> {
	const commands =
		params.context.status === "success"
			? params.hooksConfig.on_success
			: params.hooksConfig.on_failure;

	if (commands === undefined || commands.length === 0) {
		return;
	}

	await params.hookExecutor.execute(commands, params.context);
}
