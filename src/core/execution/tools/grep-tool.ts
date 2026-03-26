import type { Stats } from "node:fs";
import { glob as fsGlob, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";
import { type ToolResult, toolFailure, toolSuccess } from "./tool-output";

export const MAX_GREP_MATCHES = 500;

export const grepParams = z.object({
	pattern: z.string().describe("Search pattern (regex supported)"),
	path: z.string().optional().describe("File or directory to search (default: cwd)"),
	include: z.string().optional().describe("Glob pattern to filter files (e.g. '*.ts')"),
});

type GrepInput = z.infer<typeof grepParams>;

type GrepData = {
	readonly matches: string;
	readonly count: number;
	readonly truncated: boolean;
};

export type { GrepData };

async function resolveSearchFiles(
	searchPath: string,
	include: string | undefined,
	cwd: string,
): Promise<readonly string[]> {
	const fullPath = resolve(cwd, searchPath);
	let fileStat: Stats;
	try {
		fileStat = await stat(fullPath);
	} catch {
		throw new Error(`Path not found: ${searchPath}`);
	}

	if (fileStat.isFile()) {
		return [searchPath];
	}

	const globPattern = include ?? "**/*";
	const files: string[] = [];
	for await (const entry of fsGlob(globPattern, { cwd: fullPath })) {
		const entryPath = join(searchPath, entry);
		const entryStat = await stat(resolve(cwd, entryPath)).catch(() => undefined);
		if (entryStat?.isFile()) {
			files.push(entryPath);
		}
	}
	return files;
}

function searchFileContent(
	content: string,
	regex: RegExp,
	filePath: string,
	results: string[],
	limit: number,
): void {
	const lines = content.split("\n");
	for (let i = 0; i < lines.length; i++) {
		if (results.length >= limit) return;
		if (regex.test(lines[i])) {
			results.push(`${filePath}:${i + 1}:${lines[i]}`);
		}
	}
}

export const grepTool: Tool<GrepInput, ToolResult<GrepData>> = {
	description:
		"Search file contents for a pattern and return matching lines with file paths and line numbers",
	inputSchema: zodToJsonSchema(grepParams),
	execute: async ({ pattern, path, include }): Promise<ToolResult<GrepData>> => {
		const cwd = process.cwd();
		const searchPath = path ?? ".";
		// g フラグなしで生成することで regex.test() がステートレスに動作する
		// （g フラグ付きの場合 lastIndex が更新され、同じ文字列への連続 test() で結果が変わる）
		const regex = new RegExp(pattern);

		let files: readonly string[];
		try {
			files = await resolveSearchFiles(searchPath, include, cwd);
		} catch {
			return toolFailure(`Failed to search path: ${searchPath}`);
		}

		const results: string[] = [];
		for (const file of files) {
			if (results.length >= MAX_GREP_MATCHES) break;
			const fullFilePath = resolve(cwd, file);
			try {
				const content = await readFile(fullFilePath, "utf-8");
				searchFileContent(content, regex, file, results, MAX_GREP_MATCHES);
			} catch {
				// Skip unreadable files (binary, permission denied, etc.)
			}
		}

		return toolSuccess({
			matches: results.join("\n"),
			count: results.length,
			truncated: results.length >= MAX_GREP_MATCHES,
		});
	},
};
