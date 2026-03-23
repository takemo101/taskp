import { describe, expect, it } from "vitest";
import {
	getContextSourceValue,
	parseContextSource,
	withResolvedValue,
} from "../../../src/core/skill/context-source";

describe("parseContextSource", () => {
	it("parses file type", () => {
		const result = parseContextSource({
			type: "file",
			path: "src/{{target}}",
		});
		expect(result).toEqual({ type: "file", path: "src/{{target}}" });
	});

	it("parses glob type", () => {
		const result = parseContextSource({
			type: "glob",
			pattern: "src/**/*.ts",
		});
		expect(result).toEqual({ type: "glob", pattern: "src/**/*.ts" });
	});

	it("parses command type", () => {
		const result = parseContextSource({
			type: "command",
			run: "git diff --cached",
		});
		expect(result).toEqual({ type: "command", run: "git diff --cached" });
	});

	it("parses url type", () => {
		const result = parseContextSource({
			type: "url",
			url: "https://example.com/api-docs",
		});
		expect(result).toEqual({
			type: "url",
			url: "https://example.com/api-docs",
		});
	});

	it("throws on invalid type", () => {
		expect(() => parseContextSource({ type: "invalid" })).toThrow();
	});

	it("throws on missing required field for file", () => {
		expect(() => parseContextSource({ type: "file" })).toThrow();
	});

	it("throws on missing required field for glob", () => {
		expect(() => parseContextSource({ type: "glob" })).toThrow();
	});

	it("throws on missing required field for command", () => {
		expect(() => parseContextSource({ type: "command" })).toThrow();
	});

	it("throws on missing required field for url", () => {
		expect(() => parseContextSource({ type: "url" })).toThrow();
	});

	it("throws on missing type", () => {
		expect(() => parseContextSource({ path: "src/foo" })).toThrow();
	});
});

describe("getContextSourceValue", () => {
	it("returns path for file source", () => {
		expect(getContextSourceValue({ type: "file", path: "src/index.ts" })).toBe("src/index.ts");
	});

	it("returns pattern for glob source", () => {
		expect(getContextSourceValue({ type: "glob", pattern: "src/**/*.ts" })).toBe("src/**/*.ts");
	});

	it("returns run for command source", () => {
		expect(getContextSourceValue({ type: "command", run: "git diff" })).toBe("git diff");
	});

	it("returns url for url source", () => {
		expect(getContextSourceValue({ type: "url", url: "https://example.com" })).toBe(
			"https://example.com",
		);
	});
});

describe("withResolvedValue", () => {
	it("replaces path for file source", () => {
		const source = { type: "file" as const, path: "{{target}}" };
		expect(withResolvedValue(source, "resolved.ts")).toEqual({ type: "file", path: "resolved.ts" });
	});

	it("replaces pattern for glob source", () => {
		const source = { type: "glob" as const, pattern: "{{pat}}" };
		expect(withResolvedValue(source, "src/*.ts")).toEqual({ type: "glob", pattern: "src/*.ts" });
	});

	it("replaces run for command source", () => {
		const source = { type: "command" as const, run: "{{cmd}}" };
		expect(withResolvedValue(source, "ls -la")).toEqual({ type: "command", run: "ls -la" });
	});

	it("replaces url for url source", () => {
		const source = { type: "url" as const, url: "{{u}}" };
		expect(withResolvedValue(source, "https://resolved.com")).toEqual({
			type: "url",
			url: "https://resolved.com",
		});
	});

	it("does not mutate the original source", () => {
		const source = { type: "file" as const, path: "original.ts" };
		withResolvedValue(source, "new.ts");
		expect(source.path).toBe("original.ts");
	});
});

describe("parseContextSource", () => {
	it("preserves template variables as strings", () => {
		const result = parseContextSource({
			type: "file",
			path: "{{__cwd__}}/src/{{module}}/index.ts",
		});
		expect(result).toEqual({
			type: "file",
			path: "{{__cwd__}}/src/{{module}}/index.ts",
		});
	});
});
