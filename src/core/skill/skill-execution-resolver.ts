import type { DomainError } from "../types/errors";
import { executionError } from "../types/errors";
import type { Result } from "../types/result";
import { err, ok } from "../types/result";
import type { ResolvedActionConfig } from "./action";
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

type ActionResolution = {
	readonly config: ResolvedActionConfig;
	readonly content: string;
};

function resolveAction(skill: Skill, actionName: string): Result<ActionResolution, DomainError> {
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

	return ok({ config, content: sectionResult.value });
}

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

	const result = resolveAction(skill, actionName);
	if (!result.ok) {
		return result;
	}

	return ok({
		inputs: result.value.config.inputs,
		tools: result.value.config.tools,
		context: result.value.config.context,
		content: result.value.content,
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
	if (!actionName) {
		if (skill.metadata.actions !== undefined) {
			return err(
				executionError(
					`Skill "${skill.metadata.name}" has actions defined. Specify an action to run.`,
				),
			);
		}
		return ok({
			inputs: skill.metadata.inputs,
			content: skill.body.content,
			codeBlocks: skill.body.extractCodeBlocks("bash"),
			timeout: skill.metadata.timeout,
		});
	}

	const result = resolveAction(skill, actionName);
	if (!result.ok) {
		return result;
	}

	return ok({
		inputs: result.value.config.inputs,
		content: result.value.content,
		codeBlocks: skill.body.extractActionCodeBlocks(actionName, "bash"),
		timeout: result.value.config.timeout,
	});
}
