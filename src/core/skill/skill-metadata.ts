import { z } from "zod";
import type { ContextSource } from "./context-source";
import { contextSourceSchema } from "./context-source";
import type { SkillInput } from "./skill-input";
import { skillInputSchema } from "./skill-input";

const skillModeSchema = z.enum(["template", "agent"]);

const DEFAULT_TOOLS = ["bash", "read", "write"] as const;

const skillMetadataSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	mode: skillModeSchema.default("template"),
	inputs: z.array(skillInputSchema).default([]),
	model: z.string().min(1).optional(),
	tools: z.array(z.string().min(1)).default([...DEFAULT_TOOLS]),
	context: z.array(contextSourceSchema).default([]),
});

type SkillMode = z.infer<typeof skillModeSchema>;
type SkillMetadata = z.infer<typeof skillMetadataSchema>;

function parseSkillMetadata(data: unknown): SkillMetadata {
	return skillMetadataSchema.parse(data);
}

export type { ContextSource, SkillInput, SkillMetadata, SkillMode };
export { parseSkillMetadata, skillInputSchema, skillMetadataSchema };
