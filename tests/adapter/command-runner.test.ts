import { describe, expect, it } from "vitest";
import { createCommandRunner } from "../../src/adapter/command-runner";

describe("CommandRunner", () => {
	const runner = createCommandRunner();

	it("captures stdout from a successful command", async () => {
		const result = await runner.execute('echo "hello"');

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.stdout).toBe("hello");
		expect(result.value.exitCode).toBe(0);
	});

	it("captures stderr from a successful command", async () => {
		const result = await runner.execute('echo "err" >&2');

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.stderr).toBe("err");
		expect(result.value.exitCode).toBe(0);
	});

	it("returns ExecutionError for a failing command", async () => {
		const result = await runner.execute("exit 1");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
	});

	it("returns ExecutionError on timeout", async () => {
		const result = await runner.execute("sleep 10", { timeout: 100 });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
		expect(result.error.message).toMatch(/timed out/i);
	});

	it("respects cwd option", async () => {
		const result = await runner.execute("pwd", { cwd: "/tmp" });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.stdout).toContain("/tmp");
	});

	it("uses defaultTimeoutMs from deps", async () => {
		const runner = createCommandRunner({ defaultTimeoutMs: 100 });
		const result = await runner.execute("sleep 10");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
		expect(result.error.message).toMatch(/timed out/i);
	});

	it("per-call timeout overrides defaultTimeoutMs", async () => {
		const runner = createCommandRunner({ defaultTimeoutMs: 100 });
		const result = await runner.execute("sleep 0.05", { timeout: 5000 });

		expect(result.ok).toBe(true);
	});
});
