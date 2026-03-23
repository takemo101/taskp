import type { LanguageModelV3 } from "@ai-sdk/provider";
import { createAgentExecutor } from "../../adapter/agent-executor";
import { createConsoleLogger } from "../../adapter/console-logger";
import { createContextCollector } from "../../adapter/context-collector";
import { createDefaultContextCollectorDeps } from "../../adapter/context-collector-deps";
import { resolveActionConfig } from "../../core/skill/action";
import type { Skill } from "../../core/skill/skill";
import { domainErrorMessage } from "../../core/types/errors";
import { ok } from "../../core/types/result";
import type { HooksConfig } from "../../usecase/hook-runner";
import type { CommandExecutor } from "../../usecase/port/command-executor";
import type { HookExecutorPort } from "../../usecase/port/hook-executor";
import type { PromptCollector } from "../../usecase/port/prompt-collector";
import type { SkillRepository } from "../../usecase/port/skill-repository";
import type { SystemPromptResolver } from "../../usecase/port/system-prompt-resolver";
import { runAgentSkill } from "../../usecase/run-agent-skill";
import { runSkill } from "../../usecase/run-skill";
import {
	createTuiProgressWriter,
	createTuiStreamWriter,
	type ExecutionViewPort,
} from "../tui-stream-writer";

export type SkillRepositoryFactory = (skill: Skill) => SkillRepository;
export type PromptCollectorFactory = (
	variables: Readonly<Record<string, string>>,
) => PromptCollector;

export type ExecutionDeps = {
	readonly commandExecutor: CommandExecutor;
	readonly hookExecutor: HookExecutorPort;
	readonly hooksConfig?: HooksConfig;
	readonly skillRepositoryFactory: SkillRepositoryFactory;
	readonly promptCollectorFactory: PromptCollectorFactory;
	readonly systemPromptResolver: SystemPromptResolver;
};

export async function runExecution(
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	model: LanguageModelV3 | null,
	viewPort: ExecutionViewPort,
	deps: ExecutionDeps,
	actionName?: string,
): Promise<void> {
	const effectiveMode = resolveEffectiveMode(skill, actionName);

	if (effectiveMode === "agent" && model === null) {
		viewPort.appendOutput("Error: LLM model not configured.\n");
		viewPort.appendOutput("Set default_provider and default_model in .taskp/config.toml\n");
		viewPort.showSummary(0, 0);
		return;
	}

	try {
		if (effectiveMode === "agent" && model !== null) {
			await executeAgentMode(skill, variables, model, viewPort, deps, actionName);
		} else {
			await executeTemplateMode(skill, variables, viewPort, deps, actionName);
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		viewPort.appendOutput(`\nError: ${message}\n`);
		viewPort.showSummary(0, 0);
	}
}

export function createSingleSkillRepository(skill: Skill): SkillRepository {
	return {
		findByName: async () => ok(skill),
		listAll: async () => ({ skills: [], failures: [] }),
		listLocal: async () => ({ skills: [], failures: [] }),
		listGlobal: async () => ({ skills: [], failures: [] }),
	};
}

export function createPresetPromptCollector(
	variables: Readonly<Record<string, string>>,
): PromptCollector {
	return {
		collect: async () => ok(variables),
	};
}

function resolveEffectiveMode(skill: Skill, actionName?: string): "template" | "agent" {
	if (!actionName || !skill.metadata.actions) return skill.metadata.mode;
	const action = skill.metadata.actions[actionName];
	if (!action) return skill.metadata.mode;
	return resolveActionConfig(action, skill.metadata).mode;
}

async function executeAgentMode(
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	model: LanguageModelV3,
	viewPort: ExecutionViewPort,
	deps: ExecutionDeps,
	actionName?: string,
): Promise<void> {
	const writer = createTuiStreamWriter(viewPort);
	const progressWriter = createTuiProgressWriter(viewPort);
	const logger = createConsoleLogger();
	const agentExecutor = createAgentExecutor(writer, logger);

	const contextCollectorDeps = await createDefaultContextCollectorDeps();
	const contextCollector = createContextCollector(contextCollectorDeps);

	const result = await runAgentSkill(
		{ name: skill.metadata.name, action: actionName, presets: variables, model },
		{
			skillRepository: deps.skillRepositoryFactory(skill),
			promptCollector: deps.promptCollectorFactory(variables),
			contextCollector,
			agentExecutor,
			progressWriter,
			hookExecutor: deps.hookExecutor,
			hooksConfig: deps.hooksConfig,
			systemPromptResolver: deps.systemPromptResolver,
		},
	);

	if (!result.ok) {
		viewPort.appendOutput(`\nError: ${domainErrorMessage(result.error)}\n`);
		viewPort.showSummary(0, 0);
	}
}

async function executeTemplateMode(
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	viewPort: ExecutionViewPort,
	deps: ExecutionDeps,
	actionName?: string,
): Promise<void> {
	const progressWriter = createTuiProgressWriter(viewPort);

	const result = await runSkill(
		{
			name: skill.metadata.name,
			action: actionName,
			presets: variables,
			dryRun: false,
			force: false,
		},
		{
			skillRepository: deps.skillRepositoryFactory(skill),
			promptCollector: deps.promptCollectorFactory(variables),
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
		viewPort.appendOutput(`\nError: ${domainErrorMessage(result.error)}\n`);
		viewPort.showSummary(0, 0);
	}
}
