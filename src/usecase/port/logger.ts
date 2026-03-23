export type Logger = {
	readonly debug: (message: string) => void;
	readonly warn: (message: string) => void;
	readonly error: (message: string) => void;
};
