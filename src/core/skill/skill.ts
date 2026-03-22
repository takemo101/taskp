import matter from "gray-matter";
import type { ParseError } from "../types/errors";
import { parseError } from "../types/errors";
import type { Result } from "../types/result";
import { err, ok } from "../types/result";
import type { Action } from "./action";
import type { ActionSection } from "./action-section-parser";
import { parseActionSections } from "./action-section-parser";
import type { SkillBody } from "./skill-body";
import { createSkillBody } from "./skill-body";
import type { SkillMetadata } from "./skill-metadata";
import { parseSkillMetadata } from "./skill-metadata";

export type SkillScope = "local" | "global";

export type Skill = {
	readonly metadata: SkillMetadata;
	readonly body: SkillBody;
	readonly location: string;
	readonly scope: SkillScope;
};

export function parseSkill(
	raw: string,
	location: string,
	scope?: SkillScope,
): Result<Skill, ParseError> {
	// gray-matter は不正な frontmatter に対して例外を投げるため、
	// try-catch で捕捉して Result 型に変換する
	let parsed: matter.GrayMatterFile<string>;
	try {
		parsed = matter(raw);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return err(parseError(`Failed to parse frontmatter: ${message}`));
	}

	const metadataResult = parseSkillMetadata(parsed.data);
	if (!metadataResult.ok) {
		return metadataResult;
	}

	const metadata = metadataResult.value;

	if (metadata.actions) {
		if (metadata.inputs.length > 0) {
			console.warn('[taskp] Skill-level "inputs" is ignored when "actions" is defined');
		}

		const validationResult = validateActionSections(raw, metadata);
		if (!validationResult.ok) {
			return validationResult;
		}
	}

	return ok({
		metadata,
		body: createSkillBody(raw),
		location,
		scope: scope ?? inferScope(location),
	});
}

function validateActionSections(raw: string, metadata: SkillMetadata): Result<void, ParseError> {
	const actions = metadata.actions as Record<string, Action>;
	const sectionsResult = parseActionSections(raw);
	if (!sectionsResult.ok) return err(parseError("Failed to parse action sections"));
	const sections: readonly ActionSection[] = sectionsResult.value;

	const actionKeys = new Set(Object.keys(actions));
	const sectionNames = new Set(sections.map((section: ActionSection) => section.name));

	for (const key of actionKeys) {
		if (!sectionNames.has(key)) {
			return err(
				parseError(
					`Action "${key}" is defined in metadata but has no corresponding ## action:${key} section in body`,
				),
			);
		}
	}

	for (const name of sectionNames) {
		if (!actionKeys.has(name)) {
			return err(
				parseError(
					`Section ## action:${name} exists in body but "${name}" is not defined in actions metadata`,
				),
			);
		}
	}

	for (const [key, action] of Object.entries(actions) as [string, Action][]) {
		const effectiveMode = action.mode ?? metadata.mode ?? "template";
		if (effectiveMode === "template") {
			const section = sections.find((s: ActionSection) => s.name === key);
			if (section && section.codeBlocks.length === 0) {
				return err(
					parseError(
						`Template action "${key}" requires at least one code block in ## action:${key} section`,
					),
				);
			}
		}
	}

	return ok(undefined);
}

function inferScope(location: string): SkillScope {
	return location.includes("/.taskp/skills/") ? "local" : "global";
}
