import { Cli, z } from "incur";
import { createDefaultSkillLoader } from "./adapter/skill-loader";
import type { SkillScope } from "./core/skill/skill";
import { createListSkillsUseCase } from "./usecase/list-skills";

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
		run(_c) {
			throw new Error("Not implemented");
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
		run(_c) {
			throw new Error("Not implemented");
		},
	});

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

cli.serve();
