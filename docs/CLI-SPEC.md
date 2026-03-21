# taskp — CLI 仕様

## コマンド体系

```
taskp <command> [args] [options]
```

## コマンド一覧

### taskp run \<skill\>

スキルを実行する。

```bash
taskp run deploy
taskp run deploy --model ollama
taskp run deploy --dry-run
taskp run deploy --env production --branch main   # 質問をスキップ
```

#### 引数

| 引数 | 型 | 必須 | 説明 |
|------|-----|:---:|------|
| `skill` | `string` | ✅ | 実行するスキル名 |

#### オプション

| オプション | 短縮 | 型 | デフォルト | 説明 |
|-----------|------|-----|----------|------|
| `--model` | `-m` | `string` | 設定ファイルのデフォルト | 使用する LLM モデル |
| `--provider` | `-p` | `string` | 設定ファイルのデフォルト | LLM プロバイダ |
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
deploy        アプリをデプロイする             ./.taskp/skills/deploy
code-review   コードレビューを実行する         ~/.taskp/skills/code-review
init-db       データベースを初期化する         ~/.taskp/skills/init-db
```

```typescript
interface ListOutput {
  skills: Array<{
    name: string;
    description: string;
    location: string;              // ファイルパス
    scope: "local" | "global";
    mode: "template" | "agent";
  }>;
}
```

### taskp init \<name\>

スキルの雛形を生成する。

```bash
taskp init my-task
taskp init my-task --global
taskp init my-task --mode agent
```

#### 引数

| 引数 | 型 | 必須 | 説明 |
|------|-----|:---:|------|
| `name` | `string` | ✅ | スキル名 |

#### オプション

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `--global` | `-g` | `boolean` | `false` | グローバルに作成 |
| `--mode` | `-m` | `string` | `"template"` | 実行モード |

#### 出力

```typescript
interface InitOutput {
  name: string;
  path: string;                    // 作成されたファイルパス
  mode: "template" | "agent";
}
```

### taskp show \<skill\>

スキルの詳細を表示する。

```bash
taskp show deploy
```

#### 出力

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

```typescript
interface ShowOutput {
  name: string;
  description: string;
  mode: "template" | "agent";
  location: string;
  inputs: Array<{
    name: string;
    type: string;
    message: string;
    default?: string;
    choices?: string[];
  }>;
  context: Array<{
    type: string;
    source: string;
  }>;
}
```

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
# → taskp_run, taskp_list, taskp_init, taskp_show がツールとして利用可能
```
