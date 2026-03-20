import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDefaultContextCollectorDeps } from "../../src/adapter/context-collector-deps";

describe("createDefaultContextCollectorDeps", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "context-deps-"));
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	describe("executeCommand", () => {
		it("returns stdout on success", async () => {
			const deps = await createDefaultContextCollectorDeps();

			const result = await deps.executeCommand("echo hello", tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toBe("hello");
		});

		it("returns error on command failure", async () => {
			const deps = await createDefaultContextCollectorDeps();

			const result = await deps.executeCommand("exit 1", tempDir);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toContain("Command failed (exit 1)");
		});
	});

	describe("fetchUrl", () => {
		it("returns error for non-existent host", async () => {
			const deps = await createDefaultContextCollectorDeps();

			const result = await deps.fetchUrl("http://this-domain-does-not-exist.invalid");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			expect(result.error.message).toContain("Network error fetching");
		});
	});

	describe("scanGlob", () => {
		it("returns matching files", async () => {
			await writeFile(join(tempDir, "a.txt"), "");
			await writeFile(join(tempDir, "b.txt"), "");
			await writeFile(join(tempDir, "c.md"), "");

			const deps = await createDefaultContextCollectorDeps();

			const result = await deps.scanGlob("*.txt", tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(2);
			expect([...result.value].sort()).toEqual(["a.txt", "b.txt"]);
		});

		it("returns empty array for no matches", async () => {
			const deps = await createDefaultContextCollectorDeps();

			const result = await deps.scanGlob("*.xyz", tempDir);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toHaveLength(0);
		});
	});
});
