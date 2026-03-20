import { describe, expect, it } from "vitest";
import { formatToolArgs } from "../../../src/tui/components/tool-args-formatter";

describe("formatToolArgs", () => {
	it("formats bash tool with command string", () => {
		const result = formatToolArgs("bash", { command: "echo hello" });
		expect(result).toBe("echo hello");
	});

	it("truncates long bash commands at 60 characters", () => {
		const longCommand = "a".repeat(80);
		const result = formatToolArgs("bash", { command: longCommand });
		expect(result).toBe(`${"a".repeat(60)}...`);
	});

	it("does not truncate bash commands at exactly 60 characters", () => {
		const exactCommand = "a".repeat(60);
		const result = formatToolArgs("bash", { command: exactCommand });
		expect(result).toBe(exactCommand);
	});

	it("formats read tool with file path", () => {
		const result = formatToolArgs("read", { path: "/src/index.ts" });
		expect(result).toBe("/src/index.ts");
	});

	it("formats write tool with file path", () => {
		const result = formatToolArgs("write", { path: "/src/output.ts" });
		expect(result).toBe("/src/output.ts");
	});

	it("formats glob tool with pattern", () => {
		const result = formatToolArgs("glob", { pattern: "**/*.ts" });
		expect(result).toBe("**/*.ts");
	});

	it("formats unknown tool as JSON", () => {
		const result = formatToolArgs("unknown", { key: "value" });
		expect(result).toBe('{"key":"value"}');
	});

	it("truncates long JSON for unknown tools", () => {
		const args: Record<string, unknown> = { data: "x".repeat(80) };
		const result = formatToolArgs("custom", args);
		expect(result.length).toBe(63);
		expect(result.endsWith("...")).toBe(true);
	});

	it("formats empty args for unknown tool", () => {
		const result = formatToolArgs("custom", {});
		expect(result).toBe("{}");
	});
});
