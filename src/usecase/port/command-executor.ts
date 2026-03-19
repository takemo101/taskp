import type { ExecutionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

export type ExecOptions = {
	readonly cwd?: string;
	readonly env?: Readonly<Record<string, string>>;
	readonly timeout?: number;
};

export type ExecResult = {
	readonly stdout: string;
	readonly stderr: string;
	readonly exitCode: number;
};

export type CommandExecutor = {
	readonly execute: (
		command: string,
		options?: ExecOptions,
	) => Promise<Result<ExecResult, ExecutionError>>;
};
