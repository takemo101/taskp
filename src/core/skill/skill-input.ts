import { z } from "zod";

const inputTypeSchema = z.enum(["text", "textarea", "select", "confirm", "number", "password"]);

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
	// select 型は choices 必須だが、他の型では不要。
	// zod の discriminatedUnion ではなく refine を使うのは、
	// 共通フィールドが多く union にすると定義が冗長になるため
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
