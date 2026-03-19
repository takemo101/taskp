import { parseArgs } from "node:util";
import { createCommandRunner } from "./adapter/command-runner";
import { createPromptRunner } from "./adapter/prompt-runner";
import { createDefaultSkillLoader } from "./adapter/skill-loader";
import { type DomainError, EXIT_CODE } from "./core/types/errors";
import type { RunOutput } from "./usecase/run-skill";
import { runSkill } from "./usecase/run-skill";

type CliArgs = {
	readonly command: string;
	readonly skillName: string;
	readonly model: string | undefined;
	readonly dryRun: boolean;
	readonly force: boolean;
	readonly verbose: boolean;
	readonly noInput: boolean;
	readonly presets: Readonly<Record<string, string>>;
};

function parseCliArgs(argv: readonly string[]): CliArgs {
	const { values, positionals } = parseArgs({
		args: argv.slice(2),
		options: {
			model: { type: "string", short: "m" },
			"dry-run": { type: "boolean", default: false },
			force: { type: "boolean", short: "f", default: false },
			verbose: { type: "boolean", short: "v", default: false },
			"no-input": { type: "boolean", default: false },
			set: { type: "string", short: "s", multiple: true, default: [] },
		},
		allowPositionals: true,
	});

	const command = positionals[0] ?? "";
	const skillName = positionals[1] ?? "";
	const presets = parsePresets(values.set as string[]);

	return {
		command,
		skillName,
		model: values.model as string | undefined,
		dryRun: values["dry-run"] as boolean,
		force: values.force as boolean,
		verbose: values.verbose as boolean,
		noInput: values["no-input"] as boolean,
		presets,
	};
}

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

function showUsage(): void {
	console.log("Usage: taskp <command> [args] [options]");
	console.log("");
	console.log("Commands:");
	console.log("  run <skill>   Run a skill");
	console.log("");
	console.log("Options:");
	console.log("  --model, -m      LLM model to use");
	console.log("  --dry-run        Show execution plan without running");
	console.log("  --force, -f      Continue on error (template mode)");
	console.log("  --verbose, -v    Show detailed logs");
	console.log("  --no-input       Disable interactive prompts (use defaults)");
	console.log("  --set, -s        Set variable (--set key=value)");
}

async function runCommand(args: CliArgs): Promise<number> {
	if (!args.skillName) {
		console.error("Error: skill name is required");
		console.error("Usage: taskp run <skill>");
		return 1;
	}

	const skillRepository = createDefaultSkillLoader(process.cwd());
	const promptCollector = createPromptRunner();
	const commandExecutor = createCommandRunner();

	const result = await runSkill(
		{
			name: args.skillName,
			presets: args.presets,
			dryRun: args.dryRun,
			force: args.force,
		},
		{ skillRepository, promptCollector, commandExecutor },
	);

	if (!result.ok) {
		console.error(formatError(result.error));
		return EXIT_CODE[result.error.type];
	}

	console.log(formatRunOutput(result.value));
	return 0;
}

async function main(): Promise<void> {
	const args = parseCliArgs(process.argv);

	let exitCode: number;
	switch (args.command) {
		case "run":
			exitCode = await runCommand(args);
			break;
		default:
			showUsage();
			exitCode = args.command ? 1 : 0;
			break;
	}

	process.exit(exitCode);
}

main();
