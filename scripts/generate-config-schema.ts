#!/usr/bin/env bun
/**
 * config-loader.ts の Zod スキーマから JSON Schema を生成する。
 *
 * Usage:
 *   bun run scripts/generate-config-schema.ts
 *
 * Output:
 *   .taskp/config.schema.json
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { configSchema } from "../src/adapter/config-loader";

const jsonSchema = z.toJSONSchema(configSchema, {
	target: "draft-2020-12",
});

const outPath = resolve(import.meta.dirname, "../.taskp/config.schema.json");
await writeFile(outPath, `${JSON.stringify(jsonSchema, null, 2)}\n`);

console.log(`✅ Generated: ${outPath}`);
