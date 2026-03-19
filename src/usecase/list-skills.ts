import type { Skill, SkillScope } from "../core/skill/skill";
import type { SkillRepository } from "./port/skill-repository";

export type ListSkillsFilter = {
	readonly scope?: SkillScope;
};

export type ListOutput = {
	readonly skills: readonly Skill[];
};

export type ListSkillsUseCase = {
	readonly execute: (filter: ListSkillsFilter) => Promise<ListOutput>;
};

export function createListSkillsUseCase(repository: SkillRepository): ListSkillsUseCase {
	return {
		execute: async (filter) => {
			const skills = await fetchByScope(repository, filter.scope);
			return { skills: deduplicateByLocalPriority(skills) };
		},
	};
}

async function fetchByScope(
	repository: SkillRepository,
	scope: SkillScope | undefined,
): Promise<Skill[]> {
	switch (scope) {
		case "local":
			return repository.listLocal();
		case "global":
			return repository.listGlobal();
		default:
			return repository.listAll();
	}
}

function deduplicateByLocalPriority(skills: readonly Skill[]): readonly Skill[] {
	const seen = new Map<string, Skill>();
	for (const skill of skills) {
		const existing = seen.get(skill.metadata.name);
		if (!existing || skill.scope === "local") {
			seen.set(skill.metadata.name, skill);
		}
	}
	return [...seen.values()];
}
