import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { DomainError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { ok } from "../core/types/result";
import type { ReservedVars } from "../core/variable/template-renderer";
import { renderTemplate } from "../core/variable/template-renderer";
import type { PromptCollector } from "./port/prompt-collector";
import type { SkillRepository } from "./port/skill-repository";

const MAX_STEPS = 50;

export type RunAgentSkillInput = {
	readonly name: string;
	readonly presets: Readonly<Record<string, string>>;
	readonly model: LanguageModelV3;
};

export type AgentSkillConfig = {
	readonly model: LanguageModelV3;
	readonly systemPrompt: string;
	readonly context: string;
	readonly toolNames: readonly string[];
	readonly maxSteps: number;
	readonly skillName: string;
};

export type RunAgentSkillDeps = {
	readonly skillRepository: SkillRepository;
	readonly promptCollector: PromptCollector;
};

export async function prepareAgentSkill(
	input: RunAgentSkillInput,
	deps: RunAgentSkillDeps,
): Promise<Result<AgentSkillConfig, DomainError>> {
	const findResult = await deps.skillRepository.findByName(input.name);
	if (!findResult.ok) {
		return findResult;
	}

	const skill = findResult.value;
	const variables = await deps.promptCollector.collect(skill.metadata.inputs, input.presets);

	const reserved: ReservedVars = {
		cwd: process.cwd(),
		skillDir: skill.location,
		date: new Date().toISOString().split("T")[0],
		timestamp: new Date().toISOString(),
	};

	const renderResult = renderTemplate(skill.body.content, variables, reserved);
	if (!renderResult.ok) {
		return renderResult;
	}

	return ok({
		model: input.model,
		systemPrompt: renderResult.value,
		context: renderResult.value,
		toolNames: skill.metadata.tools,
		maxSteps: MAX_STEPS,
		skillName: skill.metadata.name,
	});
}
