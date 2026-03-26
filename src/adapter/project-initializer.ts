import { mkdir, readdir, stat, symlink, writeFile } from "node:fs/promises";
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

async function resolveBundledSkillsDir(candidates: readonly string[]): Promise<string | undefined> {
	for (const candidate of candidates) {
		if (await fileExists(candidate)) {
			return candidate;
		}
	}
	return undefined;
}

type LinkBundledSkillsResult = {
	readonly linked: readonly string[];
	readonly failed: readonly FailedLink[];
};

/**
 * ディレクトリへのシンボリックリンクを作成する。
 *
 * Windows では 'junction' を使用（管理者権限・デベロッパーモード不要）。
 * Unix 系では 'dir' を使用。
 * @see https://nodejs.org/api/fs.html#fssymlinktarget-path-type-callback
 */
async function createDirSymlink(target: string, path: string): Promise<void> {
	const type = process.platform === "win32" ? "junction" : "dir";
	await symlink(target, path, type);
}

/**
 * バンドルスキルへのシンボリックリンクを作成する。
 *
 * 相対パスを使用し、npm update でパッケージパスが変わっても追従可能。
 * Windows では junction を使用するため管理者権限不要。
 */
async function linkBundledSkills(
	skillsDir: string,
	bundledSkillsDir: string,
): Promise<LinkBundledSkillsResult> {
	if (!(await fileExists(bundledSkillsDir))) {
		return { linked: [], failed: [] };
	}

	const entries = await readdir(bundledSkillsDir, { withFileTypes: true });
	const linked: string[] = [];
	const failed: FailedLink[] = [];

	for (const entry of entries.filter((e) => e.isDirectory())) {
		const linkPath = join(skillsDir, entry.name);
		if (await fileExists(linkPath)) {
			continue;
		}
		const relTarget = relative(dirname(linkPath), join(bundledSkillsDir, entry.name));
		try {
			await createDirSymlink(relTarget, linkPath);
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

type ProjectInitializerDeps = {
	readonly baseDir: string;
	readonly location: SetupLocation;
	readonly bundledSkillsDir?: string;
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

					// .taskp/skills/ が未作成の場合のみ、ディレクトリ作成 + バンドルスキルのシンボリックリンクを行う
					const skillsDirExisted = await fileExists(skillsDir);
					await createDirIfNeeded({ path: skillsDir }, deps.baseDir, created);

					let linked: readonly string[] = [];
					let failedLinks: readonly FailedLink[] = [];
					if (!skillsDirExisted) {
						const bundledDir =
							deps.bundledSkillsDir ??
							(await resolveBundledSkillsDir(getBundledSkillsDirCandidates()));
						if (bundledDir) {
							const linkResult = await linkBundledSkills(skillsDir, bundledDir);
							linked = linkResult.linked;
							failedLinks = linkResult.failed;
						}
					}

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
						linked,
						failedLinks,
					};
				},
				(e) => new Error(`Failed to setup project: ${e.message}`),
			);
		},
	};
}
