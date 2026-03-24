import { glob as fsGlob } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";

export const globParams = z.object({
	pattern: z.string().describe("Glob pattern to match files"),
});

type GlobInput = z.infer<typeof globParams>;

export const globTool: Tool<GlobInput, readonly string[]> = {
	description: "Search for files matching a glob pattern",
	inputSchema: zodToJsonSchema(globParams),
	execute: async ({ pattern }) => {
		try {
			const matches: string[] = [];
			for await (const entry of fsGlob(pattern)) {
				matches.push(entry);
			}
			return matches;
		} catch (error) {
			throw new Error(`Failed to glob pattern: ${pattern}`, { cause: error });
		}
	},
};
