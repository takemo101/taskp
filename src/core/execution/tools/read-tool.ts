import { readFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { type ExecutionError, executionError } from "../../types/errors";
import { err, ok, type Result } from "../../types/result";
import { zodToJsonSchema } from "./schema-helper";

export const readParams = z.object({
	path: z.string().describe("File path to read"),
	encoding: z.string().optional().describe("File encoding (default: utf-8)"),
});

type ReadInput = z.infer<typeof readParams>;

export const readTool: Tool<ReadInput, Result<string, ExecutionError>> = {
	description: "Read the contents of a file",
	inputSchema: zodToJsonSchema(readParams),
	execute: async ({ path }): Promise<Result<string, ExecutionError>> => {
		try {
			const content = await readFile(path, "utf-8");
			return ok(content);
		} catch {
			return err(executionError(`Failed to read file: ${path}`));
		}
	},
};
