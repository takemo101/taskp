import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { type ConfigError, configError } from "../core/types/errors";
import { err, ok, type Result } from "../core/types/result";
import type { AiConfig, ProviderConfig } from "./config-loader";

const KNOWN_PROVIDERS = ["anthropic", "openai", "google", "ollama"] as const;

export type ModelSpec = {
	readonly provider: string;
	readonly model: string;
};

export type ModelSource = {
	readonly cliModel?: string;
	readonly skillModel?: string;
	readonly config: AiConfig;
};

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
	return createModelForProvider(spec.provider, spec.model, providerConfig);
}

function createModelForProvider(
	providerName: string,
	model: string,
	providerConfig: ProviderConfig | undefined,
): Result<LanguageModelV3, ConfigError> {
	switch (providerName) {
		case "anthropic":
			return createAnthropicModel(model, providerConfig);
		case "openai":
			return createOpenAIModel(model, providerConfig);
		case "google":
			return createGoogleModel(model, providerConfig);
		case "ollama":
			return createOllamaModel(model, providerConfig);
		default:
			return err(
				configError(
					`Unknown provider: "${providerName}". Supported: ${KNOWN_PROVIDERS.join(", ")}.`,
				),
			);
	}
}

function createAnthropicModel(
	model: string,
	config: ProviderConfig | undefined,
): Result<LanguageModelV3, ConfigError> {
	const apiKey = resolveApiKey(config?.api_key_env, "ANTHROPIC_API_KEY");
	if (!apiKey.ok) {
		return apiKey;
	}

	const provider = createAnthropic({
		apiKey: apiKey.value,
		...(config?.base_url !== undefined && { baseURL: config.base_url }),
	});

	return ok(provider(model));
}

function createOpenAIModel(
	model: string,
	config: ProviderConfig | undefined,
): Result<LanguageModelV3, ConfigError> {
	const apiKey = resolveApiKey(config?.api_key_env, "OPENAI_API_KEY");
	if (!apiKey.ok) {
		return apiKey;
	}

	const provider = createOpenAI({
		apiKey: apiKey.value,
		...(config?.base_url !== undefined && { baseURL: config.base_url }),
	});

	return ok(provider(model));
}

function createGoogleModel(
	model: string,
	config: ProviderConfig | undefined,
): Result<LanguageModelV3, ConfigError> {
	const apiKey = resolveApiKey(config?.api_key_env, "GOOGLE_GENERATIVE_AI_KEY");
	if (!apiKey.ok) {
		return apiKey;
	}

	const provider = createGoogleGenerativeAI({
		apiKey: apiKey.value,
		...(config?.base_url !== undefined && { baseURL: config.base_url }),
	});

	return ok(provider(model));
}

function createOllamaModel(
	model: string,
	config: ProviderConfig | undefined,
): Result<LanguageModelV3, ConfigError> {
	const baseUrl = config?.base_url ?? "http://localhost:11434/v1";

	const provider = createOpenAI({
		apiKey: "ollama",
		baseURL: baseUrl,
	});

	return ok(provider(model));
}

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
