import matter from "gray-matter";
import type { Skill, SkillScope } from "../../src/core/skill/skill";
import { createSkillBody } from "../../src/core/skill/skill-body";
import type { SkillMetadata } from "../../src/core/skill/skill-metadata";

type SkillOverrides = {
	readonly name?: string;
	readonly description?: string;
	readonly mode?: "template" | "agent";
	readonly location?: string;
	readonly scope?: SkillScope;
	readonly inputs?: SkillMetadata["inputs"];
	readonly tools?: string[];
	readonly context?: SkillMetadata["context"];
	readonly model?: string;
	readonly bodyContent?: string;
};

export function makeSkill(overrides: SkillOverrides = {}): Skill {
	const name = overrides.name ?? "test-skill";
	const rawMarkdown = buildRawMarkdown(overrides);

	return {
		metadata: {
			name,
			description: overrides.description ?? `Description of ${name}`,
			mode: overrides.mode ?? "template",
			inputs: overrides.inputs ?? [],
			tools: overrides.tools ?? ["bash", "read", "write"],
			context: overrides.context ?? [],
			model: overrides.model,
		},
		body: createSkillBody(matter(rawMarkdown).content),
		location: overrides.location ?? `/skills/${name}/SKILL.md`,
		scope: overrides.scope ?? "local",
	};
}

function buildRawMarkdown(overrides: SkillOverrides): string {
	const name = overrides.name ?? "test-skill";
	const frontmatter = [
		"---",
		`name: ${name}`,
		`description: ${overrides.description ?? `Description of ${name}`}`,
		`mode: ${overrides.mode ?? "template"}`,
		"---",
	].join("\n");

	const body = overrides.bodyContent ?? `# ${name}\n\nSkill body content.`;
	return `${frontmatter}\n${body}`;
}
