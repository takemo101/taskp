import type { JSONSchema7 } from "ai";
import { jsonSchema } from "ai";
import { toJSONSchema, type z } from "zod";

// Vercel AI SDK は JSONSchema7 形式のツール定義を要求するが、
// zod スキーマから直接変換する公式 API がないため、
// toJSONSchema → jsonSchema のブリッジが必要
export function zodToJsonSchema<T extends z.ZodType>(schema: T) {
	return jsonSchema<z.infer<T>>(toJSONSchema(schema) as JSONSchema7);
}
