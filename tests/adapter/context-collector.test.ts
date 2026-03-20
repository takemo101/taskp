import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createContextCollector } from "../../src/adapter/context-collector";
import type { ContextSource } from "../../src/core/skill/context-source";
import type { ExecutionError } from "../../src/core/types/errors";
import { executionError } from "../../src/core/types/errors";
import type { Result } from "../../src/core/types/result";
import { err, ok } from "../../src/core/types/result";

function stubDeps(overrides?: {
	executeCommand?: (command: string, cwd: string) => Promise<Result<string, ExecutionError>>;
	fetchUrl?: (url: string) => Promise<Result<string, ExecutionError>>;
	scanGlob?: (pattern: string, cwd: string) => Promise<readonly string[]>;
}) {
	return {
		executeCommand: overrides?.executeCommand ?? (async () => ok("")),
		fetchUrl: overrides?.fetchUrl ?? (async () => ok("")),
		scanGlob: overrides?.scanGlob ?? (async () => []),
	};
}

describe("ContextCollector", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "context-collector-"));
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	describe("file type", () => {
		it("reads file content", async () => {
			await writeFile(join(tempDir, "data.txt"), "file content");
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "file", path: "data.txt" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toBe("file content");
		});

		it("returns error for missing file", async () => {
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "file", path: "missing.txt" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toContain("Failed to read file");
		});
	});

	describe("glob type", () => {
		it("reads files matching pattern", async () => {
			await writeFile(join(tempDir, "a.md"), "aaa");
			await writeFile(join(tempDir, "b.md"), "bbb");
			const collector = createContextCollector(
				stubDeps({
					scanGlob: async () => ["a.md", "b.md"],
				}),
			);
			const sources: ContextSource[] = [{ type: "glob", pattern: "*.md" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toContain("aaa");
			expect(result.value).toContain("bbb");
		});

		it("reads files in subdirectories", async () => {
			await mkdir(join(tempDir, "sub"), { recursive: true });
			await writeFile(join(tempDir, "sub", "deep.md"), "deep content");
			const collector = createContextCollector(
				stubDeps({
					scanGlob: async () => ["sub/deep.md"],
				}),
			);
			const sources: ContextSource[] = [{ type: "glob", pattern: "**/*.md" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toContain("deep content");
		});

		it("returns empty string for no matches", async () => {
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "glob", pattern: "*.xyz" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toBe("");
		});

		it("includes progress counter in error for unreadable file", async () => {
			await writeFile(join(tempDir, "a.md"), "aaa");
			const collector = createContextCollector(
				stubDeps({
					scanGlob: async () => ["a.md", "missing.md", "c.md"],
				}),
			);
			const sources: ContextSource[] = [{ type: "glob", pattern: "*.md" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toContain("Failed to read glob match (2/3):");
			expect(result.error.message).toContain("missing.md");
		});
	});

	describe("command type", () => {
		it("returns command stdout", async () => {
			const collector = createContextCollector(
				stubDeps({
					executeCommand: async () => ok("command output"),
				}),
			);
			const sources: ContextSource[] = [{ type: "command", run: "echo hello" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toBe("command output");
		});

		it("passes cwd to command executor", async () => {
			let capturedCwd = "";
			const collector = createContextCollector(
				stubDeps({
					executeCommand: async (_cmd, cwd) => {
						capturedCwd = cwd;
						return ok("");
					},
				}),
			);
			const sources: ContextSource[] = [{ type: "command", run: "ls" }];

			await collector.collect(sources, tempDir);

			expect(capturedCwd).toBe(tempDir);
		});

		it("returns error on command failure", async () => {
			const collector = createContextCollector(
				stubDeps({
					executeCommand: async () => err(executionError("command failed")),
				}),
			);
			const sources: ContextSource[] = [{ type: "command", run: "exit 1" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toBe("command failed");
		});
	});

	describe("multiple sources", () => {
		it("joins content from multiple sources", async () => {
			await writeFile(join(tempDir, "file.txt"), "from file");
			const collector = createContextCollector(
				stubDeps({
					executeCommand: async () => ok("from command"),
				}),
			);
			const sources: ContextSource[] = [
				{ type: "file", path: "file.txt" },
				{ type: "command", run: "echo hi" },
			];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toBe("from file\n\nfrom command");
		});

		it("stops on first error", async () => {
			const collector = createContextCollector(
				stubDeps({
					executeCommand: async () => err(executionError("boom")),
				}),
			);
			const sources: ContextSource[] = [
				{ type: "command", run: "fail" },
				{ type: "file", path: "never-reached.txt" },
			];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toBe("boom");
		});
	});
});
