# taskp 設計ドキュメント

## ドキュメント一覧

| ドキュメント | 内容 |
|---|---|
| [概要・コンセプト](./CONCEPT.md) | taskp の目的、コンセプト、ユースケース |
| [アーキテクチャ](./ARCHITECTURE.md) | 全体構成、パッケージ設計、技術スタック |
| [スキル仕様](./SKILL-SPEC.md) | SKILL.md のフォーマット、探索ルール、変数展開 |
| [CLI 仕様](./CLI-SPEC.md) | コマンド体系、オプション、出力形式 |
| [AI 連携仕様](./AI-SPEC.md) | LLM プロバイダ管理、エージェントループ、ツール定義 |
| [設定ファイル仕様](./CONFIG-SPEC.md) | config.toml のスキーマ、マージ戦略、設定例 |
| [MCP クライアント仕様](./MCP-SPEC.md) | MCP ツール参照、サーバー設定、ツール統合フロー |
| [コーディング規約](./arch/coding-rules.md) | 命名、イミュータブル、Less Is More |
| [設計原則](./arch/design-principles.md) | Tell Don't Ask、デメテルの法則、Parse Don't Validate |
| [開発ワークフロー](./arch/development-workflow.md) | ドメインモデル中心開発、クリーンアーキテクチャ、テスト戦略 |
| [エラーハンドリング](./arch/error-handling.md) | Error/Defect/Fault/Failure 分類、Result 型 |
| [テスト戦略](./arch/testing-strategy.md) | テスト分類、ディレクトリ構成、実行コマンド |
