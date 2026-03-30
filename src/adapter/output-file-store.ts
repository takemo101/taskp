import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { OutputFileStorePort } from "../usecase/port/output-file-store";

const BASE_DIR = "/tmp/taskp";
const OUTPUT_FILENAME = "output.txt";

function buildSessionDir(sessionId: string): string {
	return join(BASE_DIR, sessionId);
}

function buildOutputPath(sessionId: string): string {
	return join(buildSessionDir(sessionId), OUTPUT_FILENAME);
}

export function createOutputFileStore(): OutputFileStorePort {
	return {
		async prepare(sessionId: string): Promise<string> {
			const sessionDir = buildSessionDir(sessionId);
			await mkdir(sessionDir, { recursive: true });
			const outputPath = buildOutputPath(sessionId);
			await writeFile(outputPath, "", "utf-8");
			return outputPath;
		},

		async write(filePath: string, content: string): Promise<void> {
			await writeFile(filePath, content, "utf-8");
		},

		async cleanup(sessionId: string): Promise<void> {
			const sessionDir = buildSessionDir(sessionId);
			await rm(sessionDir, { recursive: true, force: true });
		},
	};
}
