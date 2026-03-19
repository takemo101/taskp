import type { Skill } from "../../core/skill/skill";
import type { SkillNotFoundError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

export type SkillRepository = {
	readonly findByName: (name: string) => Promise<Result<Skill, SkillNotFoundError>>;
	readonly listAll: () => Promise<Skill[]>;
	readonly listLocal: () => Promise<Skill[]>;
	readonly listGlobal: () => Promise<Skill[]>;
};
