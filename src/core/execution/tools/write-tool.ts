import { writeFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";

export const writeParams = z.object({
	path: z.string().describe("File path to write"),
	content: z.string().describe("Content to write"),
});

type WriteInput = z.infer<typeof writeParams>;

export const writeTool: Tool<WriteInput, string> = {
	description: "Write content to a file",
	inputSchema: zodToJsonSchema(writeParams),
	execute: async ({ path, content }) => {
		try {
			await writeFile(path, content, "utf-8");
			return `Written to ${path}`;
		} catch (error) {
			throw new Error(`Failed to write file: ${path}`, { cause: error });
		}
	},
};
