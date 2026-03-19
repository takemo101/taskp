import { execaCommand } from "execa";
import type { ExecutionError } from "../core/types/errors";
import { executionError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import type { CommandExecutor, ExecOptions, ExecResult } from "../usecase/port/command-executor";

const DEFAULT_TIMEOUT_MS = 30_000;

export function createCommandRunner(): CommandExecutor {
	return {
		execute: async (
			command: string,
			options?: ExecOptions,
		): Promise<Result<ExecResult, ExecutionError>> => {
			try {
				const result = await execaCommand(command, {
					shell: true,
					cwd: options?.cwd,
					env: options?.env as Record<string, string> | undefined,
					timeout: options?.timeout ?? DEFAULT_TIMEOUT_MS,
				});

				return ok({
					stdout: result.stdout,
					stderr: result.stderr,
					exitCode: result.exitCode ?? 0,
				});
			} catch (error: unknown) {
				return err(executionError(toErrorMessage(error)));
			}
		},
	};
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
