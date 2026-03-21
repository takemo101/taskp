#!/usr/bin/env bun
/**
 * .taskp/config.schema.json が config-loader.ts の Zod スキーマと一致するか検証する。
 *
 * Usage:
 *   bun run scripts/verify-config-schema.ts
 *
 * 不一致の場合は非ゼロで終了し、再生成コマンドを案内する。
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { configSchema } from "../src/adapter/config-loader";

const schemaPath = resolve(import.meta.dirname, "../.taskp/config.schema.json");

const expected = `${JSON.stringify(
	z.toJSONSchema(configSchema, { target: "draft-2020-12" }),
	null,
	2,
)}\n`;

const actual = await readFile(schemaPath, "utf-8").catch(() => undefined);

if (actual === undefined) {
	console.error(`❌ ${schemaPath} が見つかりません。`);
	console.error("   bun run generate-config-schema で生成してください。");
	process.exit(1);
}

if (actual !== expected) {
	console.error("❌ .taskp/config.schema.json が Zod スキーマと一致しません。");
	console.error("   bun run generate-config-schema で再生成してください。");
	process.exit(1);
}

console.log("✅ .taskp/config.schema.json is up to date.");
