import { dirname } from "node:path";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { getActionSection, parseActionSections, resolveActionConfig } from "../core/skill";
import type { ContextSource } from "../core/skill/context-source";
import type { Skill } from "../core/skill/skill";
import type { SkillInput } from "../core/skill/skill-input";
import { type DomainError, domainErrorMessage, executionError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import type { ReservedVars } from "../core/variable/template-renderer";
import { renderTemplate } from "../core/variable/template-renderer";
import { type HooksConfig, runHooks } from "./hook-runner";
import type { AgentExecutorPort, AgentExecutorResult } from "./port/agent-executor";
import type { ContextCollectorPort } from "./port/context-collector";
import type { HookExecutorPort } from "./port/hook-executor";
import { createNoopProgressWriter, type ProgressWriter } from "./port/progress-writer";
import type { PromptCollector } from "./port/prompt-collector";
import type { SkillRepository } from "./port/skill-repository";
import type { SystemPromptResolver } from "./port/system-prompt-resolver";

const MAX_STEPS = 50;

export type RunAgentSkillInput = {
	readonly name: string;
	readonly action?: string;
	readonly presets: Readonly<Record<string, string>>;
	readonly model: LanguageModelV3;
	readonly noInput?: boolean;
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
	readonly systemPromptResolver: SystemPromptResolver;
	readonly progressWriter?: ProgressWriter;
	readonly hookExecutor?: HookExecutorPort;
	readonly hooksConfig?: HooksConfig;
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

	const actionConfig = input.action ? resolveActionForAgent(skill, input.action) : undefined;
	if (actionConfig !== undefined && !actionConfig.ok) {
		return actionConfig;
	}
	const resolved = actionConfig?.value;

	const inputs: readonly SkillInput[] = resolved?.inputs ?? skill.metadata.inputs;
	const collectResult = await deps.promptCollector.collect(inputs, input.presets, {
		noInput: input.noInput,
	});
	if (!collectResult.ok) {
		return collectResult;
	}
	const variables = collectResult.value;
	const progress = deps.progressWriter ?? createNoopProgressWriter();

	progress.writeInputs(inputs, variables);

	const reserved: ReservedVars = {
		cwd: process.cwd(),
		skillDir: dirname(skill.location),
		date: new Date().toISOString().split("T")[0],
		timestamp: new Date().toISOString(),
	};

	const rawContent = resolved?.sectionContent ?? skill.body.content;
	const renderResult = renderTemplate(rawContent, variables, reserved);
	if (!renderResult.ok) {
		return renderResult;
	}

	const skillPrompt = renderResult.value;

	const toolNames: readonly string[] = resolved?.tools ?? skill.metadata.tools;

	// system prompt: SystemPromptResolver が SYSTEM.md の探索とフォールバックを一元管理
	const systemPrompt = await deps.systemPromptResolver.resolve({
		toolNames,
		cwd: process.cwd(),
		date: reserved.date,
	});

	// prompt: SKILL.md 本文（タスク指示）+ context ソース出力（データ）を結合
	// system = 「どう振る舞うか」、prompt = 「何をするか」の分離
	const promptParts: string[] = [skillPrompt];

	const contextSources: readonly ContextSource[] = resolved?.context ?? skill.metadata.context;

	if (contextSources.length > 0) {
		progress.writeContextSources(contextSources);

		// context ソース内の変数（{{__skill_dir__}} 等）を展開してからコレクタに渡す
		// （SKILL-SPEC.md「展開タイミング」ステップ3: context のパス内の変数を展開）
		const resolvedSources = resolveContextSources(contextSources, variables, reserved);
		if (!resolvedSources.ok) {
			return resolvedSources;
		}
		const contextResult = await deps.contextCollector.collect(resolvedSources.value, process.cwd());
		if (!contextResult.ok) {
			return contextResult;
		}
		promptParts.push(contextResult.value);
	}

	const prompt = promptParts.join("\n\n");

	const startTime = Date.now();

	const executeResult = await deps.agentExecutor.execute({
		model: input.model,
		systemPrompt,
		prompt,
		toolNames,
		maxSteps: MAX_STEPS,
	});

	const durationMs = Date.now() - startTime;

	if (!executeResult.ok) {
		await runHooks({
			hookExecutor: deps.hookExecutor,
			hooksConfig: deps.hooksConfig,
			context: {
				skillName: skill.metadata.name,
				mode: "agent",
				status: "failed",
				durationMs,
				error: domainErrorMessage(executeResult.error),
			},
		});
		return executeResult;
	}

	await runHooks({
		hookExecutor: deps.hookExecutor,
		hooksConfig: deps.hooksConfig,
		context: {
			skillName: skill.metadata.name,
			mode: "agent",
			status: "success",
			durationMs,
		},
	});

	return ok({
		skillName: skill.metadata.name,
		result: executeResult.value,
	});
}

type ResolvedAction = {
	readonly inputs: readonly SkillInput[];
	readonly tools: readonly string[];
	readonly context: readonly ContextSource[];
	readonly sectionContent: string;
};

function resolveActionForAgent(
	skill: Skill,
	actionName: string,
): Result<ResolvedAction, DomainError> {
	const actions = skill.metadata.actions;
	if (!actions?.[actionName]) {
		return err(
			executionError(`Action "${actionName}" is not defined in skill "${skill.metadata.name}"`),
		);
	}

	const config = resolveActionConfig(actions[actionName], skill.metadata);

	const sectionsResult = parseActionSections(skill.body.content);
	if (!sectionsResult.ok) {
		return sectionsResult;
	}

	const section = getActionSection(sectionsResult.value, actionName);
	if (!section) {
		return err(
			executionError(
				`Action section "## action:${actionName}" not found in skill "${skill.metadata.name}"`,
			),
		);
	}

	return ok({
		inputs: config.inputs,
		tools: config.tools,
		context: config.context,
		sectionContent: section.content,
	});
}

/**
 * context ソース内の変数（パス・コマンド等）を展開する。
 * 例: `{{__skill_dir__}}/fetch.sh` → `/abs/path/to/skill/fetch.sh`
 */
function resolveContextSources(
	sources: readonly ContextSource[],
	variables: Record<string, string>,
	reserved: ReservedVars,
): Result<readonly ContextSource[], DomainError> {
	const resolved: ContextSource[] = [];

	for (const source of sources) {
		const raw = getContextSourceValue(source);
		const renderResult = renderTemplate(raw, variables, reserved);
		if (!renderResult.ok) {
			return renderResult;
		}
		resolved.push(withResolvedValue(source, renderResult.value));
	}

	return ok(resolved);
}

function getContextSourceValue(source: ContextSource): string {
	switch (source.type) {
		case "file":
			return source.path;
		case "glob":
			return source.pattern;
		case "command":
			return source.run;
		case "url":
			return source.url;
	}
}

function withResolvedValue(source: ContextSource, value: string): ContextSource {
	switch (source.type) {
		case "file":
			return { ...source, path: value };
		case "glob":
			return { ...source, pattern: value };
		case "command":
			return { ...source, run: value };
		case "url":
			return { ...source, url: value };
	}
}
