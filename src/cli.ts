import { Cli, z } from "incur";

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
		run(_c) {
			throw new Error("Not implemented");
		},
	});

cli.serve();
