import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Result } from "../core/types/result";
import type { InitOptions, SkillInitializer } from "../usecase/port/skill-initializer";
import { tryCatch } from "./error-handler-utils";

const SKILL_DIR_NAME = ".taskp/skills";
const SKILL_FILE_NAME = "SKILL.md";

type SkillInitializerDeps = {
	readonly baseDir: string;
};

function generateActionsYaml(actions: readonly string[], mode: string): string {
	const lines: string[] = ["actions:"];
	for (const action of actions) {
		lines.push(`  ${action}:`);
		lines.push(`    description: "${action} action"`);
		if (mode === "agent") {
			lines.push(`    mode: agent`);
		}
	}
	return lines.join("\n");
}

function generateTemplateContent(
	name: string,
	description: string,
	actions?: readonly string[],
): string {
	const frontmatterLines = [
		"---",
		`name: ${name}`,
		`description: ${description}`,
		"mode: template",
	];

	if (actions && actions.length > 0) {
		frontmatterLines.push(generateActionsYaml(actions, "template"));
	} else {
		frontmatterLines.push("inputs: []");
	}

	frontmatterLines.push("---");

	const bodyLines = ["", `# ${name}`, ""];

	if (actions && actions.length > 0) {
		for (const action of actions) {
			bodyLines.push(`## action: ${action}`);
			bodyLines.push("");
			bodyLines.push("```bash");
			bodyLines.push(`echo "Running ${name}:${action}"`);
			bodyLines.push("```");
			bodyLines.push("");
		}
	} else {
		bodyLines.push("```bash");
		bodyLines.push(`echo "Hello from ${name}"`);
		bodyLines.push("```");
		bodyLines.push("");
	}

	return [...frontmatterLines, ...bodyLines].join("\n");
}

function generateAgentContent(
	name: string,
	description: string,
	actions?: readonly string[],
): string {
	const frontmatterLines = ["---", `name: ${name}`, `description: ${description}`, "mode: agent"];

	if (actions && actions.length > 0) {
		frontmatterLines.push(generateActionsYaml(actions, "agent"));
	}

	frontmatterLines.push("---");

	const bodyLines = ["", `# ${name}`, ""];

	if (actions && actions.length > 0) {
		for (const action of actions) {
			bodyLines.push(`## action: ${action}`);
			bodyLines.push("");
			bodyLines.push(`Describe what the ${action} action should do.`);
			bodyLines.push("");
		}
	} else {
		bodyLines.push("Describe what this skill should do.");
		bodyLines.push("");
	}

	return [...frontmatterLines, ...bodyLines].join("\n");
}

function generateSkillContent(name: string, options: InitOptions): string {
	return options.mode === "agent"
		? generateAgentContent(name, options.description, options.actions)
		: generateTemplateContent(name, options.description, options.actions);
}

export function createSkillInitializer(deps: SkillInitializerDeps): SkillInitializer {
	return {
		create: async (name: string, options: InitOptions): Promise<Result<string, Error>> => {
			const skillDir = join(deps.baseDir, SKILL_DIR_NAME, name);
			const skillPath = join(skillDir, SKILL_FILE_NAME);

			return tryCatch(
				async () => {
					await mkdir(skillDir, { recursive: true });
					await writeFile(skillPath, generateSkillContent(name, options), "utf-8");
					return skillPath;
				},
				(e) => new Error(`Failed to create skill "${name}": ${e.message}`),
			);
		},
	};
}
