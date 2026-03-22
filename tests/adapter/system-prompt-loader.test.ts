import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSystemPromptLoader } from "../../src/adapter/system-prompt-loader";

describe("SystemPromptLoader", () => {
	let projectDir: string;
	let globalDir: string;

	beforeEach(async () => {
		projectDir = await mkdtemp(join(tmpdir(), "taskp-loader-project-"));
		globalDir = await mkdtemp(join(tmpdir(), "taskp-loader-global-"));
	});

	afterEach(async () => {
		await rm(projectDir, { recursive: true, force: true });
		await rm(globalDir, { recursive: true, force: true });
	});

	it("returns undefined when no SYSTEM.md exists", async () => {
		const loader = createSystemPromptLoader(projectDir, globalDir);
		const result = await loader.load();

		expect(result).toBeUndefined();
	});

	it("loads project SYSTEM.md", async () => {
		await mkdir(join(projectDir, ".taskp"), { recursive: true });
		await writeFile(join(projectDir, ".taskp/SYSTEM.md"), "Project system prompt");

		const loader = createSystemPromptLoader(projectDir, globalDir);
		const result = await loader.load();

		expect(result).toBe("Project system prompt");
	});

	it("loads global SYSTEM.md when project has none", async () => {
		await mkdir(join(globalDir, ".taskp"), { recursive: true });
		await writeFile(join(globalDir, ".taskp/SYSTEM.md"), "Global system prompt");

		const loader = createSystemPromptLoader(projectDir, globalDir);
		const result = await loader.load();

		expect(result).toBe("Global system prompt");
	});

	it("project SYSTEM.md takes priority over global", async () => {
		await mkdir(join(projectDir, ".taskp"), { recursive: true });
		await writeFile(join(projectDir, ".taskp/SYSTEM.md"), "Project wins");
		await mkdir(join(globalDir, ".taskp"), { recursive: true });
		await writeFile(join(globalDir, ".taskp/SYSTEM.md"), "Global loses");

		const loader = createSystemPromptLoader(projectDir, globalDir);
		const result = await loader.load();

		expect(result).toBe("Project wins");
	});

	it("treats empty file as no SYSTEM.md", async () => {
		await mkdir(join(projectDir, ".taskp"), { recursive: true });
		await writeFile(join(projectDir, ".taskp/SYSTEM.md"), "   \n  ");

		const loader = createSystemPromptLoader(projectDir, globalDir);
		const result = await loader.load();

		expect(result).toBeUndefined();
	});
});
