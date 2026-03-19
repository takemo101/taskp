import { describe, expect, it } from "vitest";
import { parseContextSource } from "../../../src/core/skill/context-source";

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
