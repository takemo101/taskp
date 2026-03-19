import { describe, expect, it } from "vitest";
import { parseSkillMetadata } from "../../../src/core/skill/skill-metadata";

describe("parseSkillMetadata", () => {
	it("最小限のフロントマター（name + description のみ）でデフォルト値が設定される", () => {
		const result = parseSkillMetadata({
			name: "deploy",
			description: "アプリケーションをデプロイする",
		});

		expect(result).toStrictEqual({
			name: "deploy",
			description: "アプリケーションをデプロイする",
			mode: "template",
			inputs: [],
			tools: ["bash", "read", "write"],
			context: [],
		});
	});

	it("全フィールド指定で正しくパースされる", () => {
		const result = parseSkillMetadata({
			name: "code-review",
			description: "コードレビューを実行する",
			mode: "agent",
			model: "claude-sonnet-4-20250514",
			inputs: [
				{
					name: "target",
					type: "text",
					message: "レビュー対象は？",
					default: ".",
				},
				{
					name: "env",
					type: "select",
					message: "環境を選んでください",
					choices: ["staging", "production"],
				},
			],
			tools: ["bash", "read"],
			context: [
				{ type: "file", path: "src/index.ts" },
				{ type: "glob", pattern: "src/**/*.ts" },
				{ type: "command", run: "git diff --cached" },
				{ type: "url", url: "https://example.com/docs" },
			],
		});

		expect(result.name).toBe("code-review");
		expect(result.mode).toBe("agent");
		expect(result.model).toBe("claude-sonnet-4-20250514");
		expect(result.inputs).toHaveLength(2);
		expect(result.tools).toStrictEqual(["bash", "read"]);
		expect(result.context).toHaveLength(4);
	});

	it("無効な mode でエラーになる", () => {
		expect(() =>
			parseSkillMetadata({
				name: "test",
				description: "test",
				mode: "invalid",
			}),
		).toThrow();
	});

	it("name が空文字でエラーになる", () => {
		expect(() =>
			parseSkillMetadata({
				name: "",
				description: "test",
			}),
		).toThrow();
	});

	it("description が空文字でエラーになる", () => {
		expect(() =>
			parseSkillMetadata({
				name: "test",
				description: "",
			}),
		).toThrow();
	});

	it("inputs の select タイプに choices がない場合エラーになる", () => {
		expect(() =>
			parseSkillMetadata({
				name: "test",
				description: "test",
				inputs: [
					{
						name: "env",
						type: "select",
						message: "環境を選んでください",
					},
				],
			}),
		).toThrow();
	});

	it("inputs の各フィールドが正しくパースされる", () => {
		const result = parseSkillMetadata({
			name: "test",
			description: "test",
			inputs: [
				{
					name: "confirm",
					type: "confirm",
					message: "よろしいですか？",
					default: true,
					required: false,
				},
				{
					name: "count",
					type: "number",
					message: "回数は？",
					default: 5,
					validate: "^[1-9][0-9]*$",
				},
			],
		});

		expect(result.inputs[0].name).toBe("confirm");
		expect(result.inputs[0].type).toBe("confirm");
		expect(result.inputs[0].default).toBe(true);
		expect(result.inputs[0].required).toBe(false);
		expect(result.inputs[1].validate).toBe("^[1-9][0-9]*$");
	});

	it("name が未指定でエラーになる", () => {
		expect(() =>
			parseSkillMetadata({
				description: "test",
			}),
		).toThrow();
	});
});
