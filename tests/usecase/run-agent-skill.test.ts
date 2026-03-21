import type { LanguageModelV3 } from "@ai-sdk/provider";
import { describe, expect, it, vi } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { ok } from "../../src/core/types/result";
import type { AgentExecutorPort } from "../../src/usecase/port/agent-executor";
import type { ContextCollectorPort } from "../../src/usecase/port/context-collector";
import type { HookContext, HookExecutorPort } from "../../src/usecase/port/hook-executor";
import type { PromptCollector } from "../../src/usecase/port/prompt-collector";
import type { SkillRepository } from "../../src/usecase/port/skill-repository";
import { runAgentSkill } from "../../src/usecase/run-agent-skill";

const mockModel = {} as LanguageModelV3;

function createAgentSkill(overrides?: Partial<Skill["metadata"]>): Skill {
	return {
		metadata: {
			name: "test-agent",
			description: "A test agent skill",
			mode: "agent",
			inputs: [],
			model: undefined,
			tools: ["bash", "read"],
			context: [],
			...overrides,
		},
		body: {
			content: "You are a helpful assistant.",
			extractCodeBlocks: () => [],
		},
		location: "/tmp/test",
		scope: "local",
	};
}

function createMockDeps(skill: Skill) {
	const skillRepository: SkillRepository = {
		findByName: vi.fn().mockResolvedValue(ok(skill)),
		listAll: vi.fn(),
		listLocal: vi.fn(),
		listGlobal: vi.fn(),
	};

	const promptCollector: PromptCollector = {
		collect: vi.fn().mockResolvedValue(ok({})),
	};

	const contextCollector: ContextCollectorPort = {
		collect: vi.fn().mockResolvedValue(ok("collected context")),
	};

	const agentExecutor: AgentExecutorPort = {
		execute: vi.fn().mockResolvedValue(ok({ output: "agent output", steps: 3, elapsedMs: 1500 })),
	};

	return { skillRepository, promptCollector, contextCollector, agentExecutor };
}

describe("runAgentSkill", () => {
	it("executes agent and returns result", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		const result = await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.skillName).toBe("test-agent");
		expect(result.value.result.output).toBe("agent output");
		expect(result.value.result.steps).toBe(3);
		expect(result.value.result.elapsedMs).toBe(1500);
	});

	it("passes correct input to agent executor", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		expect(deps.agentExecutor.execute).toHaveBeenCalledWith(
			expect.objectContaining({
				model: mockModel,
				systemPrompt: "You are a helpful assistant.",
				toolNames: ["bash", "read"],
				maxSteps: 50,
			}),
		);
	});

	it("collects context from skill context sources", async () => {
		const skill = createAgentSkill({
			context: [{ type: "file", path: "README.md" }],
		});
		const deps = createMockDeps(skill);

		const result = await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		expect(result.ok).toBe(true);
		expect(deps.contextCollector.collect).toHaveBeenCalledWith(
			[{ type: "file", path: "README.md" }],
			process.cwd(),
		);

		// Context should include both system prompt and collected context
		const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(executorCall.context).toContain("You are a helpful assistant.");
		expect(executorCall.context).toContain("collected context");
	});

	it("skips context collection when no context sources defined", async () => {
		const skill = createAgentSkill({ context: [] });
		const deps = createMockDeps(skill);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		expect(deps.contextCollector.collect).not.toHaveBeenCalled();
	});

	it("propagates skill-not-found error", async () => {
		const result = await runAgentSkill(
			{ name: "missing", presets: {}, model: mockModel },
			{
				...createMockDeps(createAgentSkill()),
				skillRepository: {
					findByName: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "SKILL_NOT_FOUND", name: "missing" },
					}),
					listAll: vi.fn(),
					listLocal: vi.fn(),
					listGlobal: vi.fn(),
				},
			},
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("SKILL_NOT_FOUND");
	});

	it("propagates context collection error", async () => {
		const skill = createAgentSkill({
			context: [{ type: "file", path: "nonexistent.md" }],
		});

		const result = await runAgentSkill(
			{ name: "test-agent", presets: {}, model: mockModel },
			{
				...createMockDeps(skill),
				contextCollector: {
					collect: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "EXECUTION_ERROR", message: "Failed to read file" },
					}),
				},
			},
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
	});

	it("propagates agent execution error", async () => {
		const skill = createAgentSkill();

		const result = await runAgentSkill(
			{ name: "test-agent", presets: {}, model: mockModel },
			{
				...createMockDeps(skill),
				agentExecutor: {
					execute: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "EXECUTION_ERROR", message: "Agent loop exceeded maximum steps" },
					}),
				},
			},
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
	});

	describe("hooks", () => {
		function stubHookExecutor(): HookExecutorPort & {
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

		it("calls on_success hook after successful agent execution", async () => {
			const skill = createAgentSkill();
			const hookExecutor = stubHookExecutor();
			const deps = {
				...createMockDeps(skill),
				hookExecutor,
				hooksConfig: { on_success: ["echo agent-done"], on_failure: ["echo agent-fail"] },
			};

			const result = await runAgentSkill(
				{ name: "test-agent", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(true);
			expect(hookExecutor.execute).toHaveBeenCalledOnce();
			expect(hookExecutor.calls[0].context.status).toBe("success");
			expect(hookExecutor.calls[0].context.mode).toBe("agent");
			expect(hookExecutor.calls[0].context.skillName).toBe("test-agent");
			expect(hookExecutor.calls[0].context.durationMs).toBeGreaterThanOrEqual(0);
			expect(hookExecutor.calls[0].commands).toEqual(["echo agent-done"]);
		});

		it("calls on_failure hook after failed agent execution", async () => {
			const skill = createAgentSkill();
			const hookExecutor = stubHookExecutor();
			const deps = {
				...createMockDeps(skill),
				hookExecutor,
				hooksConfig: { on_success: ["echo ok"], on_failure: ["echo fail"] },
				agentExecutor: {
					execute: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "EXECUTION_ERROR", message: "Agent crashed" },
					}),
				},
			};

			const result = await runAgentSkill(
				{ name: "test-agent", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(false);
			expect(hookExecutor.execute).toHaveBeenCalledOnce();
			expect(hookExecutor.calls[0].context.status).toBe("failed");
			expect(hookExecutor.calls[0].context.error).toBe("Agent crashed");
			expect(hookExecutor.calls[0].commands).toEqual(["echo fail"]);
		});

		it("works without hookExecutor and hooksConfig (backward compatible)", async () => {
			const skill = createAgentSkill();
			const deps = createMockDeps(skill);

			const result = await runAgentSkill(
				{ name: "test-agent", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(true);
		});

		it("does not call executor when on_success is empty", async () => {
			const skill = createAgentSkill();
			const hookExecutor = stubHookExecutor();
			const deps = {
				...createMockDeps(skill),
				hookExecutor,
				hooksConfig: { on_success: [], on_failure: [] },
			};

			await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

			expect(hookExecutor.execute).not.toHaveBeenCalled();
		});

		it("returns original error result even when hooks are configured", async () => {
			const skill = createAgentSkill();
			const hookExecutor = stubHookExecutor();
			const deps = {
				...createMockDeps(skill),
				hookExecutor,
				hooksConfig: { on_failure: ["notify"] },
				agentExecutor: {
					execute: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "EXECUTION_ERROR", message: "Agent timeout" },
					}),
				},
			};

			const result = await runAgentSkill(
				{ name: "test-agent", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			if (result.error.type === "EXECUTION_ERROR") {
				expect(result.error.message).toBe("Agent timeout");
			}
		});
	});

	it("resolves model priority: CLI model takes precedence", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(executorCall.model).toBe(mockModel);
	});

	it("passes noInput option to prompt collector", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel, noInput: true }, deps);

		expect(deps.promptCollector.collect).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			{ noInput: true },
		);
	});
});
