import { mkdir, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { z } from "zod";
import type { Result } from "../core/types/result";
import type {
	ProjectInitializer,
	SetupLocation,
	SetupResult,
} from "../usecase/port/project-initializer";
import { configSchema } from "./config-loader";
import { tryCatch } from "./error-handler-utils";

const TASKP_DIR = ".taskp";
const CONFIG_FILE = "config.toml";
const SCHEMA_FILE = "config.schema.json";
const SKILLS_DIR = "skills";
const TAPLO_FILE = ".taplo.toml";

const CONFIG_TEMPLATE = `# taskp — 設定ファイル

[ai]
# default_provider = "anthropic"
# default_model = "claude-sonnet-4-20250514"

# [ai.providers.anthropic]
# api_key_env = "ANTHROPIC_API_KEY"

# [ai.providers.ollama]
# base_url = "http://localhost:11434/v1"
# default_model = "qwen2.5-coder:32b"

# [cli]
# command_timeout_ms = 30000

# [hooks]
# on_success = []
# on_failure = []
`;

const GLOBAL_CONFIG_TEMPLATE = `# taskp — グローバル設定ファイル

[ai]
# default_provider = "anthropic"
# default_model = "claude-sonnet-4-20250514"

# [ai.providers.anthropic]
# api_key_env = "ANTHROPIC_API_KEY"

# [ai.providers.ollama]
# base_url = "http://localhost:11434/v1"
# default_model = "qwen2.5-coder:32b"

# [cli]
# command_timeout_ms = 30000

# [hooks]
# on_success = []
# on_failure = []
`;

const TAPLO_CONTENT = `[[rule]]
include = [".taskp/config.toml"]

[rule.schema]
path = ".taskp/config.schema.json"
`;

function generateJsonSchema(): string {
	const jsonSchema = z.toJSONSchema(configSchema, {
		target: "draft-2020-12",
	});
	return `${JSON.stringify(jsonSchema, null, 2)}\n`;
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

type FileEntry = {
	readonly path: string;
	readonly content: string;
};

type DirEntry = {
	readonly path: string;
};

async function writeFileIfNeeded(
	entry: FileEntry,
	force: boolean,
	baseDir: string,
	created: string[],
	skipped: string[],
): Promise<void> {
	const displayPath = relative(baseDir, entry.path);
	if (!force && (await fileExists(entry.path))) {
		skipped.push(displayPath);
		return;
	}
	await writeFile(entry.path, entry.content, "utf-8");
	created.push(displayPath);
}

async function createDirIfNeeded(
	entry: DirEntry,
	baseDir: string,
	created: string[],
): Promise<void> {
	const existed = await fileExists(entry.path);
	await mkdir(entry.path, { recursive: true });
	if (!existed) {
		created.push(relative(baseDir, entry.path));
	}
}

type ProjectInitializerDeps = {
	readonly baseDir: string;
	readonly location: SetupLocation;
};

export function createProjectInitializer(deps: ProjectInitializerDeps): ProjectInitializer {
	const isGlobal = deps.location === "global";
	const taskpDir = join(deps.baseDir, TASKP_DIR);
	const skillsDir = join(taskpDir, SKILLS_DIR);

	return {
		setup: async (options: { readonly force: boolean }): Promise<Result<SetupResult, Error>> => {
			return tryCatch(
				async () => {
					const created: string[] = [];
					const skipped: string[] = [];

					await createDirIfNeeded({ path: taskpDir }, deps.baseDir, created);
					await createDirIfNeeded({ path: skillsDir }, deps.baseDir, created);

					const configPath = join(taskpDir, CONFIG_FILE);
					const configContent = isGlobal ? GLOBAL_CONFIG_TEMPLATE : CONFIG_TEMPLATE;
					await writeFileIfNeeded(
						{ path: configPath, content: configContent },
						options.force,
						deps.baseDir,
						created,
						skipped,
					);

					if (!isGlobal) {
						const schemaPath = join(taskpDir, SCHEMA_FILE);
						await writeFileIfNeeded(
							{ path: schemaPath, content: generateJsonSchema() },
							options.force,
							deps.baseDir,
							created,
							skipped,
						);

						const taploPath = join(deps.baseDir, TAPLO_FILE);
						await writeFileIfNeeded(
							{ path: taploPath, content: TAPLO_CONTENT },
							options.force,
							deps.baseDir,
							created,
							skipped,
						);
					}

					return {
						location: deps.location,
						created,
						skipped,
					};
				},
				(e) => new Error(`Failed to setup project: ${e.message}`),
			);
		},
	};
}
