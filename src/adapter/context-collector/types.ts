import type { ContextSource } from "../../core/skill/context-source";
import type { ExecutionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";
import type { CollectedContext } from "../../usecase/port/context-collector";
import type { Logger } from "../../usecase/port/logger";

export type ContextCollectorIoDeps = {
	readonly executeCommand: (
		command: string,
		cwd: string,
	) => Promise<Result<string, ExecutionError>>;
	readonly fetchUrl: (url: string) => Promise<Result<string, ExecutionError>>;
	readonly fetchBinary: (
		url: string,
	) => Promise<
		Result<{ readonly data: Uint8Array; readonly mediaType: string | undefined }, ExecutionError>
	>;
	readonly scanGlob: (
		pattern: string,
		cwd: string,
	) => Promise<Result<readonly string[], ExecutionError>>;
};

export type ContextCollectorDeps = ContextCollectorIoDeps & {
	readonly logger: Logger;
};

export type SourceCollector = (
	source: ContextSource,
	cwd: string,
	deps: ContextCollectorDeps,
) => Promise<Result<readonly CollectedContext[], ExecutionError>>;
