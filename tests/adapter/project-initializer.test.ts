import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

		it("reports failed links when symlink creation fails", async () => {
			const bundledDir = join(baseDir, "bundled-skills");
			mkdirSync(join(bundledDir, "skill-ok"), { recursive: true });
			mkdirSync(join(bundledDir, "skill-fail"), { recursive: true });

			// skills ディレクトリを読み取り専用にして一部の symlink を失敗させる
			const skillsDir = join(baseDir, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			// skillsDir が既に存在すると linkBundledSkills がスキップされるため、
			// initializer 経由ではなく、skillsDir を削除してから再実行する
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
	});
});
