import fuzzysort from "fuzzysort";

export type SkillOption = {
	readonly name: string;
	readonly description: string;
};

export function filterSkills(query: string, skills: readonly SkillOption[]): SkillOption[] {
	if (query === "") {
		return [...skills];
	}

	const results = fuzzysort.go(query, skills as SkillOption[], {
		keys: ["name", "description"],
	});

	return results.map((r) => r.obj);
}
