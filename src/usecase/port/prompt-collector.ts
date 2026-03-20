import type { SkillInput } from "../../core/skill/skill-metadata";
import type { ExecutionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

export type PromptCollector = {
	readonly collect: (
		inputs: readonly SkillInput[],
		presets: Readonly<Record<string, string>>,
	) => Promise<Result<Readonly<Record<string, string>>, ExecutionError>>;
};
