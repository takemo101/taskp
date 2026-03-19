import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildTools, TOOL_NAMES } from "../../../src/core/execution/agent-tools";

describe("buildTools", () => {
	it("指定したツール名に対応するツールを返す", () => {
		const tools = buildTools(["bash", "read"]);
		expect(Object.keys(tools)).toEqual(["bash", "read"]);
		expect(tools.bash.execute).toBeTypeOf("function");
		expect(tools.read.execute).toBeTypeOf("function");
	});

	it("すべてのツールを取得できる", () => {
		const tools = buildTools([...TOOL_NAMES]);
		expect(Object.keys(tools)).toHaveLength(5);
	});

	it("空のツール名配列で空のオブジェクトを返す", () => {
		const tools = buildTools([]);
		expect(Object.keys(tools)).toHaveLength(0);
	});

	it("不明なツール名でエラーを投げる", () => {
		expect(() => buildTools(["unknown_tool"])).toThrow("Unknown tool: unknown_tool");
	});
});

describe("bash tool", () => {
	it("シェルコマンドを実行して stdout を返す", async () => {
		const tools = buildTools(["bash"]);
		const result = await tools.bash.execute?.(
			{ command: "echo hello" },
			{ toolCallId: "1", messages: [], abortSignal: AbortSignal.timeout(5000) },
		);
		expect(result).toEqual({ stdout: "hello", stderr: "", exitCode: 0 });
	});

	it("失敗したコマンドの exitCode と stderr を返す", async () => {
		const tools = buildTools(["bash"]);
		const result = (await tools.bash.execute?.(
			{ command: "echo err >&2 && exit 1" },
			{ toolCallId: "2", messages: [], abortSignal: AbortSignal.timeout(5000) },
		)) as { stdout: string; stderr: string; exitCode: number };
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toBe("err");
	});
});

describe("read tool", () => {
	it("ファイルの内容を読み込む", async () => {
		const tools = buildTools(["read"]);
		const result = await tools.read.execute?.(
			{ path: join(__dirname, "agent-tools.test.ts") },
			{ toolCallId: "3", messages: [], abortSignal: AbortSignal.timeout(5000) },
		);
		expect(result).toContain("describe");
	});
});

describe("write tool", () => {
	it("ファイルに内容を書き込む", async () => {
		const dir = await mkdtemp(join(tmpdir(), "agent-tools-test-"));
		const filePath = join(dir, "test.txt");
		try {
			const tools = buildTools(["write"]);
			const result = await tools.write.execute?.(
				{ path: filePath, content: "hello world" },
				{ toolCallId: "4", messages: [], abortSignal: AbortSignal.timeout(5000) },
			);
			expect(result).toBe(`Written to ${filePath}`);
			const written = await readFile(filePath, "utf-8");
			expect(written).toBe("hello world");
		} finally {
			await rm(dir, { recursive: true });
		}
	});
});

describe("glob tool", () => {
	it("パターンにマッチするファイルを返す", async () => {
		const tools = buildTools(["glob"]);
		const result = (await tools.glob.execute?.(
			{ pattern: "tests/core/execution/*.test.ts" },
			{ toolCallId: "5", messages: [], abortSignal: AbortSignal.timeout(5000) },
		)) as string[];
		expect(result).toContain("tests/core/execution/agent-tools.test.ts");
	});
});
