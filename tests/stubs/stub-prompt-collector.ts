import type { SkillInput } from "../../src/core/skill/skill-metadata";
import { ok } from "../../src/core/types/result";
import type { PromptCollector } from "../../src/usecase/port/prompt-collector";

export type StubPromptCollector = PromptCollector & {
	readonly collectedInputs: readonly (readonly SkillInput[])[];
};

export function createStubPromptCollector(
	answers: Readonly<Record<string, string>>,
): StubPromptCollector {
	const collected: (readonly SkillInput[])[] = [];

	return {
		collect: async (inputs, presets) => {
			collected.push(inputs);
			return ok({ ...presets, ...answers });
		},
		get collectedInputs(): readonly (readonly SkillInput[])[] {
			return [...collected];
		},
	};
}
