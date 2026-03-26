import { readFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";
import { type ToolResult, toolFailure, toolSuccess } from "./tool-output";

export const readParams = z.object({
	path: z.string().describe("File path to read"),
	encoding: z.string().optional().describe("File encoding (default: utf-8)"),
});

type ReadInput = z.infer<typeof readParams>;
type ReadResult = { readonly content: string };

export const readTool: Tool<ReadInput, ToolResult<ReadResult>> = {
	description: "Read the contents of a file",
	inputSchema: zodToJsonSchema(readParams),
	execute: async ({ path }): Promise<ToolResult<ReadResult>> => {
		try {
			const content = await readFile(path, "utf-8");
			return toolSuccess({ content });
		} catch {
			return toolFailure(`Failed to read file: ${path}`);
		}
	},
};
