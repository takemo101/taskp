import { describe, expect, it, vi } from "vitest";
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
		await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: ["echo ok"], on_failure: ["echo fail"] },
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
		});

		expect(executor.execute).toHaveBeenCalledOnce();
		expect(executor.calls[0].commands).toEqual(["echo ok"]);
	});

	it("calls on_failure commands when status is failed", async () => {
		const executor = createMockExecutor();
		await runHooks({
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

		expect(executor.execute).toHaveBeenCalledOnce();
		expect(executor.calls[0].commands).toEqual(["echo fail"]);
	});

	it("does not call executor when commands array is empty", async () => {
		const executor = createMockExecutor();
		await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_success: [], on_failure: [] },
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
		});

		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("does not call executor when commands are undefined", async () => {
		const executor = createMockExecutor();
		await runHooks({
			hookExecutor: executor,
			hooksConfig: {},
			context: { skillName: "deploy", mode: "agent", status: "success", durationMs: 100 },
		});

		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("does nothing when hookExecutor is undefined", async () => {
		await runHooks({
			hookExecutor: undefined,
			hooksConfig: { on_success: ["echo ok"] },
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
		});
		// no throw = pass
	});

	it("does nothing when hooksConfig is undefined", async () => {
		const executor = createMockExecutor();
		await runHooks({
			hookExecutor: executor,
			hooksConfig: undefined,
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
		});

		expect(executor.execute).not.toHaveBeenCalled();
	});

	it("catches and logs executor exceptions without rethrowing", async () => {
		const throwingExecutor: HookExecutorPort = {
			execute: vi.fn(async () => {
				throw new Error("network error");
			}),
		};
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await runHooks({
			hookExecutor: throwingExecutor,
			hooksConfig: { on_success: ["echo ok"] },
			context: { skillName: "deploy", mode: "template", status: "success", durationMs: 100 },
		});

		expect(errorSpy).toHaveBeenCalledWith("[taskp] hook error: network error");
		vi.restoreAllMocks();
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

		await runHooks({
			hookExecutor: executor,
			hooksConfig: { on_failure: ["notify"] },
			context,
		});

		expect(executor.calls[0].context).toEqual(context);
	});
});
