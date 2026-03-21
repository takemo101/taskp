import { describe, expect, it } from "vitest";
import { parseSkillMetadata } from "../../../src/core/skill/skill-metadata";

describe("parseSkillMetadata", () => {
	it("最小限のフロントマター（name + description のみ）でデフォルト値が設定される", () => {
		const result = parseSkillMetadata({
			name: "deploy",
			description: "アプリケーションをデプロイする",
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toStrictEqual({
			name: "deploy",
			description: "アプリケーションをデプロイする",
			mode: "template",
			inputs: [],
			tools: ["bash", "read", "write"],
			context: [],
		});
		expect(result.value.timeout).toBeUndefined();
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

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.name).toBe("code-review");
		expect(result.value.mode).toBe("agent");
		expect(result.value.model).toBe("claude-sonnet-4-20250514");
		expect(result.value.inputs).toHaveLength(2);
		expect(result.value.tools).toStrictEqual(["bash", "read"]);
		expect(result.value.context).toHaveLength(4);
	});

	it("無効な mode でエラーになる", () => {
		const result = parseSkillMetadata({
			name: "test",
			description: "test",
			mode: "invalid",
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
	});

	it("name が空文字でエラーになる", () => {
		const result = parseSkillMetadata({
			name: "",
			description: "test",
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
	});

	it("description が空文字でエラーになる", () => {
		const result = parseSkillMetadata({
			name: "test",
			description: "",
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
	});

	it("inputs の select タイプに choices がない場合エラーになる", () => {
		const result = parseSkillMetadata({
			name: "test",
			description: "test",
			inputs: [
				{
					name: "env",
					type: "select",
					message: "環境を選んでください",
				},
			],
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
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

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.inputs[0].name).toBe("confirm");
		expect(result.value.inputs[0].type).toBe("confirm");
		expect(result.value.inputs[0].default).toBe(true);
		expect(result.value.inputs[0].required).toBe(false);
		expect(result.value.inputs[1].validate).toBe("^[1-9][0-9]*$");
	});

	it("timeout が正の整数で正しくパースされる", () => {
		const result = parseSkillMetadata({
			name: "crawl",
			description: "クロールする",
			timeout: 300000,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.timeout).toBe(300000);
	});

	it("timeout が 0 でエラーになる", () => {
		const result = parseSkillMetadata({
			name: "crawl",
			description: "クロールする",
			timeout: 0,
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
	});

	it("timeout が負の数でエラーになる", () => {
		const result = parseSkillMetadata({
			name: "crawl",
			description: "クロールする",
			timeout: -1000,
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
	});

	it("timeout が小数でエラーになる", () => {
		const result = parseSkillMetadata({
			name: "crawl",
			description: "クロールする",
			timeout: 1.5,
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
	});

	it("timeout が上限値（3,600,000ms）でパースされる", () => {
		const result = parseSkillMetadata({
			name: "crawl",
			description: "クロールする",
			timeout: 3_600_000,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.timeout).toBe(3_600_000);
	});

	it("timeout が上限値を超えるとエラーになる", () => {
		const result = parseSkillMetadata({
			name: "crawl",
			description: "クロールする",
			timeout: 3_600_001,
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
	});

	it("name が未指定でエラーになる", () => {
		const result = parseSkillMetadata({
			description: "test",
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
		expect(result.error.message).toContain("name:");
	});

	it("エラーメッセージに不足フィールドのパス情報が含まれる", () => {
		const result = parseSkillMetadata({});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.message).toContain("Invalid skill metadata:");
		expect(result.error.message).toContain("name:");
		expect(result.error.message).toContain("description:");
	});
});
