import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { ToolSet } from "ai";
import { DEFAULT_MAX_AGENT_STEPS } from "../core/constants";
import { buildTaskpRunDescription, buildTools } from "../core/execution/agent-tools";
import type { ContentPart } from "../core/execution/content-part";
import { resolveAgentExecution } from "../core/skill/skill-execution-resolver";
import { partitionToolRefs } from "../core/tool-ref";
import { configError, type DomainError, domainErrorMessage } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import { buildReservedVars, renderTemplate } from "../core/variable/template-renderer";
import { collectSkillContext } from "./collect-skill-context";
import { type HooksConfig, runHooks } from "./hook-runner";
import type { AgentExecutorPort, AgentExecutorResult } from "./port/agent-executor";
import type { CollectedContext, ContextCollectorPort } from "./port/context-collector";
import type { HookExecutorPort } from "./port/hook-executor";
import type { Logger } from "./port/logger";
import type { McpToolResolverPort, ResolvedMcpToolSet } from "./port/mcp-tool-resolver";
import { createNoopProgressWriter, type ProgressWriter } from "./port/progress-writer";
import type { PromptCollector } from "./port/prompt-collector";
import type { SkillRepository } from "./port/skill-repository";
import type { SystemPromptResolver } from "./port/system-prompt-resolver";

export type RunAgentSkillInput = {
	readonly name: string;
	readonly action?: string;
	readonly presets: Readonly<Record<string, string>>;
	readonly model: LanguageModelV3;
	readonly noInput?: boolean;
	readonly maxAgentSteps?: number;
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
	readonly mcpToolResolver?: McpToolResolverPort;
	readonly logger?: Logger;
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

	const executionConfig = resolveAgentExecution(skill, input.action);
	if (!executionConfig.ok) {
		return executionConfig;
	}
	const { inputs, tools: toolNames, context: contextSources, content } = executionConfig.value;

	const collectResult = await deps.promptCollector.collect(inputs, input.presets, {
		noInput: input.noInput,
	});
	if (!collectResult.ok) {
		return collectResult;
	}
	const variables = collectResult.value;
	const progress = deps.progressWriter ?? createNoopProgressWriter();

	progress.writeInputs(inputs, variables);

	const reserved = buildReservedVars(skill.location);

	const renderResult = renderTemplate(content, variables, reserved);
	if (!renderResult.ok) {
		return renderResult;
	}

	const skillPrompt = renderResult.value;

	// system prompt: SystemPromptResolver が SYSTEM.md の探索とフォールバックを一元管理
	const systemPrompt = await deps.systemPromptResolver.resolve({
		toolNames,
		cwd: process.cwd(),
		date: reserved.date,
	});

	// prompt: SKILL.md 本文（タスク指示）を先頭に、context ソース出力（データ）を続けて配置
	// system = 「どう振る舞うか」、contentParts = 「何をするか」の分離
	const contentParts: ContentPart[] = [{ type: "text", text: skillPrompt }];

	if (contextSources.length > 0) {
		progress.writeContextSources(contextSources);

		const contextResult = await collectSkillContext(
			contextSources,
			variables,
			reserved,
			deps.contextCollector,
			process.cwd(),
		);
		if (!contextResult.ok) {
			return contextResult;
		}
		contentParts.push(...toContentParts(contextResult.value));
	}

	const { builtins, mcpRefs } = partitionToolRefs(toolNames);

	const toolDescriptions = await buildToolDescriptions(
		builtins,
		deps.skillRepository,
		skill.metadata.name,
	);

	const builtinToolsResult = buildTools(builtins, undefined, toolDescriptions);
	if (!builtinToolsResult.ok) {
		return builtinToolsResult;
	}

	if (mcpRefs.length > 0 && !deps.mcpToolResolver) {
		return err(configError("MCP tool references found but mcpToolResolver is not configured"));
	}

	try {
		let toolSet: ToolSet;

		if (mcpRefs.length > 0 && deps.mcpToolResolver) {
			const resolveResult = await deps.mcpToolResolver.resolveTools(mcpRefs);
			if (!resolveResult.ok) {
				return resolveResult;
			}

			toolSet = mergeToolSets(builtinToolsResult.value, resolveResult.value, deps.logger);
		} else {
			toolSet = builtinToolsResult.value;
		}

		// durationMs は LLM エージェントの実行時間のみを測定する
		// （コンテキスト収集時間は含めない — hooks に渡す情報として実行コストを正確に反映するため）
		const startTime = Date.now();

		const executeResult = await deps.agentExecutor.execute({
			model: input.model,
			systemPrompt,
			contentParts,
			toolNames: builtins,
			toolSet,
			maxSteps: input.maxAgentSteps ?? DEFAULT_MAX_AGENT_STEPS,
			toolDescriptions,
		});

		const durationMs = Date.now() - startTime;

		if (!executeResult.ok) {
			await runHooks({
				hookExecutor: deps.hookExecutor,
				hooksConfig: deps.hooksConfig,
				context: {
					skillName: skill.metadata.name,
					actionName: input.action,
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
				actionName: input.action,
				mode: "agent",
				status: "success",
				durationMs,
			},
		});

		return ok({
			skillName: skill.metadata.name,
			result: executeResult.value,
		});
	} finally {
		await deps.mcpToolResolver?.closeAll();
	}
}

function mergeToolSets(
	builtinTools: ToolSet,
	mcpToolSets: readonly ResolvedMcpToolSet[],
	logger: Logger | undefined,
): ToolSet {
	const merged: ToolSet = { ...builtinTools };
	for (const { server, tools } of mcpToolSets) {
		for (const [name, tool] of Object.entries(tools)) {
			if (name in merged) {
				logger?.warn(
					`MCP tool "${name}" from server "${server}" conflicts with existing tool, skipped`,
				);
				continue;
			}
			merged[name] = tool;
		}
	}
	return merged;
}

function toContentPart(ctx: CollectedContext): ContentPart {
	switch (ctx.kind) {
		case "text":
			return { type: "text", text: ctx.content };
		case "image":
			return { type: "image", data: ctx.data, mediaType: ctx.mediaType };
	}
}

function toContentParts(contexts: readonly CollectedContext[]): readonly ContentPart[] {
	return contexts.map(toContentPart);
}

async function buildToolDescriptions(
	toolNames: readonly string[],
	skillRepository: SkillRepository,
	currentSkillName: string,
): Promise<Record<string, string> | undefined> {
	if (!toolNames.includes("taskp_run")) return undefined;

	const { skills } = await skillRepository.listAll();
	return {
		taskp_run: buildTaskpRunDescription(skills, currentSkillName),
	};
}
