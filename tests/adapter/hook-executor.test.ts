import { describe, expect, it, vi } from "vitest";
import {
	buildAfterEnvVars,
	buildBaseEnvVars,
	createHookExecutor,
} from "../../src/adapter/hook-executor";
import { createSilentLogger } from "../../src/adapter/silent-logger";
import type { SessionId } from "../../src/core/execution/session";
import type { ExecutionError } from "../../src/core/types/errors";
import type { Result } from "../../src/core/types/result";
import { err, ok } from "../../src/core/types/result";
import type {
	CommandExecutor,
	ExecOptions,
	ExecResult,
} from "../../src/usecase/port/command-executor";
import type {
	AfterHookContext,
	BeforeHookContext,
	HookContext,
} from "../../src/usecase/port/hook-executor";
import type { Logger } from "../../src/usecase/port/logger";

const TEST_SESSION_ID = "tskp_test000001" as SessionId;

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
	sessionId: TEST_SESSION_ID,
	skillDir: "/home/user/skills/deploy",
	cwd: "/home/user/project",
	date: "2026-03-31",
	timestamp: "2026-03-31T12:00:00.000Z",
};

const failedContext: HookContext = {
	skillName: "deploy",
	mode: "agent",
	status: "failed",
	durationMs: 5678,
	error: "Command failed: exit 1",
	sessionId: TEST_SESSION_ID,
	skillDir: "/home/user/skills/deploy",
	cwd: "/home/user/project",
	date: "2026-03-31",
	timestamp: "2026-03-31T12:00:00.000Z",
};

describe("HookExecutor", () => {
	it("executes commands sequentially", async () => {
		const executor = createSpyCommandExecutor([
			ok({ stdout: "", stderr: "", exitCode: 0 }),
			ok({ stdout: "", stderr: "", exitCode: 0 }),
		]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		const results = await hookExecutor.execute(["echo one", "echo two"], successContext);

		expect(results).toHaveLength(2);
		expect(executor.executedCommands).toHaveLength(2);
		expect(executor.executedCommands[0].command).toBe("echo one");
		expect(executor.executedCommands[1].command).toBe("echo two");
	});

	it("injects environment variables correctly", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		await hookExecutor.execute(["echo test"], successContext);

		const env = executor.executedCommands[0].options?.env;
		expect(env).toMatchObject({
			TASKP_SESSION_ID: TEST_SESSION_ID,
			TASKP_SKILL_NAME: "deploy",
			TASKP_ACTION_NAME: "",
			TASKP_SKILL_REF: "deploy",
			TASKP_MODE: "template",
			TASKP_STATUS: "success",
			TASKP_DURATION_MS: "1234",
			TASKP_ERROR: "",
			TASKP_CALLER_SKILL: "",
			TASKP_SKILL_DIR: "/home/user/skills/deploy",
			TASKP_CWD: "/home/user/project",
			TASKP_DATE: "2026-03-31",
			TASKP_TIMESTAMP: "2026-03-31T12:00:00.000Z",
		});
	});

	it("injects TASKP_SESSION_ID from context", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		await hookExecutor.execute(["echo test"], successContext);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_SESSION_ID).toBe(TEST_SESSION_ID);
	});

	it("injects TASKP_ACTION_NAME when actionName is present", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());
		const contextWithAction: HookContext = {
			...successContext,
			actionName: "add",
		};

		await hookExecutor.execute(["echo test"], contextWithAction);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_ACTION_NAME).toBe("add");
	});

	it("injects TASKP_SKILL_REF as skillName:actionName when actionName is present", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());
		const contextWithAction: HookContext = {
			...successContext,
			skillName: "task",
			actionName: "add",
			durationMs: 100,
		};

		await hookExecutor.execute(["echo test"], contextWithAction);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_SKILL_REF).toBe("task:add");
	});

	it("injects TASKP_SKILL_REF as skillName only when no actionName", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		await hookExecutor.execute(["echo test"], successContext);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_SKILL_REF).toBe("deploy");
	});

	it("injects TASKP_ERROR on failure context", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		await hookExecutor.execute(["echo test"], failedContext);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_ERROR).toBe("Command failed: exit 1");
		expect(env?.TASKP_STATUS).toBe("failed");
		expect(env?.TASKP_MODE).toBe("agent");
	});

	it("truncates TASKP_ERROR to 1024 characters", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());
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
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

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
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		const results = await hookExecutor.execute(
			["bad-cmd", "good-cmd", "timeout-cmd"],
			successContext,
		);

		expect(results).toHaveLength(3);
		expect(results[0]).toEqual({ command: "bad-cmd", success: false, error: "command not found" });
		expect(results[1]).toEqual({ command: "good-cmd", success: true });
		expect(results[2]).toEqual({ command: "timeout-cmd", success: false, error: "timeout" });
		expect(executor.executedCommands).toHaveLength(3);
	});

	it("returns empty array for empty commands", async () => {
		const executor = createSpyCommandExecutor([]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		const results = await hookExecutor.execute([], successContext);

		expect(results).toEqual([]);
		expect(executor.executedCommands).toHaveLength(0);
	});

	it("injects TASKP_CALLER_SKILL when callerSkill is present", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());
		const contextWithCaller: HookContext = {
			...successContext,
			callerSkill: "diagnose",
		};

		await hookExecutor.execute(["echo test"], contextWithCaller);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_CALLER_SKILL).toBe("diagnose");
	});

	it("sets TASKP_CALLER_SKILL to empty string when callerSkill is undefined", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		await hookExecutor.execute(["echo test"], successContext);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_CALLER_SKILL).toBe("");
	});

	it("injects TASKP_SESSION_ID", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		await hookExecutor.execute(["echo test"], successContext);

		const env = executor.executedCommands[0].options?.env;
		expect(env?.TASKP_SESSION_ID).toBe(TEST_SESSION_ID);
	});

	it("sets timeout to 30 seconds", async () => {
		const executor = createSpyCommandExecutor([ok({ stdout: "", stderr: "", exitCode: 0 })]);
		const hookExecutor = createHookExecutor(executor, createSilentLogger());

		await hookExecutor.execute(["echo test"], successContext);

		expect(executor.executedCommands[0].options?.timeout).toBe(30_000);
	});

	it("logs warning via logger on command failure", async () => {
		const executor = createSpyCommandExecutor([
			err({ type: "EXECUTION_ERROR" as const, message: "not found" }),
		]);
		const spyLogger: Logger = {
			debug: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		};
		const hookExecutor = createHookExecutor(executor, spyLogger);

		await hookExecutor.execute(["missing-cmd"], successContext);

		expect(spyLogger.error).toHaveBeenCalledWith('hook warning: "missing-cmd" failed: not found');
	});
});

const beforeContext: BeforeHookContext = {
	skillName: "deploy",
	mode: "template",
	outputFile: "/tmp/taskp/tskp_test000001/output.txt",
	sessionId: TEST_SESSION_ID,
	skillDir: "/home/user/skills/deploy",
	cwd: "/home/user/project",
	date: "2026-03-31",
	timestamp: "2026-03-31T12:00:00.000Z",
};

const afterSuccessContext: AfterHookContext = {
	skillName: "deploy",
	mode: "template",
	status: "success",
	durationMs: 1234,
	outputFile: "/tmp/taskp/tskp_test000001/output.txt",
	sessionId: TEST_SESSION_ID,
	skillDir: "/home/user/skills/deploy",
	cwd: "/home/user/project",
	date: "2026-03-31",
	timestamp: "2026-03-31T12:00:00.000Z",
};

const afterFailedContext: AfterHookContext = {
	skillName: "deploy",
	mode: "agent",
	status: "failed",
	durationMs: 5678,
	error: "Command failed: exit 1",
	outputFile: "/tmp/taskp/tskp_test000001/output.txt",
	sessionId: TEST_SESSION_ID,
	skillDir: "/home/user/skills/deploy",
	cwd: "/home/user/project",
	date: "2026-03-31",
	timestamp: "2026-03-31T12:00:00.000Z",
};

describe("buildBaseEnvVars", () => {
	it("builds common env vars from BeforeHookContext", () => {
		const env = buildBaseEnvVars(beforeContext, "before");

		expect(env).toEqual({
			TASKP_SESSION_ID: TEST_SESSION_ID,
			TASKP_SKILL_NAME: "deploy",
			TASKP_ACTION_NAME: "",
			TASKP_SKILL_REF: "deploy",
			TASKP_MODE: "template",
			TASKP_OUTPUT_FILE: "/tmp/taskp/tskp_test000001/output.txt",
			TASKP_CALLER_SKILL: "",
			TASKP_HOOK_PHASE: "before",
			TASKP_SKILL_DIR: "/home/user/skills/deploy",
			TASKP_CWD: "/home/user/project",
			TASKP_DATE: "2026-03-31",
			TASKP_TIMESTAMP: "2026-03-31T12:00:00.000Z",
		});
	});

	it("does not include STATUS, DURATION_MS, or ERROR for BeforeHookContext", () => {
		const env = buildBaseEnvVars(beforeContext, "before");

		expect(env).not.toHaveProperty("TASKP_STATUS");
		expect(env).not.toHaveProperty("TASKP_DURATION_MS");
		expect(env).not.toHaveProperty("TASKP_ERROR");
	});

	it("includes actionName in TASKP_ACTION_NAME and TASKP_SKILL_REF", () => {
		const contextWithAction: BeforeHookContext = {
			...beforeContext,
			actionName: "migrate",
		};

		const env = buildBaseEnvVars(contextWithAction, "before");

		expect(env.TASKP_ACTION_NAME).toBe("migrate");
		expect(env.TASKP_SKILL_REF).toBe("deploy:migrate");
	});

	it("includes callerSkill in TASKP_CALLER_SKILL", () => {
		const contextWithCaller: BeforeHookContext = {
			...beforeContext,
			callerSkill: "diagnose",
		};

		const env = buildBaseEnvVars(contextWithCaller, "before");

		expect(env.TASKP_CALLER_SKILL).toBe("diagnose");
	});

	it("sets TASKP_HOOK_PHASE to the given phase", () => {
		const envBefore = buildBaseEnvVars(beforeContext, "before");
		expect(envBefore.TASKP_HOOK_PHASE).toBe("before");

		const envAfter = buildBaseEnvVars(afterSuccessContext, "after");
		expect(envAfter.TASKP_HOOK_PHASE).toBe("after");

		const envOnFailure = buildBaseEnvVars(afterFailedContext, "on_failure");
		expect(envOnFailure.TASKP_HOOK_PHASE).toBe("on_failure");
	});
});

describe("buildAfterEnvVars", () => {
	it("builds all env vars including status fields for AfterHookContext", () => {
		const env = buildAfterEnvVars(afterSuccessContext, "after");

		expect(env).toEqual({
			TASKP_SESSION_ID: TEST_SESSION_ID,
			TASKP_SKILL_NAME: "deploy",
			TASKP_ACTION_NAME: "",
			TASKP_SKILL_REF: "deploy",
			TASKP_MODE: "template",
			TASKP_OUTPUT_FILE: "/tmp/taskp/tskp_test000001/output.txt",
			TASKP_CALLER_SKILL: "",
			TASKP_HOOK_PHASE: "after",
			TASKP_STATUS: "success",
			TASKP_DURATION_MS: "1234",
			TASKP_ERROR: "",
			TASKP_SKILL_DIR: "/home/user/skills/deploy",
			TASKP_CWD: "/home/user/project",
			TASKP_DATE: "2026-03-31",
			TASKP_TIMESTAMP: "2026-03-31T12:00:00.000Z",
		});
	});

	it("includes error message on failed context", () => {
		const env = buildAfterEnvVars(afterFailedContext, "after");

		expect(env.TASKP_STATUS).toBe("failed");
		expect(env.TASKP_DURATION_MS).toBe("5678");
		expect(env.TASKP_ERROR).toBe("Command failed: exit 1");
		expect(env.TASKP_MODE).toBe("agent");
	});

	it("truncates TASKP_ERROR to 1024 characters", () => {
		const longErrorContext: AfterHookContext = {
			...afterFailedContext,
			error: "x".repeat(2000),
		};

		const env = buildAfterEnvVars(longErrorContext, "after");

		expect(env.TASKP_ERROR).toHaveLength(1024);
	});

	it("sets TASKP_HOOK_PHASE to on_failure", () => {
		const env = buildAfterEnvVars(afterFailedContext, "on_failure");

		expect(env.TASKP_HOOK_PHASE).toBe("on_failure");
	});

	it("includes actionName in TASKP_ACTION_NAME and TASKP_SKILL_REF", () => {
		const contextWithAction: AfterHookContext = {
			...afterSuccessContext,
			actionName: "migrate",
		};

		const env = buildAfterEnvVars(contextWithAction, "after");

		expect(env.TASKP_ACTION_NAME).toBe("migrate");
		expect(env.TASKP_SKILL_REF).toBe("deploy:migrate");
	});
});
