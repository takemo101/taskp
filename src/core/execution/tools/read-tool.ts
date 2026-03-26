import { readFile } from "node:fs/promises";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";
import { DEFAULT_TOOL_TIMEOUT_MS } from "./tool-constants";
import { type ToolResult, toolFailure, toolSuccess } from "./tool-output";

export const readParams = z.object({
	path: z.string().describe("File path to read"),
	encoding: z
		.enum(["utf-8", "ascii", "base64", "hex", "latin1", "utf16le"])
		.optional()
		.describe("File encoding (default: utf-8)"),
	timeout: z.number().optional().describe("Timeout in milliseconds"),
});

type ReadInput = z.infer<typeof readParams>;
type ReadResult = { readonly content: string };

export const readTool: Tool<ReadInput, ToolResult<ReadResult>> = {
	description: "Read the contents of a file",
	inputSchema: zodToJsonSchema(readParams),
	execute: async ({ path, encoding, timeout }): Promise<ToolResult<ReadResult>> => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout ?? DEFAULT_TOOL_TIMEOUT_MS);

		try {
			const content = await readFile(path, {
				encoding: encoding ?? "utf-8",
				signal: controller.signal,
			});
			return toolSuccess({ content });
		} catch {
			return toolFailure(`Failed to read file: ${path}`);
		} finally {
			clearTimeout(timeoutId);
		}
	},
};
