import type { SkillInput } from "../../core/skill/skill-metadata";

export type PromptCollector = {
	readonly collect: (
		inputs: readonly SkillInput[],
		presets: Readonly<Record<string, string>>,
	) => Promise<Readonly<Record<string, string>>>;
};
