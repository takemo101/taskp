import { glob as fsGlob } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { type ExecutionError, executionError } from "../../types/errors";
import { err, ok, type Result } from "../../types/result";
import { zodToJsonSchema } from "./schema-helper";

export const globParams = z.object({
	pattern: z.string().describe("Glob pattern to match files"),
});

type GlobInput = z.infer<typeof globParams>;

export const globTool: Tool<GlobInput, Result<readonly string[], ExecutionError>> = {
	description: "Search for files matching a glob pattern",
	inputSchema: zodToJsonSchema(globParams),
	execute: async ({ pattern }): Promise<Result<readonly string[], ExecutionError>> => {
		try {
			const matches: string[] = [];
			for await (const entry of fsGlob(pattern)) {
				matches.push(entry);
			}
			return ok(matches);
		} catch {
			return err(executionError(`Failed to glob pattern: ${pattern}`));
		}
	},
};
