# AGENTS.md — taskp

## プロジェクト概要

taskp はマークダウンで定義されたスキル（タスク手順）を、インタラクティブな質問で引数を収集し、LLM またはテンプレートエンジンで実行する CLI ツール。

- ランタイム: Bun / TypeScript (strict)
- LLM 連携: Vercel AI SDK
- CLI フレームワーク: incur
- テスト: Vitest
- Lint/Format: Biome

## 設計ドキュメント

実装前に必ず該当ドキュメントを確認すること。

| ドキュメント | 参照タイミング |
|---|---|
| [コンセプト](docs/CONCEPT.md) | 機能の目的・ユースケースを確認したいとき |
| [アーキテクチャ](docs/ARCHITECTURE.md) | パッケージ構成・依存関係・レイヤー設計 |
| [スキル仕様](docs/SKILL-SPEC.md) | SKILL.md のフォーマット・探索ルール・変数展開 |
| [CLI 仕様](docs/CLI-SPEC.md) | コマンド体系・オプション・出力形式 |
| [AI 連携仕様](docs/AI-SPEC.md) | LLM プロバイダ管理・エージェントループ・ツール定義 |

## コーディング規約

実装時は以下に従うこと。

- [コーディングルール](docs/arch/coding-rules.md) — 命名、イミュータブル、Less Is More
- [設計原則](docs/arch/design-principles.md) — Tell Don't Ask、デメテルの法則、Parse Don't Validate
- [開発ワークフロー](docs/arch/development-workflow.md) — ドメインモデル中心開発、クリーンアーキテクチャ
- [エラーハンドリング](docs/arch/error-handling.md) — Error/Defect/Fault/Failure 分類、Result 型
- [テスト戦略](docs/arch/testing-strategy.md) — テスト分類、ディレクトリ構成

## 既知の制約

- config.toml のスキーマ（`src/adapter/config-loader.ts`）を変更した場合は、JSON Schema とドキュメントの両方を更新すること
  1. `bun run scripts/generate-config-schema.ts` で `.taskp/config.schema.json` を再生成
  2. `docs/CONFIG-SPEC.md` のフィールド一覧・設定例を手動で更新

## リファレンスドキュメント

AI SDK の実装時は必要なトピックを参照すること。

| ファイル | 内容 | サイズ |
|---|---|---|
| [foundations](docs/references/ai-sdk/01-foundations.md) | 基本概念・プロンプト・ツール・ストリーミング | 61KB |
| [getting-started](docs/references/ai-sdk/02-getting-started.md) | フレームワーク別セットアップ | 167KB |
| [agents](docs/references/ai-sdk/03-agents.md) | エージェント構築・ワークフロー・メモリ | 75KB |
| [core](docs/references/ai-sdk/04-core.md) | テキスト生成・構造化データ・ツール呼び出し・MCP | 220KB |
| [ui](docs/references/ai-sdk/05-ui.md) | チャットボット・ストリーミング・エラーハンドリング | 146KB |
| [rsc](docs/references/ai-sdk/06-rsc.md) | React Server Components | 1KB |
| [providers](docs/references/ai-sdk/07-providers.md) | OpenAI/Anthropic/Google/Azure 等のプロバイダー設定 | 445KB |
| [reference](docs/references/ai-sdk/08-reference.md) | API リファレンス目次 | 6KB |
| [advanced](docs/references/ai-sdk/09-advanced.md) | マイグレーション・トラブルシューティング | 7KB |

> ファイルが大きいため `read` の `offset`/`limit` や `grep` で必要箇所のみ参照すること。
