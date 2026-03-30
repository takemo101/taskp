import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { createStreamWriter } from "../../src/adapter/stream-writer";
import type { SessionId } from "../../src/core/execution/session";

const TEST_SESSION_ID = "tskp_abc123def456" as SessionId;

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
	describe("writeHeader", () => {
		it("outputs session ID header", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeHeader();

			expect(getContent()).toBe("[session: tskp_abc123def456]\n");
		});
	});

	describe("writeText", () => {
		it("writes text directly to output", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeText("hello ");
			writer.writeText("world");

			expect(getContent()).toBe("hello world");
		});
	});

	describe("writeToolCall", () => {
		it("formats bash tool with command", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeToolCall("bash", { command: "git diff --cached" });

			expect(getContent()).toBe("\n[tool: bash] git diff --cached\n");
		});

		it("formats read tool with path", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeToolCall("read", { path: "src/index.ts" });

			expect(getContent()).toBe("\n[tool: read] src/index.ts\n");
		});

		it("formats write tool with path", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeToolCall("write", { path: "out.txt", content: "data" });

			expect(getContent()).toBe("\n[tool: write] out.txt\n");
		});

		it("formats glob tool with pattern", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeToolCall("glob", { pattern: "src/**/*.ts" });

			expect(getContent()).toBe("\n[tool: glob] src/**/*.ts\n");
		});

		it("formats ask_user tool with question", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeToolCall("ask_user", { question: "Continue?" });

			expect(getContent()).toBe("\n[tool: ask_user] Continue?\n");
		});

		it("formats unknown tool with JSON args", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeToolCall("custom", { key: "value" });

			expect(getContent()).toBe('\n[tool: custom] {"key":"value"}\n');
		});
	});

	describe("writeToolResult", () => {
		it("does not output in non-verbose mode", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeToolResult("bash", { stdout: "output", stderr: "", exitCode: 0 });

			expect(getContent()).toBe("");
		});

		it("outputs result in verbose mode", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: true, output, sessionId: TEST_SESSION_ID });

			writer.writeToolResult("bash", "command output");

			expect(getContent()).toBe("[result: bash]\ncommand output\n");
		});

		it("outputs JSON for non-string results in verbose mode", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: true, output, sessionId: TEST_SESSION_ID });

			writer.writeToolResult("bash", { stdout: "ok", exitCode: 0 });

			expect(getContent()).toContain('"stdout": "ok"');
		});
	});

	describe("writeSummary", () => {
		it("formats elapsed time, step count, and session ID", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeSummary(12300, 8);

			expect(getContent()).toBe("\nDone in 12.3s (8 steps) [tskp_abc123def456]\n");
		});

		it("handles sub-second times", () => {
			const { output, getContent } = createTestOutput();
			const writer = createStreamWriter({ verbose: false, output, sessionId: TEST_SESSION_ID });

			writer.writeSummary(500, 1);

			expect(getContent()).toBe("\nDone in 0.5s (1 steps) [tskp_abc123def456]\n");
		});
	});
});
