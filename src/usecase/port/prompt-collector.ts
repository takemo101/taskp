import type { SkillInput } from "../../core/skill/skill-metadata";
import type { ExecutionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

export type PromptCollectOptions = {
	readonly noInput?: boolean;
};

export type PromptCollector = {
	readonly collect: (
		inputs: readonly SkillInput[],
		presets: Readonly<Record<string, string>>,
		options?: PromptCollectOptions,
	) => Promise<Result<Readonly<Record<string, string>>, ExecutionError>>;
};
