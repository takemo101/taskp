import type { CodeBlock } from "../core/skill/skill-body";
import type { DomainError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { ok } from "../core/types/result";
import type { ReservedVars } from "../core/variable/template-renderer";
import { renderTemplate } from "../core/variable/template-renderer";
import type { CommandExecutor, ExecResult } from "./port/command-executor";
import type { PromptCollector } from "./port/prompt-collector";
import type { SkillRepository } from "./port/skill-repository";

export type RunSkillInput = {
	readonly name: string;
	readonly presets: Readonly<Record<string, string>>;
	readonly dryRun: boolean;
	readonly force: boolean;
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

	// template モードではマークダウン内の bash コードブロックを順に実行する。
	// force=true なら1つ失敗しても残りを続行する（CI パイプライン的な使い方に対応）
	const commandResults = await executeCommands(
		codeBlocks,
		variables,
		reserved,
		input.force,
		deps.commandExecutor,
	);
	if (!commandResults.ok) {
		return commandResults;
	}

	return ok({
		skillName: skill.metadata.name,
		rendered,
		commands: commandResults.value,
		dryRun: false,
	});
}

async function executeCommands(
	codeBlocks: readonly CodeBlock[],
	variables: Record<string, string>,
	reserved: ReservedVars,
	force: boolean,
	executor: CommandExecutor,
): Promise<Result<readonly CommandResult[], DomainError>> {
	const results: CommandResult[] = [];

	for (const block of codeBlocks) {
		const renderResult = renderTemplate(block.code, variables, reserved);
		if (!renderResult.ok) {
			return renderResult;
		}

		const execResult = await executor.execute(renderResult.value);
		if (!execResult.ok) {
			if (!force) {
				return execResult;
			}
			results.push({
				command: renderResult.value,
				result: { stdout: "", stderr: execResult.error.message, exitCode: 1 },
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
