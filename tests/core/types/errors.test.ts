import { describe, expect, it } from "vitest";
import {
	configError,
	domainErrorMessage,
	executionError,
	parseError,
	renderError,
	skillNotFoundError,
} from "../../../src/core/types/errors";

describe("domainErrorMessage", () => {
	it("returns message for ExecutionError", () => {
		expect(domainErrorMessage(executionError("cmd failed"))).toBe("cmd failed");
	});

	it("returns message for ParseError", () => {
		expect(domainErrorMessage(parseError("bad syntax"))).toBe("bad syntax");
	});

	it("returns message for RenderError", () => {
		expect(domainErrorMessage(renderError("missing var"))).toBe("missing var");
	});

	it("returns message for ConfigError", () => {
		expect(domainErrorMessage(configError("invalid"))).toBe("invalid");
	});

	it("returns formatted message for SkillNotFoundError", () => {
		expect(domainErrorMessage(skillNotFoundError("my-skill"))).toBe(
			"Skill not found: my-skill",
		);
	});
});
