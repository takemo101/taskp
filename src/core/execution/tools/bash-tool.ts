import type { Tool } from "ai";
import { execa } from "execa";
import { z } from "zod";
import { type ExecutionError, executionError } from "../../types/errors";
import { err, ok, type Result } from "../../types/result";
import { zodToJsonSchema } from "./schema-helper";

export const bashParams = z.object({
	command: z.string().describe("The shell command to execute"),
	cwd: z.string().optional().describe("Working directory"),
	timeout: z.number().optional().describe("Timeout in milliseconds"),
});

type BashInput = z.infer<typeof bashParams>;
type BashResult = { readonly stdout: string; readonly stderr: string; readonly exitCode: number };

export const bashTool: Tool<BashInput, Result<BashResult, ExecutionError>> = {
	description: "Run a shell command and return stdout/stderr",
	inputSchema: zodToJsonSchema(bashParams),
	execute: async ({ command, cwd, timeout }): Promise<Result<BashResult, ExecutionError>> => {
		try {
			const result = await execa(command, {
				shell: true,
				cwd: cwd ?? process.cwd(),
				timeout: timeout ?? 30_000,
				reject: false,
			});
			return ok({ stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode ?? 1 });
		} catch {
			return err(executionError(`Failed to execute command: ${command}`));
		}
	},
};
