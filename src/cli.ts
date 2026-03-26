#!/usr/bin/env bun
import { homedir } from "node:os";
import { Cli, z } from "incur";
import { createAgentExecutor } from "./adapter/agent-executor";
import { createLanguageModel, resolveModelSpec } from "./adapter/ai-provider";
import { createCommandRunner } from "./adapter/command-runner";
import { createDefaultConfigLoader } from "./adapter/config-loader";
import { createConsoleLogger } from "./adapter/console-logger";
import { createContextCollector } from "./adapter/context-collector";
import { createDefaultContextCollectorDeps } from "./adapter/context-collector-deps";
import { createHookExecutor } from "./adapter/hook-executor";
import { createCliProgressWriter } from "./adapter/progress-formatter";
import { createProjectInitializer } from "./adapter/project-initializer";
import { createPromptRunner } from "./adapter/prompt-runner";
import { createSkillInitializer } from "./adapter/skill-initializer";
import { createDefaultSkillLoader } from "./adapter/skill-loader";
import { createStreamWriter } from "./adapter/stream-writer";
import { createSystemPromptResolver } from "./adapter/system-prompt-resolver";
import type { Action } from "./core/skill/action";
import { resolveActionConfig } from "./core/skill/action";
import type { ContextSource } from "./core/skill/context-source";
import type { SkillScope } from "./core/skill/skill";
import { parseSkillRef } from "./core/skill/skill-ref";
import { validateActionExists, validateActionRequired } from "./core/skill/validate-skill-action";
import { type DomainError, domainErrorMessage, EXIT_CODE } from "./core/types/errors";
import type { Result } from "./core/types/result";
import { type InitOutput, initSkill } from "./usecase/init-skill";
import { createListSkillsUseCase } from "./usecase/list-skills";
import { runAgentSkill } from "./usecase/run-agent-skill";
import type { RunOutput } from "./usecase/run-skill";
import { runSkill } from "./usecase/run-skill";
import type { SetupOutput } from "./usecase/setup-project";
import { setupProject } from "./usecase/setup-project";
import type { ShowOutput } from "./usecase/show-skill";
import { showSkill } from "./usecase/show-skill";

// --set key=value 形式の引数を Record に変換する。
// "=" を含む値をサポートするため、最初の "=" のみで分割する
function parsePresets(pairs: readonly string[]): Readonly<Record<string, string>> {
	const result: Record<string, string> = {};
	for (const pair of pairs) {
		const eqIndex = pair.indexOf("=");
		if (eqIndex === -1) {
			continue;
		}
		const key = pair.slice(0, eqIndex);
		const value = pair.slice(eqIndex + 1);
		result[key] = value;
	}
	return result;
}

function formatRunOutput(output: RunOutput): string {
	const lines: string[] = [];

	if (output.dryRun) {
		lines.push("[dry-run] Rendered template:");
		lines.push(output.rendered);
		return lines.join("\n");
	}

	for (const cmd of output.commands) {
		lines.push(`$ ${cmd.command}`);
		if (cmd.result.stdout) {
			lines.push(cmd.result.stdout);
		}
		if (cmd.result.stderr) {
			lines.push(cmd.result.stderr);
		}
	}

	const failed = output.commands.filter((c) => c.result.exitCode !== 0);
	lines.push("");
	lines.push(
		`✔ ${output.skillName} completed (${output.commands.length} steps, ${failed.length} failed)`,
	);

	return lines.join("\n");
}

function formatInitOutput(output: InitOutput): string {
	return `Created ${output.mode} skill "${output.name}" at ${output.path}`;
}

function formatSetupOutput(output: SetupOutput): string {
	const lines: string[] = [];
	lines.push(`Setup ${output.location} configuration:`);

	if (output.created.length > 0) {
		lines.push("");
		lines.push("Created:");
		for (const path of output.created) {
			lines.push(`  ${path}`);
		}
	}

	if (output.skipped.length > 0) {
		lines.push("");
		lines.push("Skipped (already exists):");
		for (const path of output.skipped) {
			lines.push(`  ${path}`);
		}
	}

	if (output.linked.length > 0) {
		lines.push("");
		lines.push("Linked default skills:");
		for (const path of output.linked) {
			lines.push(`  ${path}`);
		}
	}

	if (output.failedLinks.length > 0) {
		lines.push("");
		lines.push("Failed to link skills:");
		for (const fail of output.failedLinks) {
			lines.push(`  ${fail.name}: ${fail.error}`);
		}
	}

	return lines.join("\n");
}

function formatError(error: DomainError): string {
	return `Error: ${domainErrorMessage(error)}`;
}

// Result が失敗なら CLI エラー出力して終了、成功なら値を返す
function exitOnError<T>(result: Result<T, DomainError>): T {
	if (result.ok) return result.value;
	console.error(formatError(result.error));
	process.exit(EXIT_CODE[result.error.type]);
}

const cli = Cli.create("taskp", {
	version: "0.1.6",
	description:
		"Markdown-defined skill runner with interactive argument collection and LLM execution",
})
	.command("run", {
		description: "Execute a skill",
		args: z.object({
			skill: z.string().describe("Skill name or skill:action to execute"),
		}),
		options: z.object({
			model: z.string().optional().describe("LLM model to use"),
			dryRun: z.boolean().optional().describe("Show execution plan without running"),
			force: z.boolean().optional().describe("Continue on error (template mode)"),
			verbose: z.boolean().optional().describe("Show detailed logs"),
			skipPrompt: z.boolean().optional().describe("Disable interactive prompts (use defaults)"),
			set: z.array(z.string()).optional().describe("Set variables directly (key=value)"),
		}),
		alias: {
			model: "m",
			force: "f",
			verbose: "v",
			set: "s",
		},
		async run(c) {
			const ref = exitOnError(parseSkillRef(c.args.skill));

			const presets = parsePresets(c.options.set ?? []);
			const skillRepository = createDefaultSkillLoader(process.cwd());
			const promptCollector = createPromptRunner();

			const skill = exitOnError(await skillRepository.findByName(ref.name));

			exitOnError(validateActionRequired(skill, ref.action));

			const action = exitOnError(validateActionExists(skill, ref.action));

			// アクション指定時は resolveActionConfig で mode を決定
			const effectiveMode = action
				? resolveActionConfig(action, skill.metadata).mode
				: skill.metadata.mode;

			if (effectiveMode === "agent") {
				await runAgentMode(
					{ args: { skill: ref.name, action: ref.action }, options: c.options },
					presets,
					skillRepository,
					promptCollector,
				);
				return;
			}

			const configLoader = createDefaultConfigLoader(process.cwd());
			const configResult = await configLoader.load();
			const config = configResult.ok ? configResult.value : undefined;

			const commandExecutor = createCommandRunner({
				defaultTimeoutMs: config?.cli?.command_timeout_ms,
			});
			const progressWriter = createCliProgressWriter(process.stdout);

			const hooksConfig = config?.hooks;
			const logger = createConsoleLogger();
			const hookExecutor = createHookExecutor(commandExecutor, logger);

			const result = await runSkill(
				{
					name: ref.name,
					action: ref.action,
					presets,
					dryRun: c.options.dryRun ?? false,
					force: c.options.force ?? false,
					noInput: c.options.skipPrompt,
				},
				{
					skillRepository,
					promptCollector,
					commandExecutor,
					progressWriter,
					hookExecutor,
					hooksConfig,
				},
			);

			console.log(formatRunOutput(exitOnError(result)));
		},
	})
	.command("list", {
		description: "List available skills",
		options: z.object({
			global: z.boolean().optional().describe("Show global skills only"),
			local: z.boolean().optional().describe("Show project-local skills only"),
		}),
		async run(c) {
			const scope = resolveScope(c.options.global, c.options.local);
			const repository = createDefaultSkillLoader(process.cwd());
			const usecase = createListSkillsUseCase(repository);
			const { skills } = await usecase.execute({ scope });

			if (skills.length === 0) {
				console.log("No skills found.");
				return;
			}

			printSkillTable(skills);
		},
	})
	.command("init", {
		description: "Create a skill scaffold",
		args: z.object({
			name: z.string().describe("Skill name"),
		}),
		options: z.object({
			global: z.boolean().optional().describe("Create in global directory"),
			mode: z.enum(["template", "agent"]).optional().describe("Execution mode"),
			actions: z.string().optional().describe("Comma-separated action names"),
		}),
		alias: {
			global: "g",
			mode: "m",
			actions: "a",
		},
		async run(c) {
			const isGlobal = c.options.global ?? false;
			const baseDir = isGlobal ? homedir() : process.cwd();
			const mode = c.options.mode ?? "template";
			const actions = c.options.actions
				? c.options.actions.split(",").map((a) => a.trim())
				: undefined;

			const skillRepository = createDefaultSkillLoader(process.cwd());
			const skillInitializer = createSkillInitializer({ baseDir });

			const result = await initSkill(
				{ skillRepository, skillInitializer },
				{ name: c.args.name, global: isGlobal, mode, actions },
			);

			console.log(formatInitOutput(exitOnError(result)));
		},
	})
	.command("show", {
		description: "Show skill details",
		args: z.object({
			skill: z.string().describe("Skill name or skill:action to show"),
		}),
		async run(c) {
			const ref = exitOnError(parseSkillRef(c.args.skill));

			const repository = createDefaultSkillLoader(process.cwd());
			const result = await showSkill(ref.name, repository, ref.action);

			console.log(formatShowOutput(exitOnError(result)));
		},
	})
	.command("setup", {
		description: "Initialize project configuration",
		options: z.object({
			global: z.boolean().optional().describe("Initialize global configuration"),
			force: z.boolean().optional().describe("Overwrite existing files"),
		}),
		alias: {
			global: "g",
			force: "f",
		},
		async run(c) {
			const isGlobal = c.options.global ?? false;
			const baseDir = isGlobal ? homedir() : process.cwd();

			const projectInitializer = createProjectInitializer({
				baseDir,
				location: isGlobal ? "global" : "project",
			});

			const result = await setupProject(
				{ projectInitializer },
				{ global: isGlobal, force: c.options.force ?? false },
			);

			console.log(formatSetupOutput(exitOnError(result)));
		},
	})
	.command("tui", {
		description: "Launch interactive TUI",
		options: z.object({
			model: z.string().optional().describe("LLM model to use"),
		}),
		alias: {
			model: "m",
		},
		async run(c) {
			const { startTui } = await import("./tui/app");
			await startTui({ model: c.options.model });
		},
	})
	.command("serve", {
		description: "Start as MCP stdio server",
		async run() {
			await cli.serve(["--mcp"]);
		},
	});

type RunCommandContext = {
	readonly args: { readonly skill: string; readonly action?: string };
	readonly options: {
		readonly model?: string;
		readonly verbose?: boolean;
		readonly skipPrompt?: boolean;
	};
};

async function runAgentMode(
	c: RunCommandContext,
	presets: Readonly<Record<string, string>>,
	skillRepository: ReturnType<typeof createDefaultSkillLoader>,
	promptCollector: ReturnType<typeof createPromptRunner>,
): Promise<void> {
	const configLoader = createDefaultConfigLoader(process.cwd());
	const config = exitOnError(await configLoader.load());

	const aiConfig = config.ai ?? {};
	const modelSpec = exitOnError(
		resolveModelSpec({
			cliModel: c.options.model,
			config: aiConfig,
		}),
	);

	const languageModel = exitOnError(createLanguageModel(modelSpec, aiConfig));

	const writer = createStreamWriter({
		verbose: c.options.verbose ?? false,
		output: process.stdout,
	});

	const logger = createConsoleLogger();
	const contextCollectorDeps = await createDefaultContextCollectorDeps();
	const contextCollector = createContextCollector({ ...contextCollectorDeps, logger });
	const agentExecutor = createAgentExecutor(writer, logger);

	const commandExecutor = createCommandRunner({
		defaultTimeoutMs: config.cli?.command_timeout_ms,
	});
	const hookExecutor = createHookExecutor(commandExecutor, logger);
	const hooksConfig = config.hooks;

	const result = await runAgentSkill(
		{
			name: c.args.skill,
			action: c.args.action,
			presets,
			model: languageModel,
			noInput: c.options.skipPrompt,
			maxAgentSteps: config.cli?.max_agent_steps,
		},
		{
			skillRepository,
			promptCollector,
			contextCollector,
			agentExecutor,
			systemPromptResolver: createSystemPromptResolver(process.cwd()),
			progressWriter: createCliProgressWriter(process.stdout),
			hookExecutor,
			hooksConfig,
		},
	);
	exitOnError(result);
}

function resolveScope(
	global: boolean | undefined,
	local: boolean | undefined,
): SkillScope | undefined {
	if (global) return "global";
	if (local) return "local";
	return undefined;
}

// ANSI カラーコード（NO_COLOR / 非 TTY 環境ではエスケープを無効化）
// 注意: bold と dim は同じリセットコード（\x1b[22m）のため、ネスト不可
const useColor = process.stdout.isTTY === true && !process.env.NO_COLOR;
const ansi = {
	bold: (s: string) => (useColor ? `\x1b[1m${s}\x1b[22m` : s),
	cyan: (s: string) => (useColor ? `\x1b[36m${s}\x1b[39m` : s),
	dim: (s: string) => (useColor ? `\x1b[2m${s}\x1b[22m` : s),
} as const;

function printSkillTable(
	skills: ReadonlyArray<{
		metadata: {
			name: string;
			description: string;
			actions?: Record<string, Action>;
		};
		location: string;
		scope: SkillScope;
	}>,
): void {
	for (const skill of skills) {
		const scopeLabel = ansi.dim(`(${skill.scope})`);
		const actionsLabel = formatActionsLabel(skill.metadata.actions);
		console.log(`${ansi.bold(ansi.cyan(skill.metadata.name))} ${scopeLabel}`);
		console.log(`  ${skill.metadata.description}`);
		if (actionsLabel) {
			console.log(`  Actions: ${actionsLabel}`);
		}
	}
}

function formatActionsLabel(actions: Record<string, Action> | undefined): string | undefined {
	if (!actions) return undefined;
	const names = Object.keys(actions);
	if (names.length === 0) return undefined;
	return names.join(", ");
}

function formatShowOutput(output: ShowOutput): string {
	const lines: string[] = [
		`Skill: ${output.name}`,
		`Description: ${output.description}`,
		`Mode: ${output.mode}`,
		`Location: ${output.location}`,
	];

	if (output.actions && output.actions.length > 0 && !output.actionDetail) {
		lines.push("");
		lines.push("Actions:");
		for (const action of output.actions) {
			lines.push(`  ${action.name}  ${action.description}`);
		}
	}

	if (output.actionDetail) {
		lines.push("");
		lines.push(`Action: ${output.actionDetail.name}`);
		lines.push(`  Description: ${output.actionDetail.description}`);
		lines.push(`  Mode: ${output.actionDetail.mode}`);
	}

	if (output.inputs.length > 0) {
		lines.push("");
		lines.push("Inputs:");
		for (const input of output.inputs) {
			const parts = [`  ${input.name}`, input.type, input.message];
			if (input.choices && input.choices.length > 0) {
				parts.push(`[${input.choices.join(", ")}]`);
			} else if (input.default !== undefined) {
				parts.push(`(default: ${String(input.default)})`);
			}
			lines.push(parts.join("  "));
		}
	}

	if (output.context.length > 0) {
		lines.push("");
		lines.push("Context:");
		for (const ctx of output.context) {
			const source = contextSourceValue(ctx);
			lines.push(`  ${ctx.type}  ${source}`);
		}
	}

	return lines.join("\n");
}

function contextSourceValue(ctx: ContextSource): string {
	switch (ctx.type) {
		case "file":
			return ctx.path;
		case "glob":
			return ctx.pattern;
		case "command":
			return ctx.run;
		case "url":
			return ctx.url;
		case "image":
			return ctx.path;
	}
}

// incur の serve() はコマンドライン引数を自動パースして適切なコマンドを実行する。
// --mcp フラグ付きの場合は MCP stdio サーバーとして起動する
cli.serve();
