import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { parse as parseToml } from "smol-toml";
import { z } from "zod";
import { type ConfigError, configError } from "../core/types/errors";
import { err, ok, type Result } from "../core/types/result";

const CONFIG_PATH = ".taskp/config.toml";

const providerConfigSchema = z.object({
	api_key_env: z.string().min(1).optional(),
	base_url: z.string().min(1).optional(),
	default_model: z.string().min(1).optional(),
});

const aiConfigSchema = z.object({
	default_provider: z.string().min(1).optional(),
	default_model: z.string().min(1).optional(),
	providers: z.record(z.string(), providerConfigSchema).optional(),
});

const configSchema = z.object({
	ai: aiConfigSchema.optional(),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type AiConfig = z.infer<typeof aiConfigSchema>;
export type Config = z.infer<typeof configSchema>;

type ConfigLoaderDeps = {
	readonly projectRoot: string;
	readonly globalRoot: string;
};

export function createConfigLoader(deps: ConfigLoaderDeps) {
	const globalPath = resolve(deps.globalRoot, CONFIG_PATH);
	const projectPath = resolve(deps.projectRoot, CONFIG_PATH);

	return {
		load: () => loadConfig(globalPath, projectPath),
	};
}

export function createDefaultConfigLoader(projectRoot: string) {
	return createConfigLoader({
		projectRoot,
		globalRoot: homedir(),
	});
}

// グローバル（~/.taskp/config.toml）→ プロジェクト（.taskp/config.toml）の順で読み込み、
// プロジェクト設定が優先されるようマージする（git config と同じ戦略）
async function loadConfig(
	globalPath: string,
	projectPath: string,
): Promise<Result<Config, ConfigError>> {
	const globalResult = await loadSingleConfig(globalPath);
	if (!globalResult.ok) {
		return globalResult;
	}

	const projectResult = await loadSingleConfig(projectPath);
	if (!projectResult.ok) {
		return projectResult;
	}

	return ok(mergeConfigs(globalResult.value, projectResult.value));
}

async function loadSingleConfig(path: string): Promise<Result<Config, ConfigError>> {
	// 設定ファイルが存在しないのは正常（デフォルト値で動作する）。
	// ファイルが存在するが内容が不正な場合のみエラーにする
	const raw = await readFile(path, "utf-8").catch(() => undefined);
	if (raw === undefined) {
		return ok({});
	}

	return parseConfig(raw, path);
}

function parseConfig(raw: string, path: string): Result<Config, ConfigError> {
	let parsed: unknown;
	try {
		parsed = parseToml(raw);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return err(configError(`Failed to parse TOML (${path}): ${message}`));
	}

	const result = configSchema.safeParse(parsed);
	if (!result.success) {
		return err(configError(`Invalid config (${path}): ${result.error.message}`));
	}

	return ok(result.data);
}

function mergeConfigs(global: Config, project: Config): Config {
	const globalAi = global.ai;
	const projectAi = project.ai;

	if (globalAi === undefined && projectAi === undefined) {
		return {};
	}
	if (globalAi === undefined) {
		return { ai: projectAi };
	}
	if (projectAi === undefined) {
		return { ai: globalAi };
	}

	return {
		ai: {
			default_provider: projectAi.default_provider ?? globalAi.default_provider,
			default_model: projectAi.default_model ?? globalAi.default_model,
			providers: mergeProviders(globalAi.providers, projectAi.providers),
		},
	};
}

function mergeProviders(
	global: Record<string, ProviderConfig> | undefined,
	project: Record<string, ProviderConfig> | undefined,
): Record<string, ProviderConfig> | undefined {
	if (global === undefined && project === undefined) {
		return undefined;
	}
	if (global === undefined) {
		return project;
	}
	if (project === undefined) {
		return global;
	}

	const merged: Record<string, ProviderConfig> = { ...global };
	for (const [key, value] of Object.entries(project)) {
		merged[key] = global[key] !== undefined ? { ...global[key], ...value } : value;
	}
	return merged;
}
