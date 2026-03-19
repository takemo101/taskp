import { type RenderError, renderError } from "../types/errors";
import { err, ok, type Result } from "../types/result";

export type ReservedVars = {
	readonly cwd: string;
	readonly skillDir: string;
	readonly date: string;
	readonly timestamp: string;
};

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

const RESERVED_VAR_MAP: Record<string, keyof ReservedVars> = {
	__cwd__: "cwd",
	__skill_dir__: "skillDir",
	__date__: "date",
	__timestamp__: "timestamp",
};

function resolveVariable(
	name: string,
	variables: Record<string, string>,
	reserved: ReservedVars,
): string | undefined {
	const reservedKey = RESERVED_VAR_MAP[name];
	if (reservedKey !== undefined) {
		return reserved[reservedKey];
	}
	return variables[name];
}

function findUndefinedVariables(
	template: string,
	variables: Record<string, string>,
	reserved: ReservedVars,
): readonly string[] {
	const undefined_: string[] = [];
	for (const match of template.matchAll(VARIABLE_PATTERN)) {
		const name = match[1];
		if (resolveVariable(name, variables, reserved) === undefined) {
			undefined_.push(name);
		}
	}
	return [...new Set(undefined_)];
}

export function renderTemplate(
	template: string,
	variables: Record<string, string>,
	reserved: ReservedVars,
): Result<string, RenderError> {
	const undefinedVars = findUndefinedVariables(template, variables, reserved);
	if (undefinedVars.length > 0) {
		return err(renderError(`Undefined variables: ${undefinedVars.join(", ")}`));
	}

	const rendered = template.replace(VARIABLE_PATTERN, (_, name: string) => {
		const value = resolveVariable(name, variables, reserved);
		return value as string;
	});

	return ok(rendered);
}
