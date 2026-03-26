import type { Result } from "../../core/types/result";

export type SetupLocation = "project" | "global";

export type FailedLink = {
	readonly name: string;
	readonly error: string;
};

export type SetupResult = {
	readonly location: SetupLocation;
	readonly created: readonly string[];
	readonly skipped: readonly string[];
	readonly linked: readonly string[];
	readonly failedLinks: readonly FailedLink[];
};

export type ProjectInitializer = {
	readonly setup: (options: { readonly force: boolean }) => Promise<Result<SetupResult, Error>>;
};
