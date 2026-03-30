import { describe, expect, it } from "vitest";
import { checkInputError } from "../../../src/core/skill/check-input-error";
import type { SkillInput } from "../../../src/core/skill/skill-input";

describe("checkInputError", () => {
	describe("required check", () => {
		it("returns error for empty value when required is undefined (default)", () => {
			const input: SkillInput = { name: "name", type: "text", message: "Name?" };
			expect(checkInputError(input, "")).toContain("required");
		});

		it("returns error for empty value when required is true", () => {
			const input: SkillInput = { name: "name", type: "text", message: "Name?", required: true };
			expect(checkInputError(input, "")).toContain("required");
		});

		it("returns undefined for empty value when required is false", () => {
			const input: SkillInput = {
				name: "name",
				type: "text",
				message: "Name?",
				required: false,
			};
			expect(checkInputError(input, "")).toBeUndefined();
		});

		it("returns undefined for non-empty value", () => {
			const input: SkillInput = { name: "name", type: "text", message: "Name?" };
			expect(checkInputError(input, "Alice")).toBeUndefined();
		});
	});

	describe("validate regex check", () => {
		it("returns undefined when value matches pattern", () => {
			const input: SkillInput = {
				name: "code",
				type: "text",
				message: "Code?",
				validate: "^[a-z]+\\d+$",
			};
			expect(checkInputError(input, "abc123")).toBeUndefined();
		});

		it("returns error when value does not match pattern", () => {
			const input: SkillInput = {
				name: "code",
				type: "text",
				message: "Code?",
				validate: "^[a-z]+\\d+$",
			};
			const result = checkInputError(input, "INVALID");
			expect(result).toContain("must match pattern");
		});

		it("skips regex check for empty value (required handles that)", () => {
			const input: SkillInput = {
				name: "code",
				type: "text",
				message: "Code?",
				required: false,
				validate: "^[a-z]+$",
			};
			expect(checkInputError(input, "")).toBeUndefined();
		});

		it("throws on invalid regex pattern (Defect: Zod schema should have caught this)", () => {
			const input: SkillInput = {
				name: "code",
				type: "text",
				message: "Code?",
				validate: "[invalid(",
			};
			expect(() => checkInputError(input, "anything")).toThrow();
		});
	});

	describe("combined required + validate", () => {
		it("returns required error before regex check for empty required value", () => {
			const input: SkillInput = {
				name: "email",
				type: "text",
				message: "Email?",
				validate: "^.+@.+$",
			};
			const result = checkInputError(input, "");
			expect(result).toContain("required");
		});
	});
});
