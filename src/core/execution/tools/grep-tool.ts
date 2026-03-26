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

type SkippedFile = {
	readonly file: string;
	readonly reason: string;
};

type GrepData = {
	readonly matches: string;
	readonly count: number;
	readonly truncated: boolean;
	readonly skipped: readonly SkippedFile[];
};

type ResolveResult = {
	readonly files: readonly string[];
	readonly skipped: readonly SkippedFile[];
};

export type { GrepData };

async function resolveSearchFiles(
	searchPath: string,
	include: string | undefined,
	cwd: string,
): Promise<ResolveResult> {
	const fullPath = resolve(cwd, searchPath);
	let fileStat: Stats;
	try {
		fileStat = await stat(fullPath);
	} catch {
		throw new Error(`Path not found: ${searchPath}`);
	}

	if (fileStat.isFile()) {
		return { files: [searchPath], skipped: [] };
	}

	const globPattern = include ?? "**/*";
	const files: string[] = [];
	const skipped: SkippedFile[] = [];
	for await (const entry of fsGlob(globPattern, { cwd: fullPath })) {
		const entryPath = join(searchPath, entry);
		try {
			const entryStat = await stat(resolve(cwd, entryPath));
			if (entryStat.isFile()) {
				files.push(entryPath);
			}
		} catch (error) {
			skipped.push({
				file: entryPath,
				reason: error instanceof Error ? error.message : String(error),
			});
		}
	}
	return { files, skipped };
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

		let resolveSkipped: readonly SkippedFile[];
		let files: readonly string[];
		try {
			const resolved = await resolveSearchFiles(searchPath, include, cwd);
			files = resolved.files;
			resolveSkipped = resolved.skipped;
		} catch {
			return toolFailure(`Failed to search path: ${searchPath}`);
		}

		const readSkipped: SkippedFile[] = [];
		const results: string[] = [];
		for (const file of files) {
			if (results.length >= MAX_GREP_MATCHES) break;
			const fullFilePath = resolve(cwd, file);
			try {
				const content = await readFile(fullFilePath, "utf-8");
				searchFileContent(content, regex, file, results, MAX_GREP_MATCHES);
			} catch (error) {
				readSkipped.push({
					file,
					reason: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return toolSuccess({
			matches: results.join("\n"),
			count: results.length,
			truncated: results.length >= MAX_GREP_MATCHES,
			skipped: [...resolveSkipped, ...readSkipped],
		});
	},
};
