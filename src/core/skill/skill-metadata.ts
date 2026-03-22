import { z } from "zod";
import type { ParseError } from "../types/errors";
import { parseError } from "../types/errors";
import type { Result } from "../types/result";
import { err, ok } from "../types/result";
import { actionSchema } from "./action";
import type { ContextSource } from "./context-source";
import { contextSourceSchema } from "./context-source";
import type { SkillInput } from "./skill-input";
import { skillInputSchema } from "./skill-input";

const skillModeSchema = z.enum(["template", "agent"]);

// agent モードのスキルが最低限のファイル操作を行えるよう、
// ツール未指定時のデフォルトセットを定義
const DEFAULT_TOOLS = ["bash", "read", "write"] as const;

const skillMetadataSchema = z
	.object({
		name: z.string().min(1),
		description: z.string().min(1),
		mode: skillModeSchema.default("template"),
		inputs: z.array(skillInputSchema).default([]),
		model: z.string().min(1).optional(),
		timeout: z
			.number()
			.int()
			.positive()
			.max(3_600_000)
			.optional()
			.describe("Timeout in milliseconds (max: 3,600,000 = 1 hour)"),
		tools: z.array(z.string().min(1)).default([...DEFAULT_TOOLS]),
		context: z.array(contextSourceSchema).default([]),
		actions: z.record(z.string(), actionSchema).optional(),
	})
	.refine((data) => !data.actions || Object.keys(data.actions).length > 0, {
		message: "actions must not be empty",
		path: ["actions"],
	})
	.refine(
		(data) => {
			if (!data.actions) return true;
			return Object.keys(data.actions).every((name) => !name.includes(":"));
		},
		{
			message: "action name must not contain ':'",
			path: ["actions"],
		},
	);

type SkillMode = z.infer<typeof skillModeSchema>;
type SkillMetadata = z.infer<typeof skillMetadataSchema>;

function parseSkillMetadata(data: unknown): Result<SkillMetadata, ParseError> {
	const result = skillMetadataSchema.safeParse(data);
	if (!result.success) {
		const details = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
		return err(parseError(`Invalid skill metadata: ${details}`));
	}
	return ok(result.data);
}

export type { ContextSource, SkillInput, SkillMetadata, SkillMode };
export { parseSkillMetadata, skillInputSchema, skillMetadataSchema };
