import type { CliRenderer } from "@opentui/core";

/** 現在のレンダーツリーを全てクリアして新しい画面を描画する準備をする */
export function clearScreen(renderer: CliRenderer): void {
	for (const child of renderer.root.getChildren()) {
		renderer.root.remove(child.id);
	}
}
