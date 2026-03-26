import { glob as fsGlob } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";
import { type ToolResult, toolFailure, toolSuccess } from "./tool-output";

export const globParams = z.object({
	pattern: z.string().describe("Glob pattern to match files"),
});

type GlobInput = z.infer<typeof globParams>;
type GlobData = { readonly files: readonly string[] };

export const globTool: Tool<GlobInput, ToolResult<GlobData>> = {
	description: "Search for files matching a glob pattern",
	inputSchema: zodToJsonSchema(globParams),
	execute: async ({ pattern }): Promise<ToolResult<GlobData>> => {
		try {
			const matches: string[] = [];
			for await (const entry of fsGlob(pattern)) {
				matches.push(entry);
			}
			return toolSuccess({ files: matches });
		} catch {
			return toolFailure(`Failed to glob pattern: ${pattern}`);
		}
	},
};
