import { readFile, writeFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { type ExecutionError, executionError } from "../../types/errors";
import { err, ok, type Result } from "../../types/result";
import { zodToJsonSchema } from "./schema-helper";

export const editParams = z.object({
	path: z.string().describe("File path to edit"),
	oldString: z.string().describe("The exact string to find and replace"),
	newString: z.string().describe("The replacement string"),
});

type EditInput = z.infer<typeof editParams>;

function validateMatch(
	content: string,
	oldString: string,
	path: string,
): Result<number, ExecutionError> {
	const index = content.indexOf(oldString);
	if (index === -1) {
		return err(executionError(`String not found in ${path}`));
	}

	const secondIndex = content.indexOf(oldString, index + 1);
	if (secondIndex !== -1) {
		return err(
			executionError(
				`Multiple matches found in ${path}. Provide more context in oldString to uniquely identify the location.`,
			),
		);
	}

	return ok(index);
}

export const editTool: Tool<EditInput, Result<string, ExecutionError>> = {
	description:
		"Replace a specific string in a file. The oldString must match exactly one location in the file.",
	inputSchema: zodToJsonSchema(editParams),
	execute: async ({ path, oldString, newString }): Promise<Result<string, ExecutionError>> => {
		if (oldString === newString) {
			return ok(`No changes needed in ${path}`);
		}

		let content: string;
		try {
			content = await readFile(path, "utf-8");
		} catch {
			return err(executionError(`Failed to read file: ${path}`));
		}

		const matchResult = validateMatch(content, oldString, path);
		if (!matchResult.ok) {
			return matchResult;
		}

		const index = matchResult.value;
		const updated = content.slice(0, index) + newString + content.slice(index + oldString.length);

		try {
			await writeFile(path, updated, "utf-8");
		} catch {
			return err(executionError(`Failed to write file: ${path}`));
		}

		return ok(`Edited ${path}`);
	},
};
