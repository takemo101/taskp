import { describe, expect, it } from "vitest";
import type { ReservedVars } from "../../../src/core/variable/template-renderer";
import { renderTemplate } from "../../../src/core/variable/template-renderer";

const RESERVED: ReservedVars = {
	cwd: "/home/user/project",
	skillDir: "/home/user/.taskp/skills/deploy",
	date: "2026-03-19",
	timestamp: "2026-03-19T12:00:00.000Z",
};

describe("renderTemplate", () => {
	it("expands a single variable", () => {
		const result = renderTemplate("Hello {{name}}!", { name: "World" }, RESERVED);
		expect(result).toEqual({ ok: true, value: "Hello World!" });
	});

	it("expands multiple variables", () => {
		const result = renderTemplate(
			"Deploy {{branch}} to {{env}}",
			{ branch: "main", env: "production" },
			RESERVED,
		);
		expect(result).toEqual({
			ok: true,
			value: "Deploy main to production",
		});
	});

	it("expands reserved variables", () => {
		const result = renderTemplate(
			"cwd={{__cwd__}} dir={{__skill_dir__}} date={{__date__}} ts={{__timestamp__}}",
			{},
			RESERVED,
		);
		expect(result).toEqual({
			ok: true,
			value: `cwd=${RESERVED.cwd} dir=${RESERVED.skillDir} date=${RESERVED.date} ts=${RESERVED.timestamp}`,
		});
	});

	it("returns error for undefined variables", () => {
		const result = renderTemplate("{{unknown}} and {{missing}}", {}, RESERVED);
		expect(result).toEqual({
			ok: false,
			error: { type: "RENDER_ERROR", message: "Undefined variables: unknown, missing" },
		});
	});

	it("passes through template without variables", () => {
		const result = renderTemplate("No variables here.", {}, RESERVED);
		expect(result).toEqual({ ok: true, value: "No variables here." });
	});

	it("expands the same variable appearing multiple times", () => {
		const result = renderTemplate("{{x}} + {{x}} = 2 * {{x}}", { x: "5" }, RESERVED);
		expect(result).toEqual({ ok: true, value: "5 + 5 = 2 * 5" });
	});

	it("returns deduplicated undefined variable names", () => {
		const result = renderTemplate("{{a}} {{a}} {{b}}", {}, RESERVED);
		expect(result).toEqual({
			ok: false,
			error: { type: "RENDER_ERROR", message: "Undefined variables: a, b" },
		});
	});
});
