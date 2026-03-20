import { ExitPromptError } from "@inquirer/core";
import { confirm, editor, input, number, password, select } from "@inquirer/prompts";
import type { SkillInput } from "../core/skill/skill-input";
import type { ExecutionError } from "../core/types/errors";
import { executionError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import type { PromptCollector } from "../usecase/port/prompt-collector";

type PromptFn = (skillInput: SkillInput) => Promise<string>;

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
		): Promise<Result<Readonly<Record<string, string>>, ExecutionError>> => {
			try {
				const results: Record<string, string> = {};

				for (const skillInput of inputs) {
					// --set key=value で事前指定された値はプロンプトをスキップする
					// （CI/スクリプトからの非対話実行を可能にするため）
					if (skillInput.name in presets) {
						results[skillInput.name] = presets[skillInput.name];
						continue;
					}

					const promptFn = promptByType[skillInput.type];
					results[skillInput.name] = await promptFn(skillInput);
				}

				return ok(results);
			} catch (error: unknown) {
				if (error instanceof ExitPromptError) {
					return err(executionError("User cancelled the prompt"));
				}
				return err(executionError(toErrorMessage(error)));
			}
		},
	};
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

async function askText(skillInput: SkillInput): Promise<string> {
	return input({
		message: skillInput.message,
		default: skillInput.default as string | undefined,
		required: skillInput.required ?? false,
		validate: buildValidator(skillInput),
	});
}

async function askTextarea(skillInput: SkillInput): Promise<string> {
	return editor({
		message: skillInput.message,
		default: skillInput.default as string | undefined,
		validate: buildValidator(skillInput),
	});
}

async function askSelect(skillInput: SkillInput): Promise<string> {
	const choices = skillInput.choices!.map((choice) => ({
		name: choice,
		value: choice,
	}));

	return select({
		message: skillInput.message,
		choices,
		default: skillInput.default as string | undefined,
	});
}

async function askConfirm(skillInput: SkillInput): Promise<string> {
	const result = await confirm({
		message: skillInput.message,
		default: skillInput.default as boolean | undefined,
	});

	return String(result);
}

async function askNumber(skillInput: SkillInput): Promise<string> {
	const result = await number({
		message: skillInput.message,
		default: skillInput.default as number | undefined,
		required: skillInput.required ?? false,
		validate: buildNumberValidator(skillInput),
	});

	return String(result);
}

async function askPassword(skillInput: SkillInput): Promise<string> {
	return password({
		message: skillInput.message,
		validate: buildValidator(skillInput),
	});
}

function buildValidator(skillInput: SkillInput): ((value: string) => string | true) | undefined {
	if (!skillInput.validate) return undefined;

	const regex = compileRegex(skillInput.validate);
	return (value: string) => {
		if (!regex.test(value)) {
			return `Input must match pattern: ${skillInput.validate}`;
		}
		return true;
	};
}

function buildNumberValidator(
	skillInput: SkillInput,
): ((value: number | undefined) => string | true) | undefined {
	if (!skillInput.validate) return undefined;

	const regex = compileRegex(skillInput.validate);
	return (value: number | undefined) => {
		if (value === undefined) return true;
		if (!regex.test(String(value))) {
			return `Input must match pattern: ${skillInput.validate}`;
		}
		return true;
	};
}

function compileRegex(pattern: string): RegExp {
	try {
		return new RegExp(pattern);
	} catch (cause) {
		throw new Error(`Invalid regex pattern: ${pattern}`, { cause });
	}
}
