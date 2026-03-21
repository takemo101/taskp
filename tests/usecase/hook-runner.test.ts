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
