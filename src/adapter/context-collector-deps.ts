import { executionError } from "../core/types/errors";
import { err, ok } from "../core/types/result";
import type { ContextCollectorDeps } from "./context-collector";

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
				const message = error instanceof Error ? error.message : String(error);
				return err(executionError(`Failed to execute command: ${command} (${message})`));
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
				const message = error instanceof Error ? error.message : String(error);
				return err(executionError(`Network error fetching ${url}: ${message}`));
			}
		},
		scanGlob: async (pattern, cwd) => {
			try {
				const matches: string[] = [];
				for await (const entry of glob(pattern, { cwd })) {
					matches.push(entry);
				}
				return ok(matches);
			} catch (e) {
				return err(
					executionError(
						`Failed to scan glob: ${pattern} (${e instanceof Error ? e.message : String(e)})`,
					),
				);
			}
		},
	};
}
