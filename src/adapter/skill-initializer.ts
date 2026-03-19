import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { Result } from "../core/types/result";
import { ok } from "../core/types/result";
import type { InitOptions, SkillInitializer } from "../usecase/port/skill-initializer";

const SKILL_DIR_NAME = ".taskp/skills";
const SKILL_FILE_NAME = "SKILL.md";

type SkillInitializerDeps = {
	readonly baseDir: string;
};

function generateTemplateContent(name: string, description: string): string {
	return [
		"---",
		`name: ${name}`,
		`description: ${description}`,
		"mode: template",
		"inputs: []",
		"---",
		"",
		`# ${name}`,
		"",
		"```bash",
		`echo "Hello from ${name}"`,
		"```",
		"",
	].join("\n");
}

function generateAgentContent(name: string, description: string): string {
	return [
		"---",
		`name: ${name}`,
		`description: ${description}`,
		"mode: agent",
		"---",
		"",
		`# ${name}`,
		"",
		"Describe what this skill should do.",
		"",
	].join("\n");
}

function generateSkillContent(name: string, options: InitOptions): string {
	return options.mode === "agent"
		? generateAgentContent(name, options.description)
		: generateTemplateContent(name, options.description);
}

export function createSkillInitializer(deps: SkillInitializerDeps): SkillInitializer {
	return {
		create: async (name: string, options: InitOptions): Promise<Result<string, Error>> => {
			const skillDir = join(deps.baseDir, SKILL_DIR_NAME, name);
			const skillPath = join(skillDir, SKILL_FILE_NAME);

			await mkdir(skillDir, { recursive: true });
			await writeFile(skillPath, generateSkillContent(name, options), "utf-8");

			return ok(skillPath);
		},
	};
}
