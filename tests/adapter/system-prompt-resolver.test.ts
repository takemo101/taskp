import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSystemPromptResolver } from "../../src/adapter/system-prompt-resolver";
import type { SessionId } from "../../src/core/execution/session";

const defaultOptions = {
	toolNames: ["bash", "write"] as readonly string[],
	cwd: "/test/project",
	date: "2026-03-22",
	sessionId: "tskp_test000001" as SessionId,
};

describe("SystemPromptResolver", () => {
	let projectDir: string;
	let originalHome: string;

	beforeEach(async () => {
		projectDir = await mkdtemp(join(tmpdir(), "taskp-resolver-"));
		originalHome = process.env.HOME ?? "";
		process.env.HOME = projectDir; // グローバル SYSTEM.md もこのディレクトリ内を参照
	});

	afterEach(async () => {
		process.env.HOME = originalHome;
		await rm(projectDir, { recursive: true, force: true });
	});

	it("returns default system prompt when no SYSTEM.md exists", async () => {
		const resolver = createSystemPromptResolver(projectDir);
		const result = await resolver.resolve(defaultOptions);

		expect(result).toContain("task execution agent");
		expect(result).toContain("- bash:");
		expect(result).toContain("- write:");
		expect(result).toContain("Working directory: /test/project");
		expect(result).toContain("Date: 2026-03-22");
	});

	it("uses custom SYSTEM.md when present", async () => {
		await mkdir(join(projectDir, ".taskp"), { recursive: true });
		await writeFile(join(projectDir, ".taskp/SYSTEM.md"), "You are a custom agent.");

		const resolver = createSystemPromptResolver(projectDir);
		const result = await resolver.resolve(defaultOptions);

		expect(result).toContain("You are a custom agent.");
		// デフォルトの役割定義は含まれない
		expect(result).not.toContain("task execution agent");
	});

	it("appends tool list to custom SYSTEM.md", async () => {
		await mkdir(join(projectDir, ".taskp"), { recursive: true });
		await writeFile(join(projectDir, ".taskp/SYSTEM.md"), "Custom prompt.");

		const resolver = createSystemPromptResolver(projectDir);
		const result = await resolver.resolve(defaultOptions);

		expect(result).toContain("Custom prompt.");
		expect(result).toContain("# Available tools");
		expect(result).toContain("- bash:");
		expect(result).toContain("- write:");
	});

	it("appends environment info to custom SYSTEM.md", async () => {
		await mkdir(join(projectDir, ".taskp"), { recursive: true });
		await writeFile(join(projectDir, ".taskp/SYSTEM.md"), "Custom prompt.");

		const resolver = createSystemPromptResolver(projectDir);
		const result = await resolver.resolve(defaultOptions);

		expect(result).toContain("Working directory: /test/project");
		expect(result).toContain("Date: 2026-03-22");
	});

	it("caches SYSTEM.md content across multiple resolve calls", async () => {
		await mkdir(join(projectDir, ".taskp"), { recursive: true });
		await writeFile(join(projectDir, ".taskp/SYSTEM.md"), "Cached prompt.");

		const resolver = createSystemPromptResolver(projectDir);
		const result1 = await resolver.resolve(defaultOptions);
		// ファイルを変更してもキャッシュが使われる
		await writeFile(join(projectDir, ".taskp/SYSTEM.md"), "Modified prompt.");
		const result2 = await resolver.resolve(defaultOptions);

		expect(result1).toContain("Cached prompt.");
		expect(result2).toContain("Cached prompt.");
	});

	it("reflects different tool options on each resolve call", async () => {
		const resolver = createSystemPromptResolver(projectDir);

		const result1 = await resolver.resolve({ ...defaultOptions, toolNames: ["bash"] });
		const result2 = await resolver.resolve({ ...defaultOptions, toolNames: ["write", "glob"] });

		expect(result1).toContain("- bash:");
		expect(result1).not.toContain("- glob:");
		expect(result2).toContain("- write:");
		expect(result2).toContain("- glob:");
	});
});
