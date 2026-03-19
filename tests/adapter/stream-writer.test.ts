import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createStreamWriter } from "../../src/adapter/stream-writer";

function createTestOutput(): { output: Writable; getContent: () => string } {
	const chunks: string[] = [];
	const output = new Writable({
		write(chunk, _encoding, callback) {
			chunks.push(chunk.toString());
			callback();
		},
	});
	return { output, getContent: () => chunks.join("") };
}

describe("createStreamWriter", () => {
	describe("writeText", () => {
		it("writes text directly to output", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeText("hello ");
			writer.writeText("world");

			expect(getContent()).toBe("hello world");
		});
	});

	describe("writeToolCall", () => {
		it("formats bash tool with command", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeToolCall("bash", { command: "git diff --cached" });

			expect(getContent()).toBe("\n[tool: bash] git diff --cached\n");
		});

		it("formats read tool with path", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeToolCall("read", { path: "src/index.ts" });

			expect(getContent()).toBe("\n[tool: read] src/index.ts\n");
		});

		it("formats write tool with path", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeToolCall("write", { path: "out.txt", content: "data" });

			expect(getContent()).toBe("\n[tool: write] out.txt\n");
		});

		it("formats glob tool with pattern", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeToolCall("glob", { pattern: "src/**/*.ts" });

			expect(getContent()).toBe("\n[tool: glob] src/**/*.ts\n");
		});

		it("formats ask_user tool with question", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeToolCall("ask_user", { question: "Continue?" });

			expect(getContent()).toBe("\n[tool: ask_user] Continue?\n");
		});

		it("formats unknown tool with JSON args", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeToolCall("custom", { key: "value" });

			expect(getContent()).toBe('\n[tool: custom] {"key":"value"}\n');
		});
	});

	describe("writeToolResult", () => {
		it("does not output in non-verbose mode", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeToolResult("bash", { stdout: "output", stderr: "", exitCode: 0 });

			expect(getContent()).toBe("");
		});

		it("outputs result in verbose mode", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: true, output });

			writer.writeToolResult("bash", "command output");

			expect(getContent()).toBe("[result: bash]\ncommand output\n");
		});

		it("outputs JSON for non-string results in verbose mode", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: true, output });

			writer.writeToolResult("bash", { stdout: "ok", exitCode: 0 });

			expect(getContent()).toContain('"stdout": "ok"');
		});
	});

	describe("writeSummary", () => {
		it("formats elapsed time and step count", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeSummary(12300, 8);

			expect(getContent()).toBe("\nDone in 12.3s (8 steps)\n");
		});

		it("handles sub-second times", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output });

			writer.writeSummary(500, 1);

			expect(getContent()).toBe("\nDone in 0.5s (1 steps)\n");
		});
	});
});
