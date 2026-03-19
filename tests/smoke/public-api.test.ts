import { describe, expect, it } from "vitest";

describe("public API (src/index.ts)", () => {
	it("exports core domain types and functions", async () => {
		const api = await import("../../src/index");

		// Result utilities
		expect(api.ok).toBeTypeOf("function");
		expect(api.err).toBeTypeOf("function");
		expect(api.isOk).toBeTypeOf("function");
		expect(api.isErr).toBeTypeOf("function");
		expect(api.map).toBeTypeOf("function");
		expect(api.flatMap).toBeTypeOf("function");

		// Skill parsers
		expect(api.parseSkill).toBeTypeOf("function");
		expect(api.parseSkillMetadata).toBeTypeOf("function");
		expect(api.parseSkillInput).toBeTypeOf("function");

		// Error constructors
		expect(api.ErrorType).toBeDefined();
		expect(api.skillNotFoundError).toBeTypeOf("function");
		expect(api.parseError).toBeTypeOf("function");
		expect(api.renderError).toBeTypeOf("function");
		expect(api.executionError).toBeTypeOf("function");
		expect(api.configError).toBeTypeOf("function");

		// Use case functions
		expect(api.initSkill).toBeTypeOf("function");
		expect(api.createListSkillsUseCase).toBeTypeOf("function");
		expect(api.runSkill).toBeTypeOf("function");
		expect(api.runAgentSkill).toBeTypeOf("function");
		expect(api.showSkill).toBeTypeOf("function");
	});

	it("Result utilities work correctly", async () => {
		const { ok, err, isOk, isErr } = await import("../../src/index");

		const success = ok(42);
		expect(isOk(success)).toBe(true);
		expect(isErr(success)).toBe(false);

		const failure = err("error");
		expect(isOk(failure)).toBe(false);
		expect(isErr(failure)).toBe(true);
	});
});
