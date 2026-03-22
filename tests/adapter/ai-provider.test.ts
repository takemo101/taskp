import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	createLanguageModel,
	parseModelSpec,
	resolveModelSpec,
} from "../../src/adapter/ai-provider";
import type { AiConfig } from "../../src/adapter/config-loader";

describe("parseModelSpec", () => {
	it("parses provider/model format", () => {
		const result = parseModelSpec("anthropic/claude-sonnet-4-20250514");

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ provider: "anthropic", model: "claude-sonnet-4-20250514" });
	});

	it("returns empty provider for model-only format", () => {
		const result = parseModelSpec("claude-sonnet-4-20250514");

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ provider: "", model: "claude-sonnet-4-20250514" });
	});

	it("handles ollama model with tag", () => {
		const result = parseModelSpec("ollama/qwen2.5-coder:32b");

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ provider: "ollama", model: "qwen2.5-coder:32b" });
	});

	it("returns error for empty provider", () => {
		const result = parseModelSpec("/model");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("CONFIG_ERROR");
		expect(result.error.message).toContain("Invalid model spec");
	});

	it("returns error for empty model", () => {
		const result = parseModelSpec("provider/");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("CONFIG_ERROR");
	});
});

describe("resolveModelSpec", () => {
	it("prioritizes CLI model over skill and config", () => {
		const result = resolveModelSpec({
			cliModel: "anthropic/claude-sonnet-4-20250514",
			skillModel: "openai/gpt-4o",
			config: { default_model: "google/gemini-pro" },
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ provider: "anthropic", model: "claude-sonnet-4-20250514" });
	});

	it("falls back to skill model when CLI not provided", () => {
		const result = resolveModelSpec({
			skillModel: "openai/gpt-4o",
			config: { default_model: "google/gemini-pro" },
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ provider: "openai", model: "gpt-4o" });
	});

	it("falls back to config default_model when CLI and skill not provided", () => {
		const result = resolveModelSpec({
			config: { default_model: "google/gemini-pro" },
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ provider: "google", model: "gemini-pro" });
	});

	it("uses config default_provider for model without provider prefix", () => {
		const result = resolveModelSpec({
			cliModel: "claude-sonnet-4-20250514",
			config: { default_provider: "anthropic" },
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ provider: "anthropic", model: "claude-sonnet-4-20250514" });
	});

	it("returns error when no model specified anywhere", () => {
		const result = resolveModelSpec({ config: {} });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("CONFIG_ERROR");
		expect(result.error.message).toContain("No model specified");
	});

	it("uses provider-specific default_model for config default_provider", () => {
		const result = resolveModelSpec({
			config: {
				default_provider: "ollama",
				default_model: "global-model",
				providers: {
					ollama: { default_model: "qwen3.5:9b" },
				},
			},
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ provider: "ollama", model: "qwen3.5:9b" });
	});

	it("falls back to top-level default_model when provider has no default_model", () => {
		const result = resolveModelSpec({
			config: {
				default_provider: "ollama",
				default_model: "global-model",
				providers: {
					ollama: { base_url: "http://localhost:11434/v1" },
				},
			},
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ provider: "ollama", model: "global-model" });
	});

	it("returns error when model has no provider and no default_provider", () => {
		const result = resolveModelSpec({
			cliModel: "claude-sonnet-4-20250514",
			config: {},
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("CONFIG_ERROR");
		expect(result.error.message).toContain("no provider prefix");
	});
});

describe("createLanguageModel", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
		process.env.OPENAI_API_KEY = "test-openai-key";
		process.env.GOOGLE_GENERATIVE_AI_KEY = "test-google-key";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("creates anthropic model", () => {
		const config: AiConfig = {
			providers: {
				anthropic: { api_key_env: "ANTHROPIC_API_KEY" },
			},
		};

		const result = createLanguageModel(
			{ provider: "anthropic", model: "claude-sonnet-4-20250514" },
			config,
		);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("claude-sonnet-4-20250514");
	});

	it("creates openai model", () => {
		const config: AiConfig = {
			providers: {
				openai: { api_key_env: "OPENAI_API_KEY" },
			},
		};

		const result = createLanguageModel({ provider: "openai", model: "gpt-4o" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("gpt-4o");
	});

	it("creates google model", () => {
		const config: AiConfig = {
			providers: {
				google: { api_key_env: "GOOGLE_GENERATIVE_AI_KEY" },
			},
		};

		const result = createLanguageModel({ provider: "google", model: "gemini-pro" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("gemini-pro");
	});

	it("creates ollama model with default base URL", () => {
		const config: AiConfig = {};

		const result = createLanguageModel({ provider: "ollama", model: "qwen2.5-coder:32b" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("qwen2.5-coder:32b");
	});

	it("creates ollama model with custom base URL", () => {
		const config: AiConfig = {
			providers: {
				ollama: { base_url: "http://custom:11434/v1" },
			},
		};

		const result = createLanguageModel({ provider: "ollama", model: "llama3" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("llama3");
	});

	it("creates omlx model with default base URL", () => {
		const config: AiConfig = {};

		const result = createLanguageModel({ provider: "omlx", model: "qwen2.5-coder:32b" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("qwen2.5-coder:32b");
	});

	it("creates omlx model with custom base URL", () => {
		const config: AiConfig = {
			providers: {
				omlx: { base_url: "http://custom:8000/v1" },
			},
		};

		const result = createLanguageModel({ provider: "omlx", model: "llama3" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("llama3");
	});

	it("creates lmstudio model with default base URL", () => {
		const config: AiConfig = {};

		const result = createLanguageModel({ provider: "lmstudio", model: "deepseek-r1" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("deepseek-r1");
	});

	it("creates custom openai-compatible provider with base_url in config", () => {
		const config: AiConfig = {
			providers: {
				"my-server": { base_url: "http://192.168.1.100:8080/v1" },
			},
		};

		const result = createLanguageModel({ provider: "my-server", model: "llama3" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("llama3");
		// デフォルトは Chat Completions API（openai.chat）
		expect(result.value.provider).toBe("openai.chat");
	});

	it("creates custom provider with api_type 'responses' using Responses API", () => {
		const config: AiConfig = {
			providers: {
				"my-server": { base_url: "http://192.168.1.100:8080/v1", api_type: "responses" },
			},
		};

		const result = createLanguageModel({ provider: "my-server", model: "gpt-4o" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("gpt-4o");
		// Responses API は openai.responses
		expect(result.value.provider).toBe("openai.responses");
	});

	it("creates custom provider with api_type 'chat' using Chat Completions API", () => {
		const config: AiConfig = {
			providers: {
				"my-server": { base_url: "http://192.168.1.100:8080/v1", api_type: "chat" },
			},
		};

		const result = createLanguageModel({ provider: "my-server", model: "llama3" }, config);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.modelId).toBe("llama3");
		expect(result.value.provider).toBe("openai.chat");
	});

	it("returns error for unknown provider without base_url", () => {
		const result = createLanguageModel({ provider: "unknown", model: "some-model" }, {});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("CONFIG_ERROR");
		expect(result.error.message).toContain("Unknown provider");
		expect(result.error.message).toContain("unknown");
		expect(result.error.message).toContain("base_url");
	});

	it("returns error when API key is missing", () => {
		delete process.env.ANTHROPIC_API_KEY;

		const result = createLanguageModel(
			{ provider: "anthropic", model: "claude-sonnet-4-20250514" },
			{},
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("CONFIG_ERROR");
		expect(result.error.message).toContain("ANTHROPIC_API_KEY");
	});

	it("uses custom api_key_env from provider config", () => {
		process.env.MY_CUSTOM_KEY = "custom-key";
		const config: AiConfig = {
			providers: {
				anthropic: { api_key_env: "MY_CUSTOM_KEY" },
			},
		};

		const result = createLanguageModel(
			{ provider: "anthropic", model: "claude-sonnet-4-20250514" },
			config,
		);

		expect(result.ok).toBe(true);
		delete process.env.MY_CUSTOM_KEY;
	});
});
