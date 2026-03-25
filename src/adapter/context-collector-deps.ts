import { executionError } from "../core/types/errors";
import { err, ok } from "../core/types/result";
import type { ContextCollectorDeps } from "./context-collector";
import { toErrorMessage, tryCatch } from "./error-handler-utils";

export async function createDefaultContextCollectorDeps(): Promise<ContextCollectorDeps> {
	const { execa } = await import("execa");
	const { glob } = await import("node:fs/promises");

	return {
		executeCommand: async (command, cwd) => {
			try {
				const result = await execa(command, {
					shell: true,
					cwd,
					reject: false,
				});
				if (result.failed) {
					return err(
						executionError(
							`Command failed (exit ${result.exitCode}): ${command}${result.stderr ? `\n${result.stderr}` : ""}`,
						),
					);
				}
				return ok(result.stdout);
			} catch (error) {
				return err(
					executionError(`Failed to execute command: ${command} (${toErrorMessage(error)})`),
				);
			}
		},
		fetchUrl: async (url) => {
			try {
				const response = await fetch(url);
				if (!response.ok) {
					return err(executionError(`Failed to fetch URL (HTTP ${response.status}): ${url}`));
				}
				return ok(await response.text());
			} catch (error) {
				return err(executionError(`Network error fetching ${url}: ${toErrorMessage(error)}`));
			}
		},
		fetchBinary: async (url) => {
			try {
				const response = await fetch(url);
				if (!response.ok) {
					return err(executionError(`Failed to fetch image (HTTP ${response.status}): ${url}`));
				}
				const contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
				const mediaType = contentType?.startsWith("image/") ? contentType : undefined;
				return ok({
					data: new Uint8Array(await response.arrayBuffer()),
					mediaType,
				});
			} catch (error) {
				return err(executionError(`Network error fetching image ${url}: ${toErrorMessage(error)}`));
			}
		},
		scanGlob: async (pattern, cwd) => {
			return tryCatch(
				async () => {
					const matches: string[] = [];
					for await (const entry of glob(pattern, { cwd })) {
						matches.push(entry);
					}
					return matches;
				},
				(e) => executionError(`Failed to scan glob: ${pattern} (${e.message})`),
			);
		},
	};
}
