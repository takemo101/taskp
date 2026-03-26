// agent モードのスキルが最低限のファイル操作を行えるよう、
// ツール未指定時のデフォルトセットを定義
export const DEFAULT_TOOLS = ["bash", "read", "write"] as const;

// エージェントループの最大ステップ数（LLM のツール呼び出し回数上限）
// config.toml の max_agent_steps で上書き可能（1〜200）
export const DEFAULT_MAX_AGENT_STEPS = 50;
