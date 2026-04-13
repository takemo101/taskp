export type DescriptionEntry = {
	readonly label: string;
	readonly description: string;
	readonly protected?: boolean;
};

export type DescriptionBudgetOptions = {
	readonly budgetChars: number;
	readonly maxDescriptionChars: number;
	readonly minDescriptionChars?: number;
};

export type FormattedEntry = {
	readonly label: string;
	readonly description?: string;
};

export type DescriptionBudgetResult = {
	readonly text: string;
	readonly entries: readonly FormattedEntry[];
	readonly phase: 1 | 2 | 3 | 4;
	readonly truncatedEntryCount: number;
	readonly omittedEntryCount: number;
};

export const DEFAULT_SKILL_DESCRIPTION_BUDGET = 8000;
export const DEFAULT_MAX_SKILL_DESCRIPTION_CHARS = 250;
const DEFAULT_MIN_DESCRIPTION_CHARS = 16;
const SKILL_DESCRIPTION_BUDGET_CONTEXT_PERCENT = 0.01;

type PreparedEntry = DescriptionEntry & {
	readonly description: string;
};

export function formatDescriptionEntriesWithinBudget(
	entries: readonly DescriptionEntry[],
	options: DescriptionBudgetOptions,
): DescriptionBudgetResult {
	const prepared = entries.map((entry) => ({
		...entry,
		description: clampDescription(entry.description, options.maxDescriptionChars),
	}));

	const fullText = formatEntries(prepared, "full");
	const initiallyTruncated = countChanged(entries, prepared);
	if (fullText.length <= options.budgetChars) {
		return {
			text: fullText,
			entries: toFormattedEntries(prepared, "full"),
			phase: 1,
			truncatedEntryCount: initiallyTruncated,
			omittedEntryCount: 0,
		};
	}

	const phase2 = formatPhase2(prepared, options);
	if (phase2 !== undefined) {
		const phase2Entries = parseFormattedEntries(prepared, phase2);
		return {
			text: phase2,
			entries: toFormattedEntries(phase2Entries, "full"),
			phase: 2,
			truncatedEntryCount: countChanged(entries, phase2Entries),
			omittedEntryCount: 0,
		};
	}

	const phase3 = formatPhase3(prepared, options);
	if (phase3 !== undefined) {
		const phase3Entries = parseFormattedEntries(prepared, phase3);
		return {
			text: phase3,
			entries: toFormattedEntries(phase3Entries, "full"),
			phase: 3,
			truncatedEntryCount: countChanged(entries, phase3Entries),
			omittedEntryCount: 0,
		};
	}

	const labelOnly = fitLabelOnlyEntries(prepared, options.budgetChars);

	return {
		text: formatEntries(labelOnly.entries, "label-only"),
		entries: toFormattedEntries(labelOnly.entries, "label-only"),
		phase: 4,
		truncatedEntryCount: prepared.length,
		omittedEntryCount: prepared.length - labelOnly.entries.length,
	};
}

export function deriveAgentSkillDescriptionBudget(model: {
	readonly provider: string;
	readonly model: string;
}): number {
	const contextWindowTokens = estimateContextWindowTokens(model);
	if (contextWindowTokens === undefined) {
		return DEFAULT_SKILL_DESCRIPTION_BUDGET;
	}

	return Math.floor(contextWindowTokens * 4 * SKILL_DESCRIPTION_BUDGET_CONTEXT_PERCENT);
}

function formatPhase2(
	entries: readonly PreparedEntry[],
	options: DescriptionBudgetOptions,
): string | undefined {
	const minDescriptionChars = options.minDescriptionChars ?? DEFAULT_MIN_DESCRIPTION_CHARS;
	const protectedEntries = entries.filter((entry) => entry.protected === true);
	const mutableEntries = entries.filter((entry) => entry.protected !== true);

	if (mutableEntries.length === 0) return undefined;

	const protectedText = formatEntries(protectedEntries, "full");
	const separatorLength = protectedEntries.length > 0 ? 1 : 0;
	const remainingBudget = options.budgetChars - protectedText.length - separatorLength;
	if (remainingBudget <= 0) return undefined;

	const mutableLabelsLength = mutableEntries.reduce(
		(sum, entry) => sum + entry.label.length + 2,
		0,
	);
	const mutableNewlines = Math.max(mutableEntries.length - 1, 0);
	const availableDescriptionBudget = remainingBudget - mutableLabelsLength - mutableNewlines;
	const eachDescriptionBudget = Math.floor(availableDescriptionBudget / mutableEntries.length);
	if (eachDescriptionBudget < minDescriptionChars) return undefined;

	const truncated = entries.map((entry) => {
		if (entry.protected === true) return entry;
		return { ...entry, description: clampDescription(entry.description, eachDescriptionBudget) };
	});
	const text = formatEntries(truncated, "full");
	return text.length <= options.budgetChars ? text : undefined;
}

function formatPhase3(
	entries: readonly PreparedEntry[],
	options: DescriptionBudgetOptions,
): string | undefined {
	const totalLabelLength = entries.reduce((sum, entry) => sum + entry.label.length + 2, 0);
	const totalNewlines = Math.max(entries.length - 1, 0);
	const availableDescriptionBudget = options.budgetChars - totalLabelLength - totalNewlines;
	if (availableDescriptionBudget <= 0) return undefined;

	const eachDescriptionBudget = Math.floor(availableDescriptionBudget / entries.length);
	if (eachDescriptionBudget <= 1) return undefined;

	const truncated = entries.map((entry) => ({
		...entry,
		description: clampDescription(entry.description, eachDescriptionBudget),
	}));
	const text = formatEntries(truncated, "full");
	return text.length <= options.budgetChars ? text : undefined;
}

function clampDescription(description: string, maxChars: number): string {
	if (description.length <= maxChars) return description;
	if (maxChars <= 1) return "…";
	return `${description.slice(0, maxChars - 1)}…`;
}

function formatEntries(entries: readonly PreparedEntry[], mode: "full" | "label-only"): string {
	return entries
		.map((entry) => {
			if (mode === "label-only") return entry.label;
			return `${entry.label}: ${entry.description}`;
		})
		.join("\n");
}

function fitLabelOnlyEntries(
	entries: readonly PreparedEntry[],
	budgetChars: number,
): { readonly entries: readonly PreparedEntry[] } {
	const kept: PreparedEntry[] = [];
	let used = 0;

	for (const entry of entries) {
		const nextLength = entry.label.length + (kept.length > 0 ? 1 : 0);
		if (used + nextLength > budgetChars) break;
		kept.push(entry);
		used += nextLength;
	}

	return { entries: kept };
}

function estimateContextWindowTokens(model: {
	readonly provider: string;
	readonly model: string;
}): number | undefined {
	const normalizedProvider = model.provider.toLowerCase();
	const normalizedModel = model.model.toLowerCase();

	if (normalizedProvider === "anthropic") {
		if (normalizedModel.includes("context-1m")) return 1_000_000;
		return 200_000;
	}

	if (normalizedProvider === "google") {
		if (normalizedModel.includes("gemini-1.5") || normalizedModel.includes("gemini-2.5")) {
			return 1_000_000;
		}
		return 128_000;
	}

	if (normalizedProvider === "openai") {
		if (normalizedModel.startsWith("gpt-4.1") || normalizedModel.startsWith("gpt-5")) {
			return 1_000_000;
		}
		return 128_000;
	}

	return undefined;
}

function countChanged(
	original: readonly DescriptionEntry[],
	formatted: readonly PreparedEntry[],
): number {
	let changed = 0;
	for (const [index, entry] of original.entries()) {
		const next = formatted[index];
		if (!next || entry.description !== next.description) {
			changed += 1;
		}
	}
	return changed;
}

function toFormattedEntries(
	entries: readonly PreparedEntry[],
	mode: "full" | "label-only",
): readonly FormattedEntry[] {
	return entries.map((entry) => ({
		label: entry.label,
		description: mode === "full" ? entry.description : undefined,
	}));
}

function parseFormattedEntries(
	entries: readonly PreparedEntry[],
	formattedText: string,
): readonly PreparedEntry[] {
	const lines = formattedText.split("\n");
	return entries.map((entry, index) => {
		const line = lines[index] ?? entry.label;
		const prefix = `${entry.label}: `;
		if (!line.startsWith(prefix)) {
			return { ...entry, description: "" };
		}
		return { ...entry, description: line.slice(prefix.length) };
	});
}
