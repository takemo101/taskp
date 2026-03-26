import { APICallError } from "@ai-sdk/provider";
import { type ExecutionError, executionError } from "../core/types/errors";
import { ErrorMessages } from "./error-messages";

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

// 各分類器は自身が処理できるエラーに対して ClassifiedError を返し、
// 処理できない場合は undefined を返して次の分類器に委譲する
export type ErrorClassifier = (error: unknown, provider: string) => ClassifiedError | undefined;

function classifyApiKeyError(error: unknown, provider: string): ClassifiedError | undefined {
	if (!APICallError.isInstance(error)) return undefined;
	const status = error.statusCode;
	if (status !== 401 && status !== 403) return undefined;

	return {
		category: "api_key_missing",
		message: buildApiKeyMessage(provider),
		retryable: false,
	};
}

function classifyRateLimitError(error: unknown): ClassifiedError | undefined {
	if (!APICallError.isInstance(error)) return undefined;
	if (error.statusCode !== 429) return undefined;

	return {
		category: "rate_limit",
		message: ErrorMessages.RATE_LIMITED,
		retryable: true,
	};
}

function classifyOllamaModelMissing(error: unknown, provider: string): ClassifiedError | undefined {
	if (provider !== "ollama") return undefined;
	if (!APICallError.isInstance(error)) return undefined;
	if (error.statusCode !== 404) return undefined;

	const model = extractOllamaModelFromError(error);
	return {
		category: "ollama_model_missing",
		message: ErrorMessages.ollamaModelMissing(model),
		retryable: false,
	};
}

function classifyServerError(error: unknown): ClassifiedError | undefined {
	if (!APICallError.isInstance(error)) return undefined;
	const status = error.statusCode;
	if (status === undefined || status < 500) return undefined;

	return {
		category: "network",
		message: ErrorMessages.serverError(status),
		retryable: true,
	};
}

function classifyOllamaNotRunning(error: unknown, provider: string): ClassifiedError | undefined {
	if (provider !== "ollama") return undefined;
	if (!isNetworkError(error)) return undefined;

	return {
		category: "ollama_not_running",
		message: ErrorMessages.OLLAMA_NOT_RUNNING,
		retryable: false,
	};
}

function classifyNetworkError(error: unknown): ClassifiedError | undefined {
	if (!isNetworkError(error)) return undefined;

	return {
		category: "network",
		message: ErrorMessages.NETWORK_ERROR,
		retryable: true,
	};
}

function classifyFatalError(error: unknown): ClassifiedError {
	return {
		category: "fatal",
		message: error instanceof Error ? error.message : String(error),
		retryable: false,
	};
}

// 分類器チェーン: 先頭から順に試行し、最初にマッチした結果を返す
// 新しいエラー型の追加はこの配列に分類器を追加するだけでよい
const classifierChain: readonly ErrorClassifier[] = [
	classifyApiKeyError,
	classifyRateLimitError,
	classifyOllamaModelMissing,
	classifyServerError,
	classifyOllamaNotRunning,
	classifyNetworkError,
];

// エラーをカテゴリ分類することで、リトライ可否の判定と
// ユーザーへの具体的な対処法メッセージの出し分けを実現する
export function classifyAgentError(error: unknown, provider: string): ClassifiedError {
	for (const classifier of classifierChain) {
		const result = classifier(error, provider);
		if (result !== undefined) {
			return result;
		}
	}
	return classifyFatalError(error);
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
	if (hasCauseWithCode(error, networkCodes)) {
		return true;
	}

	if (hasCode(error, networkCodes)) {
		return true;
	}

	return false;
}

function hasCauseWithCode(error: Error, codes: readonly string[]): boolean {
	const { cause } = error;
	if (typeof cause !== "object" || cause === null) return false;
	if (!("code" in cause) || typeof cause.code !== "string") return false;
	return codes.includes(cause.code);
}

function hasCode(error: Error, codes: readonly string[]): boolean {
	if (!("code" in error) || typeof error.code !== "string") return false;
	return codes.includes(error.code);
}

const API_KEY_ENV_VARS: Record<string, string> = {
	anthropic: "ANTHROPIC_API_KEY",
	openai: "OPENAI_API_KEY",
	google: "GOOGLE_GENERATIVE_AI_KEY",
};

function buildApiKeyMessage(provider: string): string {
	const envVar = API_KEY_ENV_VARS[provider];
	if (envVar === undefined) {
		return ErrorMessages.apiKeyMissingGeneric(provider);
	}
	return ErrorMessages.apiKeyMissingWithEnv(envVar);
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
