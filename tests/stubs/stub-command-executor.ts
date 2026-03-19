import type { ExecutionError } from "../../src/core/types/errors";
import type { Result } from "../../src/core/types/result";
import { ok } from "../../src/core/types/result";
import type {
	CommandExecutor,
	ExecOptions,
	ExecResult,
} from "../../src/usecase/port/command-executor";

type ExecutedCommand = {
	readonly command: string;
	readonly options: ExecOptions | undefined;
};

export type StubCommandExecutor = CommandExecutor & {
	readonly executedCommands: readonly ExecutedCommand[];
};

export function createStubCommandExecutor(
	preset: Result<ExecResult, ExecutionError> = ok({ stdout: "", stderr: "", exitCode: 0 }),
): StubCommandExecutor {
	const executed: ExecutedCommand[] = [];

	return {
		execute: async (
			command: string,
			options?: ExecOptions,
		): Promise<Result<ExecResult, ExecutionError>> => {
			executed.push({ command, options });
			return preset;
		},
		get executedCommands(): readonly ExecutedCommand[] {
			return [...executed];
		},
	};
}
