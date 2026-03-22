import { resolveActionConfig } from "../core/skill/action";
import type { ContextSource } from "../core/skill/context-source";
import type { SkillInput } from "../core/skill/skill-input";
import type { SkillMode } from "../core/skill/skill-metadata";
import type { DomainError } from "../core/types/errors";
import { configError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import type { SkillRepository } from "./port/skill-repository";

export type ActionSummary = {
	readonly name: string;
	readonly description: string;
};

export type ActionDetail = {
	readonly name: string;
	readonly description: string;
	readonly mode: SkillMode;
};

export type ShowOutput = {
	readonly name: string;
	readonly description: string;
	readonly mode: SkillMode;
	readonly location: string;
	readonly inputs: readonly SkillInput[];
	readonly context: readonly ContextSource[];
	readonly actions?: readonly ActionSummary[];
	readonly actionDetail?: ActionDetail;
};

export async function showSkill(
	name: string,
	repository: SkillRepository,
	actionName?: string,
): Promise<Result<ShowOutput, DomainError>> {
	const result = await repository.findByName(name);
	if (!result.ok) {
		return result;
	}

	const skill = result.value;

	if (actionName) {
		const actions = skill.metadata.actions;
		if (!actions || !(actionName in actions)) {
			const available = actions ? Object.keys(actions).join(", ") : "none";
			return err(
				configError(
					`Action "${actionName}" not found in skill "${name}". Available actions: ${available}`,
				),
			);
		}

		const action = actions[actionName];
		const resolved = resolveActionConfig(action, skill.metadata);

		return ok({
			name: skill.metadata.name,
			description: skill.metadata.description,
			mode: resolved.mode,
			location: skill.location,
			inputs: resolved.inputs,
			context: resolved.context,
			actionDetail: {
				name: actionName,
				description: resolved.description,
				mode: resolved.mode,
			},
		});
	}

	const actionSummaries: ActionSummary[] | undefined = skill.metadata.actions
		? Object.entries(skill.metadata.actions).map(([key, action]) => ({
				name: key,
				description: action.description,
			}))
		: undefined;

	return ok({
		name: skill.metadata.name,
		description: skill.metadata.description,
		mode: skill.metadata.mode,
		location: skill.location,
		inputs: skill.metadata.inputs,
		context: skill.metadata.context,
		actions: actionSummaries,
	});
}
