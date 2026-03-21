import { describe, expect, it, vi } from "vitest";
import { createHookExecutor } from "../../src/adapter/hook-executor";
import type { ExecutionError } from "../../src/core/types/errors";
import type { Result } from "../../src/core/types/result";
import { err, ok } from "../../src/core/types/result";
import type {
	CommandExecutor,
	ExecOptions,
	ExecResult,
} from "../../src/usecase/port/command-executor";
import type { HookContext } from "../../src/usecase/port/hook-executor";

type ExecutedCommand = {
	readonly command: string;
	readonly options: ExecOptions | undefined;
};

function createSpyCommandExecutor(
	results: readonly Result<ExecResult, ExecutionError>[],
): CommandExecutor & { readonly executedCommands: readonly ExecutedCommand[] } {
	const executed: ExecutedCommand[] = [];
	let callIndex = 0;

	return {
		execute: async (command: string, options?: ExecOptions) => {
			executed.push({ command, options });
			const result = results[callIndex] ?? ok({ stdout: "", stderr: "", exitCode: 0 });
			callIndex++;
			return result;
		},
		get executedCommands() {
			return [...executed];
		},
	};
}

const successContext: HookContext = {
	skillName: "deploy",
	mode: "template",
	status: "success",
	durationMs: 1234,
};

const failedContext: HookContext = {
	skillName: "deploy",
	mode: "agent",
	status: "failed",
	durationMs: 5678,
	error: "Command failed: exit 1",
};

describe("HookExecutor", () => {
	it("executes commands sequentially", async () => {
		const executor = createSpyCommandExecutor([
			ok({ stdout: "", stderr: "", exitCode: 0 }),
			ok({ stdout: "", stderr: "", exitCode: 0 }),
		]);
		const hookExecutor = createHookExecutor(executor);

		const results = await hookExecutor.execute(["echo one", "echo two"], successContext);

		expect(results).toHaveLength(2);
		expect(executor.executedCommands).toHaveLength(2);
		expect(executor.executedCommands[0].command).toBe("echo one");
		expect(executor.executedCommands[1].command).toBe("echo two");
	});

	it("injects environment variables correctly", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor);

		await hookExecutor.execute(["echo test"], successContext);

		const env = executor.executedCommands[0].options?.env;
		expect(env).toEqual({
			TASKP_SKILL_NAME: "deploy",
			TASKP_MODE: "template",
			TASKP_STATUS: "success",
			TASKP_DURATION_MS: "1234",
			TASKP_ERROR: "",
		});
	});

	it("injects TASKP_ERROR on failure context", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor);

		await hookExecutor.execute(["echo test"], failedContext);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_ERROR).toBe("Command failed: exit 1");
		expect(env?.TASKP_STATUS).toBe("failed");
		expect(env?.TASKP_MODE).toBe("agent");
	});

	it("truncates TASKP_ERROR to 1024 characters", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor);
		const longError = "x".repeat(2000);

		await hookExecutor.execute(["echo test"], {
			...failedContext,
			error: longError,
		});

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_ERROR).toHaveLength(1024);
	});

	it("sets TASKP_ERROR to empty string on success", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor);

		await hookExecutor.execute(["echo test"], successContext);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_ERROR).toBe("");
	});

	it("continues execution when a command fails", async () => {
		const executor = createSpyCommandExecutor([
			err({ type: "EXECUTION_ERROR" as const, message: "command not found" }),
			ok({ stdout: "", stderr: "", exitCode: 0 }),
			err({ type: "EXECUTION_ERROR" as const, message: "timeout" }),
		]);
		const hookExecutor = createHookExecutor(executor);
		vi.spyOn(console, "error").mockImplementation(() => {});

		const results = await hookExecutor.execute(
			["bad-cmd", "good-cmd", "timeout-cmd"],
			successContext,
		);

		expect(results).toHaveLength(3);
		expect(results[0]).toEqual({ command: "bad-cmd", success: false, error: "command not found" });
		expect(results[1]).toEqual({ command: "good-cmd", success: true });
		expect(results[2]).toEqual({ command: "timeout-cmd", success: false, error: "timeout" });
		expect(executor.executedCommands).toHaveLength(3);

		vi.restoreAllMocks();
	});

	it("returns empty array for empty commands", async () => {
		const executor = createSpyCommandExecutor([]);
		const hookExecutor = createHookExecutor(executor);

		const results = await hookExecutor.execute([], successContext);

		expect(results).toEqual([]);
		expect(executor.executedCommands).toHaveLength(0);
	});

	it("sets timeout to 30 seconds", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor);

		await hookExecutor.execute(["echo test"], successContext);

		expect(executor.executedCommands[0].options?.timeout).toBe(30_000);
	});

	it("outputs warning to stderr on command failure", async () => {
		const executor = createSpyCommandExecutor([
			err({ type: "EXECUTION_ERROR" as const, message: "not found" }),
		]);
		const hookExecutor = createHookExecutor(executor);
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await hookExecutor.execute(["missing-cmd"], successContext);

		expect(errorSpy).toHaveBeenCalledWith('[taskp] hook warning: "missing-cmd" failed: not found');

		vi.restoreAllMocks();
	});
});
