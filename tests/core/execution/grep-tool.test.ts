import { mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { grepTool } from "../../../src/core/execution/tools/grep-tool";

const TEST_DIR = resolve(import.meta.dirname, "__grep-tool-fixture__");

beforeEach(async () => {
	await mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
	await rm(TEST_DIR, { recursive: true, force: true });
});

type GrepResult = {
	readonly matches: string;
	readonly count: number;
	readonly truncated: boolean;
	readonly skipped: readonly { readonly file: string; readonly reason: string }[];
};

async function execute(args: {
	pattern: string;
	path?: string;
	include?: string;
}): Promise<GrepResult> {
	const originalCwd = process.cwd;
	process.cwd = () => TEST_DIR;
	try {
		const result = await grepTool.execute?.(args, {
			toolCallId: "test",
			messages: [],
			abortSignal: new AbortController().signal,
		});
		if (!result || Symbol.asyncIterator in Object(result)) {
			throw new Error("Unexpected result type");
		}
		return result as GrepResult;
	} finally {
		process.cwd = originalCwd;
	}
}

describe("grepTool", () => {
	test("returns matching lines with file path and line number", async () => {
		await writeFile(join(TEST_DIR, "hello.txt"), "hello world\nfoo bar\nhello again");

		const result = await execute({ pattern: "hello", path: "hello.txt" });

		expect(result.count).toBe(2);
		expect(result.matches).toContain("hello.txt:1:hello world");
		expect(result.matches).toContain("hello.txt:3:hello again");
		expect(result.skipped).toEqual([]);
	});

	test("returns empty skipped array when all files are readable", async () => {
		await writeFile(join(TEST_DIR, "a.ts"), "const x = 1;");

		const result = await execute({ pattern: "const", path: "." });

		expect(result.skipped).toEqual([]);
		expect(result.count).toBe(1);
	});

	test("tracks skipped files when readFile fails", async () => {
		await writeFile(join(TEST_DIR, "good.txt"), "match this line");
		await symlink(join(TEST_DIR, "nonexistent-target"), join(TEST_DIR, "broken-link.txt"));

		const result = await execute({ pattern: "match", path: "." });

		expect(result.count).toBe(1);
		expect(result.skipped.length).toBeGreaterThanOrEqual(1);
		const hasbrokenLink = result.skipped.some((s: { readonly file: string }) =>
			s.file.includes("broken-link.txt"),
		);
		expect(hasbrokenLink).toBe(true);
		const allHaveReasons = result.skipped.every(
			(s: { readonly reason: string }) => s.reason.length > 0,
		);
		expect(allHaveReasons).toBe(true);
	});

	test("throws when path does not exist", async () => {
		await expect(execute({ pattern: "foo", path: "nonexistent" })).rejects.toThrow(
			"Path not found: nonexistent",
		);
	});

	test("returns truncated flag when matches exceed limit", async () => {
		const lines = Array.from({ length: 600 }, (_, i) => `line${i}`).join("\n");
		await writeFile(join(TEST_DIR, "big.txt"), lines);

		const result = await execute({ pattern: "line", path: "big.txt" });

		expect(result.truncated).toBe(true);
		expect(result.count).toBe(500);
	});
});
