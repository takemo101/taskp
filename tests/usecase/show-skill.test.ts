import { describe, expect, it } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { skillNotFoundError } from "../../src/core/types/errors";
import { err, ok } from "../../src/core/types/result";
import type { SkillRepository } from "../../src/usecase/port/skill-repository";
import { showSkill } from "../../src/usecase/show-skill";

function createRepository(skills: readonly Skill[]): SkillRepository {
	return {
		findByName: async (name) => {
			const found = skills.find((s) => s.metadata.name === name);
			return found ? ok(found) : err(skillNotFoundError(name));
		},
		listAll: async () => [...skills],
		listLocal: async () => skills.filter((s) => s.scope === "local"),
		listGlobal: async () => skills.filter((s) => s.scope === "global"),
	};
}

const deploySkill: Skill = {
	metadata: {
		name: "deploy",
		description: "アプリケーションをデプロイする",
		mode: "template",
		inputs: [
			{
				name: "environment",
				type: "select",
				message: "デプロイ先を選んでください",
				choices: ["staging", "production"],
			},
			{
				name: "branch",
				type: "text",
				message: "ブランチ名は？",
				default: "main",
			},
		],
		tools: ["bash", "read", "write"],
		context: [{ type: "file", path: "./config.toml" }],
	},
	body: { content: "# Deploy", extractCodeBlocks: () => [] },
	location: "/project/.taskp/skills/deploy/SKILL.md",
	scope: "local",
};

describe("showSkill", () => {
	it("returns skill details for existing skill", async () => {
		const repository = createRepository([deploySkill]);
		const result = await showSkill("deploy", repository);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.name).toBe("deploy");
		expect(result.value.description).toBe("アプリケーションをデプロイする");
		expect(result.value.mode).toBe("template");
		expect(result.value.location).toBe("/project/.taskp/skills/deploy/SKILL.md");
		expect(result.value.inputs).toHaveLength(2);
		expect(result.value.context).toHaveLength(1);
	});

	it("returns error for non-existent skill", async () => {
		const repository = createRepository([]);
		const result = await showSkill("nonexistent", repository);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.error.type).toBe("SKILL_NOT_FOUND");
	});
});
