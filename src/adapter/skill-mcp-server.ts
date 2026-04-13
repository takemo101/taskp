import { Cli } from "incur";
import { z } from "zod";
import type {
	DescriptionBudgetOptions,
	DescriptionEntry,
} from "../core/skill/skill-description-budget";
import { formatDescriptionEntriesWithinBudget } from "../core/skill/skill-description-budget";
import type { Skill } from "../core/skill/skill";
import type { SkillInput } from "../core/skill/skill-input";

export type SkillMcpTool = {
	readonly toolName: string;
	readonly skillName: string;
	readonly actionName?: string;
	readonly description?: string;
	readonly inputs: readonly SkillInput[];
};

type RawSkillMcpTool = {
	readonly toolName: string;
	readonly skillName: string;
	readonly actionName?: string;
	readonly description: string;
	readonly inputs: readonly SkillInput[];
};

export type SkillMcpToolsResult = {
	readonly tools: readonly SkillMcpTool[];
	readonly phase: 1 | 2 | 3 | 4;
	readonly truncatedEntryCount: number;
	readonly omittedEntryCount: number;
};

export type CreateSkillMcpCliOptions = {
	readonly version: string;
	readonly skills: readonly Skill[];
	readonly budgetOptions: DescriptionBudgetOptions;
	readonly executeSkill: (input: {
		readonly skillName: string;
		readonly actionName?: string;
		readonly presets: Readonly<Record<string, string>>;
	}) => Promise<unknown>;
};

export function createSkillMcpCli(options: CreateSkillMcpCliOptions) {
	const { tools } = buildSkillMcpToolsResult(options.skills, options.budgetOptions);
	const cli = Cli.create("taskp", {
		version: options.version,
		description: "taskp skill MCP server",
	});

	for (const tool of tools) {
		(cli as ReturnType<typeof Cli.create>).command(tool.toolName, {
			description: tool.description,
			options: buildInputSchema(tool.inputs),
			async run(c) {
				return options.executeSkill({
					skillName: tool.skillName,
					actionName: tool.actionName,
					presets: toPresetRecord(c.options),
				});
			},
		});
	}

	return cli;
}

export function buildSkillMcpTools(
	skills: readonly Skill[],
	budgetOptions: DescriptionBudgetOptions,
): readonly SkillMcpTool[] {
	return buildSkillMcpToolsResult(skills, budgetOptions).tools;
}

export function buildSkillMcpToolsResult(
	skills: readonly Skill[],
	budgetOptions: DescriptionBudgetOptions,
): SkillMcpToolsResult {
	const rawTools: RawSkillMcpTool[] = skills.flatMap((skill) => flattenSkillTools(skill));
	assertUniqueToolNames(rawTools);
	const budgetedDescriptions = budgetSkillDescriptions(
		rawTools.map((tool) => ({ label: tool.toolName, description: tool.description })),
		budgetOptions,
	);

	return {
		tools: rawTools.map((tool) => ({
			...tool,
			description: budgetedDescriptions.descriptions.get(tool.toolName),
		})),
		phase: budgetedDescriptions.phase,
		truncatedEntryCount: budgetedDescriptions.truncatedEntryCount,
		omittedEntryCount: budgetedDescriptions.omittedEntryCount,
	};
}

function flattenSkillTools(skill: Skill): readonly RawSkillMcpTool[] {
	if (!skill.metadata.actions || Object.keys(skill.metadata.actions).length === 0) {
		return [
			{
				toolName: toMcpToolName(skill.metadata.name),
				skillName: skill.metadata.name,
				description: skill.metadata.description,
				inputs: skill.metadata.inputs,
			},
		];
	}

	return Object.entries(skill.metadata.actions).map(([actionName, action]) => ({
		toolName: toMcpToolName(skill.metadata.name, actionName),
		skillName: skill.metadata.name,
		actionName,
		description: action.description,
		inputs: action.inputs ?? skill.metadata.inputs,
	}));
}

function budgetSkillDescriptions(
	entries: readonly DescriptionEntry[],
	budgetOptions: DescriptionBudgetOptions,
): {
	readonly descriptions: ReadonlyMap<string, string | undefined>;
	readonly phase: 1 | 2 | 3 | 4;
	readonly truncatedEntryCount: number;
	readonly omittedEntryCount: number;
} {
	const result = formatDescriptionEntriesWithinBudget(entries, budgetOptions);
	const lines = result.text === "" ? [] : result.text.split("\n");
	const descriptions = new Map<string, string | undefined>();

	for (const entry of entries) {
		const prefix = `${entry.label}: `;
		const line = lines.find(
			(candidate) => candidate === entry.label || candidate.startsWith(prefix),
		);
		if (line === undefined || line === entry.label) {
			descriptions.set(entry.label, undefined);
			continue;
		}
		descriptions.set(entry.label, line.slice(prefix.length));
	}

	return {
		descriptions,
		phase: result.phase,
		truncatedEntryCount: result.truncatedEntryCount,
		omittedEntryCount: result.omittedEntryCount,
	};
}

function assertUniqueToolNames(tools: readonly RawSkillMcpTool[]): void {
	const seen = new Map<string, string>();
	for (const tool of tools) {
		const ref =
			tool.actionName === undefined ? tool.skillName : `${tool.skillName}:${tool.actionName}`;
		const previous = seen.get(tool.toolName);
		if (previous !== undefined) {
			throw new Error(
				`Duplicate MCP tool name after normalization: ${tool.toolName} (${previous}, ${ref})`,
			);
		}
		seen.set(tool.toolName, ref);
	}
}

function buildInputSchema(inputs: readonly SkillInput[]) {
	const shape: Record<string, z.ZodTypeAny> = {};
	for (const input of inputs) {
		shape[input.name] = toInputSchema(input);
	}
	return z.object(shape);
}

function toInputSchema(input: SkillInput): z.ZodTypeAny {
	let schema: z.ZodTypeAny;
	if (input.type === "number") {
		schema = z.coerce.number();
	} else if (input.type === "confirm") {
		schema = z.coerce.boolean();
	} else if (input.type === "select" && input.choices && input.choices.length > 0) {
		schema = z.enum(input.choices as [string, ...string[]]);
	} else {
		schema = z.string();
	}

	if (input.required === false || input.default !== undefined) {
		schema = schema.optional();
	}

	return schema.describe(input.message);
}

function toPresetRecord(values: Record<string, unknown>): Readonly<Record<string, string>> {
	return Object.fromEntries(
		Object.entries(values)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => [key, String(value)]),
	);
}

function toMcpToolName(skillName: string, actionName?: string): string {
	const normalize = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");
	return actionName === undefined
		? normalize(skillName)
		: `${normalize(skillName)}__${normalize(actionName)}`;
}
