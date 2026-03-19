import { APICallError } from "@ai-sdk/provider";
import { describe, expect, it } from "vitest";
import {
	classifyAgentError,
	isRetryableAgentError,
	toExecutionError,
} from "../../src/adapter/agent-error-handler";

function makeApiCallError(options: {
	statusCode?: number;
	message?: string;
	responseBody?: string;
}): APICallError {
	return new APICallError({
		message: options.message ?? "API error",
		url: "https://api.example.com/v1/chat",
		requestBodyValues: {},
		statusCode: options.statusCode,
		responseBody: options.responseBody,
	});
}

describe("classifyAgentError", () => {
	describe("rate limit", () => {
		it("classifies 429 as rate_limit", () => {
			const error = makeApiCallError({ statusCode: 429 });
			const result = classifyAgentError(error, "anthropic");

			expect(result.category).toBe("rate_limit");
			expect(result.retryable).toBe(true);
		});
	});

	describe("API key missing", () => {
		it("classifies 401 as api_key_missing", () => {
			const error = makeApiCallError({ statusCode: 401 });
			const result = classifyAgentError(error, "anthropic");

			expect(result.category).toBe("api_key_missing");
			expect(result.message).toContain("ANTHROPIC_API_KEY");
			expect(result.retryable).toBe(false);
		});

		it("classifies 403 as api_key_missing", () => {
			const error = makeApiCallError({ statusCode: 403 });
			const result = classifyAgentError(error, "openai");

			expect(result.category).toBe("api_key_missing");
			expect(result.message).toContain("OPENAI_API_KEY");
			expect(result.retryable).toBe(false);
		});

		it("shows google env var for google provider", () => {
			const error = makeApiCallError({ statusCode: 401 });
			const result = classifyAgentError(error, "google");

			expect(result.message).toContain("GOOGLE_GENERATIVE_AI_KEY");
		});

		it("shows generic message for unknown provider", () => {
			const error = makeApiCallError({ statusCode: 401 });
			const result = classifyAgentError(error, "custom");

			expect(result.message).toContain("custom");
		});
	});

	describe("Ollama not running", () => {
		it("classifies ECONNREFUSED as ollama_not_running for ollama provider", () => {
			const error = new Error("fetch failed");
			(error as { cause?: unknown }).cause = { code: "ECONNREFUSED" };
			const result = classifyAgentError(error, "ollama");

			expect(result.category).toBe("ollama_not_running");
			expect(result.message).toContain("ollama serve");
			expect(result.retryable).toBe(false);
		});

		it("classifies ECONNREFUSED as network error for non-ollama", () => {
			const error = new Error("fetch failed");
			(error as { cause?: unknown }).cause = { code: "ECONNREFUSED" };
			const result = classifyAgentError(error, "anthropic");

			expect(result.category).toBe("network");
			expect(result.retryable).toBe(true);
		});
	});

	describe("Ollama model missing", () => {
		it("classifies 404 with model name as ollama_model_missing", () => {
			const error = makeApiCallError({
				statusCode: 404,
				responseBody: JSON.stringify({ error: "model 'llama3' not found" }),
			});
			const result = classifyAgentError(error, "ollama");

			expect(result.category).toBe("ollama_model_missing");
			expect(result.message).toContain("ollama pull llama3");
			expect(result.retryable).toBe(false);
		});

		it("uses placeholder when model name cannot be extracted", () => {
			const error = makeApiCallError({
				statusCode: 404,
				responseBody: "not json",
			});
			const result = classifyAgentError(error, "ollama");

			expect(result.category).toBe("ollama_model_missing");
			expect(result.message).toContain("ollama pull <model>");
		});
	});

	describe("network errors", () => {
		it("classifies ETIMEDOUT as network error", () => {
			const error = new Error("timeout");
			(error as { cause?: unknown }).cause = { code: "ETIMEDOUT" };
			const result = classifyAgentError(error, "openai");

			expect(result.category).toBe("network");
			expect(result.retryable).toBe(true);
		});

		it("classifies ENOTFOUND as network error", () => {
			const error = new Error("dns failed");
			(error as { cause?: unknown }).cause = { code: "ENOTFOUND" };
			const result = classifyAgentError(error, "anthropic");

			expect(result.category).toBe("network");
			expect(result.retryable).toBe(true);
		});
	});

	describe("server errors", () => {
		it("classifies 500 as retryable network error", () => {
			const error = makeApiCallError({ statusCode: 500 });
			const result = classifyAgentError(error, "anthropic");

			expect(result.category).toBe("network");
			expect(result.retryable).toBe(true);
		});

		it("classifies 503 as retryable network error", () => {
			const error = makeApiCallError({ statusCode: 503 });
			const result = classifyAgentError(error, "openai");

			expect(result.category).toBe("network");
			expect(result.retryable).toBe(true);
		});
	});

	describe("fatal errors", () => {
		it("classifies unknown errors as fatal", () => {
			const error = new Error("something went wrong");
			const result = classifyAgentError(error, "anthropic");

			expect(result.category).toBe("fatal");
			expect(result.retryable).toBe(false);
		});

		it("handles non-Error values", () => {
			const result = classifyAgentError("string error", "anthropic");

			expect(result.category).toBe("fatal");
			expect(result.message).toBe("string error");
		});
	});
});

describe("isRetryableAgentError", () => {
	it("returns true for retryable errors", () => {
		const error = makeApiCallError({ statusCode: 429 });
		expect(isRetryableAgentError(error, "anthropic")).toBe(true);
	});

	it("returns false for non-retryable errors", () => {
		const error = makeApiCallError({ statusCode: 401 });
		expect(isRetryableAgentError(error, "anthropic")).toBe(false);
	});
});

describe("toExecutionError", () => {
	it("converts classified error to ExecutionError", () => {
		const classified = classifyAgentError(makeApiCallError({ statusCode: 429 }), "anthropic");
		const execError = toExecutionError(classified);

		expect(execError.type).toBe("EXECUTION_ERROR");
		expect(execError.message).toBe(classified.message);
	});
});
