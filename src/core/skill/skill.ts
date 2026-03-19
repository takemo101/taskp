import matter from "gray-matter";
import type { ParseError } from "../types/errors";
import { parseError } from "../types/errors";
import type { Result } from "../types/result";
import { err, ok } from "../types/result";
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

	let metadata: SkillMetadata;
	try {
		metadata = parseSkillMetadata(parsed.data);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return err(parseError(`Invalid skill metadata: ${message}`));
	}

	return ok({
		metadata,
		body: createSkillBody(raw),
		location,
		scope: scope ?? inferScope(location),
	});
}

function inferScope(location: string): SkillScope {
	return location.includes("/.taskp/skills/") ? "local" : "global";
}
