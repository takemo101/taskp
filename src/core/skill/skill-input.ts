import { z } from "zod";

const inputTypeSchema = z.enum(["text", "select", "confirm", "number", "password"]);

const skillInputSchema = z
	.object({
		name: z.string().min(1),
		type: inputTypeSchema,
		message: z.string().min(1),
		default: z.union([z.string(), z.number(), z.boolean()]).optional(),
		choices: z.array(z.string()).optional(),
		required: z.boolean().optional(),
		validate: z.string().optional(),
	})
	.refine((input) => input.type !== "select" || (input.choices && input.choices.length > 0), {
		message: "choices is required for select type",
	})
	.refine(
		(input) => {
			if (input.validate === undefined) return true;
			try {
				new RegExp(input.validate);
				return true;
			} catch {
				return false;
			}
		},
		{ message: "validate must be a valid regular expression" },
	);

type InputType = z.infer<typeof inputTypeSchema>;
type SkillInput = z.infer<typeof skillInputSchema>;

function parseSkillInput(data: unknown): SkillInput {
	return skillInputSchema.parse(data);
}

export type { InputType, SkillInput };
export { parseSkillInput, skillInputSchema };
