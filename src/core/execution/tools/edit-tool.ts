import { readFile, writeFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";
import { type ToolResult, toolFailure, toolSuccess } from "./tool-output";

export const editParams = z.object({
	path: z.string().describe("File path to edit"),
	oldString: z.string().describe("The exact string to find and replace"),
	newString: z.string().describe("The replacement string"),
});

type EditInput = z.infer<typeof editParams>;
type EditResult = { readonly path: string };

function validateMatch(
	content: string,
	oldString: string,
	path: string,
): ToolResult<{ index: number }> {
	const index = content.indexOf(oldString);
	if (index === -1) {
		return toolFailure(`String not found in ${path}`);
	}

	const secondIndex = content.indexOf(oldString, index + 1);
	if (secondIndex !== -1) {
		return toolFailure(
			`Multiple matches found in ${path}. Provide more context in oldString to uniquely identify the location.`,
		);
	}

	return toolSuccess({ index });
}

export const editTool: Tool<EditInput, ToolResult<EditResult>> = {
	description:
		"Replace a specific string in a file. The oldString must match exactly one location in the file.",
	inputSchema: zodToJsonSchema(editParams),
	execute: async ({ path, oldString, newString }): Promise<ToolResult<EditResult>> => {
		if (oldString === newString) {
			return toolSuccess({ path });
		}

		let content: string;
		try {
			content = await readFile(path, "utf-8");
		} catch {
			return toolFailure(`Failed to read file: ${path}`);
		}

		const matchResult = validateMatch(content, oldString, path);
		if (!matchResult.success) {
			return matchResult;
		}

		const index = matchResult.data.index;
		const updated = content.slice(0, index) + newString + content.slice(index + oldString.length);

		try {
			await writeFile(path, updated, "utf-8");
		} catch {
			return toolFailure(`Failed to write file: ${path}`);
		}

		return toolSuccess({ path });
	},
};
