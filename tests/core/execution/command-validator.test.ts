import { describe, expect, it } from "vitest";
import { validateCommand } from "../../../src/core/execution/tools/command-validator";

describe("validateCommand", () => {
	it("rejects $(...) command substitution", () => {
		expect(validateCommand("echo $(whoami)")).toBeDefined();
	});

	// biome-ignore lint/suspicious/noTemplateCurlyInString: describing literal shell syntax
	it("rejects ${...} parameter expansion", () => {
		expect(validateCommand("echo $\x7BHOME}")).toBeDefined();
	});

	it("rejects backtick command substitution", () => {
		expect(validateCommand("echo `whoami`")).toBeDefined();
	});

	it("rejects nested $(...) patterns", () => {
		expect(validateCommand("cat $(echo $(pwd)/file)")).toBeDefined();
	});

	it("allows simple commands", () => {
		expect(validateCommand("ls -la")).toBeUndefined();
	});

	it("allows pipes", () => {
		expect(validateCommand("cat file.txt | grep pattern")).toBeUndefined();
	});

	it("allows redirects", () => {
		expect(validateCommand("echo hello > output.txt")).toBeUndefined();
	});

	it("allows environment variable references with $VAR (no braces)", () => {
		expect(validateCommand("echo $HOME")).toBeUndefined();
	});

	it("allows && and || chaining", () => {
		expect(validateCommand("mkdir -p dir && cd dir")).toBeUndefined();
	});
});
