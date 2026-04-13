import type { Skill } from "../core/skill/skill";
import type { SkillLoadFailure, SkillLoadResult, SkillRepository } from "./port/skill-repository";

export type ListSkillScopeFilter = "project" | "global";

export type ListSkillsFilter = {
	readonly scope?: ListSkillScopeFilter;
};

export type ListOutput = {
	readonly skills: readonly Skill[];
	readonly failures: readonly SkillLoadFailure[];
};

export type ListSkillsUseCase = {
	readonly execute: (filter: ListSkillsFilter) => Promise<ListOutput>;
};

export function createListSkillsUseCase(repository: SkillRepository): ListSkillsUseCase {
	return {
		execute: async (filter) => {
			const result = await fetchByScope(repository, filter.scope);
			return {
				skills: deduplicateByDiscoveryOrder(result.skills),
				failures: result.failures,
			};
		},
	};
}

async function fetchByScope(
	repository: SkillRepository,
	scope: ListSkillScopeFilter | undefined,
): Promise<SkillLoadResult> {
	switch (scope) {
		case "project":
			return repository.listLocal();
		case "global":
			return repository.listGlobal();
		default:
			return repository.listAll();
	}
}

// listAll は loader 側でも重複除去しているが、usecase 層でも保証する
// （ポートの実装が変わっても discovery 順序の契約を維持するため）
function deduplicateByDiscoveryOrder(skills: readonly Skill[]): readonly Skill[] {
	const seen = new Map<string, Skill>();
	for (const skill of skills) {
		if (!seen.has(skill.metadata.name)) {
			seen.set(skill.metadata.name, skill);
		}
	}
	return [...seen.values()];
}
