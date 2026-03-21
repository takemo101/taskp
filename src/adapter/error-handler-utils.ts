import { err, ok, type Result } from "../core/types/result";

export function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

export async function tryCatch<T, E>(
	fn: () => Promise<T>,
	errorFactory: (e: Error) => E,
): Promise<Result<T, E>> {
	try {
		return ok(await fn());
	} catch (e) {
		const error = e instanceof Error ? e : new Error(String(e));
		return err(errorFactory(error));
	}
}

export function tryCatchSync<T, E>(fn: () => T, errorFactory: (e: Error) => E): Result<T, E> {
	try {
		return ok(fn());
	} catch (e) {
		const error = e instanceof Error ? e : new Error(String(e));
		return err(errorFactory(error));
	}
}
