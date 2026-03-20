/** 背景なし（透明） */
export const TRANSPARENT = "#00000000";

/** 背景なし・選択は文字色のみの SelectRenderable 共通スタイル */
export const flatSelectStyle = {
	backgroundColor: TRANSPARENT,
	focusedBackgroundColor: TRANSPARENT,
	selectedBackgroundColor: TRANSPARENT,
	selectedTextColor: "#00FF00",
} as const;
