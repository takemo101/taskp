import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ContextSource } from "../core/skill/context-source";
import type { ExecutionError } from "../core/types/errors";
import { executionError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";

type CollectedContext = {
	readonly source: ContextSource;
	readonly content: string;
};

type ContextCollectorDeps = {
	readonly executeCommand: (
		command: string,
		cwd: string,
	) => Promise<Result<string, ExecutionError>>;
	readonly fetchUrl: (url: string) => Promise<Result<string, ExecutionError>>;
	readonly scanGlob: (pattern: string, cwd: string) => Promise<readonly string[]>;
};

export function createContextCollector(deps: ContextCollectorDeps) {
	return {
		collect: (
			sources: readonly ContextSource[],
			cwd: string,
		): Promise<Result<string, ExecutionError>> => collectAll(sources, cwd, deps),
	};
}

// コンテキストソースを直列で処理する（並列にしないのは、
// command タイプが副作用を持つ可能性があり、実行順序を保証するため）
async function collectAll(
	sources: readonly ContextSource[],
	cwd: string,
	deps: ContextCollectorDeps,
): Promise<Result<string, ExecutionError>> {
	const results: CollectedContext[] = [];

	for (const source of sources) {
		const result = await collectOne(source, cwd, deps);
		if (!result.ok) {
			return result;
		}
		results.push(...result.value);
	}

	return ok(results.map((r) => r.content).join("\n\n"));
}

async function collectOne(
	source: ContextSource,
	cwd: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	switch (source.type) {
		case "file":
			return collectFile(source.path, cwd);
		case "glob":
			return collectGlob(source.pattern, cwd, deps);
		case "command":
			return collectCommand(source.run, cwd, deps);
		case "url":
			return collectUrl(source.url, deps);
	}
}

async function collectFile(
	path: string,
	cwd: string,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const fullPath = join(cwd, path);
	try {
		const content = await readFile(fullPath, "utf-8");
		return ok([{ source: { type: "file", path }, content }]);
	} catch {
		return err(executionError(`Failed to read file: ${fullPath}`));
	}
}

async function collectGlob(
	pattern: string,
	cwd: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	let paths: readonly string[];
	try {
		paths = await deps.scanGlob(pattern, cwd);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return err(executionError(`Failed to scan glob pattern "${pattern}": ${message}`));
	}
	const matches: CollectedContext[] = [];
	const total = paths.length;

	for (let i = 0; i < total; i++) {
		const path = paths[i];
		const fullPath = join(cwd, path);
		try {
			const content = await readFile(fullPath, "utf-8");
			matches.push({ source: { type: "glob", pattern }, content });
		} catch {
			return err(executionError(`Failed to read glob match (${i + 1}/${total}): ${fullPath}`));
		}
	}

	return ok(matches);
}

async function collectCommand(
	run: string,
	cwd: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const result = await deps.executeCommand(run, cwd);
	if (!result.ok) {
		return result;
	}
	return ok([{ source: { type: "command", run }, content: result.value }]);
}

async function collectUrl(
	url: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const result = await deps.fetchUrl(url);
	if (!result.ok) {
		return result;
	}
	return ok([{ source: { type: "url", url }, content: result.value }]);
}
