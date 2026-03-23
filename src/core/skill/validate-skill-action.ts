import type { ConfigError, DomainError } from "../types/errors";
import { configError, skillNotFoundError } from "../types/errors";
import type { Result } from "../types/result";
import { err, ok } from "../types/result";
import type { Action } from "./action";
import type { Skill } from "./skill";

export function validateActionRequired(
	skill: Skill,
	actionName: string | undefined,
): Result<void, ConfigError> {
	if (skill.metadata.actions && !actionName) {
		const names = Object.keys(skill.metadata.actions).join(", ");
		return err(
			configError(
				`Skill "${skill.metadata.name}" requires an action. Available actions: ${names}\nUse: taskp run ${skill.metadata.name}:<action> or use the TUI (taskp tui)`,
			),
		);
	}
	return ok(undefined);
}

export function validateActionExists(
	skill: Skill,
	actionName: string | undefined,
): Result<Action | undefined, DomainError> {
	if (!actionName) return ok(undefined);

	const actions = skill.metadata.actions;
	if (!actions || !(actionName in actions)) {
		const available = actions ? Object.keys(actions).join(", ") : "none";
		return err(
			skillNotFoundError(
				`Action "${actionName}" not found in skill "${skill.metadata.name}". Available actions: ${available}`,
			),
		);
	}

	return ok(actions[actionName]);
}
