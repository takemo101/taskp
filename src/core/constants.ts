// agent モードのスキルが最低限のファイル操作を行えるよう、
// ツール未指定時のデフォルトセットを定義
export const DEFAULT_TOOLS = ["bash", "read", "write"] as const;
