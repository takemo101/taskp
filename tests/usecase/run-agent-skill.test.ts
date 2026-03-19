import type { LanguageModelV3 } from "@ai-sdk/provider";
import { describe, expect, it, vi } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { ok } from "../../src/core/types/result";
import type { AgentExecutorPort } from "../../src/usecase/port/agent-executor";
import type { ContextCollectorPort } from "../../src/usecase/port/context-collector";
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
		collect: vi.fn().mockResolvedValue({}),
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
		const executorCall = vi.mocked(deps.agentExecutor.execute).mock.calls[0][0];
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

	it("resolves model priority: CLI model takes precedence", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		const executorCall = vi.mocked(deps.agentExecutor.execute).mock.calls[0][0];
		expect(executorCall.model).toBe(mockModel);
	});
});
