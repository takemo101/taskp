import type { CliRenderer } from "@opentui/core";
import type { Skill } from "../../../src/core/skill/skill";
import type { SkillInput } from "../../../src/core/skill/skill-input";
import type { SkillMetadata } from "../../../src/core/skill/skill-metadata";
import { showInputForm } from "../../../src/tui/screens/input-form";

const skill = createSkill("no-inputs", "No inputs skill", []);
const result = await showInputForm(null as unknown as CliRenderer, skill);
if (result === null) {
	console.error("FAIL: inputs=0 should return {} not null");
	process.exit(1);
}
if (Object.keys(result).length !== 0) {
	console.error("FAIL: inputs=0 should return empty record");
	process.exit(1);
}
console.log("PASS: inputs=0 returns empty record");

if (typeof showInputForm !== "function") {
	console.error("FAIL: showInputForm should be a function");
	process.exit(1);
}
console.log("PASS: showInputForm is a function");

console.log("PASS: input-form module imported successfully");

console.log("ALL CHECKS PASSED");

function createSkill(name: string, description: string, inputs: SkillInput[]): Skill {
	return {
		metadata: {
			name,
			description,
			mode: "template",
			inputs,
			tools: ["bash", "read", "write"],
			context: [],
		} as SkillMetadata,
		body: { raw: "", sections: [] } as unknown as Skill["body"],
		location: "/test",
		scope: "local",
	};
}
