import { describe, expect, it } from "vitest";
import {
	type DescriptionEntry,
	deriveAgentSkillDescriptionBudget,
	formatDescriptionEntriesWithinBudget,
} from "../../../src/core/skill/skill-description-budget";

function createEntry(label: string, description: string, protectedEntry = false): DescriptionEntry {
	return { label, description, protected: protectedEntry };
}

describe("formatDescriptionEntriesWithinBudget", () => {
	it("keeps full descriptions when they fit within budget", () => {
		const result = formatDescriptionEntriesWithinBudget(
			[
				createEntry("- deploy", "Deploy the application"),
				createEntry("- test", "Run the test suite"),
			],
			{ budgetChars: 200, maxDescriptionChars: 80 },
		);

		expect(result.phase).toBe(1);
		expect(result.text).toContain("- deploy: Deploy the application");
		expect(result.text).toContain("- test: Run the test suite");
		expect(result.truncatedEntryCount).toBe(0);
	});

	it("applies the per-entry description cap before budget reduction", () => {
		const result = formatDescriptionEntriesWithinBudget(
			[createEntry("- long", "abcdefghijklmnopqrstuvwxyz")],
			{ budgetChars: 200, maxDescriptionChars: 10 },
		);

		expect(result.phase).toBe(1);
		expect(result.text).toBe("- long: abcdefghi…");
		expect(result.truncatedEntryCount).toBe(1);
	});

	it("falls back to phase 2 and preserves protected entries", () => {
		const result = formatDescriptionEntriesWithinBudget(
			[
				createEntry("- bundled", "Bundled skill description", true),
				createEntry("- local", "Local skill description that must shrink"),
			],
			{ budgetChars: 70, maxDescriptionChars: 80, minDescriptionChars: 12 },
		);

		expect(result.phase).toBe(2);
		expect(result.text).toContain("- bundled: Bundled skill description");
		expect(result.text).toContain("- local: ");
		expect(result.text).toContain("…");
		expect(result.truncatedEntryCount).toBe(1);
	});

	it("falls back to phase 3 when equal truncation cannot keep the minimum length", () => {
		const result = formatDescriptionEntriesWithinBudget(
			[
				createEntry("- alpha", "Alpha description is very long"),
				createEntry("- beta", "Beta description is also very long"),
			],
			{ budgetChars: 35, maxDescriptionChars: 80, minDescriptionChars: 12 },
		);

		expect(result.phase).toBe(3);
		expect(result.text).toContain("- alpha:");
		expect(result.text).toContain("- beta:");
		expect(result.text).toContain("…");
	});

	it("falls back to phase 4 names only when even prefixes do not fit", () => {
		const result = formatDescriptionEntriesWithinBudget(
			[
				createEntry("- very-long-skill-name", "Alpha description"),
				createEntry("- another-long-skill", "Beta description"),
			],
			{ budgetChars: 43, maxDescriptionChars: 80, minDescriptionChars: 12 },
		);

		expect(result.phase).toBe(4);
		expect(result.text).toBe("- very-long-skill-name\n- another-long-skill");
		expect(result.truncatedEntryCount).toBe(2);
	});

	it("omits trailing entries in phase 4 when name-only output still exceeds budget", () => {
		const result = formatDescriptionEntriesWithinBudget(
			[
				createEntry("- very-long-skill-name", "Alpha description"),
				createEntry("- another-long-skill", "Beta description"),
			],
			{ budgetChars: 22, maxDescriptionChars: 80, minDescriptionChars: 12 },
		);

		expect(result.phase).toBe(4);
		expect(result.text).toBe("- very-long-skill-name");
	});

	it("skips phase 2 when all entries are protected", () => {
		const result = formatDescriptionEntriesWithinBudget(
			[
				createEntry("- alpha", "Alpha description is very long", true),
				createEntry("- beta", "Beta description is also very long", true),
			],
			{ budgetChars: 35, maxDescriptionChars: 80, minDescriptionChars: 12 },
		);

		// Phase 2 cannot reduce protected entries, so it falls to phase 3
		expect(result.phase).toBeGreaterThanOrEqual(3);
	});
});

describe("deriveAgentSkillDescriptionBudget", () => {
	it("derives budget from known model context windows", () => {
		expect(
			deriveAgentSkillDescriptionBudget({
				provider: "anthropic",
				model: "claude-sonnet-4-20250514",
			}),
		).toBe(8000);
		expect(deriveAgentSkillDescriptionBudget({ provider: "google", model: "gemini-2.5-pro" })).toBe(
			40000,
		);
	});

	it("falls back to default for unknown providers", () => {
		expect(
			deriveAgentSkillDescriptionBudget({ provider: "ollama", model: "qwen2.5-coder:32b" }),
		).toBe(8000);
	});
});
