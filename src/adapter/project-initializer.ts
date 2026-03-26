import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { Result } from "../core/types/result";
import type {
	FailedLink,
	ProjectInitializer,
	SetupLocation,
	SetupResult,
} from "../usecase/port/project-initializer";
import { configSchema } from "./config-loader";
import { tryCatch } from "./error-handler-utils";
import type { FileSystemPort } from "./file-system-port";

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

async function fileExists(fs: FileSystemPort, path: string): Promise<boolean> {
	try {
		await fs.stat(path);
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
	fs: FileSystemPort,
	entry: FileEntry,
	force: boolean,
	baseDir: string,
	created: string[],
	skipped: string[],
): Promise<void> {
	const displayPath = relative(baseDir, entry.path);
	if (!force && (await fileExists(fs, entry.path))) {
		skipped.push(displayPath);
		return;
	}
	await fs.writeFile(entry.path, entry.content, "utf-8");
	created.push(displayPath);
}

async function createDirIfNeeded(
	fs: FileSystemPort,
	entry: DirEntry,
	baseDir: string,
	created: string[],
): Promise<void> {
	const existed = await fileExists(fs, entry.path);
	await fs.mkdir(entry.path, { recursive: true });
	if (!existed) {
		created.push(relative(baseDir, entry.path));
	}
}

/**
 * taskp パッケージに同梱されたデフォルトスキルのディレクトリ候補を返す。
 * 呼び出し元で非同期に存在確認を行う。
 *
 * - 開発時: src/adapter/ → ../../skills
 * - ビルド後: dist/ → ../skills
 */
function getBundledSkillsDirCandidates(): readonly string[] {
	const currentDir =
		typeof import.meta.dirname === "string"
			? import.meta.dirname
			: dirname(fileURLToPath(import.meta.url));
	return [resolve(currentDir, "..", "skills"), resolve(currentDir, "..", "..", "skills")];
}

async function resolveBundledSkillsDir(
	fs: FileSystemPort,
	candidates: readonly string[],
): Promise<string | undefined> {
	for (const candidate of candidates) {
		if (await fileExists(fs, candidate)) {
			return candidate;
		}
	}
	return undefined;
}

type LinkBundledSkillsResult = {
	readonly linked: readonly string[];
	readonly failed: readonly FailedLink[];
};

async function linkBundledSkills(
	fs: FileSystemPort,
	skillsDir: string,
	bundledSkillsDir: string,
): Promise<LinkBundledSkillsResult> {
	if (!(await fileExists(fs, bundledSkillsDir))) {
		return { linked: [], failed: [] };
	}

	const entries = await fs.readdir(bundledSkillsDir, { withFileTypes: true });
	const linked: string[] = [];
	const failed: FailedLink[] = [];

	for (const entry of entries.filter((e) => e.isDirectory())) {
		const linkPath = join(skillsDir, entry.name);
		if (await fileExists(fs, linkPath)) {
			continue;
		}
		const relTarget = relative(dirname(linkPath), join(bundledSkillsDir, entry.name));
		try {
			await fs.symlink(relTarget, linkPath, "dir");
			linked.push(entry.name);
		} catch (e) {
			failed.push({
				name: entry.name,
				error: e instanceof Error ? e.message : String(e),
			});
		}
	}

	return { linked, failed };
}

export type ProjectInitializerDeps = {
	readonly baseDir: string;
	readonly location: SetupLocation;
	readonly bundledSkillsDir?: string;
	readonly fs: FileSystemPort;
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

					await createDirIfNeeded(deps.fs, { path: taskpDir }, deps.baseDir, created);

					const skillsDirExisted = await fileExists(deps.fs, skillsDir);
					await createDirIfNeeded(deps.fs, { path: skillsDir }, deps.baseDir, created);

					let linked: readonly string[] = [];
					let failedLinks: readonly FailedLink[] = [];
					if (!skillsDirExisted) {
						const bundledDir =
							deps.bundledSkillsDir ??
							(await resolveBundledSkillsDir(deps.fs, getBundledSkillsDirCandidates()));
						if (bundledDir) {
							const linkResult = await linkBundledSkills(deps.fs, skillsDir, bundledDir);
							linked = linkResult.linked;
							failedLinks = linkResult.failed;
						}
					}

					const configPath = join(taskpDir, CONFIG_FILE);
					const configContent = isGlobal ? GLOBAL_CONFIG_TEMPLATE : CONFIG_TEMPLATE;
					await writeFileIfNeeded(
						deps.fs,
						{ path: configPath, content: configContent },
						options.force,
						deps.baseDir,
						created,
						skipped,
					);

					if (!isGlobal) {
						const schemaPath = join(taskpDir, SCHEMA_FILE);
						await writeFileIfNeeded(
							deps.fs,
							{ path: schemaPath, content: generateJsonSchema() },
							options.force,
							deps.baseDir,
							created,
							skipped,
						);

						const taploPath = join(deps.baseDir, TAPLO_FILE);
						await writeFileIfNeeded(
							deps.fs,
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
						linked,
						failedLinks,
					};
				},
				(e) => new Error(`Failed to setup project: ${e.message}`),
			);
		},
	};
}
