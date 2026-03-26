import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { ContextSource } from "../../core/skill/context-source";
import type { ExecutionError } from "../../core/types/errors";
import { executionError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";
import { err, ok } from "../../core/types/result";
import type { CollectedContext } from "../../usecase/port/context-collector";
import { tryCatch } from "../error-handler-utils";
import type { ContextCollectorDeps, SourceCollector } from "./types";

const IMAGE_MEDIA_TYPES: ReadonlyMap<string, string> = new Map([
	[".png", "image/png"],
	[".jpg", "image/jpeg"],
	[".jpeg", "image/jpeg"],
	[".gif", "image/gif"],
	[".webp", "image/webp"],
]);

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

export const collectImage: SourceCollector = async (source: ContextSource, cwd, deps) => {
	if (source.type !== "image") throw new Error(`Expected image source, got ${source.type}`);
	if (isUrl(source.path)) {
		return collectImageFromUrl(source.path, deps);
	}
	const mediaType = resolveMediaTypeFromExtension(source.path);
	if (!mediaType) {
		const ext = extname(source.path).toLowerCase();
		return err(executionError(`Unsupported image extension: ${ext || "(none)"}`));
	}
	return collectImageFromFile(source.path, cwd, mediaType);
};

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
