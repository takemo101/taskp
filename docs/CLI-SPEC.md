# taskp — CLI 仕様

## コマンド体系

```
taskp <command> [args] [options]
```

## コマンド一覧

### taskp run \<skill\>

スキルを実行する。`skill:action` 形式でアクションを直接指定できる。

```bash
taskp run deploy
taskp run deploy --model ollama/qwen2.5-coder:32b
taskp run deploy --dry-run
taskp run deploy --set environment=production --set branch=main

# アクション付きスキル
taskp run task:add                                  # アクション直接指定
taskp run task:add --set title="買い物する"          # 変数を直接指定
```

#### 引数

| 引数 | 型 | 必須 | 説明 |
|------|-----|:---:|------|
| `skill` | `string` | ✅ | スキル名、または `skill:action` 形式 |

#### skill 引数のパース

```
<skill>          → スキルを実行。actions ありならエラー（TUI で選択）
<skill>:<action> → 指定アクションを直接実行
```

コロンは1つのみ許可。`task:add:extra` はエラー（終了コード: 2）。

#### オプション

| オプション | 短縮 | 型 | デフォルト | 説明 |
|-----------|------|-----|----------|------|
| `--model` | `-m` | `string` | 設定ファイルのデフォルト | 使用する LLM モデル。`provider/model` 形式でプロバイダも同時に指定可能 |
| `--dry-run` | | `boolean` | `false` | 実行計画を表示するが実行しない |
| `--force` | `-f` | `boolean` | `false` | エラー時も続行する（template モード） |
| `--verbose` | `-v` | `boolean` | `false` | 詳細ログを表示 |
| `--skip-prompt` | | `boolean` | `false` | 対話的質問を無効化（デフォルト値を使用） |
| `--set` | `-s` | `string[]` | `[]` | 変数を直接指定（`--set key=value`） |

#### 変数の直接指定

質問をスキップして値を直接渡す方法：

```bash
# --set で個別指定
taskp run deploy --set environment=production --set branch=main

# --skip-prompt でデフォルト値を使用
taskp run deploy --skip-prompt
```

#### 出力

```typescript
interface RunOutput {
  skill: string;                    // 実行したスキル名
  mode: "template" | "agent";      // 実行モード
  status: "success" | "failed";    // 実行結果
  duration: number;                 // 実行時間（ms）
  steps?: number;                   // 実行ステップ数（template モード）
  error?: string;                   // エラーメッセージ（失敗時）
}
```

### taskp list

利用可能なスキルを一覧表示する。

```bash
taskp list
taskp list --global
taskp list --local
```

#### オプション

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `--global` | `boolean` | `false` | グローバルスキルのみ表示 |
| `--local` | `boolean` | `false` | プロジェクトローカルスキルのみ表示 |

#### 出力

```
Name          Description                    Location
task          タスクを管理する                ./.taskp/skills/task
  Actions: add, delete, list
deploy        アプリをデプロイする             ./.taskp/skills/deploy
code-review   コードレビューを実行する         ~/.taskp/skills/code-review
```

アクション付きスキルは `Actions` 行にアクション一覧を表示する。

### taskp init \<name\>

スキルの雛形を生成する。

```bash
taskp init my-task
taskp init my-task --global
taskp init my-task --mode agent
taskp init my-task --actions add,delete,list     # アクション付きスキル
```

#### 引数

| 引数 | 型 | 必須 | 説明 |
|------|-----|:---:|------|
| `name` | `string` | ✅ | スキル名 |

#### オプション

| オプション | 短縮 | 型 | デフォルト | 説明 |
|-----------|------|-----|----------|------|
| `--global` | `-g` | `boolean` | `false` | グローバルに作成 |
| `--mode` | `-m` | `string` | `"template"` | 実行モード |
| `--actions` | `-a` | `string` | - | カンマ区切りのアクション名。指定するとアクション付きスキルの雛形を生成 |

#### 出力

```typescript
interface InitOutput {
  name: string;
  path: string;                    // 作成されたファイルパス
  mode: "template" | "agent";
}
```

### taskp setup

プロジェクトの初期設定を行う。`.taskp/` ディレクトリと設定ファイルのテンプレートを生成する。

```bash
taskp setup
taskp setup --global
```

#### 生成されるファイル

**プロジェクト（デフォルト）:**

```
.taskp/
├── config.toml            ← 設定テンプレート（コメント付き）
├── config.schema.json     ← エディタ補完用 JSON Schema
└── skills/                ← スキル格納ディレクトリ
.taplo.toml                ← Taplo（TOML LSP）設定（既存なら追記）
```

**グローバル（`--global`）:**

```
~/.taskp/
├── config.toml            ← グローバル設定テンプレート
└── skills/                ← グローバルスキル格納ディレクトリ
```

#### オプション

| オプション | 短縮 | 型 | デフォルト | 説明 |
|-----------|------|-----|----------|------|
| `--global` | `-g` | `boolean` | `false` | グローバル設定を初期化 |
| `--force` | `-f` | `boolean` | `false` | 既存ファイルを上書き |

#### 動作

1. `.taskp/` ディレクトリを作成
2. `config.toml` のテンプレートを生成（セクションごとのコメント付き）
3. `config.schema.json` を生成（プロジェクトのみ）
4. `.taplo.toml` を生成または追記（プロジェクトのみ）
5. `skills/` ディレクトリを作成
6. 既存ファイルがある場合はスキップ（`--force` で上書き）

#### 出力

```typescript
interface SetupOutput {
  location: "project" | "global";
  created: string[];                // 作成されたファイルパス一覧
  skipped: string[];                // 既存のためスキップされたファイル一覧
}
```

#### 生成される config.toml テンプレート

```toml
# taskp — 設定ファイル
# 詳細: https://github.com/your-repo/taskp/docs/CONFIG-SPEC.md

[ai]
# default_provider = "anthropic"     # anthropic | openai | google | ollama | omlx | lmstudio
# default_model = "claude-sonnet-4-20250514"

# [ai.providers.anthropic]
# api_key_env = "ANTHROPIC_API_KEY"

# [ai.providers.ollama]
# base_url = "http://localhost:11434/v1"
# default_model = "qwen2.5-coder:32b"

# [cli]
# command_timeout_ms = 30000

# [hooks]
# on_success = []
# on_failure = []
```

### taskp show \<skill\>

スキルの詳細を表示する。`skill:action` 形式でアクションの詳細も表示できる。

```bash
taskp show deploy
taskp show task              # アクション一覧を表示
taskp show task:add          # アクションの詳細を表示
```

#### 出力（通常スキル）

```
Skill: deploy
Description: アプリケーションをデプロイする
Mode: template
Location: ./.taskp/skills/deploy/SKILL.md

Inputs:
  environment  select   デプロイ先を選んでください  [staging, production]
  branch       text     ブランチ名は？              (default: main)
  confirm      confirm  本当にデプロイしますか？
```

#### 出力（アクション付きスキル）

```
Skill: task
Description: タスクを管理する
Mode: template
Location: ./.taskp/skills/task/SKILL.md

Actions:
  add       タスクを追加する
  delete    タスクを削除する
  list      タスク一覧を表示する
```

#### 出力（アクション詳細）

```
Skill: task
Action: add
Description: タスクを追加する
Mode: template
Location: ./.taskp/skills/task/SKILL.md

Inputs:
  title      text     タスク名は？
  priority   select   優先度は？          [low, medium, high] (default: medium)
```

### taskp setup

プロジェクトまたはグローバルの初期設定を行う。

```bash
taskp setup
taskp setup --global
taskp setup --force
```

#### オプション

| オプション | 短縮 | 型 | デフォルト | 説明 |
|-----------|------|-----|----------|------|
| `--global` | `-g` | `boolean` | `false` | グローバル設定を初期化 |
| `--force` | `-f` | `boolean` | `false` | 既存ファイルを上書き |

#### 生成ファイル

**プロジェクト (`taskp setup`)**:

| ファイル | 説明 |
|---------|------|
| `.taskp/config.toml` | プロジェクト設定ファイル（コメント付きテンプレート） |
| `.taskp/config.schema.json` | JSON Schema（エディタ補完用） |
| `.taskp/skills/` | スキル格納ディレクトリ |
| `.taplo.toml` | Taplo（TOML LSP）設定 |

**グローバル (`taskp setup --global`)**:

| ファイル | 説明 |
|---------|------|
| `~/.taskp/config.toml` | グローバル設定ファイル（コメント付きテンプレート） |
| `~/.taskp/skills/` | グローバルスキル格納ディレクトリ |

> グローバル初期化では `config.schema.json` と `.taplo.toml` は生成しない。

#### 動作

- `--force` なし: 既存ファイルはスキップされる
- `--force` あり: 既存ファイルを上書きする

#### 出力

```typescript
interface SetupOutput {
  location: "project" | "global";  // 初期化先
  created: string[];               // 作成されたファイル
  skipped: string[];               // スキップされたファイル
}
```

#### 終了コード

- 正常終了: `0`
- 設定エラー（ファイル書き込み失敗等）: `4`

## 終了コード

| コード | 意味 |
|--------|------|
| `0` | 正常終了 |
| `1` | スキル実行エラー（コマンド失敗、LLM エラー等） |
| `2` | スキルが見つからない |
| `3` | スキル定義のパースエラー |
| `4` | 設定エラー（API キーなし等） |

### taskp tui

インタラクティブ TUI を起動する。

```bash
taskp tui
```

fzf 風のファジー検索でスキルを選択し、パラメータを入力して実行する。
agent モードの実行結果はマークダウンでストリーミング表示される。

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

## MCP サーバーモード

incur により、すべてのコマンドが MCP ツールとしても公開される。

```bash
# MCP サーバーとして起動
taskp serve

# Claude Code / pi から利用
# → taskp_run, taskp_list, taskp_init, taskp_setup, taskp_show がツールとして利用可能
```
