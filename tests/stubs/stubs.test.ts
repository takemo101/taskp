import { describe, expect, it } from "vitest";
import { ok } from "../../src/core/types/result";
import { makeSkill } from "../helpers/make-skill";
import { createInMemorySkillRepository } from "./in-memory-skill-repository";
import { createStubCommandExecutor } from "./stub-command-executor";
import { createStubPromptCollector } from "./stub-prompt-collector";
import { createStubSkillInitializer } from "./stub-skill-initializer";

describe("makeSkill", () => {
	it("creates a skill with defaults", () => {
		const skill = makeSkill();
		expect(skill.metadata.name).toBe("test-skill");
		expect(skill.scope).toBe("local");
	});

	it("applies overrides", () => {
		const skill = makeSkill({ name: "custom", scope: "global", mode: "agent" });
		expect(skill.metadata.name).toBe("custom");
		expect(skill.metadata.mode).toBe("agent");
		expect(skill.scope).toBe("global");
	});
});

describe("InMemorySkillRepository", () => {
	it("findByName returns ok for existing skill", async () => {
		const skill = makeSkill({ name: "hello" });
		const repo = createInMemorySkillRepository([skill]);

		const result = await repo.findByName("hello");
		expect(result).toEqual(ok(skill));
	});

	it("findByName returns err for missing skill", async () => {
		const repo = createInMemorySkillRepository([]);

		const result = await repo.findByName("missing");
		expect(result.ok).toBe(false);
	});

	it("listAll returns all skills", async () => {
		const skills = [makeSkill({ name: "a" }), makeSkill({ name: "b" })];
		const repo = createInMemorySkillRepository(skills);

		const result = await repo.listAll();
		expect(result.skills).toHaveLength(2);
		expect(result.failures).toHaveLength(0);
	});

	it("listLocal/listGlobal filters by scope", async () => {
		const skills = [
			makeSkill({ name: "local-one", scope: "local" }),
			makeSkill({ name: "global-one", scope: "global" }),
		];
		const repo = createInMemorySkillRepository(skills);

		const localResult = await repo.listLocal();
		const globalResult = await repo.listGlobal();
		expect(localResult.skills).toHaveLength(1);
		expect(globalResult.skills).toHaveLength(1);
	});
});

describe("StubCommandExecutor", () => {
	it("records executed commands", async () => {
		const executor = createStubCommandExecutor();
		await executor.execute("echo hello", { cwd: "/tmp" });

		expect(executor.executedCommands).toEqual([
			{ command: "echo hello", options: { cwd: "/tmp" } },
		]);
	});

	it("returns preset result", async () => {
		const preset = ok({ stdout: "output", stderr: "", exitCode: 0 } as const);
		const executor = createStubCommandExecutor(preset);

		const result = await executor.execute("any");
		expect(result).toEqual(preset);
	});
});

describe("StubPromptCollector", () => {
	it("returns preset answers merged with presets", async () => {
		const collector = createStubPromptCollector({ name: "Alice" });

		const result = await collector.collect([], { existing: "value" });
		expect(result).toEqual(ok({ existing: "value", name: "Alice" }));
	});

	it("records collected inputs", async () => {
		const collector = createStubPromptCollector({});
		const inputs = [{ name: "q", type: "text" as const, message: "Question?" }];

		await collector.collect(inputs, {});
		expect(collector.collectedInputs).toHaveLength(1);
	});
});

describe("StubSkillInitializer", () => {
	it("records created skills with path", async () => {
		const initializer = createStubSkillInitializer("/custom");

		const result = await initializer.create("my-skill", {
			mode: "template",
			description: "A skill",
		});

		expect(result).toEqual(ok("/custom/my-skill/SKILL.md"));
		expect(initializer.createdSkills).toEqual([
			{
				name: "my-skill",
				options: { mode: "template", description: "A skill" },
				path: "/custom/my-skill/SKILL.md",
			},
		]);
	});
});
