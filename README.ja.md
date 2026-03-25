# taskp

[English README](README.md)

マークダウンで定義されたスキル（タスク手順）を、インタラクティブな質問で引数を収集し、LLM またはテンプレートエンジンで実行する CLI ツール。

## 特徴

- **マークダウンでスキル定義** — 人間が読み書きしやすく、Git 管理も容易
- **2つの実行モード** — テンプレート展開（LLM 不要）と AI エージェント実行
- **マルチアクション** — 関連する操作（追加/削除/一覧）を1つのスキルにまとめられる
- **マルチプロバイダ対応** — Anthropic / OpenAI / Google / Ollama をサポート
- **MCP サーバー** — Claude Code や pi などの AI ツールからも利用可能

## インストール

```bash
bun install -g github:takemo101/taskp
```

バージョンを指定してインストール：

```bash
bun install -g github:takemo101/taskp#v0.1.7
```

> **必要環境:** Bun >= 1.2.0

インストール後に `taskp` が見つからない場合は、Bun のグローバル bin ディレクトリを PATH に追加してください：

```bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### アップデート

```bash
bun install -g github:takemo101/taskp
```

### アンインストール

```bash
bun remove -g taskp
```

## クイックスタート

### 1. プロジェクトを初期化する

```bash
taskp setup
```

`.taskp/` ディレクトリとコメントアウトされた `config.toml` が生成されます。必要な行のコメントを外すだけで設定できます：

```toml
[ai]
default_provider = "anthropic"
default_model = "claude-sonnet-4-20250514"

[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"
```

JSON Schema と `.taplo.toml` も生成されるため、[Taplo](https://taplo.tamasfe.dev/) 対応エディタで補完が効きます。

グローバル設定（プロジェクト横断）の場合：

```bash
taskp setup --global
```

### 2. スキルを作成する

```bash
taskp init deploy
```

`.taskp/skills/deploy/SKILL.md` が生成されます。

### 3. スキルを編集する

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

### 4. スキルを実行する

```bash
taskp run deploy
# → "デプロイ先を選んでください" [staging / production]
# → "ブランチ名は？" [main]
# → コマンドが順番に実行される
```

### 5. AI エージェントモードで実行する

`mode: agent` に変更すれば、LLM がスキルの内容を解釈して実行します。

```bash
taskp run code-review --model anthropic/claude-sonnet-4-20250514
```

### 6. マルチアクションスキルを作成する

`actions` で関連する操作を1つのスキルにまとめられます：

```markdown
---
name: task
description: タスクを管理する
mode: template
actions:
  add:
    description: タスクを追加する
    inputs:
      - name: title
        type: text
        message: "タスク名は？"
  list:
    description: タスク一覧を表示する
  delete:
    description: タスクを削除する
    mode: agent
    tools: [bash]
    inputs:
      - name: id
        type: text
        message: "タスクIDは？"
---

# タスク管理

## action:add

｀｀｀bash
echo "タスク追加: {{title}}"
｀｀｀

## action:list

｀｀｀bash
echo "タスク一覧..."
｀｀｀

## action:delete

タスク {{id}} を確認してから削除してください。
```

```bash
taskp run task:add                 # 特定のアクションを実行
taskp run task:add --set title="買い物"
taskp tui                          # TUI でアクションを選択
```

各アクションは独自の `mode`、`model`、`inputs`、`tools`、`context` を持てます。1つのスキル内で template と agent モードを混在できます。

## コマンド一覧

### `taskp run <skill>`

スキルを実行します。

```bash
taskp run deploy
taskp run deploy --model ollama/qwen2.5-coder:32b
taskp run deploy --dry-run
taskp run deploy --set environment=production --set branch=main
taskp run deploy --no-input
taskp run task:add               # 特定のアクションを実行
```

| オプション | 短縮 | 説明 |
|-----------|------|------|
| `--model` | `-m` | 使用する LLM モデル（`provider/model` 形式対応） |
| `--dry-run` | | 実行計画を表示するが実行しない |
| `--force` | `-f` | エラー時も続行する（template モード） |
| `--verbose` | `-v` | 詳細ログを表示 |
| `--no-input` | | 対話的質問を無効化（デフォルト値を使用） |
| `--set` | `-s` | 変数を直接指定（`--set key=value`） |

### `taskp setup`

プロジェクトの設定を初期化します。

```bash
taskp setup
taskp setup --global
taskp setup --force
```

| オプション | 短縮 | 説明 |
|-----------|------|------|
| `--global` | `-g` | グローバル設定（`~/.taskp/`）を初期化 |
| `--force` | `-f` | 既存ファイルを上書き |

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
taskp init my-task --actions add,delete,list
```

### `taskp show <skill>`

スキルの詳細を表示します。

```bash
taskp show deploy
taskp show task:add              # アクション詳細を表示
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
model: anthropic/claude-sonnet-4-20250514  # agent モード用（provider/model 形式）
tools:                  # agent モードで使用するツール（省略可）
  - bash
  - read
  - write
  - edit
  - grep
  - fetch
context:                # 自動的にコンテキストに含めるソース（省略可）
  - type: file
    path: "src/{{target}}"
  - type: command
    run: "git diff --cached"
  - type: image
    path: "docs/diagram.png"
actions:                # マルチアクション定義（省略可）
  build:
    description: プロジェクトをビルドする
    inputs:
      - name: target
        type: text
        message: "ビルド対象は？"
  test:
    description: テストを実行する
    mode: agent
    tools: [bash, read]
---
```

### アクション

`actions` フィールドで1つのスキルに複数のアクションを定義できます。各アクションは `mode`、`model`、`inputs`、`tools`、`context`、`timeout` を個別に上書き可能で、未指定のフィールドはスキルレベルの値を継承します。

`actions` が定義されている場合、スキルレベルの `inputs` は無視されます。

アクションの実行手順は本文中の `## action:<name>` セクションで定義します：

```markdown
## action:build

｀｀｀bash
npm run build --target={{target}}
｀｀｀

## action:test

テストカバレッジを分析し、改善点を提案してください。
```

コロン区切りでアクションを実行：

```bash
taskp run my-skill:build
taskp run my-skill:test --model anthropic/claude-sonnet-4-20250514
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

### エージェントツール

agent モードでは、以下の組み込みツールが利用できます：

| ツール | 説明 |
|--------|------|
| `bash` | シェルコマンドを実行 |
| `read` | ファイル内容を読み取り |
| `write` | ファイルに書き込み |
| `edit` | ファイル内の特定文字列を置換（完全一致が1箇所のみ必要） |
| `grep` | ファイル内容をパターン検索（正規表現対応） |
| `fetch` | URL からテキストコンテンツを取得（http/https のみ） |
| `glob` | glob パターンでファイルを検索 |
| `ask_user` | 実行中にユーザーに質問 |
| `taskp_run` | 他の template モードスキルを呼び出し |

`tools` フィールドで必要なツールを指定します：

```yaml
tools:
  - bash
  - read
  - grep
  - fetch
```

#### `taskp_run`

agent モードで LLM が他の template モードスキルを呼び出せます：

```yaml
---
name: diagnose
mode: agent
tools:
  - bash
  - read
  - taskp_run    # スキル間連携を有効化
---
```

制約:
- template モードのスキルのみ呼び出し可能（agent のネストは不可）
- 再帰呼び出しは検出・ブロック
- 最大ネスト深度: 3

### 画像コンテキスト

スキルのコンテキストに画像を含めてマルチモーダル LLM に送信できます：

```yaml
context:
  - type: image
    path: "docs/architecture.png"
  - type: image
    path: "screenshots/{{target}}.png"    # 変数展開対応
```

対応フォーマット: PNG, JPEG, GIF, WebP。画像はバイナリデータとして直接 LLM に送信されます。

## カスタムシステムプロンプト

agent モードで使用されるシステムプロンプトを `SYSTEM.md` ファイルでカスタマイズできます。

| 場所 | スコープ |
|------|----------|
| `.taskp/SYSTEM.md` | プロジェクトローカル（優先） |
| `~/.taskp/SYSTEM.md` | グローバル |

`SYSTEM.md` が存在する場合、その内容がデフォルトのシステムプロンプトの代わりに使用されます。利用可能なツール一覧と環境情報は自動的に付与されます。

`SYSTEM.md` が見つからない場合（または空ファイルの場合）は、組み込みのデフォルトシステムプロンプトが使用されます。

詳細は [スキル仕様 — カスタムシステムプロンプト](docs/SKILL-SPEC.md#カスタムシステムプロンプトsystemmd) を参照してください。

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
