import type { ContextSource } from "../../core/skill/context-source";
import type { ExecutionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

export type ContextCollectorPort = {
	readonly collect: (
		sources: readonly ContextSource[],
		cwd: string,
	) => Promise<Result<string, ExecutionError>>;
};
