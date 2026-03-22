import { z } from "zod";
import type { ContextSource } from "./context-source";
import { contextSourceSchema } from "./context-source";
import type { SkillInput } from "./skill-input";
import { skillInputSchema } from "./skill-input";
import type { SkillMetadata } from "./skill-metadata";

const skillModeSchema = z.enum(["template", "agent"]);

const DEFAULT_TOOLS = ["bash", "read", "write"] as const;

const actionSchema = z.object({
	description: z.string().min(1),
	mode: skillModeSchema.optional(),
	model: z.string().min(1).optional(),
	inputs: z.array(skillInputSchema).optional(),
	context: z.array(contextSourceSchema).optional(),
	tools: z.array(z.string().min(1)).optional(),
	timeout: z.number().int().positive().max(3_600_000).optional(),
});

type Action = z.infer<typeof actionSchema>;

type ResolvedActionConfig = {
	readonly description: string;
	readonly mode: "template" | "agent";
	readonly model: string | undefined;
	readonly inputs: readonly SkillInput[];
	readonly context: readonly ContextSource[];
	readonly tools: readonly string[];
	readonly timeout: number | undefined;
};

function resolveActionConfig(action: Action, skill: SkillMetadata): ResolvedActionConfig {
	return {
		description: action.description,
		mode: action.mode ?? skill.mode ?? "template",
		model: action.model ?? skill.model ?? undefined,
		inputs: action.inputs ?? [],
		context: action.context ?? skill.context ?? [],
		tools: action.tools ?? skill.tools ?? [...DEFAULT_TOOLS],
		timeout: action.timeout ?? skill.timeout ?? undefined,
	};
}

export type { Action, ResolvedActionConfig };
export { actionSchema, resolveActionConfig };
