import { input } from "@inquirer/prompts";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";

export const askUserParams = z.object({
	question: z.string().describe("The question to ask the user"),
});

type AskUserInput = z.infer<typeof askUserParams>;

export const askUserTool: Tool<AskUserInput, string> = {
	description: "Ask the user a question and wait for their response",
	inputSchema: zodToJsonSchema(askUserParams),
	execute: async ({ question }) => {
		return await input({ message: question });
	},
};
