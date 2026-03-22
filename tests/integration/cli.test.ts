import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execaCommand } from "execa";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseSkillRef } from "../../src/cli";

const CLI_PATH = join(import.meta.dirname, "../../src/cli.ts");

function run(args: string, cwd: string) {
	return execaCommand(`bun run ${CLI_PATH} ${args}`, { cwd, reject: false });
}

describe("parseSkillRef", () => {
	it("parses skill name without action", () => {
		expect(parseSkillRef("task")).toEqual({ name: "task", action: undefined });
	});

	it("parses skill:action format", () => {
		expect(parseSkillRef("task:add")).toEqual({ name: "task", action: "add" });
	});

	it("throws on skill:action:extra format", () => {
		expect(() => parseSkillRef("task:add:extra")).toThrow("Invalid skill reference");
	});
});

describe("CLI E2E: init → list → run", () => {
	let projectDir: string;

	beforeEach(() => {
		projectDir = mkdtempSync(join(tmpdir(), "taskp-cli-e2e-"));
	});

	afterEach(() => {
		rmSync(projectDir, { recursive: true, force: true });
	});

	it("init creates a skill, list shows it, run executes it", async () => {
		const initResult = await run("init hello", projectDir);
		expect(initResult.exitCode).toBe(0);
		expect(initResult.stdout).toContain("Created template skill");

		const listResult = await run("list", projectDir);
		expect(listResult.exitCode).toBe(0);
		expect(listResult.stdout).toContain("hello");

		const runResult = await run("run hello", projectDir);
		expect(runResult.exitCode).toBe(0);
		expect(runResult.stdout).toContain("Hello from hello");
		expect(runResult.stdout).toContain("hello completed");
	});

	it("init with --mode template creates a template skill", async () => {
		const initResult = await run("init greet --mode template", projectDir);
		expect(initResult.exitCode).toBe(0);

		const runResult = await run("run greet", projectDir);
		expect(runResult.exitCode).toBe(0);
		expect(runResult.stdout).toContain("Hello from greet");
	});

	it("init rejects duplicate skill names", async () => {
		await run("init dup-skill", projectDir);
		const secondInit = await run("init dup-skill", projectDir);

		expect(secondInit.exitCode).not.toBe(0);
		expect(secondInit.stderr).toContain("already exists");
	});

	it("list shows empty message when no skills exist", async () => {
		const result = await run("list --local", projectDir);
		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("No skills found");
	});

	it("run exits with error for nonexistent skill", async () => {
		const result = await run("run nonexistent", projectDir);
		expect(result.exitCode).toBe(2);
		expect(result.stderr).toContain("not found");
	});
});
