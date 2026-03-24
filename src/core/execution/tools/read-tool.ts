import { readFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";

export const readParams = z.object({
	path: z.string().describe("File path to read"),
	encoding: z.string().optional().describe("File encoding (default: utf-8)"),
});

type ReadInput = z.infer<typeof readParams>;

export const readTool: Tool<ReadInput, string> = {
	description: "Read the contents of a file",
	inputSchema: zodToJsonSchema(readParams),
	execute: async ({ path }) => {
		try {
			return await readFile(path, "utf-8");
		} catch (error) {
			throw new Error(`Failed to read file: ${path}`, { cause: error });
		}
	},
};
