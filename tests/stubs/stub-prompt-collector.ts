import type { SkillInput } from "../../src/core/skill/skill-metadata";
import type { PromptCollector } from "../../src/usecase/port/prompt-collector";

export type StubPromptCollector = PromptCollector & {
	readonly collectedInputs: readonly (readonly SkillInput[])[];
};

export function createStubPromptCollector(
	answers: Readonly<Record<string, string>>,
): StubPromptCollector {
	const collected: (readonly SkillInput[])[] = [];

	return {
		collect: async (
			inputs: readonly SkillInput[],
			presets: Readonly<Record<string, string>>,
		): Promise<Readonly<Record<string, string>>> => {
			collected.push(inputs);
			return { ...presets, ...answers };
		},
		get collectedInputs(): readonly (readonly SkillInput[])[] {
			return [...collected];
		},
	};
}
