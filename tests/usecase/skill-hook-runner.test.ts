import { describe, expect, it, vi } from "vitest";
import type { SessionId } from "../../src/core/execution/session";
import { ErrorType } from "../../src/core/types/errors";
import type {
	AfterHookContext,
	BeforeHookContext,
	HookExecutorPort,
	HookResult,
} from "../../src/usecase/port/hook-executor";
import type { Logger } from "../../src/usecase/port/logger";
import {
	runAfterHooks,
	runBeforeHooks,
	runOnFailureHooks,
} from "../../src/usecase/skill-hook-runner";

const TEST_SESSION_ID = "tskp_test000001" as SessionId;

function createMockExecutor(
	results?: (commands: readonly string[]) => readonly HookResult[],
): HookExecutorPort & {
	calls: { commands: readonly string[]; phase?: string }[];
} {
	const calls: { commands: readonly string[]; phase?: string }[] = [];
	return {
		calls,
		execute: vi.fn(async (commands, _context, phase) => {
			calls.push({ commands, phase });
			if (results) {
				return results(commands);
			}
			return commands.map((cmd: string) => ({ command: cmd, success: true }));
		}),
	};
}

function createSpyLogger(): Logger & {
	warnings: string[];
	errors: string[];
} {
	const warnings: string[] = [];
	const errors: string[] = [];
	return {
		warnings,
		errors,
		debug: vi.fn(),
		warn: vi.fn((msg: string) => warnings.push(msg)),
		error: vi.fn((msg: string) => errors.push(msg)),
	};
}

const beforeContext: BeforeHookContext = {
	skillName: "deploy",
	mode: "template",
	outputFile: "/tmp/taskp/tskp_test000001/output.txt",
	sessionId: TEST_SESSION_ID,
};

const afterSuccessContext: AfterHookContext = {
	skillName: "deploy",
	mode: "template",
	status: "success",
	durationMs: 1234,
	outputFile: "/tmp/taskp/tskp_test000001/output.txt",
	sessionId: TEST_SESSION_ID,
};

const afterFailedContext: AfterHookContext = {
	skillName: "deploy",
	mode: "agent",
	status: "failed",
	durationMs: 5678,
	error: "Command failed: exit 1",
	outputFile: "/tmp/taskp/tskp_test000001/output.txt",
	sessionId: TEST_SESSION_ID,
};

describe("runBeforeHooks", () => {
	it("returns ok when hooks is undefined", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		const result = await runBeforeHooks({
			hookExecutor: executor,
			hooks: undefined,
			context: beforeContext,
			logger,
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("returns ok when hookExecutor is undefined", async () => {
		const logger = createSpyLogger();
		const result = await runBeforeHooks({
			hookExecutor: undefined,
			hooks: { before: ["echo ok"] },
			context: beforeContext,
			logger,
		});

		expect(result.ok).toBe(true);
	});

	it("returns ok when before commands are undefined", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		const result = await runBeforeHooks({
			hookExecutor: executor,
			hooks: { after: ["echo after"] },
			context: beforeContext,
			logger,
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("returns ok when before commands are empty", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		const result = await runBeforeHooks({
			hookExecutor: executor,
			hooks: { before: [] },
			context: beforeContext,
			logger,
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("returns ok when all before hooks succeed", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		const result = await runBeforeHooks({
			hookExecutor: executor,
			hooks: { before: ["echo one", "echo two"] },
			context: beforeContext,
			logger,
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).toHaveBeenCalledOnce();
		expect(executor.calls[0].commands).toEqual(["echo one", "echo two"]);
	});

	it("passes 'before' phase to executor", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runBeforeHooks({
			hookExecutor: executor,
			hooks: { before: ["echo ok"] },
			context: beforeContext,
			logger,
		});

		expect(executor.calls[0].phase).toBe("before");
	});

	it("returns err when a before hook fails", async () => {
		const executor = createMockExecutor((commands) =>
			commands.map((cmd) =>
				cmd === "fail-cmd"
					? { command: cmd, success: false, error: "exit code 1" }
					: { command: cmd, success: true },
			),
		);
		const logger = createSpyLogger();

		const result = await runBeforeHooks({
			hookExecutor: executor,
			hooks: { before: ["echo ok", "fail-cmd"] },
			context: beforeContext,
			logger,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.Execution);
			expect(result.error.message).toBe('Skill before hook failed: "fail-cmd": exit code 1');
		}
	});

	it("returns err with 'unknown error' when failed hook has no error message", async () => {
		const executor = createMockExecutor(() => [{ command: "bad-cmd", success: false }]);
		const logger = createSpyLogger();

		const result = await runBeforeHooks({
			hookExecutor: executor,
			hooks: { before: ["bad-cmd"] },
			context: beforeContext,
			logger,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Skill before hook failed: "bad-cmd": unknown error');
		}
	});

	it("returns err when executor throws", async () => {
		const executor: HookExecutorPort = {
			execute: vi.fn(async () => {
				throw new Error("network error");
			}),
		};
		const logger = createSpyLogger();

		const result = await runBeforeHooks({
			hookExecutor: executor,
			hooks: { before: ["echo ok"] },
			context: beforeContext,
			logger,
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.Execution);
			expect(result.error.message).toBe("Skill before hook failed: network error");
		}
	});
});

describe("runAfterHooks", () => {
	it("does nothing when hooks is undefined", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runAfterHooks({
			hookExecutor: executor,
			hooks: undefined,
			context: afterSuccessContext,
			logger,
		});

		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("does nothing when hookExecutor is undefined", async () => {
		const logger = createSpyLogger();
		await runAfterHooks({
			hookExecutor: undefined,
			hooks: { after: ["echo done"] },
			context: afterSuccessContext,
			logger,
		});

		expect(logger.warnings).toHaveLength(0);
	});

	it("does nothing when after commands are undefined", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runAfterHooks({
			hookExecutor: executor,
			hooks: { before: ["echo before"] },
			context: afterSuccessContext,
			logger,
		});

		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("does nothing when after commands are empty", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runAfterHooks({
			hookExecutor: executor,
			hooks: { after: [] },
			context: afterSuccessContext,
			logger,
		});

		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("executes after hooks and returns void on success", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runAfterHooks({
			hookExecutor: executor,
			hooks: { after: ["echo done", "echo cleanup"] },
			context: afterSuccessContext,
			logger,
		});

		expect(executor.execute).toHaveBeenCalledOnce();
		expect(executor.calls[0].commands).toEqual(["echo done", "echo cleanup"]);
		expect(logger.warnings).toHaveLength(0);
	});

	it("passes 'after' phase to executor", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runAfterHooks({
			hookExecutor: executor,
			hooks: { after: ["echo ok"] },
			context: afterSuccessContext,
			logger,
		});

		expect(executor.calls[0].phase).toBe("after");
	});

	it("logs warning and does not throw when after hook fails", async () => {
		const executor = createMockExecutor((commands) =>
			commands.map((cmd) => ({ command: cmd, success: false, error: "hook error" })),
		);
		const logger = createSpyLogger();

		await runAfterHooks({
			hookExecutor: executor,
			hooks: { after: ["cleanup"] },
			context: afterFailedContext,
			logger,
		});

		expect(logger.warnings).toHaveLength(1);
		expect(logger.warnings[0]).toBe('Skill after hook warning: "cleanup": hook error');
	});

	it("logs warning and does not throw when executor throws", async () => {
		const executor: HookExecutorPort = {
			execute: vi.fn(async () => {
				throw new Error("crash");
			}),
		};
		const logger = createSpyLogger();

		await runAfterHooks({
			hookExecutor: executor,
			hooks: { after: ["echo ok"] },
			context: afterSuccessContext,
			logger,
		});

		expect(logger.warnings).toHaveLength(1);
		expect(logger.warnings[0]).toBe("Skill after hook warning: crash");
	});
});

describe("runOnFailureHooks", () => {
	it("does nothing when hooks is undefined", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runOnFailureHooks({
			hookExecutor: executor,
			hooks: undefined,
			context: afterFailedContext,
			logger,
		});

		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("does nothing when hookExecutor is undefined", async () => {
		const logger = createSpyLogger();
		await runOnFailureHooks({
			hookExecutor: undefined,
			hooks: { on_failure: ["echo recover"] },
			context: afterFailedContext,
			logger,
		});

		expect(logger.warnings).toHaveLength(0);
	});

	it("does nothing when on_failure commands are undefined", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runOnFailureHooks({
			hookExecutor: executor,
			hooks: { after: ["echo after"] },
			context: afterFailedContext,
			logger,
		});

		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("does nothing when on_failure commands are empty", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runOnFailureHooks({
			hookExecutor: executor,
			hooks: { on_failure: [] },
			context: afterFailedContext,
			logger,
		});

		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("executes on_failure hooks and returns void on success", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runOnFailureHooks({
			hookExecutor: executor,
			hooks: { on_failure: ["echo recover", "notify-admin"] },
			context: afterFailedContext,
			logger,
		});

		expect(executor.execute).toHaveBeenCalledOnce();
		expect(executor.calls[0].commands).toEqual(["echo recover", "notify-admin"]);
		expect(logger.warnings).toHaveLength(0);
	});

	it("passes 'on_failure' phase to executor", async () => {
		const executor = createMockExecutor();
		const logger = createSpyLogger();
		await runOnFailureHooks({
			hookExecutor: executor,
			hooks: { on_failure: ["echo recover"] },
			context: afterFailedContext,
			logger,
		});

		expect(executor.calls[0].phase).toBe("on_failure");
	});

	it("logs warning and does not throw when on_failure hook fails", async () => {
		const executor = createMockExecutor((commands) =>
			commands.map((cmd) => ({ command: cmd, success: false, error: "failed to recover" })),
		);
		const logger = createSpyLogger();

		await runOnFailureHooks({
			hookExecutor: executor,
			hooks: { on_failure: ["recover"] },
			context: afterFailedContext,
			logger,
		});

		expect(logger.warnings).toHaveLength(1);
		expect(logger.warnings[0]).toBe('Skill on_failure hook warning: "recover": failed to recover');
	});

	it("logs warning and does not throw when executor throws", async () => {
		const executor: HookExecutorPort = {
			execute: vi.fn(async () => {
				throw new Error("fatal");
			}),
		};
		const logger = createSpyLogger();

		await runOnFailureHooks({
			hookExecutor: executor,
			hooks: { on_failure: ["recover"] },
			context: afterFailedContext,
			logger,
		});

		expect(logger.warnings).toHaveLength(1);
		expect(logger.warnings[0]).toBe("Skill on_failure hook warning: fatal");
	});
});
