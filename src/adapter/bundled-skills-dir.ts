import { stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * taskp パッケージに同梱されたデフォルトスキルのディレクトリ候補を返す。
 *
 * - 開発時: src/adapter/ → ../../skills
 * - ビルド後: dist/ → ../skills
 */
export function getBundledSkillsDirCandidates(): readonly string[] {
	const currentDir =
		typeof import.meta.dirname === "string"
			? import.meta.dirname
			: dirname(fileURLToPath(import.meta.url));
	return [resolve(currentDir, "..", "skills"), resolve(currentDir, "..", "..", "skills")];
}

export async function resolveBundledSkillsDir(
	candidates: readonly string[],
): Promise<string | undefined> {
	for (const candidate of candidates) {
		try {
			await stat(candidate);
			return candidate;
		} catch {
			// candidate does not exist
		}
	}
	return undefined;
}
