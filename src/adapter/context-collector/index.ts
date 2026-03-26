import type { ContextSource } from "../../core/skill/context-source";
import type { ExecutionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";
import { ok } from "../../core/types/result";
import type { CollectedContext } from "../../usecase/port/context-collector";
import { collectCommand } from "./command-collector";
import { collectFile } from "./file-collector";
import { collectGlob } from "./glob-collector";
import { collectImage } from "./image-collector";
import type { ContextCollectorDeps, SourceCollector } from "./types";
import { collectUrl } from "./url-collector";

export type { ContextCollectorDeps } from "./types";

const sourceCollectors: ReadonlyMap<ContextSource["type"], SourceCollector> = new Map([
	["file", collectFile],
	["glob", collectGlob],
	["command", collectCommand],
	["url", collectUrl],
	["image", collectImage],
]);

export function createContextCollector(deps: ContextCollectorDeps) {
	return {
		collect: (
			sources: readonly ContextSource[],
			cwd: string,
		): Promise<Result<readonly CollectedContext[], ExecutionError>> =>
			collectAll(sources, cwd, deps),
	};
}

// コンテキストソースを直列で処理する（並列にしないのは、
// command タイプが副作用を持つ可能性があり、実行順序を保証するため）
async function collectAll(
	sources: readonly ContextSource[],
	cwd: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const results: CollectedContext[] = [];

	for (const source of sources) {
		const collector = sourceCollectors.get(source.type);
		if (!collector) {
			throw new Error(`Unknown context source type: ${source.type}`);
		}
		const result = await collector(source, cwd, deps);
		if (!result.ok) {
			return result;
		}
		results.push(...result.value);
	}

	return ok(results);
}
