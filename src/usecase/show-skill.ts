import type { ContextSource } from "../core/skill/context-source";
import type { SkillInput } from "../core/skill/skill-input";
import type { DomainError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { ok } from "../core/types/result";
import type { SkillRepository } from "./port/skill-repository";

export type ShowOutput = {
	readonly name: string;
	readonly description: string;
	readonly mode: string;
	readonly location: string;
	readonly inputs: readonly SkillInput[];
	readonly context: readonly ContextSource[];
};

export async function showSkill(
	name: string,
	repository: SkillRepository,
): Promise<Result<ShowOutput, DomainError>> {
	const findResult = await repository.findByName(name);
	if (!findResult.ok) {
		return findResult;
	}

	const skill = findResult.value;
	return ok({
		name: skill.metadata.name,
		description: skill.metadata.description,
		mode: skill.metadata.mode,
		location: skill.location,
		inputs: skill.metadata.inputs,
		context: skill.metadata.context,
	});
}
