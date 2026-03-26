/**
 * シェルコマンドインジェクション検出用のパターン。
 * $(...) / `...` / ${...} によるコマンド置換・パラメータ展開を検出する。
 */
const COMMAND_SUBSTITUTION_PATTERN = /\$\(|\$\{|`/;

/** コマンド文字列に危険なシェル展開パターンが含まれていないかを検証する。 */
export function validateCommand(command: string): string | undefined {
	if (COMMAND_SUBSTITUTION_PATTERN.test(command)) {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: describing literal shell syntax
		return "Command contains shell expansion patterns ($(...), ${...}, or backticks) which are not allowed";
	}
	return undefined;
}
