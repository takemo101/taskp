import { ExitPromptError } from "@inquirer/core";
import { confirm, editor, input, number, password, select } from "@inquirer/prompts";
import type { SkillInput } from "../core/skill/skill-input";
import type { ExecutionError } from "../core/types/errors";
import { executionError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import type { PromptCollectOptions, PromptCollector } from "../usecase/port/prompt-collector";
import { toErrorMessage, tryCatchSync } from "./error-handler-utils";

type PromptFn = (skillInput: SkillInput) => Promise<Result<string, ExecutionError>>;

const promptByType: Record<string, PromptFn> = {
	text: askText,
	textarea: askTextarea,
	select: askSelect,
	confirm: askConfirm,
	number: askNumber,
	password: askPassword,
};

export function createPromptRunner(): PromptCollector {
	return {
		collect: async (
			inputs: readonly SkillInput[],
			presets: Readonly<Record<string, string>>,
			options?: PromptCollectOptions,
		): Promise<Result<Readonly<Record<string, string>>, ExecutionError>> => {
			const results: Record<string, string> = {};

			for (const skillInput of inputs) {
				const value = await resolveInput(skillInput, presets, options);
				if (!value.ok) return value;
				results[skillInput.name] = value.value;
			}

			return ok(results);
		},
	};
}

async function resolveInput(
	skillInput: SkillInput,
	presets: Readonly<Record<string, string>>,
	options?: PromptCollectOptions,
): Promise<Result<string, ExecutionError>> {
	if (skillInput.name in presets) {
		return ok(presets[skillInput.name]);
	}
	if (options?.noInput) {
		return resolveNonInteractive(skillInput);
	}
	return promptByType[skillInput.type](skillInput);
}

function resolveNonInteractive(skillInput: SkillInput): Result<string, ExecutionError> {
	if (skillInput.default !== undefined) {
		return ok(String(skillInput.default));
	}
	// required は optional (boolean | undefined)。undefined は「required」として扱う
	// （SkillInput の Zod スキーマでデフォルト値が設定されていないため）
	if (skillInput.required !== false) {
		return err(
			executionError(
				`Input "${skillInput.name}" is required but has no default value (--skip-prompt mode)`,
			),
		);
	}
	return ok("");
}

function wrapPromptError(error: unknown): Result<never, ExecutionError> {
	if (error instanceof ExitPromptError) {
		return err(executionError("User cancelled the prompt"));
	}
	return err(executionError(toErrorMessage(error)));
}

async function askText(skillInput: SkillInput): Promise<Result<string, ExecutionError>> {
	const validatorResult = buildValidator(skillInput);
	if (!validatorResult.ok) return validatorResult;

	try {
		const value = await input({
			message: skillInput.message,
			default: skillInput.default as string | undefined,
			required: skillInput.required ?? false,
			validate: validatorResult.value,
		});
		return ok(value);
	} catch (error: unknown) {
		return wrapPromptError(error);
	}
}

async function askTextarea(skillInput: SkillInput): Promise<Result<string, ExecutionError>> {
	const validatorResult = buildValidator(skillInput);
	if (!validatorResult.ok) return validatorResult;

	try {
		const value = await editor({
			message: skillInput.message,
			default: skillInput.default as string | undefined,
			validate: validatorResult.value,
		});
		return ok(value);
	} catch (error: unknown) {
		return wrapPromptError(error);
	}
}

async function askSelect(skillInput: SkillInput): Promise<Result<string, ExecutionError>> {
	if (!skillInput.choices) {
		return err(executionError(`choices is required for select input: ${skillInput.name}`));
	}

	const choices = skillInput.choices.map((choice) => ({
		name: choice,
		value: choice,
	}));

	try {
		const value = await select({
			message: skillInput.message,
			choices,
			default: skillInput.default as string | undefined,
		});
		return ok(value);
	} catch (error: unknown) {
		return wrapPromptError(error);
	}
}

async function askConfirm(skillInput: SkillInput): Promise<Result<string, ExecutionError>> {
	try {
		const result = await confirm({
			message: skillInput.message,
			default: skillInput.default as boolean | undefined,
		});
		return ok(String(result));
	} catch (error: unknown) {
		return wrapPromptError(error);
	}
}

async function askNumber(skillInput: SkillInput): Promise<Result<string, ExecutionError>> {
	const validatorResult = buildNumberValidator(skillInput);
	if (!validatorResult.ok) return validatorResult;

	try {
		const result = await number({
			message: skillInput.message,
			default: skillInput.default as number | undefined,
			required: skillInput.required ?? false,
			validate: validatorResult.value,
		});
		return ok(String(result));
	} catch (error: unknown) {
		return wrapPromptError(error);
	}
}

async function askPassword(skillInput: SkillInput): Promise<Result<string, ExecutionError>> {
	const validatorResult = buildValidator(skillInput);
	if (!validatorResult.ok) return validatorResult;

	try {
		const value = await password({
			message: skillInput.message,
			validate: validatorResult.value,
		});
		return ok(value);
	} catch (error: unknown) {
		return wrapPromptError(error);
	}
}

function buildValidator(
	skillInput: SkillInput,
): Result<((value: string) => string | true) | undefined, ExecutionError> {
	if (!skillInput.validate) return ok(undefined);

	const regexResult = compileRegex(skillInput.validate);
	if (!regexResult.ok) return regexResult;

	const regex = regexResult.value;
	return ok((value: string) => {
		if (!regex.test(value)) {
			return `Input must match pattern: ${skillInput.validate}`;
		}
		return true;
	});
}

function buildNumberValidator(
	skillInput: SkillInput,
): Result<((value: number | undefined) => string | true) | undefined, ExecutionError> {
	if (!skillInput.validate) return ok(undefined);

	const regexResult = compileRegex(skillInput.validate);
	if (!regexResult.ok) return regexResult;

	const regex = regexResult.value;
	return ok((value: number | undefined) => {
		if (value === undefined) return true;
		if (!regex.test(String(value))) {
			return `Input must match pattern: ${skillInput.validate}`;
		}
		return true;
	});
}

function compileRegex(pattern: string): Result<RegExp, ExecutionError> {
	return tryCatchSync(
		() => new RegExp(pattern),
		() => executionError(`Invalid regex pattern: ${pattern}`),
	);
}
