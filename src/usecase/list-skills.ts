import type { Skill, SkillScope } from "../core/skill/skill";
import type { SkillLoadFailure, SkillLoadResult, SkillRepository } from "./port/skill-repository";

export type ListSkillsFilter = {
	readonly scope?: SkillScope;
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
				skills: deduplicateByLocalPriority(result.skills),
				failures: result.failures,
			};
		},
	};
}

async function fetchByScope(
	repository: SkillRepository,
	scope: SkillScope | undefined,
): Promise<SkillLoadResult> {
	switch (scope) {
		case "local":
			return repository.listLocal();
		case "global":
			return repository.listGlobal();
		default:
			return repository.listAll();
	}
}

// listAll は loader 側でも重複除去しているが、usecase 層でも保証する
// （ポートの実装が変わっても usecase の契約を維持するため）
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
