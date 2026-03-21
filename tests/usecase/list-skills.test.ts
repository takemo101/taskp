import { describe, expect, it } from "vitest";
import type { Skill, SkillScope } from "../../src/core/skill/skill";
import { skillNotFoundError } from "../../src/core/types/errors";
import { err, ok } from "../../src/core/types/result";
import { createListSkillsUseCase } from "../../src/usecase/list-skills";
import type { SkillRepository } from "../../src/usecase/port/skill-repository";

function createSkill(name: string, scope: SkillScope): Skill {
	return {
		metadata: {
			name,
			description: `${name} skill`,
			mode: "template",
			inputs: [],
			tools: ["bash", "read", "write"],
			context: [],
		},
		body: { content: `# ${name}`, extractCodeBlocks: () => [] },
		location:
			scope === "local" ? `/project/.taskp/skills/${name}/SKILL.md` : `/global/${name}/SKILL.md`,
		scope,
	};
}

function createInMemoryRepository(skills: readonly Skill[]): SkillRepository {
	return {
		findByName: async (name) => {
			const found = skills.find((s) => s.metadata.name === name);
			return found ? ok(found) : err(skillNotFoundError(name));
		},
		listAll: async () => ({ skills: [...skills], failures: [] }),
		listLocal: async () => ({ skills: skills.filter((s) => s.scope === "local"), failures: [] }),
		listGlobal: async () => ({ skills: skills.filter((s) => s.scope === "global"), failures: [] }),
	};
}

describe("ListSkillsUseCase", () => {
	const localDeploy = createSkill("deploy", "local");
	const globalDeploy = createSkill("deploy", "global");
	const globalLint = createSkill("lint", "global");
	const localTest = createSkill("test", "local");

	it("ローカル + グローバルの統合一覧を返す", async () => {
		const repo = createInMemoryRepository([localTest, globalLint]);
		const usecase = createListSkillsUseCase(repo);

		const result = await usecase.execute({});

		expect(result.skills).toHaveLength(2);
		const names = result.skills.map((s) => s.metadata.name);
		expect(names).toContain("test");
		expect(names).toContain("lint");
	});

	it("同名スキルはローカルを優先する", async () => {
		const repo = createInMemoryRepository([globalDeploy, localDeploy, globalLint]);
		const usecase = createListSkillsUseCase(repo);

		const result = await usecase.execute({});

		expect(result.skills).toHaveLength(2);
		const deploy = result.skills.find((s) => s.metadata.name === "deploy");
		expect(deploy?.scope).toBe("local");
	});

	it("--global フィルタでグローバルスキルのみ返す", async () => {
		const repo = createInMemoryRepository([localTest, globalLint, globalDeploy]);
		const usecase = createListSkillsUseCase(repo);

		const result = await usecase.execute({ scope: "global" });

		expect(result.skills).toHaveLength(2);
		for (const skill of result.skills) {
			expect(skill.scope).toBe("global");
		}
	});

	it("--local フィルタでローカルスキルのみ返す", async () => {
		const repo = createInMemoryRepository([localTest, globalLint, localDeploy]);
		const usecase = createListSkillsUseCase(repo);

		const result = await usecase.execute({ scope: "local" });

		expect(result.skills).toHaveLength(2);
		for (const skill of result.skills) {
			expect(skill.scope).toBe("local");
		}
	});

	it("スキルが0件の場合は空配列を返す", async () => {
		const repo = createInMemoryRepository([]);
		const usecase = createListSkillsUseCase(repo);

		const result = await usecase.execute({});

		expect(result.skills).toHaveLength(0);
	});
});
