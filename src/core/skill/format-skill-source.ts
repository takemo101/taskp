import { homedir } from "node:os";
import { dirname, relative } from "node:path";

/**
 * スキルファイルの location パスを、ホームディレクトリ相対（~/...）または
 * cwd 相対（./...）の表示用文字列に変換する。
 */
export function formatSkillSource(location: string, cwd = process.cwd()): string {
	const skillDir = dirname(location);
	const home = homedir();

	if (skillDir === home || skillDir.startsWith(`${home}/`)) {
		return `~${skillDir.slice(home.length)}`;
	}

	const relativePath = relative(cwd, skillDir);
	if (relativePath === "") {
		return ".";
	}

	return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}
