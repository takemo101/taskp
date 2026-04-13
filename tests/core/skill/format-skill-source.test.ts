import { homedir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatSkillSource } from "../../../src/core/skill/format-skill-source";

describe("formatSkillSource", () => {
	const home = homedir();

	it("returns home-relative path for skills under home directory", () => {
		const location = join(home, ".taskp", "skills", "deploy", "SKILL.md");
		expect(formatSkillSource(location)).toBe("~/.taskp/skills/deploy");
	});

	it("returns cwd-relative path for project skills", () => {
		const cwd = "/tmp/my-project";
		const location = "/tmp/my-project/.taskp/skills/test/SKILL.md";
		expect(formatSkillSource(location, cwd)).toBe(".taskp/skills/test");
	});

	it("returns dot for skill dir equal to cwd", () => {
		const cwd = "/tmp/project";
		const location = "/tmp/project/SKILL.md";
		expect(formatSkillSource(location, cwd)).toBe(".");
	});

	it("returns parent-relative path when skill is above cwd", () => {
		const cwd = "/tmp/project/src";
		const location = "/tmp/project/.taskp/skills/deploy/SKILL.md";
		const result = formatSkillSource(location, cwd);
		expect(result).toBe("../.taskp/skills/deploy");
	});
});
