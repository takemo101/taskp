import { z } from "zod";

const inputTypeSchema = z.enum(["text", "select", "confirm", "number", "password"]);

const skillInputSchema = z
	.object({
		name: z.string().min(1),
		type: inputTypeSchema,
		message: z.string().min(1),
		default: z.union([z.string(), z.number(), z.boolean()]).optional(),
		choices: z.array(z.string()).optional(),
		required: z.boolean().optional(),
		validate: z.string().optional(),
	})
	.refine((input) => input.type !== "select" || (input.choices && input.choices.length > 0), {
		message: "choices is required for select type",
	});

const contextSourceSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("file"), path: z.string().min(1) }),
	z.object({ type: z.literal("glob"), pattern: z.string().min(1) }),
	z.object({ type: z.literal("command"), run: z.string().min(1) }),
	z.object({ type: z.literal("url"), url: z.string().min(1) }),
]);

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

type SkillInput = z.infer<typeof skillInputSchema>;
type ContextSource = z.infer<typeof contextSourceSchema>;
type SkillMode = z.infer<typeof skillModeSchema>;
type SkillMetadata = z.infer<typeof skillMetadataSchema>;

function parseSkillMetadata(data: unknown): SkillMetadata {
	return skillMetadataSchema.parse(data);
}

export type { ContextSource, SkillInput, SkillMetadata, SkillMode };
export { parseSkillMetadata, skillInputSchema, skillMetadataSchema };
