import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	buildTaskpRunDescription,
	buildTools,
	TOOL_NAMES,
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
