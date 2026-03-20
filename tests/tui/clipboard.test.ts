import { describe, expect, it } from "vitest";
import { resolveClipboardCommand } from "../../src/tui/clipboard";

describe("resolveClipboardCommand", () => {
	it("returns a command object for the current platform", () => {
		const result = resolveClipboardCommand();

		// CI やローカル環境に依存しないよう、プラットフォームごとに期待値を分岐
		switch (process.platform) {
			case "darwin":
				expect(result).toEqual({ bin: "pbcopy", args: [] });
				break;
			case "linux":
				expect(result).toEqual({
					bin: "xclip",
					args: ["-selection", "clipboard"],
				});
				break;
			case "win32":
				expect(result).toEqual({ bin: "clip.exe", args: [] });
				break;
			default:
				expect(result).toBeNull();
		}
	});

	it("returns an object with bin and args properties", () => {
		const result = resolveClipboardCommand();
		if (result === null) return; // unsupported platform

		expect(typeof result.bin).toBe("string");
		expect(Array.isArray(result.args)).toBe(true);
	});
});
