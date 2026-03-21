import { describe, expect, it, vi } from "vitest";
import type { Skill } from "../../../src/core/skill/skill";
import type { SkillInput } from "../../../src/core/skill/skill-input";
import type { SkillMetadata } from "../../../src/core/skill/skill-metadata";
import { err, ok } from "../../../src/core/types/result";
import type { ExecutionViewPort } from "../../../src/tui/tui-stream-writer";

vi.mock("../../../src/usecase/run-skill");
vi.mock("../../../src/usecase/run-agent-skill");
vi.mock("../../../src/adapter/agent-executor", () => ({
	createAgentExecutor: () => ({}),
}));
vi.mock("../../../src/adapter/context-collector", () => ({
	createContextCollector: () => ({}),
}));
vi.mock("../../../src/adapter/context-collector-deps", () => ({
	createDefaultContextCollectorDeps: async () => ({}),
}));

import {
	createPresetPromptCollector,
	createSingleSkillRepository,
	type ExecutionDeps,
	formatDomainError,
	runExecution,
} from "../../../src/tui/screens/execution-runner";
import { runAgentSkill } from "../../../src/usecase/run-agent-skill";
import { runSkill } from "../../../src/usecase/run-skill";

const mockedRunSkill = vi.mocked(runSkill);
const mockedRunAgentSkill = vi.mocked(runAgentSkill);

function createSkill(name: string, mode: "template" | "agent", inputs: SkillInput[] = []): Skill {
	return {
		metadata: {
			name,
			description: `${name} skill`,
			mode,
			inputs,
			tools: ["bash", "read", "write"],
			context: [],
		} as SkillMetadata,
		body: { raw: "", sections: [] } as unknown as Skill["body"],
		location: "/test",
		scope: "local",
	};
}

function createMockViewPort(): ExecutionViewPort & { calls: string[] } {
	const calls: string[] = [];
	return {
		calls,
		appendContext(text: string) {
			calls.push(`appendContext:${text}`);
		},
		appendOutput(text: string) {
			calls.push(`appendOutput:${text}`);
		},
		showToolStatus(toolName: string, _args: Record<string, unknown>) {
			calls.push(`showToolStatus:${toolName}`);
		},
		clearToolStatus() {
			calls.push("clearToolStatus");
		},
		showSummary(elapsedMs: number, steps: number) {
			calls.push(`showSummary:${elapsedMs}:${steps}`);
		},
	};
}

function createMockDeps(): ExecutionDeps {
	return {
		commandExecutor: { execute: vi.fn() },
		hookExecutor: { execute: vi.fn() },
		skillRepositoryFactory: createSingleSkillRepository,
		promptCollectorFactory: createPresetPromptCollector,
	};
}

describe("formatDomainError", () => {
	it("formats SKILL_NOT_FOUND with skill name", () => {
		const result = formatDomainError({ type: "SKILL_NOT_FOUND", name: "my-skill" });
		expect(result).toBe('Skill "my-skill" not found');
	});

	it("formats PARSE_ERROR with message", () => {
		const result = formatDomainError({ type: "PARSE_ERROR", message: "bad syntax" });
		expect(result).toBe("bad syntax");
	});

	it("formats EXECUTION_ERROR with message", () => {
		const result = formatDomainError({ type: "EXECUTION_ERROR", message: "command failed" });
		expect(result).toBe("command failed");
	});
});

describe("createSingleSkillRepository", () => {
	it("returns the skill from findByName", async () => {
		const skill = createSkill("test", "template");
		const repo = createSingleSkillRepository(skill);
		const result = await repo.findByName("anything");
		expect(result).toEqual(ok(skill));
	});

	it("returns empty arrays for list methods", async () => {
		const skill = createSkill("test", "template");
		const repo = createSingleSkillRepository(skill);
		expect(await repo.listAll()).toEqual({ skills: [], failures: [] });
		expect(await repo.listLocal()).toEqual({ skills: [], failures: [] });
		expect(await repo.listGlobal()).toEqual({ skills: [], failures: [] });
	});
});

describe("createPresetPromptCollector", () => {
	it("returns the provided variables", async () => {
		const vars = { key: "value" };
		const collector = createPresetPromptCollector(vars);
		const result = await collector.collect([], {});
		expect(result).toEqual(ok({ key: "value" }));
	});
});

describe("runExecution", () => {
	it("shows error when agent mode has no model", async () => {
		const skill = createSkill("agent-skill", "agent");
		const view = createMockViewPort();
		const deps = createMockDeps();

		await runExecution(skill, {}, null, view, deps);

		expect(view.calls).toContain("appendOutput:Error: LLM model not configured.\n");
		expect(view.calls).toContain(
			"appendOutput:Set default_provider and default_model in .taskp/config.toml\n",
		);
		expect(view.calls).toContain("showSummary:0:0");
	});

	it("handles execution errors gracefully in template mode", async () => {
		const skill = createSkill("tmpl-skill", "template");
		const view = createMockViewPort();
		const deps = createMockDeps();

		mockedRunSkill.mockRejectedValueOnce(new Error("unexpected failure"));

		await runExecution(skill, {}, null, view, deps);

		expect(view.calls).toContain("appendOutput:\nError: unexpected failure\n");
		expect(view.calls).toContain("showSummary:0:0");
	});

	it("handles non-Error thrown values gracefully", async () => {
		const skill = createSkill("tmpl-skill", "template");
		const view = createMockViewPort();
		const deps = createMockDeps();

		mockedRunSkill.mockRejectedValueOnce("string error");

		await runExecution(skill, {}, null, view, deps);

		expect(view.calls).toContain("appendOutput:\nError: string error\n");
		expect(view.calls).toContain("showSummary:0:0");
	});

	it("outputs command results in template mode on success", async () => {
		const skill = createSkill("tmpl-skill", "template");
		const view = createMockViewPort();
		const deps = createMockDeps();

		mockedRunSkill.mockResolvedValueOnce(
			ok({
				skillName: "tmpl-skill",
				rendered: "echo hello",
				dryRun: false,
				commands: [
					{
						command: "echo hello",
						result: { exitCode: 0, stdout: "hello\n", stderr: "" },
					},
				],
			}),
		);

		await runExecution(skill, {}, null, view, deps);

		expect(view.calls).toContain("appendOutput:\n$ echo hello\n");
		expect(view.calls).toContain("appendOutput:hello\n");
		expect(view.calls).toContain("showSummary:0:1");
	});

	it("outputs stderr in template mode", async () => {
		const skill = createSkill("tmpl-skill", "template");
		const view = createMockViewPort();
		const deps = createMockDeps();

		mockedRunSkill.mockResolvedValueOnce(
			ok({
				skillName: "tmpl-skill",
				rendered: "bad-cmd",
				dryRun: false,
				commands: [
					{
						command: "bad-cmd",
						result: { exitCode: 1, stdout: "", stderr: "not found\n" },
					},
				],
			}),
		);

		await runExecution(skill, {}, null, view, deps);

		expect(view.calls).toContain("appendOutput:not found\n");
	});

	it("shows domain error when template mode returns error result", async () => {
		const skill = createSkill("tmpl-skill", "template");
		const view = createMockViewPort();
		const deps = createMockDeps();

		mockedRunSkill.mockResolvedValueOnce(
			err({ type: "SKILL_NOT_FOUND" as const, name: "tmpl-skill" }),
		);

		await runExecution(skill, {}, null, view, deps);

		expect(view.calls).toContain('appendOutput:\nError: Skill "tmpl-skill" not found\n');
		expect(view.calls).toContain("showSummary:0:0");
	});

	it("shows domain error when agent mode returns error result", async () => {
		const skill = createSkill("agent-skill", "agent");
		const view = createMockViewPort();
		const deps = createMockDeps();
		const fakeModel = {} as never;

		mockedRunAgentSkill.mockResolvedValueOnce(
			err({ type: "EXECUTION_ERROR" as const, message: "LLM unavailable" }),
		);

		await runExecution(skill, {}, fakeModel, view, deps);

		expect(view.calls).toContain("appendOutput:\nError: LLM unavailable\n");
		expect(view.calls).toContain("showSummary:0:0");
	});

	it("handles execution errors gracefully in agent mode", async () => {
		const skill = createSkill("agent-skill", "agent");
		const view = createMockViewPort();
		const deps = createMockDeps();
		const fakeModel = {} as never;

		mockedRunAgentSkill.mockRejectedValueOnce(new Error("network error"));

		await runExecution(skill, {}, fakeModel, view, deps);

		expect(view.calls).toContain("appendOutput:\nError: network error\n");
		expect(view.calls).toContain("showSummary:0:0");
	});
});
