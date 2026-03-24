import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	buildTaskpRunDescription,
	buildTools,
	getPrimaryArgKey,
	MAX_FETCH_LENGTH,
	MAX_GREP_MATCHES,
	MAX_NESTING_DEPTH,
	resolveSkillMode,
	TOOL_NAMES,
	validateFetchUrl,
	validateTaskpRunCall,
} from "../../../src/core/execution/agent-tools";
import type { Skill } from "../../../src/core/skill/skill";

describe("buildTools", () => {
	it("指定したツール名に対応するツールを返す", () => {
		const result = buildTools(["bash", "read"]);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(Object.keys(result.value)).toEqual(["bash", "read"]);
		expect(result.value.bash.execute).toBeTypeOf("function");
		expect(result.value.read.execute).toBeTypeOf("function");
	});

	it("taskp_run 以外の静的ツールをすべて取得できる", () => {
		const staticNames = TOOL_NAMES.filter((n) => n !== "taskp_run");
		const result = buildTools(staticNames);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(Object.keys(result.value)).toHaveLength(staticNames.length);
	});

	it("空のツール名配列で空のオブジェクトを返す", () => {
		const result = buildTools([]);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(Object.keys(result.value)).toHaveLength(0);
	});

	it("edit ツールを生成できる", () => {
		const result = buildTools(["edit"]);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(Object.keys(result.value)).toEqual(["edit"]);
		expect(result.value.edit.execute).toBeTypeOf("function");
	});

	it("不明なツール名で ExecutionError を返す", () => {
		const result = buildTools(["unknown_tool"]);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toEqual({
			type: "EXECUTION_ERROR",
			message: "Unknown tool: unknown_tool",
		});
	});
});

function unwrapTools(toolNames: readonly string[]) {
	const result = buildTools(toolNames);
	if (!result.ok) throw new Error("buildTools failed unexpectedly");
	return result.value;
}

describe("bash tool", () => {
	it("シェルコマンドを実行して stdout を返す", async () => {
		const tools = unwrapTools(["bash"]);
		const result = await tools.bash.execute?.(
			{ command: "echo hello" },
			{ toolCallId: "1", messages: [], abortSignal: AbortSignal.timeout(5000) },
		);
		expect(result).toEqual({ stdout: "hello", stderr: "", exitCode: 0 });
	});

	it("失敗したコマンドの exitCode と stderr を返す", async () => {
		const tools = unwrapTools(["bash"]);
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
		const tools = unwrapTools(["read"]);
		const result = await tools.read.execute?.(
			{ path: join(__dirname, "agent-tools.test.ts") },
			{ toolCallId: "3", messages: [], abortSignal: AbortSignal.timeout(5000) },
		);
		expect(result).toContain("describe");
	});

	it("存在しないファイルでエラーを投げる", async () => {
		const tools = unwrapTools(["read"]);
		await expect(
			tools.read.execute?.(
				{ path: "/nonexistent/path/file.txt" },
				{ toolCallId: "3", messages: [], abortSignal: AbortSignal.timeout(5000) },
			),
		).rejects.toThrow("Failed to read file: /nonexistent/path/file.txt");
	});
});

describe("write tool", () => {
	it("ファイルに内容を書き込む", async () => {
		const dir = await mkdtemp(join(tmpdir(), "agent-tools-test-"));
		const filePath = join(dir, "test.txt");
		try {
			const tools = unwrapTools(["write"]);
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

	it("存在しないディレクトリへの書き込みでエラーを投げる", async () => {
		const tools = unwrapTools(["write"]);
		const invalidPath = "/nonexistent/dir/file.txt";
		await expect(
			tools.write.execute?.(
				{ path: invalidPath, content: "test" },
				{ toolCallId: "4", messages: [], abortSignal: AbortSignal.timeout(5000) },
			),
		).rejects.toThrow(`Failed to write file: ${invalidPath}`);
	});
});

describe("glob tool", () => {
	it("パターンにマッチするファイルを返す", async () => {
		const tools = unwrapTools(["glob"]);
		const result = (await tools.glob.execute?.(
			{ pattern: "tests/core/execution/*.test.ts" },
			{ toolCallId: "5", messages: [], abortSignal: AbortSignal.timeout(5000) },
		)) as string[];
		expect(result).toContain("tests/core/execution/agent-tools.test.ts");
	});
});

describe("edit tool", () => {
	it("ファイルの一部を置換する", async () => {
		const dir = await mkdtemp(join(tmpdir(), "agent-tools-test-"));
		const filePath = join(dir, "test.txt");
		try {
			await writeFile(filePath, "hello world foo bar", "utf-8");
			const tools = unwrapTools(["edit"]);
			const result = await tools.edit.execute?.(
				{ path: filePath, oldString: "world", newString: "universe" },
				{ toolCallId: "e1", messages: [], abortSignal: AbortSignal.timeout(5000) },
			);
			expect(result).toBe(`Edited ${filePath}`);
			const content = await readFile(filePath, "utf-8");
			expect(content).toBe("hello universe foo bar");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	it("oldString が見つからない場合エラーを投げる", async () => {
		const dir = await mkdtemp(join(tmpdir(), "agent-tools-test-"));
		const filePath = join(dir, "test.txt");
		try {
			await writeFile(filePath, "hello world", "utf-8");
			const tools = unwrapTools(["edit"]);
			await expect(
				tools.edit.execute?.(
					{ path: filePath, oldString: "nonexistent", newString: "replaced" },
					{ toolCallId: "e2", messages: [], abortSignal: AbortSignal.timeout(5000) },
				),
			).rejects.toThrow(`String not found in ${filePath}`);
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	it("複数マッチ時にエラーを投げる", async () => {
		const dir = await mkdtemp(join(tmpdir(), "agent-tools-test-"));
		const filePath = join(dir, "test.txt");
		try {
			await writeFile(filePath, "hello hello hello", "utf-8");
			const tools = unwrapTools(["edit"]);
			await expect(
				tools.edit.execute?.(
					{ path: filePath, oldString: "hello", newString: "hi" },
					{ toolCallId: "e3", messages: [], abortSignal: AbortSignal.timeout(5000) },
				),
			).rejects.toThrow(`Multiple matches found in ${filePath}`);
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	it("存在しないファイルでエラーを投げる", async () => {
		const tools = unwrapTools(["edit"]);
		const invalidPath = "/nonexistent/path/file.txt";
		await expect(
			tools.edit.execute?.(
				{ path: invalidPath, oldString: "old", newString: "new" },
				{ toolCallId: "e4", messages: [], abortSignal: AbortSignal.timeout(5000) },
			),
		).rejects.toThrow(`Failed to read file: ${invalidPath}`);
	});
});

describe("grep tool", () => {
	const toolCallOpts = {
		toolCallId: "grep-1",
		messages: [],
		abortSignal: AbortSignal.timeout(10_000),
	};

	it("buildTools に grep を渡してツールが生成される", () => {
		const result = buildTools(["grep"]);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.grep).toBeDefined();
		expect(result.value.grep.execute).toBeTypeOf("function");
	});

	it("パターンマッチ結果がファイルパス・行番号付きで返る", async () => {
		const dir = await mkdtemp(join(tmpdir(), "grep-test-"));
		try {
			await writeFile(join(dir, "hello.txt"), "hello world\nfoo bar\nhello again\n");
			const tools = unwrapTools(["grep"]);
			const result = (await tools.grep.execute?.(
				{ pattern: "hello", path: dir },
				toolCallOpts,
			)) as { matches: string; count: number; truncated: boolean };
			expect(result.count).toBe(2);
			expect(result.truncated).toBe(false);
			const lines = result.matches.split("\n");
			expect(lines[0]).toContain("hello.txt:1:hello world");
			expect(lines[1]).toContain("hello.txt:3:hello again");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	it("include でファイル種別を絞り込める", async () => {
		const dir = await mkdtemp(join(tmpdir(), "grep-test-"));
		try {
			await writeFile(join(dir, "app.ts"), "const x = 1;\n");
			await writeFile(join(dir, "app.js"), "const x = 1;\n");
			const tools = unwrapTools(["grep"]);
			const result = (await tools.grep.execute?.(
				{ pattern: "const", path: dir, include: "*.ts" },
				toolCallOpts,
			)) as { matches: string; count: number; truncated: boolean };
			expect(result.count).toBe(1);
			expect(result.matches).toContain("app.ts");
			expect(result.matches).not.toContain("app.js");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	it("マッチなしの場合は空文字列・count: 0 を返す", async () => {
		const dir = await mkdtemp(join(tmpdir(), "grep-test-"));
		try {
			await writeFile(join(dir, "file.txt"), "nothing here\n");
			const tools = unwrapTools(["grep"]);
			const result = (await tools.grep.execute?.(
				{ pattern: "ZZZZZ_NO_MATCH", path: dir },
				toolCallOpts,
			)) as { matches: string; count: number; truncated: boolean };
			expect(result.matches).toBe("");
			expect(result.count).toBe(0);
			expect(result.truncated).toBe(false);
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	it("MAX_GREP_MATCHES で打ち切りが発生する", async () => {
		const dir = await mkdtemp(join(tmpdir(), "grep-test-"));
		try {
			const lines = Array.from({ length: MAX_GREP_MATCHES + 100 }, (_, i) => `match-${i}`);
			await writeFile(join(dir, "big.txt"), lines.join("\n"));
			const tools = unwrapTools(["grep"]);
			const result = (await tools.grep.execute?.(
				{ pattern: "match-", path: dir },
				toolCallOpts,
			)) as { matches: string; count: number; truncated: boolean };
			expect(result.count).toBe(MAX_GREP_MATCHES);
			expect(result.truncated).toBe(true);
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	it("不正な正規表現でエラーを投げる", async () => {
		const tools = unwrapTools(["grep"]);
		await expect(
			tools.grep.execute?.({ pattern: "[invalid", path: "." }, toolCallOpts),
		).rejects.toThrow();
	});

	it("単一ファイルを直接検索できる", async () => {
		const dir = await mkdtemp(join(tmpdir(), "grep-test-"));
		try {
			await writeFile(join(dir, "target.txt"), "line1\nfind me\nline3\n");
			const tools = unwrapTools(["grep"]);
			const result = (await tools.grep.execute?.(
				{ pattern: "find me", path: join(dir, "target.txt") },
				toolCallOpts,
			)) as { matches: string; count: number; truncated: boolean };
			expect(result.count).toBe(1);
			expect(result.matches).toContain(":2:find me");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	it("サブディレクトリのファイルも再帰的に検索する", async () => {
		const dir = await mkdtemp(join(tmpdir(), "grep-test-"));
		try {
			const subDir = join(dir, "sub");
			await mkdir(subDir);
			await writeFile(join(dir, "root.txt"), "target line\n");
			await writeFile(join(subDir, "nested.txt"), "target line\n");
			const tools = unwrapTools(["grep"]);
			const result = (await tools.grep.execute?.(
				{ pattern: "target", path: dir },
				toolCallOpts,
			)) as { matches: string; count: number; truncated: boolean };
			expect(result.count).toBe(2);
			expect(result.matches).toContain("root.txt");
			expect(result.matches).toContain("nested.txt");
		} finally {
			await rm(dir, { recursive: true });
		}
	});

	it("存在しないパスでエラーを投げる", async () => {
		const tools = unwrapTools(["grep"]);
		await expect(
			tools.grep.execute?.({ pattern: "test", path: "/nonexistent/path" }, toolCallOpts),
		).rejects.toThrow("Path not found");
	});

	it("存在しないディレクトリでエラーを投げる", async () => {
		const tools = unwrapTools(["grep"]);
		await expect(
			tools.grep.execute?.(
				{ pattern: "test", path: "/tmp/surely-does-not-exist-xyz" },
				toolCallOpts,
			),
		).rejects.toThrow("Path not found");
	});
});

describe("fetch tool", () => {
	it("buildTools に fetch を渡してツールが生成される", () => {
		const result = buildTools(["fetch"]);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.fetch).toBeDefined();
		expect(result.value.fetch.execute).toBeTypeOf("function");
	});
});

describe("validateFetchUrl", () => {
	it("https URL を許可する", () => {
		expect(() => validateFetchUrl("https://example.com")).not.toThrow();
	});

	it("http URL を許可する", () => {
		expect(() => validateFetchUrl("http://example.com")).not.toThrow();
	});

	it("file:// プロトコルを拒否する", () => {
		expect(() => validateFetchUrl("file:///etc/passwd")).toThrow(
			"Unsupported protocol: file:. Only http and https are allowed.",
		);
	});

	it("ftp:// プロトコルを拒否する", () => {
		expect(() => validateFetchUrl("ftp://example.com")).toThrow("Unsupported protocol: ftp:");
	});

	it("localhost を拒否する", () => {
		expect(() => validateFetchUrl("http://localhost:8080")).toThrow(
			"Access to internal/private addresses is not allowed: localhost",
		);
	});

	it("127.0.0.1 を拒否する", () => {
		expect(() => validateFetchUrl("http://127.0.0.1")).toThrow(
			"Access to internal/private addresses is not allowed: 127.0.0.1",
		);
	});

	it("::1 を拒否する", () => {
		expect(() => validateFetchUrl("http://[::1]")).toThrow(
			"Access to internal/private addresses is not allowed: [::1]",
		);
	});

	it("0.0.0.0 を拒否する", () => {
		expect(() => validateFetchUrl("http://0.0.0.0")).toThrow(
			"Access to internal/private addresses is not allowed: 0.0.0.0",
		);
	});

	it("クラウドメタデータエンドポイントを拒否する", () => {
		expect(() => validateFetchUrl("http://169.254.169.254/latest/meta-data")).toThrow(
			"Access to internal/private addresses is not allowed: 169.254.169.254",
		);
	});

	it("192.168.x.x プライベート IP を拒否する", () => {
		expect(() => validateFetchUrl("http://192.168.1.1")).toThrow(
			"Access to internal/private addresses is not allowed: 192.168.1.1",
		);
	});

	it("10.x.x.x プライベート IP を拒否する", () => {
		expect(() => validateFetchUrl("http://10.0.0.1")).toThrow(
			"Access to internal/private addresses is not allowed: 10.0.0.1",
		);
	});

	it("172.16.0.0/12 プライベート IP を拒否する", () => {
		expect(() => validateFetchUrl("http://172.16.0.1")).toThrow(
			"Access to internal/private addresses is not allowed: 172.16.0.1",
		);
		expect(() => validateFetchUrl("http://172.31.255.255")).toThrow(
			"Access to internal/private addresses is not allowed: 172.31.255.255",
		);
	});

	it("172.x.x.x の非プライベート範囲は許可する", () => {
		expect(() => validateFetchUrl("http://172.15.0.1")).not.toThrow();
		expect(() => validateFetchUrl("http://172.32.0.1")).not.toThrow();
	});

	it("不正な URL でエラーを投げる", () => {
		expect(() => validateFetchUrl("not-a-url")).toThrow();
	});
});

describe("fetch tool redirect prevention", () => {
	it("redirect: 'error' を設定して SSRF バイパスを防止する", async () => {
		const result = buildTools(["fetch"]);
		if (!result.ok) throw new Error("buildTools failed");

		const fetchExecute = result.value.fetch.execute;
		if (!fetchExecute) throw new Error("fetch.execute is undefined");

		let capturedInit: RequestInit | undefined;
		const originalFetch = globalThis.fetch;
		globalThis.fetch = ((_input: string | URL | Request, init?: RequestInit) => {
			capturedInit = init;
			return Promise.resolve(
				new Response("ok", {
					status: 200,
					headers: { "content-type": "text/plain" },
				}),
			);
		}) as typeof globalThis.fetch;

		try {
			await fetchExecute(
				{ url: "https://example.com" },
				{ toolCallId: "test", messages: [], abortSignal: AbortSignal.timeout(5000) },
			);
			expect(capturedInit?.redirect).toBe("error");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});

describe("fetch tool truncation", () => {
	it("MAX_FETCH_LENGTH のデフォルト値が 50000 である", () => {
		expect(MAX_FETCH_LENGTH).toBe(50_000);
	});
});

describe("buildTools with descriptionOverrides", () => {
	it("指定したツールの description を上書きする", () => {
		const result = buildTools(["bash"], {
			descriptionOverrides: { bash: "Custom bash description" },
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.bash.description).toBe("Custom bash description");
	});

	it("上書き対象外のツールは元の description を維持する", () => {
		const result = buildTools(["bash", "read"], {
			descriptionOverrides: { bash: "Overridden" },
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.bash.description).toBe("Overridden");
		expect(result.value.read.description).toBe("Read the contents of a file");
	});
});

function createSkillFixture(overrides: {
	readonly name: string;
	readonly description: string;
	readonly mode?: "template" | "agent";
	readonly actions?: Record<
		string,
		{ readonly description: string; readonly mode?: "template" | "agent" }
	>;
}): Skill {
	const actions = overrides.actions
		? Object.fromEntries(
				Object.entries(overrides.actions).map(([key, action]) => [key, { ...action }]),
			)
		: undefined;

	return {
		metadata: {
			name: overrides.name,
			description: overrides.description,
			mode: overrides.mode ?? "template",
			inputs: [],
			tools: ["bash", "read", "write"],
			context: [],
			actions,
		},
		body: {
			content: "",
			extractCodeBlocks: () => [],
			extractActionSection: () => undefined,
			extractActionCodeBlocks: () => [],
		},
		location: `/skills/${overrides.name}/SKILL.md`,
		scope: "local",
	};
}

describe("buildTaskpRunDescription", () => {
	it("通常のスキル一覧を description に含める", () => {
		const skills = [
			createSkillFixture({ name: "deploy", description: "アプリケーションをデプロイする" }),
			createSkillFixture({ name: "test", description: "テストを実行する" }),
		];

		const result = buildTaskpRunDescription(skills);

		expect(result).toContain("Available skills:");
		expect(result).toContain("- deploy: アプリケーションをデプロイする");
		expect(result).toContain("- test: テストを実行する");
	});

	it("アクション付きスキルをアクションごとに展開表示する", () => {
		const skills = [
			createSkillFixture({
				name: "task",
				description: "タスクを管理する",
				actions: {
					add: { description: "タスクを追加する" },
					delete: { description: "タスクを削除する" },
					list: { description: "タスク一覧を表示する" },
				},
			}),
		];

		const result = buildTaskpRunDescription(skills);

		expect(result).toContain("- task: タスクを管理する");
		expect(result).toContain("  - task:add: タスクを追加する");
		expect(result).toContain("  - task:delete: タスクを削除する");
		expect(result).toContain("  - task:list: タスク一覧を表示する");
	});

	it("agent モードのスキルを一覧から除外する", () => {
		const skills = [
			createSkillFixture({ name: "deploy", description: "デプロイ", mode: "template" }),
			createSkillFixture({ name: "chat", description: "チャット", mode: "agent" }),
		];

		const result = buildTaskpRunDescription(skills);

		expect(result).toContain("- deploy: デプロイ");
		expect(result).not.toContain("chat");
	});

	it("agent モードのアクションを一覧から除外する", () => {
		const skills = [
			createSkillFixture({
				name: "task",
				description: "タスクを管理する",
				actions: {
					add: { description: "追加する", mode: "template" },
					chat: { description: "チャットする", mode: "agent" },
				},
			}),
		];

		const result = buildTaskpRunDescription(skills);

		expect(result).toContain("  - task:add: 追加する");
		expect(result).not.toContain("chat");
	});

	it("空のスキル一覧ではベース description のみ返す", () => {
		const result = buildTaskpRunDescription([]);

		expect(result).toBe(
			"Run another taskp skill or action. Only template-mode skills can be invoked.",
		);
		expect(result).not.toContain("Available skills:");
	});

	it("実行中のスキル自身を一覧から除外する", () => {
		const skills = [
			createSkillFixture({ name: "deploy", description: "デプロイ" }),
			createSkillFixture({ name: "current", description: "現在のスキル" }),
		];

		const result = buildTaskpRunDescription(skills, "current");

		expect(result).toContain("- deploy: デプロイ");
		expect(result).not.toContain("current");
	});

	it("全アクションが agent モードのスキルは表示しない", () => {
		const skills = [
			createSkillFixture({
				name: "agent-only",
				description: "エージェント専用",
				actions: {
					a: { description: "A", mode: "agent" },
					b: { description: "B", mode: "agent" },
				},
			}),
		];

		const result = buildTaskpRunDescription(skills);

		expect(result).not.toContain("agent-only");
	});
});

describe("getPrimaryArgKey", () => {
	it("returns the primary arg key for known tools", () => {
		expect(getPrimaryArgKey("bash")).toBe("command");
		expect(getPrimaryArgKey("read")).toBe("path");
		expect(getPrimaryArgKey("write")).toBe("path");
		expect(getPrimaryArgKey("edit")).toBe("path");
		expect(getPrimaryArgKey("glob")).toBe("pattern");
		expect(getPrimaryArgKey("grep")).toBe("pattern");
		expect(getPrimaryArgKey("fetch")).toBe("url");
		expect(getPrimaryArgKey("ask_user")).toBe("question");
		expect(getPrimaryArgKey("taskp_run")).toBe("skill");
	});

	it("returns undefined for unknown tools", () => {
		expect(getPrimaryArgKey("custom")).toBeUndefined();
		expect(getPrimaryArgKey("")).toBeUndefined();
	});
});

describe("validateTaskpRunCall", () => {
	it("再帰呼び出しを検出してエラーを返す", () => {
		const result = validateTaskpRunCall("deploy", ["deploy"]);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toBe("Recursive call detected: deploy");
	});

	it("アクション付きスキルIDの再帰を検出する", () => {
		const result = validateTaskpRunCall("task:add", ["task:add"]);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toBe("Recursive call detected: task:add");
	});

	it("最大ネスト深度を超えた場合エラーを返す", () => {
		const callStack = Array.from({ length: MAX_NESTING_DEPTH }, (_, i) => `skill-${i}`);
		const result = validateTaskpRunCall("new-skill", callStack);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain("Maximum nesting depth");
	});

	it("有効な呼び出しで ok を返す", () => {
		const result = validateTaskpRunCall("deploy", ["test"]);
		expect(result.ok).toBe(true);
	});

	it("空のコールスタックで ok を返す", () => {
		const result = validateTaskpRunCall("deploy", []);
		expect(result.ok).toBe(true);
	});
});

describe("resolveSkillMode", () => {
	it("アクション未指定でスキルのモードを返す", () => {
		const skill = createSkillFixture({ name: "s", description: "d", mode: "template" });
		expect(resolveSkillMode(skill)).toBe("template");
	});

	it("アクション指定でアクションのモードを返す", () => {
		const skill = createSkillFixture({
			name: "s",
			description: "d",
			mode: "template",
			actions: { run: { description: "run", mode: "agent" } },
		});
		expect(resolveSkillMode(skill, "run")).toBe("agent");
	});

	it("アクションにモード未定義の場合スキルのモードにフォールバックする", () => {
		const skill = createSkillFixture({
			name: "s",
			description: "d",
			mode: "agent",
			actions: { run: { description: "run" } },
		});
		expect(resolveSkillMode(skill, "run")).toBe("agent");
	});

	it("存在しないアクション名でスキルのモードを返す", () => {
		const skill = createSkillFixture({ name: "s", description: "d", mode: "template" });
		expect(resolveSkillMode(skill, "nonexistent")).toBe("template");
	});
});
