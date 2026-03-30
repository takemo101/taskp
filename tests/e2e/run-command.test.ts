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

	it("includes session ID with tskp_ prefix in run output", async () => {
		createSkillFile(projectDir, "hello", NO_INPUT_SKILL);

		const result = await execaCommand(`bun run ${CLI_PATH} run hello`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toMatch(/\[tskp_[a-f0-9]{12}\]/);
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

	const ACTION_SKILL = [
		"---",
		"name: task",
		"description: Manage tasks",
		"mode: template",
		"actions:",
		"  add:",
		'    description: "Add a new task"',
		"  delete:",
		'    description: "Delete a task"',
		"  list:",
		'    description: "List tasks"',
		"---",
		"",
		"# task",
		"",
		"## action: add",
		"",
		"```bash",
		'echo "task added"',
		"```",
		"",
		"## action: delete",
		"",
		"```bash",
		'echo "task deleted"',
		"```",
		"",
		"## action: list",
		"",
		"```bash",
		'echo "task listed"',
		"```",
	].join("\n");

	it("executes a skill action with task:add", async () => {
		createSkillFile(projectDir, "task", ACTION_SKILL);

		const result = await execaCommand(`bun run ${CLI_PATH} run task:add`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("task added");
	});

	it("exits with error for task:add:extra (too many colons)", async () => {
		createSkillFile(projectDir, "task", ACTION_SKILL);

		const result = await execaCommand(`bun run ${CLI_PATH} run task:add:extra`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(3);
		expect(result.stderr).toContain("Invalid skill reference");
	});

	it("exits with error for task:unknown (nonexistent action)", async () => {
		createSkillFile(projectDir, "task", ACTION_SKILL);

		const result = await execaCommand(`bun run ${CLI_PATH} run task:unknown`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(2);
		expect(result.stderr).toContain("not found");
	});

	it("exits with error when actions skill used without action", async () => {
		createSkillFile(projectDir, "task", ACTION_SKILL);

		const result = await execaCommand(`bun run ${CLI_PATH} run task`, {
			cwd: projectDir,
			reject: false,
		});

		expect(result.exitCode).toBe(4);
		expect(result.stderr).toContain("requires an action");
		expect(result.stderr).toContain("add, delete, list");
	});
});
