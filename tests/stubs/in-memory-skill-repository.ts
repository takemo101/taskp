import type { Skill } from "../../src/core/skill/skill";
import type { SkillNotFoundError } from "../../src/core/types/errors";
import { skillNotFoundError } from "../../src/core/types/errors";
import type { Result } from "../../src/core/types/result";
import { err, ok } from "../../src/core/types/result";
import type { SkillLoadResult, SkillRepository } from "../../src/usecase/port/skill-repository";

export function createInMemorySkillRepository(skills: readonly Skill[]): SkillRepository {
	const store = [...skills];

	return {
		findByName: async (name: string): Promise<Result<Skill, SkillNotFoundError>> => {
			const found = store.find((s) => s.metadata.name === name);
			return found ? ok(found) : err(skillNotFoundError(name));
		},
		listAll: async (): Promise<SkillLoadResult> => ({ skills: [...store], failures: [] }),
		listLocal: async (): Promise<SkillLoadResult> => ({
			skills: store.filter((s) => s.scope === "local"),
			failures: [],
		}),
		listGlobal: async (): Promise<SkillLoadResult> => ({
			skills: store.filter((s) => s.scope === "global"),
			failures: [],
		}),
	};
}
