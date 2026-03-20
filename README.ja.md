# taskp

[English README](README.md)

マークダウンで定義されたスキル（タスク手順）を、インタラクティブな質問で引数を収集し、LLM またはテンプレートエンジンで実行する CLI ツール。

## 特徴

- **マークダウンでスキル定義** — 人間が読み書きしやすく、Git 管理も容易
- **2つの実行モード** — テンプレート展開（LLM 不要）と AI エージェント実行
- **マルチプロバイダ対応** — Anthropic / OpenAI / Google / Ollama をサポート
- **MCP サーバー** — Claude Code や pi などの AI ツールからも利用可能

## インストール

```bash
bun install -g taskp
```

> **必要環境:** Bun >= 1.2.0

## クイックスタート

### 1. スキルを作成する

```bash
taskp init deploy
```

`.taskp/skills/deploy/SKILL.md` が生成されます。

### 2. スキルを編集する

```markdown
---
name: deploy
description: アプリケーションをデプロイする
mode: template
inputs:
  - name: environment
    type: select
    message: "デプロイ先を選んでください"
    choices: [staging, production]
  - name: branch
    type: text
    message: "ブランチ名は？"
    default: main
---

# Deploy

{{environment}} 環境に {{branch}} ブランチをデプロイします。

## 手順

\`\`\`bash
git checkout {{branch}}
git pull origin {{branch}}
npm run build
npm run deploy:{{environment}}
\`\`\`
```

### 3. スキルを実行する

```bash
taskp run deploy
# → "デプロイ先を選んでください" [staging / production]
# → "ブランチ名は？" [main]
# → コマンドが順番に実行される
```

### 4. AI エージェントモードで実行する

`mode: agent` に変更すれば、LLM がスキルの内容を解釈して実行します。

```bash
taskp run code-review --model anthropic/claude-sonnet-4-20250514
```

## コマンド一覧

### `taskp run <skill>`

スキルを実行します。

```bash
taskp run deploy
taskp run deploy --model ollama/qwen2.5-coder:32b
taskp run deploy --dry-run
taskp run deploy --set environment=production --set branch=main
taskp run deploy --no-input
```

| オプション | 短縮 | 説明 |
|-----------|------|------|
| `--model` | `-m` | 使用する LLM モデル |
| `--provider` | `-p` | LLM プロバイダ |
| `--dry-run` | | 実行計画を表示するが実行しない |
| `--force` | `-f` | エラー時も続行する（template モード） |
| `--verbose` | `-v` | 詳細ログを表示 |
| `--no-input` | | 対話的質問を無効化（デフォルト値を使用） |
| `--set` | `-s` | 変数を直接指定（`--set key=value`） |

### `taskp list`

利用可能なスキルを一覧表示します。

```bash
taskp list
taskp list --global
taskp list --local
```

### `taskp init <name>`

スキルの雛形を生成します。

```bash
taskp init my-task
taskp init my-task --global
taskp init my-task --mode agent
```

### `taskp show <skill>`

スキルの詳細を表示します。

```bash
taskp show deploy
```

### `taskp tui`

インタラクティブ TUI を起動します。

```bash
taskp tui
```

fzf 風のファジー検索でスキルを選択し、パラメータを入力して実行できます。
agent モードの実行結果はマークダウンでストリーミング表示されます。

#### キーバインド

| 画面 | キー | 動作 |
|------|------|------|
| スキル選択 | ↑↓ | 移動 |
| スキル選択 | Enter | 選択 |
| スキル選択 | Esc | 終了 |
| 入力フォーム | Tab / Shift+Tab | 次/前の入力へ |
| 入力フォーム | Enter | 値確定 |
| 入力フォーム | Esc | 戻る |
| 実行完了 | Enter | スキル選択に戻る |
| 実行完了 | Esc | 終了 |

<!-- TODO: スクリーンショットを追加 -->

### `taskp serve`

MCP サーバーとして起動します（詳細は [MCP サーバーとしての使い方](#mcp-サーバーとしての使い方) を参照）。

## スキルの作成方法

スキルは `SKILL.md` というマークダウンファイルで定義します。

### ファイル構造

```
<skill-name>/
└── SKILL.md
```

### 配置場所

| 場所 | スコープ | 用途 |
|------|---------|------|
| `.taskp/skills/<name>/SKILL.md` | プロジェクトローカル | プロジェクト固有のタスク |
| `~/.taskp/skills/<name>/SKILL.md` | グローバル | 個人で共通利用するタスク |

プロジェクトローカルが優先されます。

### フロントマター

```yaml
---
name: my-skill          # スキル名
description: 説明文      # list コマンドで表示
mode: template          # template | agent
inputs:                 # 入力定義
  - name: target
    type: text
    message: "対象は？"
model: anthropic/claude-sonnet-4-20250514  # agent モード用（省略可）
tools:                  # agent モードで使用するツール（省略可）
  - bash
  - read
  - write
context:                # 自動的にコンテキストに含めるソース（省略可）
  - type: file
    path: "src/{{target}}"
  - type: command
    run: "git diff --cached"
---
```

### 入力タイプ

| type | UI | 戻り値型 |
|------|-----|---------|
| `text` | 自由入力 | `string` |
| `textarea` | 複数行入力（Meta+Enter で確定） | `string` |
| `select` | 選択肢から選ぶ | `string` |
| `confirm` | Yes/No | `boolean` |
| `number` | 数値入力 | `number` |
| `password` | マスク入力 | `string` |

### 変数展開

本文中で `{{変数名}}` を使って入力値を展開できます。

## 設定ファイル

設定は TOML 形式で記述します。プロジェクト設定がグローバル設定より優先されます。

### グローバル設定 `~/.taskp/config.toml`

```toml
[ai]
default_provider = "anthropic"
default_model = "claude-sonnet-4-20250514"

[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"

[ai.providers.openai]
api_key_env = "OPENAI_API_KEY"

[ai.providers.ollama]
base_url = "http://localhost:11434/v1"
default_model = "qwen2.5-coder:32b"
```

### プロジェクト設定 `.taskp/config.toml`

```toml
[ai]
default_provider = "ollama"
default_model = "qwen2.5-coder:14b"
```

## MCP サーバーとしての使い方

taskp は MCP（Model Context Protocol）サーバーとして動作し、Claude Code や pi などの AI ツールから利用できます。

```bash
taskp serve
```

公開されるツール:

- `taskp_run` — スキルを実行
- `taskp_list` — スキル一覧を取得
- `taskp_init` — スキルの雛形を生成
- `taskp_show` — スキルの詳細を表示

## ドキュメント

詳細な仕様は `docs/` ディレクトリを参照してください。

- [コンセプト](docs/CONCEPT.md)
- [アーキテクチャ](docs/ARCHITECTURE.md)
- [スキル仕様](docs/SKILL-SPEC.md)
- [CLI 仕様](docs/CLI-SPEC.md)
- [AI 連携仕様](docs/AI-SPEC.md)

## ライセンス

MIT
