import { dirname } from "node:path";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { ContextSource } from "../core/skill/context-source";
import { type DomainError, domainErrorMessage } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { ok } from "../core/types/result";
import type { ReservedVars } from "../core/variable/template-renderer";
import { renderTemplate } from "../core/variable/template-renderer";
import { type HooksConfig, runHooks } from "./hook-runner";
import type { AgentExecutorPort, AgentExecutorResult } from "./port/agent-executor";
import type { ContextCollectorPort } from "./port/context-collector";
import type { HookContext, HookExecutorPort } from "./port/hook-executor";
import { createNoopProgressWriter, type ProgressWriter } from "./port/progress-writer";
import type { PromptCollector } from "./port/prompt-collector";
import type { SkillRepository } from "./port/skill-repository";

const MAX_STEPS = 50;

export type RunAgentSkillInput = {
	readonly name: string;
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
	const collectResult = await deps.promptCollector.collect(skill.metadata.inputs, input.presets, {
		noInput: input.noInput,
	});
	if (!collectResult.ok) {
		return collectResult;
	}
	const variables = collectResult.value;
	const progress = deps.progressWriter ?? createNoopProgressWriter();

	progress.writeInputs(skill.metadata.inputs, variables);

	const reserved: ReservedVars = {
		cwd: process.cwd(),
		skillDir: dirname(skill.location),
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
		progress.writeContextSources(skill.metadata.context);

		// context ソース内の変数（{{__skill_dir__}} 等）を展開してからコレクタに渡す
		// （SKILL-SPEC.md「展開タイミング」ステップ3: context のパス内の変数を展開）
		const resolvedSources = resolveContextSources(skill.metadata.context, variables, reserved);
		if (!resolvedSources.ok) {
			return resolvedSources;
		}
		const contextResult = await deps.contextCollector.collect(resolvedSources.value, process.cwd());
		if (!contextResult.ok) {
			return contextResult;
		}
		contextParts.push(contextResult.value);
	}

	const context = contextParts.join("\n\n");

	const startTime = Date.now();

	const executeResult = await deps.agentExecutor.execute({
		model: input.model,
		systemPrompt,
		context,
		toolNames: skill.metadata.tools,
		maxSteps: MAX_STEPS,
	});

	const durationMs = Date.now() - startTime;

	if (!executeResult.ok) {
		await invokeHooks(deps, {
			skillName: skill.metadata.name,
			mode: "agent",
			status: "failed",
			durationMs,
			error: domainErrorMessage(executeResult.error),
		});
		return executeResult;
	}

	await invokeHooks(deps, {
		skillName: skill.metadata.name,
		mode: "agent",
		status: "success",
		durationMs,
	});

	return ok({
		skillName: skill.metadata.name,
		result: executeResult.value,
	});
}

async function invokeHooks(
	deps: Pick<RunAgentSkillDeps, "hookExecutor" | "hooksConfig">,
	hookContext: HookContext,
): Promise<void> {
	if (deps.hookExecutor === undefined || deps.hooksConfig === undefined) {
		return;
	}
	await runHooks({
		hookExecutor: deps.hookExecutor,
		hooksConfig: deps.hooksConfig,
		context: hookContext,
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
