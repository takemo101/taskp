import { type ExecutionError, executionError } from "../core/types/errors";
import { err, ok, type Result } from "../core/types/result";

export type RetryConfig = {
	readonly maxRetries: number;
	readonly baseDelayMs: number;
	readonly maxDelayMs: number;
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	baseDelayMs: 1000,
	maxDelayMs: 30000,
};

export function calculateDelay(attempt: number, config: RetryConfig): number {
	const delay = config.baseDelayMs * 2 ** attempt;
	return Math.min(delay, config.maxDelayMs);
}

export async function withRetry<T>(
	fn: () => Promise<T>,
	isRetryable: (error: unknown) => boolean,
	config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<Result<T, ExecutionError>> {
	let lastError: unknown;

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		try {
			const result = await fn();
			return ok(result);
		} catch (error) {
			lastError = error;

			if (!isRetryable(error)) {
				return err(executionError(formatError(error)));
			}

			if (attempt < config.maxRetries) {
				const delay = calculateDelay(attempt, config);
				await sleep(delay);
			}
		}
	}

	return err(
		executionError(
			`Max retries (${config.maxRetries}) exceeded. Last error: ${formatError(lastError)}`,
		),
	);
}

function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
