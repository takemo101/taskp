import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ContextSource } from "../../core/skill/context-source";
import { executionError } from "../../core/types/errors";
import { tryCatch } from "../error-handler-utils";
import type { SourceCollector } from "./types";

export const collectFile: SourceCollector = async (source: ContextSource, cwd: string) => {
	if (source.type !== "file") throw new Error(`Expected file source, got ${source.type}`);
	const fullPath = resolve(cwd, source.path);
	return tryCatch(
		async () => {
			const content = await readFile(fullPath, "utf-8");
			return [
				{ kind: "text" as const, source: { type: "file" as const, path: source.path }, content },
			];
		},
		() => executionError(`Failed to read file: ${fullPath}`),
	);
};
