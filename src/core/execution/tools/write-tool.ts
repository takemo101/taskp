import { writeFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { type ExecutionError, executionError } from "../../types/errors";
import { err, ok, type Result } from "../../types/result";
import { zodToJsonSchema } from "./schema-helper";

export const writeParams = z.object({
	path: z.string().describe("File path to write"),
	content: z.string().describe("Content to write"),
});

type WriteInput = z.infer<typeof writeParams>;

export const writeTool: Tool<WriteInput, Result<string, ExecutionError>> = {
	description: "Write content to a file",
	inputSchema: zodToJsonSchema(writeParams),
	execute: async ({ path, content }): Promise<Result<string, ExecutionError>> => {
		try {
			await writeFile(path, content, "utf-8");
			return ok(`Written to ${path}`);
		} catch {
			return err(executionError(`Failed to write file: ${path}`));
		}
	},
};
