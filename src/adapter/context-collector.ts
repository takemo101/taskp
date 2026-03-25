import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { ContextSource } from "../core/skill/context-source";
import type { ExecutionError } from "../core/types/errors";
import { executionError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import type { CollectedContext } from "../usecase/port/context-collector";
import { tryCatch } from "./error-handler-utils";

const IMAGE_MEDIA_TYPES: ReadonlyMap<string, string> = new Map([
	[".png", "image/png"],
	[".jpg", "image/jpeg"],
	[".jpeg", "image/jpeg"],
	[".gif", "image/gif"],
	[".webp", "image/webp"],
]);

export type ContextCollectorDeps = {
	readonly executeCommand: (
		command: string,
		cwd: string,
	) => Promise<Result<string, ExecutionError>>;
	readonly fetchUrl: (url: string) => Promise<Result<string, ExecutionError>>;
	readonly fetchBinary: (
		url: string,
	) => Promise<
		Result<{ readonly data: Uint8Array; readonly mediaType: string | undefined }, ExecutionError>
	>;
	readonly scanGlob: (
		pattern: string,
		cwd: string,
	) => Promise<Result<readonly string[], ExecutionError>>;
};

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
		const result = await collectOne(source, cwd, deps);
		if (!result.ok) {
			return result;
		}
		results.push(...result.value);
	}

	return ok(results);
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
		case "image":
			return collectImage(source.path, cwd, deps);
	}
}

async function collectFile(
	path: string,
	cwd: string,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const fullPath = resolve(cwd, path);
	return tryCatch(
		async () => {
			const content = await readFile(fullPath, "utf-8");
			return [{ kind: "text" as const, source: { type: "file" as const, path }, content }];
		},
		() => executionError(`Failed to read file: ${fullPath}`),
	);
}

async function collectGlob(
	pattern: string,
	cwd: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const scanResult = await deps.scanGlob(pattern, cwd);
	if (!scanResult.ok) {
		return scanResult;
	}
	const paths = scanResult.value;
	const total = paths.length;

	const results = await Promise.all(
		paths.map((path, i) => readGlobMatch(pattern, resolve(cwd, path), i, total)),
	);

	const collected: CollectedContext[] = [];
	for (const result of results) {
		if (!result.ok) {
			return result;
		}
		collected.push(result.value);
	}

	return ok(collected);
}

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

async function collectCommand(
	run: string,
	cwd: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const result = await deps.executeCommand(run, cwd);
	if (!result.ok) {
		return result;
	}
	return ok([{ kind: "text", source: { type: "command", run }, content: result.value }]);
}

async function collectUrl(
	url: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const result = await deps.fetchUrl(url);
	if (!result.ok) {
		return result;
	}
	return ok([{ kind: "text", source: { type: "url", url }, content: result.value }]);
}

function isUrl(value: string): boolean {
	return value.startsWith("http://") || value.startsWith("https://");
}

/** 拡張子から mediaType を解決する。URL の場合はクエリパラメータを除去してから判定する */
function resolveMediaTypeFromExtension(pathOrUrl: string): string | undefined {
	let pathname: string;
	if (isUrl(pathOrUrl)) {
		try {
			pathname = new URL(pathOrUrl).pathname;
		} catch {
			return undefined;
		}
	} else {
		pathname = pathOrUrl;
	}
	return IMAGE_MEDIA_TYPES.get(extname(pathname).toLowerCase());
}

async function collectImage(
	path: string,
	cwd: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	if (isUrl(path)) {
		return collectImageFromUrl(path, deps);
	}
	const mediaType = resolveMediaTypeFromExtension(path);
	if (!mediaType) {
		const ext = extname(path).toLowerCase();
		return err(executionError(`Unsupported image extension: ${ext || "(none)"}`));
	}
	return collectImageFromFile(path, cwd, mediaType);
}

async function collectImageFromFile(
	path: string,
	cwd: string,
	mediaType: string,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const fullPath = resolve(cwd, path);
	return tryCatch(
		async () => {
			const data = new Uint8Array(await readFile(fullPath));
			return [
				{
					kind: "image" as const,
					source: { type: "image" as const, path },
					data,
					mediaType,
				},
			];
		},
		() => executionError(`Failed to read image: ${fullPath}`),
	);
}

async function collectImageFromUrl(
	url: string,
	deps: ContextCollectorDeps,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
	const result = await deps.fetchBinary(url);
	if (!result.ok) {
		return result;
	}

	// Content-Type ヘッダーから mediaType を取得し、取れなければ拡張子から推測する
	const mediaType = result.value.mediaType ?? resolveMediaTypeFromExtension(url) ?? "image/png";

	return ok([
		{
			kind: "image" as const,
			source: { type: "image" as const, path: url },
			data: result.value.data,
			mediaType,
		},
	]);
}
