import { writeFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";
import { type ToolResult, toolFailure, toolSuccess } from "./tool-output";

export const writeParams = z.object({
	path: z.string().describe("File path to write"),
	content: z.string().describe("Content to write"),
});

type WriteInput = z.infer<typeof writeParams>;
type WriteResult = { readonly path: string };

export const writeTool: Tool<WriteInput, ToolResult<WriteResult>> = {
	description: "Write content to a file",
	inputSchema: zodToJsonSchema(writeParams),
	execute: async ({ path, content }): Promise<ToolResult<WriteResult>> => {
		try {
			await writeFile(path, content, "utf-8");
			return toolSuccess({ path });
		} catch {
			return toolFailure(`Failed to write file: ${path}`);
		}
	},
};
