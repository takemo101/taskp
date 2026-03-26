import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createContextCollector } from "../../src/adapter/context-collector";
import type { ContextSource } from "../../src/core/skill/context-source";
import type { ExecutionError } from "../../src/core/types/errors";
import { executionError } from "../../src/core/types/errors";
import type { Result } from "../../src/core/types/result";
import { err, ok } from "../../src/core/types/result";

function createSpyLogger() {
	return {
		debug: vi.fn<(message: string) => void>(),
		warn: vi.fn<(message: string) => void>(),
		error: vi.fn<(message: string) => void>(),
	};
}

function stubDeps(overrides?: {
	executeCommand?: (command: string, cwd: string) => Promise<Result<string, ExecutionError>>;
	fetchUrl?: (url: string) => Promise<Result<string, ExecutionError>>;
	fetchBinary?: (
		url: string,
	) => Promise<
		Result<{ readonly data: Uint8Array; readonly mediaType: string | undefined }, ExecutionError>
	>;
	scanGlob?: (pattern: string, cwd: string) => Promise<Result<readonly string[], ExecutionError>>;
	logger?: ReturnType<typeof createSpyLogger>;
}) {
	return {
		executeCommand: overrides?.executeCommand ?? (async () => ok("")),
		fetchUrl: overrides?.fetchUrl ?? (async () => ok("")),
		fetchBinary:
			overrides?.fetchBinary ?? (async () => ok({ data: new Uint8Array(), mediaType: undefined })),
		scanGlob: overrides?.scanGlob ?? (async () => ok([] as readonly string[])),
		logger: overrides?.logger ?? createSpyLogger(),
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
		it("reads file content with kind text", async () => {
			await writeFile(join(tempDir, "data.txt"), "file content");
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "file", path: "data.txt" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toEqual([
				{
					kind: "text",
					source: { type: "file", path: "data.txt" },
					content: "file content",
				},
			]);
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
		it("reads files matching pattern with kind text", async () => {
			await writeFile(join(tempDir, "a.md"), "aaa");
			await writeFile(join(tempDir, "b.md"), "bbb");
			const collector = createContextCollector(
				stubDeps({
					scanGlob: async () => ok(["a.md", "b.md"]),
				}),
			);
			const sources: ContextSource[] = [{ type: "glob", pattern: "*.md" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(2);
			expect(result.value[0]).toEqual({
				kind: "text",
				source: { type: "glob", pattern: "*.md" },
				content: "aaa",
			});
			expect(result.value[1]).toEqual({
				kind: "text",
				source: { type: "glob", pattern: "*.md" },
				content: "bbb",
			});
		});

		it("reads files in subdirectories", async () => {
			await mkdir(join(tempDir, "sub"), { recursive: true });
			await writeFile(join(tempDir, "sub", "deep.md"), "deep content");
			const collector = createContextCollector(
				stubDeps({
					scanGlob: async () => ok(["sub/deep.md"]),
				}),
			);
			const sources: ContextSource[] = [{ type: "glob", pattern: "**/*.md" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(1);
			expect(result.value[0].kind).toBe("text");
			if (result.value[0].kind === "text") {
				expect(result.value[0].content).toContain("deep content");
			}
		});

		it("returns empty array for no matches", async () => {
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "glob", pattern: "*.xyz" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toEqual([]);
		});

		it("returns error when scanGlob fails", async () => {
			const collector = createContextCollector(
				stubDeps({
					scanGlob: async () => err(executionError("glob scan failed")),
				}),
			);
			const sources: ContextSource[] = [{ type: "glob", pattern: "*.md" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toBe("glob scan failed");
		});

		it("returns successful results and warns on partial failure", async () => {
			await writeFile(join(tempDir, "a.md"), "aaa");
			const logger = createSpyLogger();
			const collector = createContextCollector(
				stubDeps({
					scanGlob: async () => ok(["a.md", "missing.md"]),
					logger,
				}),
			);
			const sources: ContextSource[] = [{ type: "glob", pattern: "*.md" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(1);
			expect(result.value[0]).toEqual({
				kind: "text",
				source: { type: "glob", pattern: "*.md" },
				content: "aaa",
			});
			expect(logger.warn).toHaveBeenCalledOnce();
			expect(logger.warn.mock.calls[0][0]).toContain("1 of 2 glob matches failed");
			expect(logger.warn.mock.calls[0][0]).toContain("missing.md");
		});

		it("returns error when all glob matches fail", async () => {
			const collector = createContextCollector(
				stubDeps({
					scanGlob: async () => ok(["missing1.md", "missing2.md"]),
				}),
			);
			const sources: ContextSource[] = [{ type: "glob", pattern: "*.md" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toContain('All glob matches failed for "*.md"');
			expect(result.error.message).toContain("missing1.md");
			expect(result.error.message).toContain("missing2.md");
		});
	});

	describe("command type", () => {
		it("returns command stdout with kind text", async () => {
			const collector = createContextCollector(
				stubDeps({
					executeCommand: async () => ok("command output"),
				}),
			);
			const sources: ContextSource[] = [{ type: "command", run: "echo hello" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toEqual([
				{
					kind: "text",
					source: { type: "command", run: "echo hello" },
					content: "command output",
				},
			]);
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

	describe("url type", () => {
		it("returns fetched content with kind text", async () => {
			const collector = createContextCollector(
				stubDeps({
					fetchUrl: async () => ok("fetched content"),
				}),
			);
			const sources: ContextSource[] = [{ type: "url", url: "https://example.com" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toEqual([
				{
					kind: "text",
					source: { type: "url", url: "https://example.com" },
					content: "fetched content",
				},
			]);
		});

		it("returns error on fetch failure", async () => {
			const collector = createContextCollector(
				stubDeps({
					fetchUrl: async () => err(executionError("network error")),
				}),
			);
			const sources: ContextSource[] = [{ type: "url", url: "https://example.com" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toBe("network error");
		});
	});

	describe("image type", () => {
		it("reads image as Uint8Array with correct mediaType", async () => {
			const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
			await writeFile(join(tempDir, "test.png"), imageData);
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "image", path: "test.png" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(1);
			expect(result.value[0].kind).toBe("image");
			if (result.value[0].kind === "image") {
				expect(result.value[0].data).toBeInstanceOf(Uint8Array);
				expect(result.value[0].data).toEqual(imageData);
				expect(result.value[0].mediaType).toBe("image/png");
				expect(result.value[0].source).toEqual({ type: "image", path: "test.png" });
			}
		});

		it.each([
			[".png", "image/png"],
			[".jpg", "image/jpeg"],
			[".jpeg", "image/jpeg"],
			[".gif", "image/gif"],
			[".webp", "image/webp"],
		])("resolves %s to %s", async (ext, expectedMediaType) => {
			const imageData = new Uint8Array([0xff, 0xd8]);
			await writeFile(join(tempDir, `test${ext}`), imageData);
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "image", path: `test${ext}` }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value[0].kind).toBe("image");
			if (result.value[0].kind === "image") {
				expect(result.value[0].mediaType).toBe(expectedMediaType);
			}
		});

		it("returns error for unsupported extension", async () => {
			await writeFile(join(tempDir, "test.svg"), "<svg></svg>");
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "image", path: "test.svg" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toContain("Unsupported image extension: .svg");
		});

		it("returns error for bmp extension", async () => {
			await writeFile(join(tempDir, "test.bmp"), new Uint8Array([0x42, 0x4d]));
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "image", path: "test.bmp" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toContain("Unsupported image extension: .bmp");
		});

		it("returns error for missing image file", async () => {
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [{ type: "image", path: "missing.png" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toContain("Failed to read image");
		});

		it("fetches image from URL via fetchBinary", async () => {
			const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
			const collector = createContextCollector(
				stubDeps({
					fetchBinary: async () => ok({ data: imageData, mediaType: "image/png" }),
				}),
			);
			const sources: ContextSource[] = [{ type: "image", path: "https://example.com/photo.png" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(1);
			expect(result.value[0].kind).toBe("image");
			if (result.value[0].kind === "image") {
				expect(result.value[0].data).toEqual(imageData);
				expect(result.value[0].mediaType).toBe("image/png");
				expect(result.value[0].source).toEqual({
					type: "image",
					path: "https://example.com/photo.png",
				});
			}
		});

		it("returns error when URL image fetch fails", async () => {
			const collector = createContextCollector(
				stubDeps({
					fetchBinary: async () =>
						err(
							executionError("Failed to fetch image (HTTP 404): https://example.com/missing.jpg"),
						),
				}),
			);
			const sources: ContextSource[] = [{ type: "image", path: "https://example.com/missing.jpg" }];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("HTTP 404");
		});

		it("resolves media type from URL ignoring query params", async () => {
			const imageData = new Uint8Array([0xff, 0xd8]);
			const collector = createContextCollector(
				stubDeps({
					fetchBinary: async () => ok({ data: imageData, mediaType: undefined }),
				}),
			);
			const sources: ContextSource[] = [
				{ type: "image", path: "https://example.com/photo.jpg?width=800&format=original" },
			];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value[0].kind).toBe("image");
			if (result.value[0].kind === "image") {
				expect(result.value[0].mediaType).toBe("image/jpeg");
			}
		});
	});

	describe("multiple sources", () => {
		it("collects all sources in order", async () => {
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
			expect(result.value).toHaveLength(2);
			expect(result.value[0]).toEqual({
				kind: "text",
				source: { type: "file", path: "file.txt" },
				content: "from file",
			});
			expect(result.value[1]).toEqual({
				kind: "text",
				source: { type: "command", run: "echo hi" },
				content: "from command",
			});
		});

		it("mixes text and image sources", async () => {
			await writeFile(join(tempDir, "file.txt"), "text content");
			const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
			await writeFile(join(tempDir, "photo.png"), imageData);
			const collector = createContextCollector(stubDeps());
			const sources: ContextSource[] = [
				{ type: "file", path: "file.txt" },
				{ type: "image", path: "photo.png" },
			];

			const result = await collector.collect(sources, tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(2);
			expect(result.value[0].kind).toBe("text");
			expect(result.value[1].kind).toBe("image");
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
