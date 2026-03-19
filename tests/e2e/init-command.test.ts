import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execaCommand } from "execa";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const CLI_PATH = join(import.meta.dirname, "../../src/cli.ts");

describe("taskp init (E2E)", () => {
	let projectDir: string;

	beforeEach(() => {
		projectDir = mkdtempSync(join(tmpdir(), "taskp-init-e2e-"));
	});

	afterEach(() => {
		rmSync(projectDir, { recursive: true, force: true });
	});

	it("creates a template skill scaffold", async () => {
		const result = await execaCommand(`bun run ${CLI_PATH} init my-task`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("my-task");

		const skillPath = join(projectDir, ".taskp/skills/my-task/SKILL.md");
		expect(existsSync(skillPath)).toBe(true);

		const content = readFileSync(skillPath, "utf-8");
		expect(content).toContain("name: my-task");
		expect(content).toContain("mode: template");
		expect(content).toContain("inputs: []");
	});

	it("creates an agent mode skill with --mode agent", async () => {
		const result = await execaCommand(`bun run ${CLI_PATH} init review --mode agent`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(0);

		const skillPath = join(projectDir, ".taskp/skills/review/SKILL.md");
		expect(existsSync(skillPath)).toBe(true);

		const content = readFileSync(skillPath, "utf-8");
		expect(content).toContain("name: review");
		expect(content).toContain("mode: agent");
	});

	it("creates a skill in global directory with --global", async () => {
		const globalDir = mkdtempSync(join(tmpdir(), "taskp-global-e2e-"));

		try {
			const result = await execaCommand(`bun run ${CLI_PATH} init my-global-task --global`, {
				cwd: projectDir,
				reject: false,
				env: { HOME: globalDir },
			});

			expect(result.exitCode).toBe(0);

			const skillPath = join(globalDir, ".taskp/skills/my-global-task/SKILL.md");
			expect(existsSync(skillPath)).toBe(true);
		} finally {
			rmSync(globalDir, { recursive: true, force: true });
		}
	});

	it("outputs the created file path", async () => {
		const result = await execaCommand(`bun run ${CLI_PATH} init path-test`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("path-test");
		expect(result.stdout).toContain("SKILL.md");
	});
});
