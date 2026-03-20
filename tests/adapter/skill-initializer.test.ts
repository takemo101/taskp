import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSkillInitializer } from "../../src/adapter/skill-initializer";

describe("createSkillInitializer", () => {
	let baseDir: string;

	beforeEach(() => {
		baseDir = mkdtempSync(join(tmpdir(), "taskp-init-"));
	});

	afterEach(() => {
		rmSync(baseDir, { recursive: true, force: true });
	});

	it("creates SKILL.md in the correct directory", async () => {
		const initializer = createSkillInitializer({ baseDir });

		const result = await initializer.create("my-task", {
			mode: "template",
			description: "my-task skill",
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			const expectedPath = join(baseDir, ".taskp/skills/my-task/SKILL.md");
			expect(result.value).toBe(expectedPath);
			expect(existsSync(expectedPath)).toBe(true);
		}
	});

	it("generates template mode content", async () => {
		const initializer = createSkillInitializer({ baseDir });

		await initializer.create("deploy", {
			mode: "template",
			description: "deploy skill",
		});

		const content = readFileSync(join(baseDir, ".taskp/skills/deploy/SKILL.md"), "utf-8");
		expect(content).toContain("name: deploy");
		expect(content).toContain("description: deploy skill");
		expect(content).toContain("mode: template");
		expect(content).toContain("inputs: []");
		expect(content).toContain("```bash");
	});

	it("returns error when directory creation fails", async () => {
		const initializer = createSkillInitializer({ baseDir: "/nonexistent/readonly/path" });

		const result = await initializer.create("my-task", {
			mode: "template",
			description: "my-task skill",
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toContain('Failed to create skill "my-task"');
		}
	});

	it("generates agent mode content", async () => {
		const initializer = createSkillInitializer({ baseDir });

		await initializer.create("review", {
			mode: "agent",
			description: "review skill",
		});

		const content = readFileSync(join(baseDir, ".taskp/skills/review/SKILL.md"), "utf-8");
		expect(content).toContain("name: review");
		expect(content).toContain("description: review skill");
		expect(content).toContain("mode: agent");
		expect(content).not.toContain("inputs:");
		expect(content).not.toContain("```bash");
	});
});
