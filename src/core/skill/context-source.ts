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

const imageSourceSchema = z.object({
	type: z.literal("image"),
	path: z.string(),
});

export const contextSourceSchema = z.discriminatedUnion("type", [
	fileSourceSchema,
	globSourceSchema,
	commandSourceSchema,
	urlSourceSchema,
	imageSourceSchema,
]);

export type ContextSource = z.infer<typeof contextSourceSchema>;

export function getContextSourceValue(source: ContextSource): string {
	switch (source.type) {
		case "file":
			return source.path;
		case "glob":
			return source.pattern;
		case "command":
			return source.run;
		case "url":
			return source.url;
		case "image":
			return source.path;
	}
}

export function withResolvedValue(source: ContextSource, value: string): ContextSource {
	switch (source.type) {
		case "file":
			return { ...source, path: value };
		case "glob":
			return { ...source, pattern: value };
		case "command":
			return { ...source, run: value };
		case "url":
			return { ...source, url: value };
		case "image":
			return { ...source, path: value };
	}
}

export function parseContextSource(input: unknown): ContextSource {
	return contextSourceSchema.parse(input);
}
