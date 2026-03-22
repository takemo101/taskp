import type { Result } from "../../core/types/result";

export type InitOptions = {
	readonly mode: "template" | "agent";
	readonly description: string;
	readonly actions?: readonly string[];
};

export type SkillInitializer = {
	readonly create: (name: string, options: InitOptions) => Promise<Result<string, Error>>;
};
