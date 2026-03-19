import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { DomainError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { ok } from "../core/types/result";
import type { ReservedVars } from "../core/variable/template-renderer";
import { renderTemplate } from "../core/variable/template-renderer";
import type { AgentExecutorPort, AgentExecutorResult } from "./port/agent-executor";
import type { ContextCollectorPort } from "./port/context-collector";
import type { PromptCollector } from "./port/prompt-collector";
import type { SkillRepository } from "./port/skill-repository";

const MAX_STEPS = 50;

export type RunAgentSkillInput = {
	readonly name: string;
	readonly presets: Readonly<Record<string, string>>;
	readonly model: LanguageModelV3;
};

export type RunAgentSkillOutput = {
	readonly skillName: string;
	readonly result: AgentExecutorResult;
};

export type RunAgentSkillDeps = {
	readonly skillRepository: SkillRepository;
	readonly promptCollector: PromptCollector;
	readonly contextCollector: ContextCollectorPort;
	readonly agentExecutor: AgentExecutorPort;
};

export async function runAgentSkill(
	input: RunAgentSkillInput,
	deps: RunAgentSkillDeps,
): Promise<Result<RunAgentSkillOutput, DomainError>> {
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

	const systemPrompt = renderResult.value;

	// systemPrompt（スキル本文をレンダリングしたもの）を context の先頭に含め、
	// 追加の context ソース（ファイル・コマンド出力等）をその後に結合する
	const contextParts: string[] = [systemPrompt];

	if (skill.metadata.context.length > 0) {
		const contextResult = await deps.contextCollector.collect(
			skill.metadata.context,
			process.cwd(),
		);
		if (!contextResult.ok) {
			return contextResult;
		}
		contextParts.push(contextResult.value);
	}

	const context = contextParts.join("\n\n");

	const executeResult = await deps.agentExecutor.execute({
		model: input.model,
		systemPrompt,
		context,
		toolNames: skill.metadata.tools,
		maxSteps: MAX_STEPS,
	});
	if (!executeResult.ok) {
		return executeResult;
	}

	return ok({
		skillName: skill.metadata.name,
		result: executeResult.value,
	});
}
