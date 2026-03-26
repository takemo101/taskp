import type { DomainError } from "../types/errors";
import { executionError } from "../types/errors";
import type { Result } from "../types/result";
import { err, ok } from "../types/result";
import { resolveActionConfig } from "./action";
import type { ContextSource } from "./context-source";
import type { Skill } from "./skill";
import type { CodeBlock } from "./skill-body";
import type { SkillInput } from "./skill-input";

export type AgentExecutionConfig = {
	readonly inputs: readonly SkillInput[];
	readonly tools: readonly string[];
	readonly context: readonly ContextSource[];
	readonly content: string;
};

export type TemplateExecutionConfig = {
	readonly inputs: readonly SkillInput[];
	readonly content: string;
	readonly codeBlocks: readonly CodeBlock[];
	readonly timeout: number | undefined;
};

/**
 * エージェントモード実行に必要な設定を Skill から解決する。
 * actionName 指定時はアクション設定を優先し、未指定時はスキルレベルの設定を使用する。
 */
export function resolveAgentExecution(
	skill: Skill,
	actionName: string | undefined,
): Result<AgentExecutionConfig, DomainError> {
	if (!actionName) {
		return ok({
			inputs: skill.metadata.inputs,
			tools: skill.metadata.tools,
			context: skill.metadata.context,
			content: skill.body.content,
		});
	}

	const actions = skill.metadata.actions;
	if (!actions?.[actionName]) {
		return err(
			executionError(`Action "${actionName}" is not defined in skill "${skill.metadata.name}"`),
		);
	}

	const config = resolveActionConfig(actions[actionName], skill.metadata);

	const sectionResult = skill.body.extractActionSection(actionName);
	if (!sectionResult.ok) {
		return sectionResult;
	}

	return ok({
		inputs: config.inputs,
		tools: config.tools,
		context: config.context,
		content: sectionResult.value,
	});
}

/**
 * テンプレートモード実行に必要な設定を Skill から解決する。
 * actionName 指定時はアクション設定を優先し、未指定時はスキルレベルの設定を使用する。
 */
export function resolveTemplateExecution(
	skill: Skill,
	actionName: string | undefined,
): Result<TemplateExecutionConfig, DomainError> {
	const hasActions = skill.metadata.actions !== undefined;

	if (hasActions && !actionName) {
		return err(
			executionError(
				`Skill "${skill.metadata.name}" has actions defined. Specify an action to run.`,
			),
		);
	}

	if (!actionName) {
		return ok({
			inputs: skill.metadata.inputs,
			content: skill.body.content,
			codeBlocks: skill.body.extractCodeBlocks("bash"),
			timeout: skill.metadata.timeout,
		});
	}

	const actions = skill.metadata.actions;
	if (!actions) {
		return err(executionError(`Skill "${skill.metadata.name}" does not define actions.`));
	}

	const actionDef = actions[actionName];
	if (!actionDef) {
		return err(
			executionError(`Action "${actionName}" not found in skill "${skill.metadata.name}".`),
		);
	}

	const config = resolveActionConfig(actionDef, skill.metadata);

	const sectionResult = skill.body.extractActionSection(actionName);
	if (!sectionResult.ok) {
		return sectionResult;
	}

	return ok({
		inputs: config.inputs,
		content: sectionResult.value,
		codeBlocks: skill.body.extractActionCodeBlocks(actionName, "bash"),
		timeout: config.timeout,
	});
}
