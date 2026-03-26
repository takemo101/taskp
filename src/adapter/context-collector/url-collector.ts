import type { ContextSource } from "../../core/skill/context-source";
import { ok } from "../../core/types/result";
import type { SourceCollector } from "./types";

export const collectUrl: SourceCollector = async (source: ContextSource, _cwd, deps) => {
	if (source.type !== "url") throw new Error(`Expected url source, got ${source.type}`);
	const result = await deps.fetchUrl(source.url);
	if (!result.ok) {
		return result;
	}
	return ok([
		{
			kind: "text" as const,
			source: { type: "url" as const, url: source.url },
			content: result.value,
		},
	]);
};
