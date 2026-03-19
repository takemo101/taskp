import type { LanguageModelV3 } from "@ai-sdk/provider";
import { describe, expect, it, vi } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { ok } from "../../src/core/types/result";
import type { PromptCollector } from "../../src/usecase/port/prompt-collector";
import type { SkillRepository } from "../../src/usecase/port/skill-repository";
import { prepareAgentSkill } from "../../src/usecase/run-agent-skill";

function createAgentSkill(): Skill {
	return {
		metadata: {
			name: "test-agent",
			description: "A test agent skill",
			mode: "agent",
			inputs: [],
			model: undefined,
			tools: ["bash", "read"],
			context: [],
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

	return { skillRepository, promptCollector };
}

const mockModel = {} as LanguageModelV3;

describe("prepareAgentSkill", () => {
	it("returns agent config from skill", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		const result = await prepareAgentSkill(
			{
				name: "test-agent",
				presets: {},
				model: mockModel,
			},
			deps,
		);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.skillName).toBe("test-agent");
		expect(result.value.toolNames).toEqual(["bash", "read"]);
		expect(result.value.maxSteps).toBe(50);
		expect(result.value.model).toBe(mockModel);
	});

	it("renders template variables in system prompt", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		const result = await prepareAgentSkill(
			{
				name: "test-agent",
				presets: {},
				model: mockModel,
			},
			deps,
		);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.systemPrompt).toContain("You are a helpful assistant.");
	});

	it("propagates skill-not-found error", async () => {
		const skillRepository: SkillRepository = {
			findByName: vi.fn().mockResolvedValue({
				ok: false,
				error: { type: "SKILL_NOT_FOUND", name: "missing" },
			}),
			listAll: vi.fn(),
			listLocal: vi.fn(),
			listGlobal: vi.fn(),
		};
		const promptCollector: PromptCollector = {
			collect: vi.fn().mockResolvedValue({}),
		};
		const deps = { skillRepository, promptCollector };

		const result = await prepareAgentSkill(
			{
				name: "missing",
				presets: {},
				model: mockModel,
			},
			deps,
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("SKILL_NOT_FOUND");
	});
});
