import type { Tool } from "ai";
import { execa } from "execa";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";
import { type ToolResult, toolFailure, toolSuccess } from "./tool-output";

export const bashParams = z.object({
	command: z.string().describe("The shell command to execute"),
	cwd: z.string().optional().describe("Working directory"),
	timeout: z.number().optional().describe("Timeout in milliseconds"),
});

type BashInput = z.infer<typeof bashParams>;
type BashData = { readonly stdout: string; readonly stderr: string; readonly exitCode: number };

export type { BashData };

export const bashTool: Tool<BashInput, ToolResult<BashData>> = {
	description: "Run a shell command and return stdout/stderr",
	inputSchema: zodToJsonSchema(bashParams),
	execute: async ({ command, cwd, timeout }): Promise<ToolResult<BashData>> => {
		try {
			const result = await execa(command, {
				shell: true,
				cwd: cwd ?? process.cwd(),
				timeout: timeout ?? 30_000,
				reject: false,
			});
			return toolSuccess({
				stdout: result.stdout,
				stderr: result.stderr,
				exitCode: result.exitCode ?? 1,
			});
		} catch {
			return toolFailure(`Failed to execute command: ${command}`);
		}
	},
};
