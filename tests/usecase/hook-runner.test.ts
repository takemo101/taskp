import { describe, expect, it, vi } from "vitest";
import { ErrorType } from "../../src/core/types/errors";
import { runHooks } from "../../src/usecase/hook-runner";
import type { HookContext, HookExecutorPort } from "../../src/usecase/port/hook-executor";

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
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
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
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("does not call executor when commands are undefined", async () => {
		const executor = createMockExecutor();
		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: {},
			context: { skillName: "deploy", mode: "agent", status: "success", durationMs: 100 },
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("returns ok when hookExecutor is undefined", async () => {
		const result = await runHooks({
			hookExecutor: undefined,
			hooksConfig: { on_success: ["echo ok"] },
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
		});

		expect(result.ok).toBe(true);
	});

	it("returns ok when hooksConfig is undefined", async () => {
		const executor = createMockExecutor();
		const result = await runHooks({
			hookExecutor: executor,
			hooksConfig: undefined,
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
		});

		expect(result.ok).toBe(true);
		expect(executor.execute).not.toHaveBeenCalled();
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
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
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
