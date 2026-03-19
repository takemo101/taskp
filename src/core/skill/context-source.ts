import { z } from "zod";

const fileSourceSchema = z.object({
	type: z.literal("file"),
	path: z.string(),
});

const globSourceSchema = z.object({
	type: z.literal("glob"),
	pattern: z.string(),
});

const commandSourceSchema = z.object({
	type: z.literal("command"),
	run: z.string(),
});

const urlSourceSchema = z.object({
	type: z.literal("url"),
	url: z.string(),
});

export const contextSourceSchema = z.discriminatedUnion("type", [
	fileSourceSchema,
	globSourceSchema,
	commandSourceSchema,
	urlSourceSchema,
]);

export type ContextSource = z.infer<typeof contextSourceSchema>;

export function parseContextSource(input: unknown): ContextSource {
	return contextSourceSchema.parse(input);
}
