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

const stdioServerSchema = z.object({
	transport: z.literal("stdio"),
	command: z.string().min(1).describe("Command to execute"),
	args: z.array(z.string()).optional().describe("Command arguments"),
	env: z.record(z.string(), z.string()).optional().describe("Environment variable names to pass"),
});

const httpServerSchema = z.object({
	transport: z.literal("http"),
	url: z.string().url().describe("HTTP endpoint URL"),
	headers_env: z
		.record(z.string(), z.string())
		.optional()
		.describe("Environment variable names for HTTP headers"),
});

const sseServerSchema = z.object({
	transport: z.literal("sse"),
	url: z.string().url().describe("SSE endpoint URL"),
	headers_env: z
		.record(z.string(), z.string())
		.optional()
		.describe("Environment variable names for HTTP headers"),
});

export const mcpServerConfigSchema = z.discriminatedUnion("transport", [
	stdioServerSchema,
	httpServerSchema,
	sseServerSchema,
]);

export const mcpConfigSchema = z.object({
	servers: z
		.record(z.string(), mcpServerConfigSchema)
		.optional()
		.describe("MCP server definitions keyed by server name"),
});

export const cliConfigSchema = z.object({
	command_timeout_ms: z
		.number()
		.int()
		.positive()
		.optional()
		.describe("Default timeout for command execution in milliseconds"),
	max_agent_steps: z
		.number()
		.int()
		.min(1)
		.max(200)
		.optional()
		.describe("Maximum number of agent loop steps (1–200, default: 50)"),
});

export const configSchema = z.object({
	ai: aiConfigSchema.optional().describe("AI/LLM settings"),
	hooks: hooksConfigSchema.optional().describe("Lifecycle hooks"),
	cli: cliConfigSchema.optional().describe("CLI behavior settings"),
	mcp: mcpConfigSchema.optional().describe("MCP server settings"),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type AiConfig = z.infer<typeof aiConfigSchema>;
export type HooksConfig = z.infer<typeof hooksConfigSchema>;
export type CliConfig = z.infer<typeof cliConfigSchema>;
export type McpServerConfig = z.infer<typeof mcpServerConfigSchema>;
export type McpConfig = z.infer<typeof mcpConfigSchema>;
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

function mergeByProjectPriority<T extends Record<string, unknown>>(global: T, project: T): T {
	const result = { ...global };
	for (const key of Object.keys(project) as (keyof T)[]) {
		if (project[key] !== undefined) {
			result[key] = project[key];
		}
	}
	return result;
}

export function mergeAiConfig(global: AiConfig, project: AiConfig): AiConfig {
	return {
		...mergeByProjectPriority(global, project),
		providers: mergeOptional(global.providers, project.providers, mergeProviders),
	};
}

export function mergeHooksConfig(global: HooksConfig, project: HooksConfig): HooksConfig {
	return mergeByProjectPriority(global, project);
}

export function mergeCliConfig(global: CliConfig, project: CliConfig): CliConfig {
	return mergeByProjectPriority(global, project);
}

// 同名サーバーは project 側が丸ごと上書き（フィールド単位マージしない）
export function mergeMcpConfig(global: McpConfig, project: McpConfig): McpConfig {
	return {
		servers: mergeOptional(global.servers, project.servers, (g, p) => ({ ...g, ...p })),
	};
}

function mergeConfigs(global: Config, project: Config): Config {
	return {
		ai: mergeOptional(global.ai, project.ai, mergeAiConfig),
		hooks: mergeOptional(global.hooks, project.hooks, mergeHooksConfig),
		cli: mergeOptional(global.cli, project.cli, mergeCliConfig),
		mcp: mergeOptional(global.mcp, project.mcp, mergeMcpConfig),
	};
}
