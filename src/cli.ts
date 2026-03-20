import { homedir } from "node:os";
import { Cli, z } from "incur";
import { createAgentExecutor } from "./adapter/agent-executor";
import { createLanguageModel, resolveModelSpec } from "./adapter/ai-provider";
import { createCommandRunner } from "./adapter/command-runner";
import { createDefaultConfigLoader } from "./adapter/config-loader";
import { createContextCollector } from "./adapter/context-collector";
import { createPromptRunner } from "./adapter/prompt-runner";
import { createSkillInitializer } from "./adapter/skill-initializer";
import { createDefaultSkillLoader } from "./adapter/skill-loader";
import { createStreamWriter } from "./adapter/stream-writer";
import type { ContextSource } from "./core/skill/context-source";
import type { SkillScope } from "./core/skill/skill";
import { type DomainError, EXIT_CODE, executionError } from "./core/types/errors";
import { err, ok } from "./core/types/result";
import { type InitOutput, initSkill } from "./usecase/init-skill";
import { createListSkillsUseCase } from "./usecase/list-skills";
import { runAgentSkill } from "./usecase/run-agent-skill";
import type { RunOutput } from "./usecase/run-skill";
import { runSkill } from "./usecase/run-skill";
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

function formatError(error: DomainError): string {
	switch (error.type) {
		case "SKILL_NOT_FOUND":
			return `Error: Skill "${error.name}" not found`;
		case "PARSE_ERROR":
			return `Error: ${error.message}`;
		case "RENDER_ERROR":
			return `Error: ${error.message}`;
		case "EXECUTION_ERROR":
			return `Error: ${error.message}`;
		case "CONFIG_ERROR":
			return `Error: ${error.message}`;
	}
}

const cli = Cli.create("taskp", {
	version: "0.1.0",
	description:
		"Markdown-defined skill runner with interactive argument collection and LLM execution",
})
	.command("run", {
		description: "Execute a skill",
		args: z.object({
			skill: z.string().describe("Skill name to execute"),
		}),
		options: z.object({
			model: z.string().optional().describe("LLM model to use"),
			provider: z.string().optional().describe("LLM provider"),
			dryRun: z.boolean().optional().describe("Show execution plan without running"),
			force: z.boolean().optional().describe("Continue on error (template mode)"),
			verbose: z.boolean().optional().describe("Show detailed logs"),
			noInput: z.boolean().optional().describe("Disable interactive prompts (use defaults)"),
			set: z.array(z.string()).optional().describe("Set variables directly (key=value)"),
		}),
		alias: {
			model: "m",
			provider: "p",
			force: "f",
			verbose: "v",
			set: "s",
		},
		async run(c) {
			const presets = parsePresets(c.options.set ?? []);
			const skillRepository = createDefaultSkillLoader(process.cwd());
			const promptCollector = createPromptRunner();

			// まずスキルを読み込んで mode を判定し、agent/template で処理を分岐する。
			// agent モードは LLM 接続が必要なため、設定の読み込みやモデル解決が追加で発生する
			const findResult = await skillRepository.findByName(c.args.skill);
			if (!findResult.ok) {
				console.error(formatError(findResult.error));
				process.exit(EXIT_CODE[findResult.error.type]);
			}

			const skill = findResult.value;

			if (skill.metadata.mode === "agent") {
				await runAgentMode(c, presets, skillRepository, promptCollector);
				return;
			}

			const commandExecutor = createCommandRunner();
			const result = await runSkill(
				{
					name: c.args.skill,
					presets,
					dryRun: c.options.dryRun ?? false,
					force: c.options.force ?? false,
				},
				{ skillRepository, promptCollector, commandExecutor },
			);

			if (!result.ok) {
				console.error(formatError(result.error));
				process.exit(EXIT_CODE[result.error.type]);
			}

			console.log(formatRunOutput(result.value));
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
		}),
		alias: {
			global: "g",
			mode: "m",
		},
		async run(c) {
			const isGlobal = c.options.global ?? false;
			const baseDir = isGlobal ? homedir() : process.cwd();
			const mode = c.options.mode ?? "template";

			const skillRepository = createDefaultSkillLoader(process.cwd());
			const skillInitializer = createSkillInitializer({ baseDir });

			const result = await initSkill(
				{ skillRepository, skillInitializer },
				{ name: c.args.name, global: isGlobal, mode },
			);

			if (!result.ok) {
				console.error(formatError(result.error));
				process.exit(EXIT_CODE[result.error.type]);
			}

			console.log(formatInitOutput(result.value));
		},
	})
	.command("show", {
		description: "Show skill details",
		args: z.object({
			skill: z.string().describe("Skill name to show"),
		}),
		async run(c) {
			const repository = createDefaultSkillLoader(process.cwd());
			const result = await showSkill(c.args.skill, repository);

			if (!result.ok) {
				console.error(formatError(result.error));
				process.exit(EXIT_CODE[result.error.type]);
			}

			console.log(formatShowOutput(result.value));
		},
	})
	.command("tui", {
		description: "Launch interactive TUI",
		async run() {
			const { startTui } = await import("./tui/app");
			await startTui();
		},
	})
	.command("serve", {
		description: "Start as MCP stdio server",
		async run() {
			await cli.serve(["--mcp"]);
		},
	});

type RunCommandContext = {
	readonly args: { readonly skill: string };
	readonly options: {
		readonly model?: string;
		readonly verbose?: boolean;
	};
};

async function runAgentMode(
	c: RunCommandContext,
	presets: Readonly<Record<string, string>>,
	skillRepository: ReturnType<typeof createDefaultSkillLoader>,
	promptCollector: ReturnType<typeof createPromptRunner>,
): Promise<void> {
	const configLoader = createDefaultConfigLoader(process.cwd());
	const configResult = await configLoader.load();
	if (!configResult.ok) {
		console.error(formatError(configResult.error));
		process.exit(EXIT_CODE[configResult.error.type]);
	}

	const aiConfig = configResult.value.ai ?? {};
	const modelSpecResult = resolveModelSpec({
		cliModel: c.options.model,
		config: aiConfig,
	});
	if (!modelSpecResult.ok) {
		console.error(formatError(modelSpecResult.error));
		process.exit(EXIT_CODE[modelSpecResult.error.type]);
	}

	const languageModelResult = createLanguageModel(modelSpecResult.value, aiConfig);
	if (!languageModelResult.ok) {
		console.error(formatError(languageModelResult.error));
		process.exit(EXIT_CODE[languageModelResult.error.type]);
	}

	const writer = createStreamWriter({
		verbose: c.options.verbose ?? false,
		output: process.stdout,
	});

	const contextCollector = createContextCollector({
		executeCommand: async (command, cwd) => {
			const { execa } = await import("execa");
			const result = await execa(command, { shell: true, cwd, reject: false });
			return ok(result.stdout);
		},
		fetchUrl: async (url) => {
			try {
				const response = await fetch(url);
				if (!response.ok) {
					return err(executionError(`Failed to fetch URL: ${url} (${response.status})`));
				}
				return ok(await response.text());
			} catch (e) {
				return err(
					executionError(
						`Failed to fetch URL: ${url} (${e instanceof Error ? e.message : String(e)})`,
					),
				);
			}
		},
		scanGlob: async (pattern, cwd) => {
			try {
				const { glob } = await import("node:fs/promises");
				const matches: string[] = [];
				for await (const entry of glob(pattern, { cwd })) {
					matches.push(entry);
				}
				return ok(matches);
			} catch (e) {
				return err(
					executionError(
						`Failed to scan glob: ${pattern} (${e instanceof Error ? e.message : String(e)})`,
					),
				);
			}
		},
	});

	const agentExecutor = createAgentExecutor(writer);

	const result = await runAgentSkill(
		{
			name: c.args.skill,
			presets,
			model: languageModelResult.value,
		},
		{ skillRepository, promptCollector, contextCollector, agentExecutor },
	);
	if (!result.ok) {
		console.error(formatError(result.error));
		process.exit(EXIT_CODE[result.error.type]);
	}
}

function resolveScope(
	global: boolean | undefined,
	local: boolean | undefined,
): SkillScope | undefined {
	if (global) return "global";
	if (local) return "local";
	return undefined;
}

function printSkillTable(
	skills: ReadonlyArray<{ metadata: { name: string; description: string }; location: string }>,
): void {
	const header = { name: "Name", description: "Description", location: "Location" };
	const rows = skills.map((s) => ({
		name: s.metadata.name,
		description: s.metadata.description,
		location: s.location,
	}));

	const nameWidth = Math.max(header.name.length, ...rows.map((r) => r.name.length));
	const descWidth = Math.max(header.description.length, ...rows.map((r) => r.description.length));

	const formatRow = (name: string, desc: string, loc: string): string =>
		`${name.padEnd(nameWidth)}  ${desc.padEnd(descWidth)}  ${loc}`;

	console.log(formatRow(header.name, header.description, header.location));
	for (const row of rows) {
		console.log(formatRow(row.name, row.description, row.location));
	}
}

function formatShowOutput(output: ShowOutput): string {
	const lines: string[] = [
		`Skill: ${output.name}`,
		`Description: ${output.description}`,
		`Mode: ${output.mode}`,
		`Location: ${output.location}`,
	];

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
	}
}

// incur の serve() はコマンドライン引数を自動パースして適切なコマンドを実行する。
// --mcp フラグ付きの場合は MCP stdio サーバーとして起動する
cli.serve();
