import { describe, expect, it } from "vitest";
import {
	buildSystemPrompt,
	formatEnvironment,
	formatToolsList,
} from "../../../src/core/execution/system-prompt";

describe("formatToolsList", () => {
	it("formats tool names with descriptions from agent-tools", () => {
		const result = formatToolsList(["bash", "write"]);

		expect(result).toContain("- bash:");
		expect(result).toContain("- write:");
		expect(result).toContain("shell command");
		expect(result).toContain("Write content");
	});

	it("returns '(none)' for empty tool list", () => {
		expect(formatToolsList([])).toBe("(none)");
	});

	it("shows 'Custom tool' for unknown tool names", () => {
		const result = formatToolsList(["my_custom_tool"]);

		expect(result).toBe("- my_custom_tool: Custom tool");
	});

	it("handles mix of known and unknown tools", () => {
		const result = formatToolsList(["bash", "unknown_tool"]);

		expect(result).toContain("- bash:");
		expect(result).toContain("shell command");
		expect(result).toContain("- unknown_tool: Custom tool");
	});
});

describe("formatEnvironment", () => {
	it("includes cwd, date, and platform", () => {
		const result = formatEnvironment("/home/user/project", "2026-03-22");

		expect(result).toContain("Working directory: /home/user/project");
		expect(result).toContain("Date: 2026-03-22");
		expect(result).toContain(`Platform: ${process.platform}`);
	});
});

describe("buildSystemPrompt", () => {
	const options = {
		toolNames: ["bash", "read", "write"] as readonly string[],
		cwd: "/home/user/project",
		date: "2026-03-22",
	};

	it("includes role definition", () => {
		const result = buildSystemPrompt(options);

		expect(result).toContain("task execution agent");
		expect(result).toContain("taskp");
	});

	it("includes tool list", () => {
		const result = buildSystemPrompt(options);

		expect(result).toContain("- bash:");
		expect(result).toContain("- read:");
		expect(result).toContain("- write:");
	});

	it("includes guidelines", () => {
		const result = buildSystemPrompt(options);

		expect(result).toContain("Execute the task immediately");
		expect(result).toContain("Be concise");
		expect(result).toContain("output format");
	});

	it("includes environment info", () => {
		const result = buildSystemPrompt(options);

		expect(result).toContain("Working directory: /home/user/project");
		expect(result).toContain("Date: 2026-03-22");
	});

	it("handles empty tool list", () => {
		const result = buildSystemPrompt({ ...options, toolNames: [] });

		expect(result).toContain("(none)");
	});
});
