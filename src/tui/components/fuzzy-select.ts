import fuzzysort from "fuzzysort";

export type SkillOption = {
	readonly name: string;
	readonly description: string;
	readonly actionName?: string;
	readonly parentSkillName?: string;
};

export function filterSkills(query: string, skills: readonly SkillOption[]): SkillOption[] {
	if (query === "") {
		return [...skills];
	}

	const results = fuzzysort.go(query, skills as SkillOption[], {
		keys: ["name", "description"],
		threshold: 0.3,
	});

	return results.map((r) => r.obj);
}

export function buildSkillOptionsWithActions(
	skills: readonly {
		readonly name: string;
		readonly description: string;
		readonly actions?: Record<string, { readonly description: string }>;
	}[],
): SkillOption[] {
	const options: SkillOption[] = [];
	for (const skill of skills) {
		options.push({ name: skill.name, description: skill.description });
		if (skill.actions) {
			for (const [actionName, action] of Object.entries(skill.actions)) {
				options.push({
					name: `${skill.name}:${actionName}`,
					description: action.description,
					actionName,
					parentSkillName: skill.name,
				});
			}
		}
	}
	return options;
}
