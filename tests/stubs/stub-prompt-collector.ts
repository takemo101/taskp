import type { SkillInput } from "../../src/core/skill/skill-metadata";
import { ok } from "../../src/core/types/result";
import type {
	PromptCollectOptions,
	PromptCollector,
} from "../../src/usecase/port/prompt-collector";

export type StubPromptCollector = PromptCollector & {
	readonly collectedInputs: readonly (readonly SkillInput[])[];
	readonly collectedOptions: readonly (PromptCollectOptions | undefined)[];
};

export function createStubPromptCollector(
	answers: Readonly<Record<string, string>>,
): StubPromptCollector {
	const collected: (readonly SkillInput[])[] = [];
	const collectedOpts: (PromptCollectOptions | undefined)[] = [];

	return {
		collect: async (inputs, presets, options) => {
			collected.push(inputs);
			collectedOpts.push(options);
			return ok({ ...presets, ...answers });
		},
		get collectedInputs(): readonly (readonly SkillInput[])[] {
			return [...collected];
		},
		get collectedOptions(): readonly (PromptCollectOptions | undefined)[] {
			return [...collectedOpts];
		},
	};
}
