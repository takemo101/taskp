export type Logger = {
	readonly debug: (message: string) => void;
	readonly warn: (message: string) => void;
	readonly error: (message: string) => void;
};

export function createNoopLogger(): Logger {
	return { debug: () => {}, warn: () => {}, error: () => {} };
}
