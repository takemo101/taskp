import { dirname } from "node:path";
import { resolveActionConfig } from "../core/skill/action";
import type { Skill } from "../core/skill/skill";
import type { CodeBlock } from "../core/skill/skill-body";
import { type DomainError, domainErrorMessage, executionError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import type { ReservedVars } from "../core/variable/template-renderer";
import { renderTemplate } from "../core/variable/template-renderer";
import { type HooksConfig, runHooks } from "./hook-runner";
import type { CommandExecutor, ExecResult } from "./port/command-executor";
import type { HookExecutorPort } from "./port/hook-executor";
import { createNoopProgressWriter, type ProgressWriter } from "./port/progress-writer";
import type { PromptCollector } from "./port/prompt-collector";
import type { SkillRepository } from "./port/skill-repository";

export type RunSkillInput = {
	readonly name: string;
	readonly action?: string;
	readonly presets: Readonly<Record<string, string>>;
	readonly dryRun: boolean;
	readonly force: boolean;
	readonly noInput?: boolean;
	readonly callerSkill?: string;
};

export type CommandResult = {
	readonly command: string;
	readonly result: ExecResult;
};

export type RunOutput = {
	readonly skillName: string;
	readonly rendered: string;
	readonly commands: readonly CommandResult[];
	readonly dryRun: boolean;
};

export type RunSkillDeps = {
	readonly skillRepository: SkillRepository;
	readonly promptCollector: PromptCollector;
	readonly commandExecutor: CommandExecutor;
	readonly progressWriter?: ProgressWriter;
	readonly hookExecutor?: HookExecutorPort;
	readonly hooksConfig?: HooksConfig;
};

export async function runSkill(
	input: RunSkillInput,
	deps: RunSkillDeps,
): Promise<Result<RunOutput, DomainError>> {
	const findResult = await deps.skillRepository.findByName(input.name);
	if (!findResult.ok) {
		return findResult;
	}

	const skill = findResult.value;
	const hasActions = skill.metadata.actions !== undefined;

	if (hasActions && !input.action) {
		return err(
			executionError(
				`Skill "${skill.metadata.name}" has actions defined. Specify an action to run.`,
			),
		);
	}

	if (input.action) {
		return runWithAction({ ...input, action: input.action }, skill, deps);
	}

	return runWithoutAction(input, skill, deps);
}

async function runWithAction(
	input: RunSkillInput & { readonly action: string },
	skill: Skill,
	deps: RunSkillDeps,
): Promise<Result<RunOutput, DomainError>> {
	const actions = skill.metadata.actions;
	if (!actions) {
		return err(executionError(`Skill "${skill.metadata.name}" does not define actions.`));
	}

	const action = actions[input.action];
	if (!action) {
		return err(
			executionError(`Action "${input.action}" not found in skill "${skill.metadata.name}".`),
		);
	}

	const config = resolveActionConfig(action, skill.metadata);

	const collectResult = await deps.promptCollector.collect(config.inputs, input.presets, {
		noInput: input.noInput,
	});
	if (!collectResult.ok) {
		return collectResult;
	}
	const variables = collectResult.value;

	const progress = deps.progressWriter ?? createNoopProgressWriter();
	progress.writeInputs(config.inputs, variables);

	const reserved: ReservedVars = {
		cwd: process.cwd(),
		skillDir: dirname(skill.location),
		date: new Date().toISOString().split("T")[0],
		timestamp: new Date().toISOString(),
	};

	const sectionContent = skill.body.extractActionSection(input.action);
	if (!sectionContent) {
		return err(executionError(`Action section "action:${input.action}" not found in skill body.`));
	}

	const renderResult = renderTemplate(sectionContent, variables, reserved);
	if (!renderResult.ok) {
		return renderResult;
	}

	const rendered = renderResult.value;
	const codeBlocks = skill.body.extractActionCodeBlocks(input.action, "bash");

	if (input.dryRun) {
		return ok({
			skillName: skill.metadata.name,
			rendered,
			commands: [],
			dryRun: true,
		});
	}

	const timeout = config.timeout;

	return executeAndReport(skill, codeBlocks, variables, reserved, input, deps, rendered, timeout);
}

async function runWithoutAction(
	input: RunSkillInput,
	skill: Skill,
	deps: RunSkillDeps,
): Promise<Result<RunOutput, DomainError>> {
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

	const rendered = renderResult.value;
	const codeBlocks = skill.body.extractCodeBlocks("bash");

	if (input.dryRun) {
		return ok({
			skillName: skill.metadata.name,
			rendered,
			commands: [],
			dryRun: true,
		});
	}

	return executeAndReport(
		skill,
		codeBlocks,
		variables,
		reserved,
		input,
		deps,
		rendered,
		skill.metadata.timeout,
	);
}

async function executeAndReport(
	skill: Skill,
	codeBlocks: readonly CodeBlock[],
	variables: Record<string, string>,
	reserved: ReservedVars,
	input: RunSkillInput,
	deps: RunSkillDeps,
	rendered: string,
	timeout: number | undefined,
): Promise<Result<RunOutput, DomainError>> {
	const startTime = Date.now();

	const commandResults = await executeCommands(
		codeBlocks,
		variables,
		reserved,
		deps.commandExecutor,
		{ force: input.force, timeout },
	);

	const durationMs = Date.now() - startTime;

	if (!commandResults.ok) {
		await runHooks({
			hookExecutor: deps.hookExecutor,
			hooksConfig: deps.hooksConfig,
			context: {
				skillName: skill.metadata.name,
				actionName: input.action,
				mode: "template",
				status: "failed",
				durationMs,
				error: domainErrorMessage(commandResults.error),
				callerSkill: input.callerSkill,
			},
		});
		return commandResults;
	}

	await runHooks({
		hookExecutor: deps.hookExecutor,
		hooksConfig: deps.hooksConfig,
		context: {
			skillName: skill.metadata.name,
			actionName: input.action,
			mode: "template",
			status: "success",
			durationMs,
			callerSkill: input.callerSkill,
		},
	});

	return ok({
		skillName: skill.metadata.name,
		rendered,
		commands: commandResults.value,
		dryRun: false,
	});
}

type ExecuteCommandsOptions = {
	readonly force: boolean;
	readonly timeout?: number;
};

async function executeCommands(
	codeBlocks: readonly CodeBlock[],
	variables: Record<string, string>,
	reserved: ReservedVars,
	executor: CommandExecutor,
	options: ExecuteCommandsOptions,
): Promise<Result<readonly CommandResult[], DomainError>> {
	const results: CommandResult[] = [];

	for (const block of codeBlocks) {
		const renderResult = renderTemplate(block.code, variables, reserved);
		if (!renderResult.ok) {
			return renderResult;
		}

		const execResult = await executor.execute(
			renderResult.value,
			options.timeout !== undefined ? { timeout: options.timeout } : undefined,
		);
		if (!execResult.ok) {
			if (!options.force) {
				return execResult;
			}
			results.push({
				command: renderResult.value,
				result: { stdout: "", stderr: domainErrorMessage(execResult.error), exitCode: 1 },
			});
			continue;
		}

		results.push({
			command: renderResult.value,
			result: execResult.value,
		});
	}

	return ok(results);
}
