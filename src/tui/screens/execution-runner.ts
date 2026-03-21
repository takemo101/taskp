import type { LanguageModelV3 } from "@ai-sdk/provider";
import { createAgentExecutor } from "../../adapter/agent-executor";
import { createContextCollector } from "../../adapter/context-collector";
import { createDefaultContextCollectorDeps } from "../../adapter/context-collector-deps";
import type { Skill } from "../../core/skill/skill";
import type { DomainError } from "../../core/types/errors";
import { ok } from "../../core/types/result";
import type { HooksConfig } from "../../usecase/hook-runner";
import type { CommandExecutor } from "../../usecase/port/command-executor";
import type { HookExecutorPort } from "../../usecase/port/hook-executor";
import type { PromptCollector } from "../../usecase/port/prompt-collector";
import type { SkillRepository } from "../../usecase/port/skill-repository";
import { runAgentSkill } from "../../usecase/run-agent-skill";
import { runSkill } from "../../usecase/run-skill";
import {
	createTuiProgressWriter,
	createTuiStreamWriter,
	type ExecutionViewPort,
} from "../tui-stream-writer";

export type ExecutionDeps = {
	readonly commandExecutor: CommandExecutor;
	readonly hookExecutor: HookExecutorPort;
	readonly hooksConfig?: HooksConfig;
};

export async function runExecution(
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	model: LanguageModelV3 | null,
	viewPort: ExecutionViewPort,
	deps: ExecutionDeps,
): Promise<void> {
	if (skill.metadata.mode === "agent" && model === null) {
		viewPort.appendOutput("Error: LLM model not configured.\n");
		viewPort.appendOutput("Set default_provider and default_model in .taskp/config.toml\n");
		viewPort.showSummary(0, 0);
		return;
	}

	try {
		if (skill.metadata.mode === "agent" && model !== null) {
			await executeAgentMode(skill, variables, model, viewPort, deps);
		} else {
			await executeTemplateMode(skill, variables, viewPort, deps);
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		viewPort.appendOutput(`\nError: ${message}\n`);
		viewPort.showSummary(0, 0);
	}
}

export function formatDomainError(error: DomainError): string {
	if (error.type === "SKILL_NOT_FOUND") {
		return `Skill "${error.name}" not found`;
	}
	return error.message;
}

export function buildSkillRepository(skill: Skill): SkillRepository {
	return {
		findByName: async () => ok(skill),
		listAll: async () => [],
		listLocal: async () => [],
		listGlobal: async () => [],
	};
}

export function buildPromptCollector(variables: Readonly<Record<string, string>>): PromptCollector {
	return {
		collect: async () => ok(variables as Record<string, string>),
	};
}

async function executeAgentMode(
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	model: LanguageModelV3,
	viewPort: ExecutionViewPort,
	deps: ExecutionDeps,
): Promise<void> {
	const writer = createTuiStreamWriter(viewPort);
	const progressWriter = createTuiProgressWriter(viewPort);
	const agentExecutor = createAgentExecutor(writer);

	const contextCollectorDeps = await createDefaultContextCollectorDeps();
	const contextCollector = createContextCollector(contextCollectorDeps);

	const result = await runAgentSkill(
		{ name: skill.metadata.name, presets: variables, model },
		{
			skillRepository: buildSkillRepository(skill),
			promptCollector: buildPromptCollector(variables),
			contextCollector,
			agentExecutor,
			progressWriter,
			hookExecutor: deps.hookExecutor,
			hooksConfig: deps.hooksConfig,
		},
	);

	if (!result.ok) {
		viewPort.appendOutput(`\nError: ${formatDomainError(result.error)}\n`);
		viewPort.showSummary(0, 0);
	}
}

async function executeTemplateMode(
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	viewPort: ExecutionViewPort,
	deps: ExecutionDeps,
): Promise<void> {
	const progressWriter = createTuiProgressWriter(viewPort);

	const result = await runSkill(
		{ name: skill.metadata.name, presets: variables, dryRun: false, force: false },
		{
			skillRepository: buildSkillRepository(skill),
			promptCollector: buildPromptCollector(variables),
			commandExecutor: deps.commandExecutor,
			progressWriter,
			hookExecutor: deps.hookExecutor,
			hooksConfig: deps.hooksConfig,
		},
	);

	if (result.ok) {
		for (const cmd of result.value.commands) {
			viewPort.appendOutput(`\n$ ${cmd.command}\n`);
			if (cmd.result.stdout) {
				viewPort.appendOutput(cmd.result.stdout);
			}
			if (cmd.result.stderr) {
				viewPort.appendOutput(cmd.result.stderr);
			}
		}
		viewPort.showSummary(0, result.value.commands.length);
	} else {
		viewPort.appendOutput(`\nError: ${formatDomainError(result.error)}\n`);
		viewPort.showSummary(0, 0);
	}
}
