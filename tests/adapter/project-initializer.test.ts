import { mkdirSync, mkdtempSync, readlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createNodeFileSystem } from "../../src/adapter/file-system-port";
import { createProjectInitializer } from "../../src/adapter/project-initializer";

describe("createProjectInitializer", () => {
	let baseDir: string;

	beforeEach(() => {
		baseDir = mkdtempSync(join(tmpdir(), "taskp-init-test-"));
	});

	afterEach(() => {
		rmSync(baseDir, { recursive: true, force: true });
	});

	describe("bundled skill linking", () => {
		it("links bundled skills and returns empty failedLinks on success", async () => {
			const bundledDir = join(baseDir, "bundled-skills");
			mkdirSync(join(bundledDir, "skill-a"), { recursive: true });
			mkdirSync(join(bundledDir, "skill-b"), { recursive: true });

			const initializer = createProjectInitializer({
				baseDir,
				location: "project",
				bundledSkillsDir: bundledDir,
				fs: createNodeFileSystem(),
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.linked).toContain("skill-a");
			expect(result.value.linked).toContain("skill-b");
			expect(result.value.failedLinks).toHaveLength(0);
		});

		it("creates relative symlinks pointing to bundled skills", async () => {
			const bundledDir = join(baseDir, "bundled-skills");
			mkdirSync(join(bundledDir, "skill-a"), { recursive: true });

			const initializer = createProjectInitializer({
				baseDir,
				location: "project",
				bundledSkillsDir: bundledDir,
				fs: createNodeFileSystem(),
			});

			const result = await initializer.setup({ force: false });
			expect(result.ok).toBe(true);

			const linkPath = join(baseDir, ".taskp", "skills", "skill-a");
			const target = readlinkSync(linkPath);
			const expectedRel = relative(join(baseDir, ".taskp", "skills"), join(bundledDir, "skill-a"));
			expect(target).toBe(expectedRel);
		});

		it("skips already existing skill directories", async () => {
			const bundledDir = join(baseDir, "bundled-skills");
			mkdirSync(join(bundledDir, "skill-a"), { recursive: true });

			const initializer = createProjectInitializer({
				baseDir,
				location: "project",
				bundledSkillsDir: bundledDir,
				fs: createNodeFileSystem(),
			});

			await initializer.setup({ force: false });

			const initializer2 = createProjectInitializer({
				baseDir,
				location: "project",
				bundledSkillsDir: bundledDir,
				fs: createNodeFileSystem(),
			});
			const result = await initializer2.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.linked).toHaveLength(0);
		});

		it("reports failed links when symlink creation fails", async () => {
			const bundledDir = join(baseDir, "bundled-skills");
			mkdirSync(join(bundledDir, "skill-ok"), { recursive: true });
			mkdirSync(join(bundledDir, "skill-fail"), { recursive: true });

			const skillsDir = join(baseDir, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			rmSync(skillsDir, { recursive: true });

			const initializer = createProjectInitializer({
				baseDir,
				location: "project",
				bundledSkillsDir: bundledDir,
				fs: createNodeFileSystem(),
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.failedLinks).toBeDefined();
			expect(Array.isArray(result.value.failedLinks)).toBe(true);
		});

		it("returns empty linked when bundled skills directory does not exist", async () => {
			const nonExistentDir = join(baseDir, "does-not-exist");

			const initializer = createProjectInitializer({
				baseDir,
				location: "project",
				bundledSkillsDir: nonExistentDir,
				fs: createNodeFileSystem(),
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.linked).toHaveLength(0);
			expect(result.value.failedLinks).toHaveLength(0);
		});

		it("reports individual failures with error messages", async () => {
			const bundledDir = join(baseDir, "bundled-skills");
			mkdirSync(join(bundledDir, "good-skill"), { recursive: true });
			mkdirSync(join(bundledDir, "bad-skill"), { recursive: true });

			const initializer = createProjectInitializer({
				baseDir,
				location: "project",
				bundledSkillsDir: bundledDir,
				fs: createNodeFileSystem(),
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.linked.length + result.value.failedLinks.length).toBeGreaterThan(0);
			for (const failed of result.value.failedLinks) {
				expect(failed.name).toBeTruthy();
				expect(failed.error).toBeTruthy();
			}
		});
	});
});
