import { execFile } from "node:child_process";

// OpenTUI の selection イベントハンドラから呼ばれるため、
// レンダリングをブロックしないよう非同期で実行する
export function copyToClipboard(text: string): void {
	const command = resolveClipboardCommand();
	if (!command) return;

	const child = execFile(command.bin, command.args, { timeout: 3000 });
	child.stdin?.end(text);
}

/** @internal テスト用に export */
export function resolveClipboardCommand(): {
	readonly bin: string;
	readonly args: readonly string[];
} | null {
	switch (process.platform) {
		case "darwin":
			return { bin: "pbcopy", args: [] };
		case "linux":
			return { bin: "xclip", args: ["-selection", "clipboard"] };
		case "win32":
			return { bin: "clip.exe", args: [] };
		default:
			return null;
	}
}
