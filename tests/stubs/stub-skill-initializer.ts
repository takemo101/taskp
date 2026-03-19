import type { Result } from "../../src/core/types/result";
import { ok } from "../../src/core/types/result";
import type { InitOptions, SkillInitializer } from "../../src/usecase/port/skill-initializer";

type CreatedSkill = {
	readonly name: string;
	readonly options: InitOptions;
	readonly path: string;
};

export type StubSkillInitializer = SkillInitializer & {
	readonly createdSkills: readonly CreatedSkill[];
};

export function createStubSkillInitializer(basePath = "/skills"): StubSkillInitializer {
	const created: CreatedSkill[] = [];

	return {
		create: async (name: string, options: InitOptions): Promise<Result<string, Error>> => {
			const path = `${basePath}/${name}/SKILL.md`;
			created.push({ name, options, path });
			return ok(path);
		},
		get createdSkills(): readonly CreatedSkill[] {
			return [...created];
		},
	};
}
