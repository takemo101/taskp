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

type ProviderFactory = (
	model: string,
	config: ProviderConfig | undefined,
) => Result<LanguageModelV3, ConfigError>;

// ---------------------------------------------------------------------------
// Provider Registry
// ---------------------------------------------------------------------------

const providerRegistry = new Map<string, ProviderFactory>();

function registerProvider(name: string, factory: ProviderFactory): void {
	providerRegistry.set(name, factory);
}

function resolveProvider(
	providerName: string,
	model: string,
	providerConfig: ProviderConfig | undefined,
): Result<LanguageModelV3, ConfigError> {
	const factory = providerRegistry.get(providerName);
	if (factory !== undefined) {
		return factory(model, providerConfig);
	}

	// 未知のプロバイダ名でも base_url があれば OpenAI 互換プロトコルで接続を試みる。
	// LM Studio や vLLM など、OpenAI API 互換のローカルサーバーを
	// 事前登録なしで利用可能にするため
	if (providerConfig?.base_url !== undefined) {
		return createLocalFactory()(model, providerConfig);
	}

	const knownNames = [...providerRegistry.keys()].join(", ");
	return err(
		configError(
			`Unknown provider: "${providerName}". Built-in: ${knownNames}. ` +
				`For custom OpenAI-compatible servers, set base_url in [ai.providers.${providerName}].`,
		),
	);
}

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

function createLocalFactory(defaultBaseUrl?: string): ProviderFactory {
	return (model, config) => {
		const baseUrl = config?.base_url ?? defaultBaseUrl;

		if (baseUrl === undefined) {
			return err(configError("No base_url configured for this provider."));
		}

		// ローカル LLM サーバーは認証不要だが、OpenAI SDK が apiKey 必須のため
		// ダミー値 "local" を渡す
		const apiKey = config?.api_key_env ? (process.env[config.api_key_env] ?? "local") : "local";

		const provider = createOpenAI({ apiKey, baseURL: baseUrl });
		return ok(provider(model));
	};
}

// ---------------------------------------------------------------------------
// Built-in provider registration
// ---------------------------------------------------------------------------

// Cloud providers
registerProvider(
	"anthropic",
	createCloudFactory("ANTHROPIC_API_KEY", (opts) => {
		const p = createAnthropic(opts);
		return (model) => p(model);
	}),
);

registerProvider(
	"openai",
	createCloudFactory("OPENAI_API_KEY", (opts) => {
		const p = createOpenAI(opts);
		return (model) => p(model);
	}),
);

registerProvider(
	"google",
	createCloudFactory("GOOGLE_GENERATIVE_AI_KEY", (opts) => {
		const p = createGoogleGenerativeAI(opts);
		return (model) => p(model);
	}),
);

// Local providers (OpenAI-compatible)
registerProvider("ollama", createLocalFactory("http://localhost:11434/v1"));
registerProvider("omlx", createLocalFactory("http://localhost:8000/v1"));
registerProvider("lmstudio", createLocalFactory("http://localhost:1234/v1"));

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
	const rawSpec = source.cliModel ?? source.skillModel ?? source.config.default_model;

	if (rawSpec === undefined) {
		return err(
			configError("No model specified. Set --model, skill model field, or config default_model."),
		);
	}

	const parseResult = parseModelSpec(rawSpec);
	if (!parseResult.ok) {
		return parseResult;
	}

	const { provider, model } = parseResult.value;

	if (provider !== "") {
		return ok({ provider, model });
	}

	const defaultProvider = source.config.default_provider;
	if (defaultProvider === undefined) {
		return err(
			configError(
				`Model "${rawSpec}" has no provider prefix. Set default_provider in config or use "provider/model" format.`,
			),
		);
	}

	return ok({ provider: defaultProvider, model });
}

export function createLanguageModel(
	spec: ModelSpec,
	config: AiConfig,
): Result<LanguageModelV3, ConfigError> {
	const providerConfig = config.providers?.[spec.provider];
	return resolveProvider(spec.provider, spec.model, providerConfig);
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
