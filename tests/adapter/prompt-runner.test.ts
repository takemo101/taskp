import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SkillInput } from "../../src/core/skill/skill-input";

vi.mock("@inquirer/prompts", () => ({
	input: vi.fn(),
	editor: vi.fn(),
	select: vi.fn(),
	confirm: vi.fn(),
	number: vi.fn(),
	password: vi.fn(),
}));

import { ExitPromptError } from "@inquirer/core";
import { confirm, editor, input, number, password, select } from "@inquirer/prompts";
import { createPromptRunner } from "../../src/adapter/prompt-runner";

const mockedInput = input as ReturnType<typeof vi.fn>;
const mockedEditor = editor as ReturnType<typeof vi.fn>;
const mockedSelect = select as ReturnType<typeof vi.fn>;
const mockedConfirm = confirm as ReturnType<typeof vi.fn>;
const mockedNumber = number as ReturnType<typeof vi.fn>;
const mockedPassword = password as ReturnType<typeof vi.fn>;

describe("PromptRunner", () => {
	const runner = createPromptRunner();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("collects text input", async () => {
		mockedInput.mockResolvedValueOnce("hello");

		const inputs: SkillInput[] = [{ name: "greeting", type: "text", message: "Enter greeting" }];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ greeting: "hello" });
		expect(mockedInput).toHaveBeenCalledWith(
			expect.objectContaining({ message: "Enter greeting" }),
		);
	});

	it("collects select input", async () => {
		mockedSelect.mockResolvedValueOnce("opt-b");

		const inputs: SkillInput[] = [
			{
				name: "lang",
				type: "select",
				message: "Pick language",
				choices: ["opt-a", "opt-b"],
			},
		];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ lang: "opt-b" });
		expect(mockedSelect).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Pick language",
				choices: [
					{ name: "opt-a", value: "opt-a" },
					{ name: "opt-b", value: "opt-b" },
				],
			}),
		);
	});

	it("collects confirm input", async () => {
		mockedConfirm.mockResolvedValueOnce(true);

		const inputs: SkillInput[] = [{ name: "proceed", type: "confirm", message: "Continue?" }];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ proceed: "true" });
	});

	it("collects number input", async () => {
		mockedNumber.mockResolvedValueOnce(42);

		const inputs: SkillInput[] = [{ name: "count", type: "number", message: "How many?" }];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ count: "42" });
	});

	it("collects textarea input", async () => {
		mockedEditor.mockResolvedValueOnce("line1\nline2\nline3");

		const inputs: SkillInput[] = [{ name: "body", type: "textarea", message: "Enter body" }];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ body: "line1\nline2\nline3" });
		expect(mockedEditor).toHaveBeenCalledWith(expect.objectContaining({ message: "Enter body" }));
	});

	it("collects password input", async () => {
		mockedPassword.mockResolvedValueOnce("secret123");

		const inputs: SkillInput[] = [{ name: "token", type: "password", message: "Enter token" }];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ token: "secret123" });
	});

	it("skips questions for preset values", async () => {
		const inputs: SkillInput[] = [
			{ name: "name", type: "text", message: "Name?" },
			{ name: "age", type: "number", message: "Age?" },
		];

		mockedNumber.mockResolvedValueOnce(25);

		const result = await runner.collect(inputs, { name: "Alice" });
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ name: "Alice", age: "25" });
		expect(mockedInput).not.toHaveBeenCalled();
	});

	it("passes default values to prompts", async () => {
		mockedInput.mockResolvedValueOnce("world");

		const inputs: SkillInput[] = [
			{ name: "greet", type: "text", message: "Greeting?", default: "world" },
		];

		await runner.collect(inputs, {});
		expect(mockedInput).toHaveBeenCalledWith(expect.objectContaining({ default: "world" }));
	});

	it("passes validate regex to text input", async () => {
		mockedInput.mockResolvedValueOnce("abc123");

		const inputs: SkillInput[] = [
			{
				name: "code",
				type: "text",
				message: "Code?",
				validate: "^[a-z]+\\d+$",
			},
		];

		await runner.collect(inputs, {});

		const callArgs = mockedInput.mock.calls[0][0] as { validate?: (v: string) => string | true };
		expect(callArgs.validate).toBeDefined();
		expect(callArgs.validate!("abc123")).toBe(true);
		expect(callArgs.validate!("INVALID")).toEqual(expect.stringContaining("must match"));
	});

	it("returns error on invalid validate regex pattern", async () => {
		const inputs: SkillInput[] = [
			{
				name: "code",
				type: "text",
				message: "Code?",
				validate: "[invalid(",
			},
		];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
		expect(result.error.message).toContain("Invalid regex pattern: [invalid(");
	});

	it("collects multiple inputs in order", async () => {
		mockedInput.mockResolvedValueOnce("Alice");
		mockedNumber.mockResolvedValueOnce(30);
		mockedConfirm.mockResolvedValueOnce(false);

		const inputs: SkillInput[] = [
			{ name: "name", type: "text", message: "Name?" },
			{ name: "age", type: "number", message: "Age?" },
			{ name: "ok", type: "confirm", message: "OK?" },
		];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({ name: "Alice", age: "30", ok: "false" });
	});

	it("returns error when user cancels prompt", async () => {
		mockedInput.mockRejectedValueOnce(new Error("User force closed the prompt"));

		const inputs: SkillInput[] = [{ name: "name", type: "text", message: "Name?" }];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
		expect(result.error.message).toContain("User force closed the prompt");
	});

	it("returns cancellation error when user presses Ctrl+C", async () => {
		mockedInput.mockRejectedValueOnce(new ExitPromptError());

		const inputs: SkillInput[] = [{ name: "name", type: "text", message: "Name?" }];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
		expect(result.error.message).toBe("User cancelled the prompt");
	});

	it("returns error on TTY failure", async () => {
		mockedSelect.mockRejectedValueOnce(new Error("Input stream is not a TTY"));

		const inputs: SkillInput[] = [
			{ name: "lang", type: "select", message: "Pick", choices: ["a", "b"] },
		];

		const result = await runner.collect(inputs, {});
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
		expect(result.error.message).toContain("Input stream is not a TTY");
	});
});
