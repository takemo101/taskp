import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { parse as parseToml } from "smol-toml";
import { z } from "zod";
import { type ConfigError, configError } from "../core/types/errors";
import { err, ok, type Result } from "../core/types/result";
import { tryCatchSync } from "./error-handler-utils";

const CONFIG_PATH = ".taskp/config.toml";

export const providerConfigSchema = z.object({
	api_key_env: z.string().min(1).optional().describe("Environment variable name for API key"),
	base_url: z.string().min(1).optional().describe("Custom endpoint URL"),
	default_model: z.string().min(1).optional().describe("Default model for this provider"),
	api_type: z
		.enum(["chat", "responses"])
		.optional()
		.describe(
			"API type for custom OpenAI-compatible providers: 'chat' (Chat Completions API, default) or 'responses' (Responses API)",
		),
});

export const aiConfigSchema = z.object({
	default_provider: z
		.string()
		.min(1)
		.optional()
		.describe("Default provider (anthropic | openai | google | ollama | omlx | lmstudio)"),
	default_model: z.string().min(1).optional().describe("Default model name"),
	providers: z
		.record(z.string(), providerConfigSchema)
		.optional()
		.describe("Per-provider settings"),
});

export const hooksConfigSchema = z.object({
	on_success: z.array(z.string().min(1)).optional().describe("Commands to run on skill success"),
	on_failure: z.array(z.string().min(1)).optional().describe("Commands to run on skill failure"),
});

export const cliConfigSchema = z.object({
	command_timeout_ms: z
		.number()
		.int()
		.positive()
		.optional()
		.describe("Default timeout for command execution in milliseconds"),
});

export const configSchema = z.object({
	ai: aiConfigSchema.optional().describe("AI/LLM settings"),
	hooks: hooksConfigSchema.optional().describe("Lifecycle hooks"),
	cli: cliConfigSchema.optional().describe("CLI behavior settings"),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type AiConfig = z.infer<typeof aiConfigSchema>;
export type HooksConfig = z.infer<typeof hooksConfigSchema>;
export type CliConfig = z.infer<typeof cliConfigSchema>;
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
	const parseResult = tryCatchSync(
		() => parseToml(raw),
		(e) => configError(`Failed to parse TOML (${path}): ${e.message}`),
	);
	if (!parseResult.ok) return parseResult;

	const result = configSchema.safeParse(parseResult.value);
	if (!result.success) {
		return err(configError(`Invalid config (${path}): ${result.error.message}`));
	}

	return ok(result.data);
}

export function mergeOptional<T>(
	global: T | undefined,
	project: T | undefined,
	merge: (g: T, p: T) => T,
): T | undefined {
	if (global === undefined && project === undefined) return undefined;
	if (global === undefined) return project;
	if (project === undefined) return global;
	return merge(global, project);
}

export function mergeProviders(
	global: Record<string, ProviderConfig>,
	project: Record<string, ProviderConfig>,
): Record<string, ProviderConfig> {
	const merged: Record<string, ProviderConfig> = { ...global };
	for (const [key, value] of Object.entries(project)) {
		merged[key] = global[key] !== undefined ? { ...global[key], ...value } : value;
	}
	return merged;
}

export function mergeAiConfig(global: AiConfig, project: AiConfig): AiConfig {
	return {
		default_provider: project.default_provider ?? global.default_provider,
		default_model: project.default_model ?? global.default_model,
		providers: mergeOptional(global.providers, project.providers, mergeProviders),
	};
}

export function mergeHooksConfig(global: HooksConfig, project: HooksConfig): HooksConfig {
	return {
		on_success: project.on_success ?? global.on_success,
		on_failure: project.on_failure ?? global.on_failure,
	};
}

export function mergeCliConfig(global: CliConfig, project: CliConfig): CliConfig {
	return {
		command_timeout_ms: project.command_timeout_ms ?? global.command_timeout_ms,
	};
}

function mergeConfigs(global: Config, project: Config): Config {
	return {
		ai: mergeOptional(global.ai, project.ai, mergeAiConfig),
		hooks: mergeOptional(global.hooks, project.hooks, mergeHooksConfig),
		cli: mergeOptional(global.cli, project.cli, mergeCliConfig),
	};
}
