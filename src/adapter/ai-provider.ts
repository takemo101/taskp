import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { type ConfigError, configError } from "../core/types/errors";
import { err, ok, type Result } from "../core/types/result";
import type { AiConfig, ProviderConfig } from "./config-loader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModelSpec = {
	readonly provider: string;
	readonly model: string;
};

export type ModelSource = {
	readonly cliModel?: string;
	readonly skillModel?: string;
	readonly config: AiConfig;
};

export type ProviderFactory = (
	model: string,
	config: ProviderConfig | undefined,
) => Result<LanguageModelV3, ConfigError>;

export type ProviderRegistry = ReadonlyMap<string, ProviderFactory>;

// ---------------------------------------------------------------------------
// Factory builders
// ---------------------------------------------------------------------------

function createCloudFactory(
	defaultEnvVar: string,
	sdkFactory: (opts: { apiKey: string; baseURL?: string }) => (model: string) => LanguageModelV3,
): ProviderFactory {
	return (model, config) => {
		const apiKey = resolveApiKey(config?.api_key_env, defaultEnvVar);
		if (!apiKey.ok) {
			return apiKey;
		}

		const provider = sdkFactory({
			apiKey: apiKey.value,
			...(config?.base_url !== undefined && { baseURL: config.base_url }),
		});

		return ok(provider(model));
	};
}

type LocalFactoryOptions = {
	readonly useResponsesApi?: boolean;
};

function createLocalFactory(
	defaultBaseUrl?: string,
	options?: LocalFactoryOptions,
): ProviderFactory {
	return (model, config) => {
		const baseUrl = config?.base_url ?? defaultBaseUrl;

		if (baseUrl === undefined) {
			return err(configError("No base_url configured for this provider."));
		}

		// ローカル LLM サーバーは認証不要だが、OpenAI SDK が apiKey 必須のため
		// ダミー値 "local" を渡す
		const apiKey = config?.api_key_env ? (process.env[config.api_key_env] ?? "local") : "local";

		const provider = createOpenAI({ apiKey, baseURL: baseUrl });

		// Responses API をサポートするサーバー（omlx 等）はデフォルト形式を使い、
		// それ以外（ollama, lmstudio 等）は Chat Completions API を使う
		return ok(options?.useResponsesApi ? provider(model) : provider.chat(model));
	};
}

// ---------------------------------------------------------------------------
// Provider Registry Factory
// ---------------------------------------------------------------------------

export function createDefaultProviderRegistry(): ProviderRegistry {
	const registry = new Map<string, ProviderFactory>();

	// Cloud providers
	registry.set(
		"anthropic",
		createCloudFactory("ANTHROPIC_API_KEY", (opts) => {
			const p = createAnthropic(opts);
			return (model) => p(model);
		}),
	);

	registry.set(
		"openai",
		createCloudFactory("OPENAI_API_KEY", (opts) => {
			const p = createOpenAI(opts);
			return (model) => p(model);
		}),
	);

	registry.set(
		"google",
		createCloudFactory("GOOGLE_GENERATIVE_AI_KEY", (opts) => {
			const p = createGoogleGenerativeAI(opts);
			return (model) => p(model);
		}),
	);

	// Ollama はステートレス実装のため item_reference 非対応 → Chat Completions API を使う
	registry.set("ollama", createLocalFactory("http://localhost:11434/v1"));

	// omlx, LM Studio は Responses API (item_reference) をサポート
	registry.set("omlx", createLocalFactory("http://localhost:8000/v1", { useResponsesApi: true }));
	registry.set(
		"lmstudio",
		createLocalFactory("http://localhost:1234/v1", { useResponsesApi: true }),
	);

	return registry;
}

// ---------------------------------------------------------------------------
// Provider Resolution
// ---------------------------------------------------------------------------

function resolveProvider(
	providerName: string,
	model: string,
	providerConfig: ProviderConfig | undefined,
	registry: ProviderRegistry,
): Result<LanguageModelV3, ConfigError> {
	const factory = registry.get(providerName);
	if (factory !== undefined) {
		return factory(model, providerConfig);
	}

	// 未知のプロバイダ名でも base_url があれば OpenAI 互換プロトコルで接続を試みる。
	// LM Studio や vLLM など、OpenAI API 互換のローカルサーバーを
	// 事前登録なしで利用可能にするため
	if (providerConfig?.base_url !== undefined) {
		const useResponsesApi = providerConfig.api_type === "responses";
		return createLocalFactory(undefined, { useResponsesApi })(model, providerConfig);
	}

	const knownNames = [...registry.keys()].join(", ");
	return err(
		configError(
			`Unknown provider: "${providerName}". Built-in: ${knownNames}. ` +
				`For custom OpenAI-compatible servers, set base_url in [ai.providers.${providerName}].`,
		),
	);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// "provider/model" 形式を分割する。スラッシュなしの場合は
// provider を空にして、後段の resolveModelSpec で default_provider を適用させる
export function parseModelSpec(spec: string): Result<ModelSpec, ConfigError> {
	const slashIndex = spec.indexOf("/");
	if (slashIndex === -1) {
		return ok({ provider: "", model: spec });
	}

	const provider = spec.slice(0, slashIndex);
	const model = spec.slice(slashIndex + 1);

	if (provider === "" || model === "") {
		return err(configError(`Invalid model spec: "${spec}". Expected "provider/model" format.`));
	}

	return ok({ provider, model });
}

export function resolveModelSpec(source: ModelSource): Result<ModelSpec, ConfigError> {
	// 1. CLI / スキル指定があればそれを優先
	const explicitSpec = source.cliModel ?? source.skillModel;
	if (explicitSpec !== undefined) {
		return resolveWithProvider(explicitSpec, source);
	}

	// 2. config の default_provider を使用
	const resolvedProvider = source.config.default_provider;

	// 3. 解決された provider の default_model > トップレベル default_model
	const providerDefaultModel = resolvedProvider
		? source.config.providers?.[resolvedProvider]?.default_model
		: undefined;
	const rawSpec = providerDefaultModel ?? source.config.default_model;

	if (rawSpec === undefined) {
		return err(
			configError("No model specified. Set --model, skill model field, or config default_model."),
		);
	}

	return resolveWithProvider(rawSpec, source);
}

function resolveWithProvider(rawSpec: string, source: ModelSource): Result<ModelSpec, ConfigError> {
	const parseResult = parseModelSpec(rawSpec);
	if (!parseResult.ok) {
		return parseResult;
	}

	const { provider, model } = parseResult.value;

	if (provider !== "") {
		return ok({ provider, model });
	}

	const resolvedProvider = source.config.default_provider;
	if (resolvedProvider === undefined) {
		return err(
			configError(
				`Model "${rawSpec}" has no provider prefix. Set default_provider in config or use "provider/model" format.`,
			),
		);
	}

	return ok({ provider: resolvedProvider, model });
}

export function createLanguageModel(
	spec: ModelSpec,
	config: AiConfig,
	registry: ProviderRegistry = createDefaultProviderRegistry(),
): Result<LanguageModelV3, ConfigError> {
	const providerConfig = config.providers?.[spec.provider];
	return resolveProvider(spec.provider, spec.model, providerConfig, registry);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveApiKey(
	envVarName: string | undefined,
	defaultEnvVar: string,
): Result<string, ConfigError> {
	const envName = envVarName ?? defaultEnvVar;
	const value = process.env[envName];

	if (value === undefined || value === "") {
		return err(configError(`API key not found. Set the ${envName} environment variable.`));
	}

	return ok(value);
}
