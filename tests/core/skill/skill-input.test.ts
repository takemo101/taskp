import { describe, expect, it } from "vitest";
import { parseSkillInput } from "../../../src/core/skill/skill-input";

describe("parseSkillInput", () => {
	it("text タイプが正しくパースされる", () => {
		const result = parseSkillInput({
			name: "target",
			type: "text",
			message: "対象を入力してください",
		});

		expect(result.name).toBe("target");
		expect(result.type).toBe("text");
		expect(result.message).toBe("対象を入力してください");
	});

	it("select タイプが choices 付きで正しくパースされる", () => {
		const result = parseSkillInput({
			name: "env",
			type: "select",
			message: "環境を選んでください",
			choices: ["staging", "production"],
		});

		expect(result.type).toBe("select");
		expect(result.choices).toStrictEqual(["staging", "production"]);
	});

	it("confirm タイプが boolean デフォルト付きでパースされる", () => {
		const result = parseSkillInput({
			name: "proceed",
			type: "confirm",
			message: "続行しますか？",
			default: true,
		});

		expect(result.type).toBe("confirm");
		expect(result.default).toBe(true);
	});

	it("number タイプが数値デフォルト付きでパースされる", () => {
		const result = parseSkillInput({
			name: "count",
			type: "number",
			message: "回数は？",
			default: 5,
		});

		expect(result.type).toBe("number");
		expect(result.default).toBe(5);
	});

	it("textarea タイプが正しくパースされる", () => {
		const result = parseSkillInput({
			name: "body",
			type: "textarea",
			message: "本文を入力してください",
		});

		expect(result.type).toBe("textarea");
		expect(result.message).toBe("本文を入力してください");
	});

	it("textarea タイプがデフォルト値付きでパースされる", () => {
		const result = parseSkillInput({
			name: "body",
			type: "textarea",
			message: "本文を入力",
			default: "デフォルトテキスト",
		});

		expect(result.type).toBe("textarea");
		expect(result.default).toBe("デフォルトテキスト");
	});

	it("password タイプが正しくパースされる", () => {
		const result = parseSkillInput({
			name: "secret",
			type: "password",
			message: "パスワードを入力",
		});

		expect(result.type).toBe("password");
	});

	it("select で choices がない場合エラーになる", () => {
		expect(() =>
			parseSkillInput({
				name: "env",
				type: "select",
				message: "環境を選んでください",
			}),
		).toThrow("choices is required for select type");
	});

	it("select で choices が空配列の場合エラーになる", () => {
		expect(() =>
			parseSkillInput({
				name: "env",
				type: "select",
				message: "環境を選んでください",
				choices: [],
			}),
		).toThrow("choices is required for select type");
	});

	it("不正な type でエラーになる", () => {
		expect(() =>
			parseSkillInput({
				name: "test",
				type: "invalid",
				message: "テスト",
			}),
		).toThrow();
	});

	it("validate フィールドの正規表現が正しくパースされる", () => {
		const result = parseSkillInput({
			name: "email",
			type: "text",
			message: "メールアドレスを入力",
			validate: "^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-zA-Z]+$",
		});

		expect(result.validate).toBe("^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-zA-Z]+$");
	});

	it("validate に無効な正規表現が指定された場合エラーになる", () => {
		expect(() =>
			parseSkillInput({
				name: "test",
				type: "text",
				message: "テスト",
				validate: "[invalid",
			}),
		).toThrow("validate must be a valid regular expression");
	});

	it("required フィールドが正しくパースされる", () => {
		const result = parseSkillInput({
			name: "optional",
			type: "text",
			message: "任意の入力",
			required: false,
		});

		expect(result.required).toBe(false);
	});

	it("name が空文字でエラーになる", () => {
		expect(() =>
			parseSkillInput({
				name: "",
				type: "text",
				message: "テスト",
			}),
		).toThrow();
	});

	it("message が空文字でエラーになる", () => {
		expect(() =>
			parseSkillInput({
				name: "test",
				type: "text",
				message: "",
			}),
		).toThrow();
	});
});
