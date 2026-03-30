import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createOutputFileStore } from "../../src/adapter/output-file-store";

const TEST_SESSION_ID = "tskp_test_output_001";
const SESSION_DIR = join("/tmp/taskp", TEST_SESSION_ID);

describe("OutputFileStore", () => {
	const store = createOutputFileStore();

	afterEach(async () => {
		await store.cleanup(TEST_SESSION_ID).catch(() => {});
	});

	describe("prepare", () => {
		it("セッションディレクトリを作成する", async () => {
			await store.prepare(TEST_SESSION_ID);

			const dirStat = await stat(SESSION_DIR);
			expect(dirStat.isDirectory()).toBe(true);
		});

		it("空の output.txt を作成する", async () => {
			const outputPath = await store.prepare(TEST_SESSION_ID);

			const content = await readFile(outputPath, "utf-8");
			expect(content).toBe("");
		});

		it("出力ファイルのパスを返す", async () => {
			const outputPath = await store.prepare(TEST_SESSION_ID);

			expect(outputPath).toBe(join(SESSION_DIR, "output.txt"));
		});

		it("既にディレクトリが存在しても成功する", async () => {
			await store.prepare(TEST_SESSION_ID);
			const outputPath = await store.prepare(TEST_SESSION_ID);

			expect(outputPath).toBe(join(SESSION_DIR, "output.txt"));
		});
	});

	describe("write", () => {
		it("内容をファイルに書き込む", async () => {
			const outputPath = await store.prepare(TEST_SESSION_ID);

			await store.write(outputPath, "hello world");

			const content = await readFile(outputPath, "utf-8");
			expect(content).toBe("hello world");
		});

		it("既存の内容を上書きする", async () => {
			const outputPath = await store.prepare(TEST_SESSION_ID);

			await store.write(outputPath, "first");
			await store.write(outputPath, "second");

			const content = await readFile(outputPath, "utf-8");
			expect(content).toBe("second");
		});

		it("マルチバイト文字を正しく書き込む", async () => {
			const outputPath = await store.prepare(TEST_SESSION_ID);

			await store.write(outputPath, "日本語テスト 🎉");

			const content = await readFile(outputPath, "utf-8");
			expect(content).toBe("日本語テスト 🎉");
		});
	});

	describe("cleanup", () => {
		it("セッションディレクトリを削除する", async () => {
			await store.prepare(TEST_SESSION_ID);

			await store.cleanup(TEST_SESSION_ID);

			expect(existsSync(SESSION_DIR)).toBe(false);
		});

		it("存在しないセッションでもエラーにならない", async () => {
			await expect(store.cleanup("tskp_nonexistent")).resolves.toBeUndefined();
		});
	});

	describe("lifecycle", () => {
		it("prepare → write → cleanup の完全なライフサイクル", async () => {
			const outputPath = await store.prepare(TEST_SESSION_ID);
			expect(existsSync(outputPath)).toBe(true);

			await store.write(outputPath, "lifecycle test content");
			const content = await readFile(outputPath, "utf-8");
			expect(content).toBe("lifecycle test content");

			await store.cleanup(TEST_SESSION_ID);
			expect(existsSync(SESSION_DIR)).toBe(false);
		});
	});
});
