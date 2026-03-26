import type { ContextSource } from "../../core/skill/context-source";
import { ok } from "../../core/types/result";
import type { SourceCollector } from "./types";

export const collectCommand: SourceCollector = async (source: ContextSource, cwd, deps) => {
	if (source.type !== "command") throw new Error(`Expected command source, got ${source.type}`);
	const result = await deps.executeCommand(source.run, cwd);
	if (!result.ok) {
		return result;
	}
	return ok([
		{
			kind: "text" as const,
			source: { type: "command" as const, run: source.run },
			content: result.value,
		},
	]);
};
