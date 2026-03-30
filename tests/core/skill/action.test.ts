import { describe, expect, it } from "vitest";
import type { Action } from "../../../src/core/skill/action";
import { resolveActionConfig } from "../../../src/core/skill/action";
import type { SkillMetadata } from "../../../src/core/skill/skill-metadata";

function baseSkill(overrides: Partial<SkillMetadata> = {}): SkillMetadata {
	return {
		name: "test-skill",
		description: "A test skill",
		mode: "template",
		inputs: [{ name: "target", type: "text", message: "Target?" }],
		tools: ["bash", "read", "write"],
		context: [],
		...overrides,
	};
}

function baseAction(overrides: Partial<Action> = {}): Action {
	return {
		description: "An action",
		...overrides,
	};
}

describe("resolveActionConfig", () => {
	it("アクション未指定フィールドはスキルから継承される", () => {
		const skill = baseSkill({
			mode: "agent",
			model: "claude-sonnet-4-20250514",
			context: [{ type: "file", path: "README.md" }],
			tools: ["bash"],
			timeout: 60000,
		});
		const action = baseAction();

		const resolved = resolveActionConfig(action, skill);

		expect(resolved.mode).toBe("agent");
		expect(resolved.model).toBe("claude-sonnet-4-20250514");
		expect(resolved.context).toStrictEqual([{ type: "file", path: "README.md" }]);
		expect(resolved.tools).toStrictEqual(["bash"]);
		expect(resolved.timeout).toBe(60000);
	});

	it("アクション指定フィールドはスキルより優先される", () => {
		const skill = baseSkill({
			mode: "template",
			model: "gpt-4",
			context: [{ type: "file", path: "old.md" }],
			tools: ["bash"],
			timeout: 30000,
		});
		const action = baseAction({
			mode: "agent",
			model: "claude-sonnet-4-20250514",
			context: [{ type: "file", path: "new.md" }],
			tools: ["bash", "read", "write"],
			timeout: 120000,
		});

		const resolved = resolveActionConfig(action, skill);

		expect(resolved.mode).toBe("agent");
		expect(resolved.model).toBe("claude-sonnet-4-20250514");
		expect(resolved.context).toStrictEqual([{ type: "file", path: "new.md" }]);
		expect(resolved.tools).toStrictEqual(["bash", "read", "write"]);
		expect(resolved.timeout).toBe(120000);
	});

	it("スキルも未指定のフィールドはデフォルト値にフォールバックする", () => {
		const skill = baseSkill();
		const action = baseAction();

		const resolved = resolveActionConfig(action, skill);

		expect(resolved.mode).toBe("template");
		expect(resolved.model).toBeUndefined();
		expect(resolved.context).toStrictEqual([]);
		expect(resolved.tools).toStrictEqual(["bash", "read", "write"]);
		expect(resolved.timeout).toBeUndefined();
	});

	it("アクション未指定の inputs はスキルから継承される", () => {
		const skill = baseSkill({
			inputs: [{ name: "target", type: "text", message: "Target?" }],
		});
		const action = baseAction();

		const resolved = resolveActionConfig(action, skill);

		expect(resolved.inputs).toStrictEqual([{ name: "target", type: "text", message: "Target?" }]);
	});

	it("アクション固有の inputs が使用される", () => {
		const skill = baseSkill({
			inputs: [{ name: "skill-input", type: "text", message: "Skill input?" }],
		});
		const actionInputs = [
			{ name: "action-input", type: "text" as const, message: "Action input?" },
		];
		const action = baseAction({ inputs: actionInputs });

		const resolved = resolveActionConfig(action, skill);

		expect(resolved.inputs).toStrictEqual(actionInputs);
	});

	it("description はアクション自身のものが使用される", () => {
		const skill = baseSkill();
		const action = baseAction({ description: "Custom action description" });

		const resolved = resolveActionConfig(action, skill);

		expect(resolved.description).toBe("Custom action description");
	});

	it("hooks 未指定のアクションはスキルの hooks を継承する", () => {
		const skillHooks = {
			before: ["echo 'skill before'"],
			after: ["echo 'skill after'"],
		};
		const skill = baseSkill({ hooks: skillHooks });
		const action = baseAction();

		const resolved = resolveActionConfig(action, skill);

		expect(resolved.hooks).toStrictEqual(skillHooks);
	});

	it("アクション固有の hooks はスキルの hooks を完全に置き換える（オブジェクト単位）", () => {
		const skillHooks = {
			before: ["echo 'skill before'"],
			after: ["echo 'skill after'"],
			on_failure: ["echo 'skill failure'"],
		};
		const actionHooks = {
			before: ["echo 'action before'"],
		};
		const skill = baseSkill({ hooks: skillHooks });
		const action = baseAction({ hooks: actionHooks });

		const resolved = resolveActionConfig(action, skill);

		expect(resolved.hooks).toStrictEqual(actionHooks);
		expect(resolved.hooks?.after).toBeUndefined();
		expect(resolved.hooks?.on_failure).toBeUndefined();
	});

	it("スキルもアクションも hooks 未指定の場合 undefined になる", () => {
		const skill = baseSkill();
		const action = baseAction();

		const resolved = resolveActionConfig(action, skill);

		expect(resolved.hooks).toBeUndefined();
	});
});
