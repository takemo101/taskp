import { APICallError } from "@ai-sdk/provider";
import { type ExecutionError, executionError } from "../core/types/errors";

export type AgentErrorCategory =
	| "rate_limit"
	| "api_key_missing"
	| "ollama_not_running"
	| "ollama_model_missing"
	| "network"
	| "fatal";

export type ClassifiedError = {
	readonly category: AgentErrorCategory;
	readonly message: string;
	readonly retryable: boolean;
};

// エラーをカテゴリ分類することで、リトライ可否の判定と
// ユーザーへの具体的な対処法メッセージの出し分けを実現する
export function classifyAgentError(error: unknown, provider: string): ClassifiedError {
	if (APICallError.isInstance(error)) {
		return classifyApiCallError(error, provider);
	}

	if (isNetworkError(error)) {
		if (provider === "ollama") {
			return {
				category: "ollama_not_running",
				message: "Ollama is not running. Start it with:\n\n  ollama serve\n",
				retryable: false,
			};
		}
		return {
			category: "network",
			message: "Network error: unable to reach the API server. Check your internet connection.",
			retryable: true,
		};
	}

	return {
		category: "fatal",
		message: error instanceof Error ? error.message : String(error),
		retryable: false,
	};
}

function classifyApiCallError(error: APICallError, provider: string): ClassifiedError {
	const status = error.statusCode;

	if (status === 401 || status === 403) {
		return {
			category: "api_key_missing",
			message: buildApiKeyMessage(provider),
			retryable: false,
		};
	}

	if (status === 429) {
		return {
			category: "rate_limit",
			message: "Rate limited by the API. Retrying with exponential backoff...",
			retryable: true,
		};
	}

	if (provider === "ollama" && status === 404) {
		const model = extractOllamaModelFromError(error);
		return {
			category: "ollama_model_missing",
			message: `Model not found. Download it with:\n\n  ollama pull ${model}\n`,
			retryable: false,
		};
	}

	if (status !== undefined && status >= 500) {
		return {
			category: "network",
			message: `Server error (${status}). Retrying...`,
			retryable: true,
		};
	}

	return {
		category: "fatal",
		message: error.message,
		retryable: false,
	};
}

function isNetworkError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;

	// Node.js のネットワークエラーは error.cause.code に格納されることが多いが、
	// undici（fetch 内部）は UND_ERR_* 形式の独自コードを使うため両方チェックする
	const networkCodes = [
		"ECONNREFUSED",
		"ECONNRESET",
		"ETIMEDOUT",
		"ENOTFOUND",
		"UND_ERR_CONNECT_TIMEOUT",
	];
	const cause = (error as { cause?: { code?: string } }).cause;
	if (cause?.code !== undefined && networkCodes.includes(cause.code)) {
		return true;
	}

	const code = (error as { code?: string }).code;
	if (code !== undefined && networkCodes.includes(code)) {
		return true;
	}

	return false;
}

const API_KEY_ENV_VARS: Record<string, string> = {
	anthropic: "ANTHROPIC_API_KEY",
	openai: "OPENAI_API_KEY",
	google: "GOOGLE_GENERATIVE_AI_KEY",
};

function buildApiKeyMessage(provider: string): string {
	const envVar = API_KEY_ENV_VARS[provider];
	if (envVar === undefined) {
		return `API key is invalid or missing for provider "${provider}".`;
	}
	return `API key is invalid or missing. Set the ${envVar} environment variable:\n\n  export ${envVar}=your-api-key\n`;
}

function extractOllamaModelFromError(error: APICallError): string {
	const body = error.responseBody;
	if (body !== undefined) {
		try {
			const parsed = JSON.parse(body) as { error?: string };
			const match = parsed.error?.match(/model ['"]?([^'"]+)['"]? not found/);
			if (match?.[1] !== undefined) {
				return match[1];
			}
		} catch {
			// ignore parse failure
		}
	}
	return "<model>";
}

export function toExecutionError(classified: ClassifiedError): ExecutionError {
	return executionError(classified.message);
}

export function isRetryableAgentError(error: unknown, provider: string): boolean {
	return classifyAgentError(error, provider).retryable;
}
