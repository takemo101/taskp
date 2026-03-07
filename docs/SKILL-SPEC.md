# taskp — スキル仕様

## ファイル構造

スキルは `SKILL.md` というマークダウンファイルで定義する。

```
<skill-name>/
└── SKILL.md
```

## SKILL.md フォーマット

```markdown
---
name: deploy
description: アプリケーションをデプロイする
mode: template                         # template | agent（デフォルト: template）
inputs:
  - name: environment
    type: select
    message: "デプロイ先を選んでください"
    choices: [staging, production]
  - name: branch
    type: text
    message: "ブランチ名は？"
    default: main
  - name: confirm
    type: confirm
    message: "本当にデプロイしますか？"
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

## フロントマター仕様

### 必須フィールド

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `name` | `string` | スキル名（ディレクトリ名と一致させる） |
| `description` | `string` | スキルの説明（list コマンドで表示） |

### オプションフィールド

| フィールド | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `mode` | `"template" \| "agent"` | `"template"` | 実行モード |
| `inputs` | `Input[]` | `[]` | 入力定義（質問リスト） |
| `model` | `string` | 設定ファイルのデフォルト | 使用する LLM モデル |
| `tools` | `string[]` | `["bash", "read", "write"]` | agent モードで使用するツール |
| `context` | `ContextSource[]` | `[]` | 自動的にコンテキストに含めるソース |

### Input 型

```typescript
type InputType = "text" | "select" | "confirm" | "number" | "password";

interface Input {
  name: string;                     // 変数名（{{name}} で参照）
  type: InputType;                  // 入力タイプ
  message: string;                  // 質問文
  default?: string | number | boolean;  // デフォルト値
  choices?: string[];               // select 用の選択肢
  required?: boolean;               // 必須かどうか（デフォルト: true）
  validate?: string;                // バリデーション正規表現
}
```

#### 各 InputType の挙動

| type | UI | 戻り値型 |
|------|-----|---------|
| `text` | 自由入力 | `string` |
| `select` | 選択肢から選ぶ | `string` |
| `confirm` | Yes/No | `boolean` |
| `number` | 数値入力 | `number` |
| `password` | マスク入力 | `string` |

### ContextSource 型

スキル実行前に自動的にコンテキストに含めるソースを定義する。

```yaml
context:
  - type: file
    path: "src/{{target}}"        # 変数展開可能
  - type: glob
    pattern: "src/**/*.ts"
  - type: command
    run: "git diff --cached"
  - type: url
    url: "https://example.com/api-docs"
```

```typescript
type ContextSource =
  | { type: "file"; path: string }
  | { type: "glob"; pattern: string }
  | { type: "command"; run: string }
  | { type: "url"; url: string };
```

## スキル探索ルール

### 探索順序

```
1. ./.taskp/skills/<name>/SKILL.md     ← プロジェクトローカル
2. ~/.taskp/skills/<name>/SKILL.md     ← グローバル
```

- プロジェクトローカルが優先される（上書きセマンティクス）
- 見つからない場合はエラー

### 一覧取得時

- 両方のディレクトリをスキャン
- 同名スキルはプロジェクトローカルを優先表示
- グローバルのみのスキルも表示（ソース表示で区別）

## 変数展開

### 基本構文

```
{{variable_name}}
```

- フロントマターの `inputs` で定義された変数名を参照
- 未定義の変数はエラー

### 展開タイミング

```
1. フロントマター解析
2. inputs → インタラクティブ質問で値を収集
3. context のパス内の変数を展開
4. context ソースからコンテキストを収集
5. マークダウン本文の変数を展開
6. 実行（template or agent）
```

### 予約変数

| 変数 | 説明 |
|------|------|
| `{{__cwd__}}` | 現在の作業ディレクトリ |
| `{{__skill_dir__}}` | スキルファイルのディレクトリパス |
| `{{__date__}}` | 実行日（YYYY-MM-DD） |
| `{{__timestamp__}}` | 実行タイムスタンプ（ISO 8601） |

## 実行モード

### template モード

マークダウン内のコードブロック（```bash）を抽出し、変数展開後に順次実行する。

```
1. コードブロックを上から順に抽出
2. {{変数}} を展開
3. execa で順次実行
4. 各コマンドの stdout/stderr を表示
5. 非ゼロ終了コードで中断（--force で続行可能）
```

LLM 不要。確定的な手順の自動化に最適。

### agent モード

マークダウン全体（変数展開済み）を LLM のシステムプロンプトとして渡し、ツール呼び出しで自律実行する。

```
1. マークダウン全体を変数展開
2. context ソースの内容を付加
3. LLM にシステムプロンプトとして送信
4. LLM がツール（bash, read, write 等）を呼び出す
5. ツール実行結果を LLM に返す
6. LLM が完了と判断するまで繰り返す
```

LLM 必要。判断を伴うタスク（コードレビュー、リファクタリング等）に最適。

## サンプルスキル

### template モード: deploy

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
  - name: confirm
    type: confirm
    message: "{{environment}} に {{branch}} をデプロイします。よろしいですか？"
---

# Deploy to {{environment}}

\`\`\`bash
git checkout {{branch}}
git pull origin {{branch}}
npm run build
npm run deploy:{{environment}}
\`\`\`
```

### agent モード: code-review

```markdown
---
name: code-review
description: コードレビューを実行する
mode: agent
model: claude-sonnet-4-20250514
inputs:
  - name: target
    type: text
    message: "レビュー対象のファイルまたはディレクトリは？"
    default: "."
  - name: focus
    type: text
    message: "特に注目してほしい観点は？（空欄可）"
    required: false
context:
  - type: glob
    pattern: "{{target}}"
tools:
  - bash
  - read
---

# コードレビュー

以下の観点でコードをレビューしてください:

1. バグの可能性がある箇所
2. パフォーマンスの問題
3. 可読性・保守性の改善点
4. セキュリティ上の懸念

{{#if focus}}
特に以下の観点に注目してください: {{focus}}
{{/if}}

レビュー結果は以下の形式で出力してください:

## 問題点
- [重要度: high/medium/low] ファイル:行番号 — 説明

## 改善提案
- ファイル:行番号 — 提案内容
```
