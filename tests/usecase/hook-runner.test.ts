import { describe, expect, it, vi } from "vitest";
import type { SessionId } from "../../src/core/execution/session";
import { ErrorType } from "../../src/core/types/errors";
import { runHooks } from "../../src/usecase/hook-runner";
import type { HookContext, HookExecutorPort } from "../../src/usecase/port/hook-executor";

const TEST_SESSION_ID = "tskp_test000001" as SessionId;

function createMockExecutor(): HookExecutorPort & {
	calls: { commands: readonly string[]; context: HookContext }[];
} {
	const calls: { commands: readonly string[]; context: HookContext }[] = [];
	return {
		calls,
		execute: vi.fn(async (commands, context) => {
			calls.push({ commands, context });
			return commands.map((cmd: string) => ({ command: cmd, success: true }));
		}),
	};
}

describe("runHooks", () => {
	it("calls on_success commands when status is success", async () => {
		const executor = createMockExecutor();
		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: ["echo ok"], on_failure: ["echo fail"] },
			context: {
				skillName: "deploy",
				mode: "template",
				status: "success",
				durationMs: 100,
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).toHaveBeenCalledOnce();
		expect(executor.calls[0].commands).toEqual(["echo ok"]);
	});

	it("calls on_failure commands when status is failed", async () => {
		const executor = createMockExecutor();
		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: ["echo ok"], on_failure: ["echo fail"] },
			context: {
				skillName: "deploy",
				mode: "template",
				status: "failed",
				durationMs: 50,
				error: "boom",
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).toHaveBeenCalledOnce();
		expect(executor.calls[0].commands).toEqual(["echo fail"]);
	});

	it("does not call executor when commands array is empty", async () => {
		const executor = createMockExecutor();
		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: [], on_failure: [] },
			context: {
				skillName: "deploy",
				mode: "template",
				status: "success",
				durationMs: 100,
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("does not call executor when commands are undefined", async () => {
		const executor = createMockExecutor();
		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: {},
			context: {
				skillName: "deploy",
				mode: "agent",
				status: "success",
				durationMs: 100,
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("returns ok when hookExecutor is undefined", async () => {
		const result = await runHooks({
			hookExecutor: undefined,
			hooksConfig: { on_success: ["echo ok"] },
			context: {
				skillName: "deploy",
				mode: "template",
				status: "success",
				durationMs: 100,
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(true);
	});

	it("returns ok when hooksConfig is undefined", async () => {
		const executor = createMockExecutor();
		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: undefined,
			context: {
				skillName: "deploy",
				mode: "template",
				status: "success",
				durationMs: 100,
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("returns err with details when a hook command fails", async () => {
		const executor: HookExecutorPort = {
			execute: vi.fn(async (commands: readonly string[]) =>
				commands.map((cmd) =>
					cmd === "fail-cmd"
						? { command: cmd, success: false, error: "exit code 1" }
						: { command: cmd, success: true },
				),
			),
		};

		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: ["echo ok", "fail-cmd"] },
			context: {
				skillName: "deploy",
				mode: "template",
				status: "success",
				durationMs: 100,
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.Execution);
			expect(result.error.message).toBe('Hook partially failed: "fail-cmd": exit code 1');
		}
	});

	it("returns err listing all failed hooks when multiple commands fail", async () => {
		const executor: HookExecutorPort = {
			execute: vi.fn(async (commands: readonly string[]) =>
				commands.map((cmd) => ({ command: cmd, success: false, error: `${cmd} broken` })),
			),
		};

		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_failure: ["notify", "cleanup"] },
			context: {
				skillName: "deploy",
				mode: "template",
				status: "failed",
				durationMs: 50,
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.Execution);
			expect(result.error.message).toBe(
				'Hook partially failed: "notify": notify broken, "cleanup": cleanup broken',
			);
		}
	});

	it("returns err with 'unknown error' when failed hook has no error message", async () => {
		const executor: HookExecutorPort = {
			execute: vi.fn(async () => [{ command: "bad-cmd", success: false }]),
		};

		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: ["bad-cmd"] },
			context: {
				skillName: "deploy",
				mode: "template",
				status: "success",
				durationMs: 100,
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Hook partially failed: "bad-cmd": unknown error');
		}
	});

	it("returns err with ExecutionError when executor throws", async () => {
		const throwingExecutor: HookExecutorPort = {
			execute: vi.fn(async () => {
				throw new Error("network error");
			}),
		};

		const result = await runHooks({
			hookExecutor: throwingExecutor,
			hooksConfig: { on_success: ["echo ok"] },
			context: {
				skillName: "deploy",
				mode: "template",
				status: "success",
				durationMs: 100,
				sessionId: TEST_SESSION_ID,
			},
		});

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.Execution);
			expect(result.error.message).toBe("Hook failed: network error");
		}
	});

	it("passes context to executor", async () => {
		const executor = createMockExecutor();
		const context: HookContext = {
			skillName: "build",
			mode: "agent",
			status: "failed",
			durationMs: 5000,
			error: "timeout",
			sessionId: TEST_SESSION_ID,
		};

		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_failure: ["notify"] },
			context,
		});

		expect(result.ok).toBe(true);
		expect(executor.calls[0].context).toEqual(context);
	});

	it("passes actionName in context when action is specified", async () => {
		const executor = createMockExecutor();
		const context: HookContext = {
			skillName: "task",
			actionName: "add",
			mode: "template",
			status: "success",
			durationMs: 100,
			sessionId: TEST_SESSION_ID,
		};

		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: ["echo ok"] },
			context,
		});

		expect(result.ok).toBe(true);
		expect(executor.calls[0].context.actionName).toBe("add");
	});

	it("passes callerSkill in context when present", async () => {
		const executor = createMockExecutor();
		const context: HookContext = {
			skillName: "build",
			mode: "template",
			status: "success",
			durationMs: 100,
			callerSkill: "diagnose",
			sessionId: TEST_SESSION_ID,
		};

		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: ["echo ok"] },
			context,
		});

		expect(result.ok).toBe(true);
		expect(executor.calls[0].context.callerSkill).toBe("diagnose");
	});

	it("omits callerSkill in context for direct execution", async () => {
		const executor = createMockExecutor();
		const context: HookContext = {
			skillName: "deploy",
			mode: "template",
			status: "success",
			durationMs: 100,
			sessionId: TEST_SESSION_ID,
		};

		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: ["echo ok"] },
			context,
		});

		expect(result.ok).toBe(true);
		expect(executor.calls[0].context.callerSkill).toBeUndefined();
	});

	it("omits actionName in context for single skill execution", async () => {
		const executor = createMockExecutor();
		const context: HookContext = {
			skillName: "deploy",
			mode: "template",
			status: "success",
			durationMs: 100,
			sessionId: TEST_SESSION_ID,
		};

		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: ["echo ok"] },
			context,
		});

		expect(result.ok).toBe(true);
		expect(executor.calls[0].context.actionName).toBeUndefined();
	});
});
