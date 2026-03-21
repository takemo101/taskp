import { execaCommand } from "execa";
import type { ExecutionError } from "../core/types/errors";
import { executionError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import type { CommandExecutor, ExecOptions, ExecResult } from "../usecase/port/command-executor";
import { tryCatch } from "./error-handler-utils";

const DEFAULT_TIMEOUT_MS = 30_000;

export type CommandRunnerDeps = {
	readonly defaultTimeoutMs?: number;
};

export function createCommandRunner(deps?: CommandRunnerDeps): CommandExecutor {
	const timeoutMs = deps?.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;

	return {
		execute: async (
			command: string,
			options?: ExecOptions,
		): Promise<Result<ExecResult, ExecutionError>> => {
			return tryCatch(
				async () => {
					const result = await execaCommand(command, {
						shell: true,
						cwd: options?.cwd,
						env: options?.env as Record<string, string> | undefined,
						timeout: options?.timeout ?? timeoutMs,
					});

					return {
						stdout: result.stdout,
						stderr: result.stderr,
						exitCode: result.exitCode ?? 0,
					};
				},
				(e) => executionError(e.message),
			);
		},
	};
}
