import { describe, expect, it } from "vitest";
import { parseSkill } from "../../../src/core/skill/skill";
import {
	resolveAgentExecution,
	resolveTemplateExecution,
} from "../../../src/core/skill/skill-execution-resolver";
import { domainErrorMessage } from "../../../src/core/types/errors";

function buildSkillRaw(frontmatter: string, body: string): string {
	return `---\n${frontmatter}\n---\n${body}`;
}

const simpleSkill = buildSkillRaw(
	[
		"name: test-skill",
		'description: "A test skill"',
		"mode: agent",
		"inputs:",
		'  - { name: "target", type: "text", message: "Target?" }',
		"tools: [bash, read]",
		"context:",
		'  - { type: "file", path: "README.md" }',
		"timeout: 60000",
	].join("\n"),
	"\n# Test Skill\n\nDo something with {{target}}\n\n```bash\necho hello\n```\n",
);

const actionSkill = buildSkillRaw(
	[
		"name: multi-action",
		'description: "Multi action skill"',
		"mode: agent",
		"tools: [bash]",
		"actions:",
		"  deploy:",
		'    description: "Deploy"',
		"    inputs:",
		'      - { name: "env", type: "text", message: "Env?" }',
		"    tools: [bash, write]",
		"    context:",
		'      - { type: "file", path: "deploy.md" }',
		"    timeout: 30000",
		"  test:",
		'    description: "Test"',
		"    mode: template",
	].join("\n"),
	[
		"",
		"## action:deploy",
		"",
		"Deploy to {{env}}",
		"",
		"```bash",
		"deploy --env {{env}}",
		"```",
		"",
		"## action:test",
		"",
		"Run tests",
		"",
		"```bash",
		"npm test",
		"```",
	].join("\n"),
);

function parseTestSkill(raw: string) {
	const result = parseSkill(raw, "/test/SKILL.md");
	if (!result.ok) throw new Error("Failed to parse skill");
	return result.value;
}

describe("resolveAgentExecution", () => {
	it("アクション未指定時はスキルレベルの設定を返す", () => {
		const skill = parseTestSkill(simpleSkill);
		const result = resolveAgentExecution(skill, undefined);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.inputs).toStrictEqual(skill.metadata.inputs);
		expect(result.value.tools).toStrictEqual(["bash", "read"]);
		expect(result.value.context).toStrictEqual([{ type: "file", path: "README.md" }]);
		expect(result.value.content).toContain("Do something with {{target}}");
	});

	it("アクション指定時はアクションの設定を返す", () => {
		const skill = parseTestSkill(actionSkill);
		const result = resolveAgentExecution(skill, "deploy");

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.inputs).toStrictEqual([{ name: "env", type: "text", message: "Env?" }]);
		expect(result.value.tools).toStrictEqual(["bash", "write"]);
		expect(result.value.context).toStrictEqual([{ type: "file", path: "deploy.md" }]);
		expect(result.value.content).toContain("Deploy to {{env}}");
	});

	it("存在しないアクション名でエラーを返す", () => {
		const skill = parseTestSkill(actionSkill);
		const result = resolveAgentExecution(skill, "nonexistent");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(domainErrorMessage(result.error)).toContain("nonexistent");
	});
});

describe("resolveTemplateExecution", () => {
	it("アクション未指定時はスキルレベルの設定を返す", () => {
		const skill = parseTestSkill(simpleSkill);
		const result = resolveTemplateExecution(skill, undefined);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.inputs).toStrictEqual(skill.metadata.inputs);
		expect(result.value.content).toContain("Do something with {{target}}");
		expect(result.value.codeBlocks.length).toBe(1);
		expect(result.value.timeout).toBe(60000);
	});

	it("アクション指定時はアクションの設定を返す", () => {
		const skill = parseTestSkill(actionSkill);
		const result = resolveTemplateExecution(skill, "deploy");

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.inputs).toStrictEqual([{ name: "env", type: "text", message: "Env?" }]);
		expect(result.value.content).toContain("Deploy to {{env}}");
		expect(result.value.codeBlocks.length).toBe(1);
		expect(result.value.timeout).toBe(30000);
	});

	it("アクション定義済みスキルでアクション未指定時はエラーを返す", () => {
		const skill = parseTestSkill(actionSkill);
		const result = resolveTemplateExecution(skill, undefined);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(domainErrorMessage(result.error)).toContain("has actions defined");
	});

	it("存在しないアクション名でエラーを返す", () => {
		const skill = parseTestSkill(actionSkill);
		const result = resolveTemplateExecution(skill, "nonexistent");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(domainErrorMessage(result.error)).toContain("nonexistent");
	});
});
