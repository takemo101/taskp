import { homedir } from "node:os";
import { Cli, z } from "incur";
import { createCommandRunner } from "./adapter/command-runner";
import { createPromptRunner } from "./adapter/prompt-runner";
import { createSkillInitializer } from "./adapter/skill-initializer";
import { createDefaultSkillLoader } from "./adapter/skill-loader";
import { type DomainError, EXIT_CODE } from "./core/types/errors";
import { type InitOutput, initSkill } from "./usecase/init-skill";
import type { RunOutput } from "./usecase/run-skill";
import { runSkill } from "./usecase/run-skill";

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
		run(_c) {
			throw new Error("Not implemented");
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
	});

cli.serve();
