import { type ParseError, parseError } from "../types/errors";
import { err, ok, type Result } from "../types/result";

export type SkillRef = {
	readonly name: string;
	readonly action: string | undefined;
};

export function parseSkillRef(ref: string): Result<SkillRef, ParseError> {
	const colonIndex = ref.indexOf(":");
	if (colonIndex === -1) {
		return ok({ name: ref, action: undefined });
	}
	const rest = ref.slice(colonIndex + 1);
	if (rest.includes(":")) {
		return err(parseError(`Invalid skill reference "${ref}": expected "skill" or "skill:action"`));
	}
	return ok({ name: ref.slice(0, colonIndex), action: rest });
}
