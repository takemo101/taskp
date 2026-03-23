import type { Logger } from "../usecase/port/logger";

export function createSilentLogger(): Logger {
	return {
		debug: () => {},
		warn: () => {},
		error: () => {},
	};
}
