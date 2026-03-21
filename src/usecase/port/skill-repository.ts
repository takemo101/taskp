import type { Skill } from "../../core/skill/skill";
import type { SkillNotFoundError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

export type SkillLoadFailure = {
	readonly path: string;
	readonly error: string;
};

export type SkillLoadResult = {
	readonly skills: readonly Skill[];
	readonly failures: readonly SkillLoadFailure[];
};

export type SkillRepository = {
	readonly findByName: (name: string) => Promise<Result<Skill, SkillNotFoundError>>;
	readonly listAll: () => Promise<SkillLoadResult>;
	readonly listLocal: () => Promise<SkillLoadResult>;
	readonly listGlobal: () => Promise<SkillLoadResult>;
};
