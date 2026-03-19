import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { ExecutionMode } from "../core/execution/execution-mode";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import type { InitOptions, SkillInitializer } from "../usecase/port/skill-initializer";

const SKILL_DIR_NAME = ".taskp/skills";
const SKILL_FILE_NAME = "SKILL.md";

type SkillInitializerDeps = {
	readonly localRoot: string;
	readonly globalRoot: string;
};

export function createSkillInitializer(deps: SkillInitializerDeps): SkillInitializer & {
	readonly createGlobal: (name: string, options: InitOptions) => Promise<Result<string, Error>>;
} {
	return {
		create: (name, options) => createSkillScaffold(deps.localRoot, name, options),
		createGlobal: (name, options) => createSkillScaffold(deps.globalRoot, name, options),
	};
}

async function createSkillScaffold(
	root: string,
	name: string,
	options: InitOptions,
): Promise<Result<string, Error>> {
	const dir = resolve(root, SKILL_DIR_NAME, name);
	const filePath = join(dir, SKILL_FILE_NAME);

	try {
		await mkdir(dir, { recursive: true });
		await writeFile(filePath, generateScaffold(name, options.mode, options.description));
		return ok(filePath);
	} catch (error) {
		return err(error instanceof Error ? error : new Error(String(error)));
	}
}

function generateScaffold(name: string, mode: ExecutionMode, description: string): string {
	const lines = [
		"---",
		`name: ${name}`,
		`description: "${description}"`,
		`mode: ${mode}`,
		"---",
		"",
		`# ${name}`,
		"",
	];

	if (mode === "template") {
		lines.push("```bash", `echo "Hello from ${name}"`, "```", "");
	}

	return lines.join("\n");
}
