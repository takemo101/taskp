import type { Logger } from "../usecase/port/logger";

export function createConsoleLogger(): Logger {
	return {
		debug: (msg) => console.debug(`[taskp] ${msg}`),
		warn: (msg) => console.warn(`[taskp] ${msg}`),
		error: (msg) => console.error(`[taskp] ${msg}`),
	};
}
