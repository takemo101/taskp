import { describe, expect, it } from "vitest";
import { formatContextSources, formatInputs } from "../../src/adapter/progress-formatter";
import type { SkillInput } from "../../src/core/skill/skill-input";

const inputs: readonly SkillInput[] = [
	{ name: "lang", type: "select", message: "コミットメッセージの言語は？", choices: ["en", "ja"] },
	{
		name: "mode",
		type: "select",
		message: "実行モードを選んでください",
		choices: ["commit", "dry-run"],
	},
];

describe("formatInputs", () => {
	it("formats inputs with checkmark and answer", () => {
		expect(formatInputs(inputs, { lang: "ja", mode: "dry-run" })).toBe(
			"✔ コミットメッセージの言語は？ ja\n✔ 実行モードを選んでください dry-run\n",
		);
	});

	it("returns empty string for empty inputs", () => {
		expect(formatInputs([], {})).toBe("");
	});

	it("skips inputs without matching variable", () => {
		expect(formatInputs(inputs, { lang: "ja" })).toBe("✔ コミットメッセージの言語は？ ja\n");
	});
});

describe("formatContextSources", () => {
	it("formats command source", () => {
		expect(formatContextSources([{ type: "command", run: "git diff" }])).toBe("$ git diff\n");
	});

	it("formats file source", () => {
		expect(formatContextSources([{ type: "file", path: "README.md" }])).toBe("📄 README.md\n");
	});

	it("formats glob source", () => {
		expect(formatContextSources([{ type: "glob", pattern: "src/**/*.ts" }])).toBe(
			"📂 src/**/*.ts\n",
		);
	});

	it("formats url source", () => {
		expect(formatContextSources([{ type: "url", url: "https://example.com" }])).toBe(
			"🔗 https://example.com\n",
		);
	});

	it("formats multiple sources", () => {
		const result = formatContextSources([
			{ type: "command", run: "git diff" },
			{ type: "file", path: "README.md" },
		]);
		expect(result).toBe("$ git diff\n📄 README.md\n");
	});

	it("returns empty string for empty array", () => {
		expect(formatContextSources([])).toBe("");
	});
});
