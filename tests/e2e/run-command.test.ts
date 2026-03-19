import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execaCommand } from "execa";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const CLI_PATH = join(import.meta.dirname, "../../src/cli.ts");

function createSkillFile(baseDir: string, name: string, content: string): void {
	const dir = join(baseDir, ".taskp", "skills", name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "SKILL.md"), content);
}

describe("taskp run (E2E)", () => {
	let projectDir: string;

	beforeEach(() => {
		projectDir = mkdtempSync(join(tmpdir(), "taskp-e2e-"));
	});

	afterEach(() => {
		rmSync(projectDir, { recursive: true, force: true });
	});

	const NO_INPUT_SKILL = [
		"---",
		"name: hello",
		"description: Say hello",
		"mode: template",
		"---",
		"",
		"# Hello",
		"",
		"```bash",
		'echo "Hello, World!"',
		"```",
	].join("\n");

	const INPUT_SKILL = [
		"---",
		"name: greet",
		"description: Greet someone",
		"mode: template",
		"inputs:",
		"  - name: target",
		"    type: text",
		'    message: "Who to greet?"',
		"    default: World",
		"---",
		"",
		"# Greet",
		"",
		"```bash",
		'echo "Hello, {{target}}!"',
		"```",
	].join("\n");

	it("executes a template skill without inputs", async () => {
		createSkillFile(projectDir, "hello", NO_INPUT_SKILL);

		const result = await execaCommand(`bun run ${CLI_PATH} run hello`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("Hello, World!");
		expect(result.stdout).toContain("hello completed");
	});

	it("shows rendered template with --dry-run", async () => {
		createSkillFile(projectDir, "hello", NO_INPUT_SKILL);

		const result = await execaCommand(`bun run ${CLI_PATH} run hello --dry-run`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("[dry-run]");
		expect(result.stdout).toContain('echo "Hello, World!"');
	});

	it("sets variables with --set", async () => {
		createSkillFile(projectDir, "greet", INPUT_SKILL);

		const result = await execaCommand(`bun run ${CLI_PATH} run greet --set target=Bun`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("Hello, Bun!");
	});

	it("exits with code 2 for nonexistent skill", async () => {
		const result = await execaCommand(`bun run ${CLI_PATH} run nonexistent`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(2);
		expect(result.stderr).toContain("not found");
	});
});
