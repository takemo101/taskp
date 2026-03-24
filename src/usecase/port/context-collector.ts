import type { ContextSource } from "../../core/skill/context-source";
import type { ExecutionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

export type CollectedContext =
	| { readonly kind: "text"; readonly source: ContextSource; readonly content: string }
	| {
			readonly kind: "image";
			readonly source: ContextSource;
			readonly data: Uint8Array;
			readonly mediaType: string;
	  };

export type ContextCollectorPort = {
	readonly collect: (
		sources: readonly ContextSource[],
		cwd: string,
	) => Promise<Result<readonly CollectedContext[], ExecutionError>>;
};
