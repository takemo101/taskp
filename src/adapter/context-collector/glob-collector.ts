import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ContextSource } from "../../core/skill/context-source";
import type { ExecutionError } from "../../core/types/errors";
import { executionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";
import { ok } from "../../core/types/result";
import type { CollectedContext } from "../../usecase/port/context-collector";
import { tryCatch } from "../error-handler-utils";
import type { SourceCollector } from "./types";

export const collectGlob: SourceCollector = async (source: ContextSource, cwd, deps) => {
	if (source.type !== "glob") throw new Error(`Expected glob source, got ${source.type}`);
	const scanResult = await deps.scanGlob(source.pattern, cwd);
	if (!scanResult.ok) {
		return scanResult;
	}
	const paths = scanResult.value;
	const total = paths.length;

	const results = await Promise.all(
		paths.map((path, i) => readGlobMatch(source.pattern, resolve(cwd, path), i, total)),
	);

	const collected: CollectedContext[] = [];
	for (const result of results) {
		if (!result.ok) {
			return result;
		}
		collected.push(result.value);
	}

	return ok(collected);
};

async function readGlobMatch(
	pattern: string,
	fullPath: string,
	index: number,
	total: number,
): Promise<Result<CollectedContext, ExecutionError>> {
	return tryCatch(
		async () => {
			const content = await readFile(fullPath, "utf-8");
			return { kind: "text" as const, source: { type: "glob" as const, pattern }, content };
		},
		(e) =>
			executionError(
				`Failed to read glob match (${index + 1}/${total}): ${fullPath}: ${e.message}`,
			),
	);
}
