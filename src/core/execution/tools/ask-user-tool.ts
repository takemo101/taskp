import { input } from "@inquirer/prompts";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";
import { type ToolResult, toolSuccess } from "./tool-output";

export const askUserParams = z.object({
	question: z.string().describe("The question to ask the user"),
});

type AskUserInput = z.infer<typeof askUserParams>;
type AskUserData = { readonly answer: string };

export const askUserTool: Tool<AskUserInput, ToolResult<AskUserData>> = {
	description: "Ask the user a question and wait for their response",
	inputSchema: zodToJsonSchema(askUserParams),
	execute: async ({ question }): Promise<ToolResult<AskUserData>> => {
		const answer = await input({ message: question });
		return toolSuccess({ answer });
	},
};
