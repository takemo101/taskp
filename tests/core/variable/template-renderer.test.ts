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

	describe("conditional blocks ({{#if}}/{{else}}/{{/if}})", () => {
		it("renders if-block when variable is truthy", () => {
			const result = renderTemplate("{{#if flag}}YES{{/if}}", { flag: "true" }, RESERVED);
			expect(result).toEqual({ ok: true, value: "YES" });
		});

		it("renders else-block when variable is 'false'", () => {
			const result = renderTemplate(
				"{{#if flag}}YES{{else}}NO{{/if}}",
				{ flag: "false" },
				RESERVED,
			);
			expect(result).toEqual({ ok: true, value: "NO" });
		});

		it("renders else-block when variable is empty string", () => {
			const result = renderTemplate(
				"{{#if name}}Hello {{name}}{{else}}No name{{/if}}",
				{ name: "" },
				RESERVED,
			);
			expect(result).toEqual({ ok: true, value: "No name" });
		});

		it("renders nothing when variable is falsy and no else-block", () => {
			const result = renderTemplate(
				"before{{#if flag}} included{{/if}} after",
				{ flag: "false" },
				RESERVED,
			);
			expect(result).toEqual({ ok: true, value: "before after" });
		});

		it("expands variables inside the selected branch", () => {
			const result = renderTemplate(
				"{{#if flag}}Deploy to {{env}}{{else}}Skipped{{/if}}",
				{ flag: "true", env: "production" },
				RESERVED,
			);
			expect(result).toEqual({ ok: true, value: "Deploy to production" });
		});

		it("ignores variables in the non-selected branch", () => {
			const result = renderTemplate(
				"{{#if flag}}{{used}}{{else}}{{unused_is_ok}}{{/if}}",
				{ flag: "true", used: "value" },
				RESERVED,
			);
			expect(result).toEqual({ ok: true, value: "value" });
		});

		it("handles multiple conditional blocks", () => {
			const result = renderTemplate(
				"{{#if a}}A{{/if}}-{{#if b}}B{{/if}}",
				{ a: "true", b: "false" },
				RESERVED,
			);
			expect(result).toEqual({ ok: true, value: "A-" });
		});

		it("returns error when condition variable is undefined", () => {
			const result = renderTemplate("{{#if unknown}}X{{/if}}", {}, RESERVED);
			expect(result).toEqual({
				ok: false,
				error: { type: "RENDER_ERROR", message: "Undefined variables: unknown" },
			});
		});

		it("treats any non-empty non-false string as truthy", () => {
			const result = renderTemplate(
				"{{#if val}}YES{{else}}NO{{/if}}",
				{ val: "anything" },
				RESERVED,
			);
			expect(result).toEqual({ ok: true, value: "YES" });
		});

		it("works with multiline content in branches", () => {
			const template = `{{#if verbose}}
Line 1
Line 2
{{else}}
Short
{{/if}}`;
			const result = renderTemplate(template, { verbose: "true" }, RESERVED);
			expect(result).toEqual({
				ok: true,
				value: "\nLine 1\nLine 2\n",
			});
		});

		it("returns error for nested {{#if}} blocks", () => {
			const result = renderTemplate(
				"{{#if a}}{{#if b}}nested{{/if}}{{/if}}",
				{ a: "true", b: "true" },
				RESERVED,
			);
			expect(result).toEqual({
				ok: false,
				error: { type: "RENDER_ERROR", message: "Nested {{#if}} blocks are not supported" },
			});
		});

		it("allows condition variable to also appear in body", () => {
			const result = renderTemplate("{{#if flag}}flag={{flag}}{{/if}}", { flag: "true" }, RESERVED);
			expect(result).toEqual({ ok: true, value: "flag=true" });
		});

		it("allows reserved variable as condition", () => {
			const result = renderTemplate("{{#if __cwd__}}cwd exists{{else}}no cwd{{/if}}", {}, RESERVED);
			expect(result).toEqual({ ok: true, value: "cwd exists" });
		});

		it("returns error for unclosed {{#if}} block", () => {
			const result = renderTemplate("{{#if flag}}no closing tag", { flag: "true" }, RESERVED);
			expect(result).toEqual({
				ok: false,
				error: { type: "RENDER_ERROR", message: "Unclosed {{#if}} block: missing {{/if}}" },
			});
		});

		it("returns error for {{/if}} without matching {{#if}}", () => {
			const result = renderTemplate("some text{{/if}}", {}, RESERVED);
			expect(result).toEqual({
				ok: false,
				error: { type: "RENDER_ERROR", message: "Unexpected {{/if}} without matching {{#if}}" },
			});
		});

		it("returns error for {{else}} without matching {{#if}}", () => {
			const result = renderTemplate("some text{{else}}other", {}, RESERVED);
			expect(result).toEqual({
				ok: false,
				error: { type: "RENDER_ERROR", message: "Unexpected {{else}} without matching {{#if}}" },
			});
		});
	});
});
