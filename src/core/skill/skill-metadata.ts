import { z } from "zod";
import type { ParseError } from "../types/errors";
import { parseError } from "../types/errors";
import type { Result } from "../types/result";
import { err, ok } from "../types/result";
import type { ContextSource } from "./context-source";
import { contextSourceSchema } from "./context-source";
import type { SkillInput } from "./skill-input";
import { skillInputSchema } from "./skill-input";

const skillModeSchema = z.enum(["template", "agent"]);

// agent モードのスキルが最低限のファイル操作を行えるよう、
// ツール未指定時のデフォルトセットを定義
const DEFAULT_TOOLS = ["bash", "read", "write"] as const;

const skillMetadataSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	mode: skillModeSchema.default("template"),
	inputs: z.array(skillInputSchema).default([]),
	model: z.string().min(1).optional(),
	tools: z.array(z.string().min(1)).default([...DEFAULT_TOOLS]),
	context: z.array(contextSourceSchema).default([]),
});

type SkillMode = z.infer<typeof skillModeSchema>;
type SkillMetadata = z.infer<typeof skillMetadataSchema>;

function parseSkillMetadata(data: unknown): Result<SkillMetadata, ParseError> {
	try {
		return ok(skillMetadataSchema.parse(data));
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		return err(parseError(`Invalid skill metadata: ${message}`));
	}
}

export type { ContextSource, SkillInput, SkillMetadata, SkillMode };
export { parseSkillMetadata, skillInputSchema, skillMetadataSchema };
