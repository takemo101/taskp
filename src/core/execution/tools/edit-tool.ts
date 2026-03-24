import { readFile, writeFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";

export const editParams = z.object({
	path: z.string().describe("File path to edit"),
	oldString: z.string().describe("The exact string to find and replace"),
	newString: z.string().describe("The replacement string"),
});

type EditInput = z.infer<typeof editParams>;

export const editTool: Tool<EditInput, string> = {
	description:
		"Replace a specific string in a file. The oldString must match exactly one location in the file.",
	inputSchema: zodToJsonSchema(editParams),
	execute: async ({ path, oldString, newString }) => {
		let content: string;
		try {
			content = await readFile(path, "utf-8");
		} catch (error) {
			throw new Error(`Failed to read file: ${path}`, { cause: error });
		}

		const index = content.indexOf(oldString);
		if (index === -1) {
			throw new Error(`String not found in ${path}`);
		}

		const secondIndex = content.indexOf(oldString, index + 1);
		if (secondIndex !== -1) {
			throw new Error(
				`Multiple matches found in ${path}. Provide more context in oldString to uniquely identify the location.`,
			);
		}

		const updated = content.slice(0, index) + newString + content.slice(index + oldString.length);

		try {
			await writeFile(path, updated, "utf-8");
		} catch (error) {
			throw new Error(`Failed to write file: ${path}`, { cause: error });
		}

		return `Edited ${path}`;
	},
};
