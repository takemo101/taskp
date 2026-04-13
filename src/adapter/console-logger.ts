import type { Logger } from "../usecase/port/logger";

export function createConsoleLogger(options?: { readonly verbose?: boolean }): Logger {
	const verbose = options?.verbose ?? false;
	return {
		debug: (msg) => {
			if (!verbose) return;
			console.debug(`[taskp] ${msg}`);
		},
		warn: (msg) => console.warn(`[taskp] ${msg}`),
		error: (msg) => console.error(`[taskp] ${msg}`),
	};
}
