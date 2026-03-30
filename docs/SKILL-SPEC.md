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
| `inputs` | `Input[]` | `[]` | 入力定義（質問リスト）。`actions` が定義されている場合は無視される |
| `model` | `string` | 設定ファイルのデフォルト | 使用する LLM モデル。`provider/model` 形式でプロバイダも同時に指定可能 |
| `timeout` | `number` | `30000` | template モードのコマンド実行タイムアウト（ミリ秒、最大: 3,600,000）。agent モードでは無視される |
| `tools` | `string[]` | `["bash", "read", "write"]` | agent モードで使用するツール。組み込み: `bash`, `read`, `write`, `edit`, `glob`, `grep`, `fetch`, `ask_user`, `taskp_run`。MCP: `mcp:<server>`, `mcp:<server>/<tool>` |
| `context` | `ContextSource[]` | `[]` | 自動的にコンテキストに含めるソース |
| `actions` | `Record<string, Action>` | - | アクション定義マップ。1つのスキルで複数のアクションを持つ場合に使用 |

### Action 型

`actions` フィールドで定義する各アクションの型。すべてのフィールドは省略可能で、省略時はスキルレベルの値を継承する（`inputs` を除く）。

| フィールド | 型 | 継承元 | 説明 |
|-----------|-----|--------|------|
| `description` | `string` | **必須** | アクションの説明 |
| `mode` | `"template" \| "agent"` | `skill.mode` → `"template"` | 実行モード |
| `model` | `string` | `skill.model` → config default | LLM モデル |
| `inputs` | `Input[]` | なし（デフォルト: `[]`） | 入力定義。アクション間で共有しない |
| `context` | `ContextSource[]` | `skill.context` → `[]` | コンテキストソース |
| `tools` | `string[]` | `skill.tools` → `["bash", "read", "write"]` | agent モード用ツール |
| `timeout` | `number` | `skill.timeout` → コマンドランナーのデフォルト | template モードのタイムアウト（ms） |

#### 継承ルール

```
action.mode    ?? skill.mode    ?? "template"
action.model   ?? skill.model   ?? undefined
action.context ?? skill.context ?? []
action.tools   ?? skill.tools   ?? ["bash", "read", "write"]
action.timeout ?? skill.timeout ?? undefined
```

`inputs` は継承しない。各アクションが独立した入力セットを持つため、スキルレベルの `inputs` からの暗黙の継承は混乱を招く。

#### スキルレベルの `inputs` との排他

`actions` が定義されている場合、スキルレベルの `inputs` は無視される（警告をログ出力）。

### アクションセクション

アクション付きスキルの本文には、各アクションに対応する `## action:<name>` セクションを記述する。

```markdown
## action:add

新しいタスクを追加する。

\`\`\`bash
{{__skill_dir__}}/common.sh add "{{title}}" --priority {{priority}}
\`\`\`

## action:delete

指定した ID のタスクを削除する。

\`\`\`bash
{{__skill_dir__}}/common.sh delete "{{id}}"
\`\`\`
```

- **見出しレベル**: H2（`##`）固定
- **書式**: `## action:<name>`（`action:` プレフィックス + フロントマターの actions キー名）
- **セクション範囲**: 次の H2 見出しまで、またはファイル末尾まで
- `## action:*` に属さない本文（冒頭の説明文など）は taskp では無視され、Agent 利用時のコンテキストとして機能する

### Input 型

```typescript
type InputType = "text" | "textarea" | "select" | "confirm" | "number" | "password";

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
| `text` | 自由入力（1行） | `string` |
| `textarea` | 複数行入力（Meta+Enter で確定） | `string` |
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
  - type: image
    path: "{{image_path}}"        # 画像ファイル（変数展開可能）
```

```typescript
type ContextSource =
  | { type: "file"; path: string }
  | { type: "glob"; pattern: string }
  | { type: "command"; run: string }
  | { type: "url"; url: string }
  | { type: "image"; path: string };
```

#### image タイプ

画像ファイルを `Uint8Array` + mediaType としてバイナリ読み込みし、マルチモーダルコンテンツとして LLM に送信する。

対応フォーマット:

| 拡張子 | mediaType |
|--------|-----------|
| `.png` | `image/png` |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.gif` | `image/gif` |
| `.webp` | `image/webp` |

未対応の拡張子（`.svg`, `.bmp` 等）はエラーになる。

### MCP ツール参照

`tools` フィールドで `mcp:` プレフィックスを使用して、外部 MCP サーバーのツールを有効化できる。

| 形式 | 意味 |
|------|------|
| `mcp:<server>` | 指定サーバーの全ツールを有効化 |
| `mcp:<server>/<tool>` | 指定サーバーの特定ツールのみ有効化 |

```yaml
tools:
  - bash
  - read
  - mcp:github              # github サーバーの全ツール
  - mcp:slack/post_message   # slack サーバーの post_message のみ
```

MCP サーバーの接続設定は `config.toml` の `[mcp.servers]` で定義する。詳細は [MCP クライアント仕様](MCP-SPEC.md) を参照。

アクションレベルでも MCP ツールを指定できる。継承ルールは組み込みツールと同じ。

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
| `{{__session_id__}}` | 実行セッション ID（`tskp_` プレフィックス + ランダム文字列） |

#### セッション ID

スキル実行ごとに一意のセッション ID が自動発行される。形式は `tskp_<ランダム文字列>`（例: `tskp_a1b2c3d4e5f6`）。

内部的には `SessionId` branded type（`string & { readonly __brand: "SessionId" }`）として表現され、生の文字列との取り違えを型レベルで防止する。生成関数（`generateSessionId()`）は副作用を伴うため Adapter 層に配置される（[ARCHITECTURE](ARCHITECTURE.md) 参照）。

- 1回の `taskp run` / TUI 実行につき1つ発行される
- `taskp_run` ツールでネストされた子スキル呼び出しでは、親と同じセッション ID が伝搬される
- フック実行時の環境変数 `TASKP_SESSION_ID` でも参照可能（[CONFIG-SPEC](CONFIG-SPEC.md) 参照）
- agent モードのシステムプロンプトの環境情報にも含まれる

**利用例:**

```markdown
---
name: deploy
mode: template
---
# Deploy (Session: {{__session_id__}})

｀｀｀bash
curl -X POST https://api.example.com/deploy \
  --header "X-Session-Id: {{__session_id__}}"
｀｀｀
```

### 条件ブロック

`{{#if variable}}...{{/if}}` で条件付きセクションを記述できる。`{{else}}` 節は省略可能。

```
{{#if confirm}}
確認済みの処理を実行します。
{{else}}
スキップしました。
{{/if}}
```

#### truthy / falsy 判定

| 値 | 判定 | 典型的なソース |
|----|------|---------------|
| `""` （空文字） | **falsy** | `required: false` の入力が未入力 |
| `"false"` | **falsy** | `confirm` 型で No を選択 |
| それ以外の文字列 | **truthy** | `"true"`, `"hello"`, `"0"` 等 |

#### 制約

- **ネスト不可**: `{{#if}}` の内側に別の `{{#if}}` を含めるとエラーになる
- **選択されなかった分岐内の変数は検証されない**: falsy で除外された分岐に未定義変数があってもエラーにならない
- **閉じタグ必須**: `{{#if}}` に対応する `{{/if}}` がない場合はエラーになる

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

## カスタムシステムプロンプト（SYSTEM.md）

agent モードでは、スキルのマークダウン本文がシステムプロンプトとして使用されるが、その前段に共通の「基盤システムプロンプト」が付与される。この基盤部分を `SYSTEM.md` ファイルで上書きできる。

### 配置場所と探索順序

```
1. ./.taskp/SYSTEM.md     ← プロジェクトローカル（優先）
2. ~/.taskp/SYSTEM.md     ← グローバル
```

- プロジェクトローカルが優先される（config.toml と同じ戦略）
- 空ファイルは「カスタムなし」と同じ扱い
- どちらも存在しない場合はデフォルトの基盤システムプロンプトが使用される

### デフォルトの基盤システムプロンプト

`SYSTEM.md` が存在しない場合、以下の内容が基盤として使用される:

- タスク実行エージェントとしての役割定義
- 利用可能なツール一覧
- 実行ガイドライン（即座に実行、簡潔な応答、フォーマット遵守 等）
- 環境情報（作業ディレクトリ、日付、プラットフォーム）

### カスタム SYSTEM.md の構造

`SYSTEM.md` を配置すると、デフォルトの基盤プロンプトが完全に置き換えられる。ただし、以下の情報は自動的に末尾に付与される:

- **利用可能なツール一覧** — スキルの `tools` フィールドに基づく
- **環境情報** — 作業ディレクトリ、日付、プラットフォーム

```markdown
<!-- .taskp/SYSTEM.md の例 -->

あなたは経験豊富なシニアエンジニアです。
コードの品質と保守性を最優先に考えてタスクを実行してください。

## ルール

- 変更前に必ず既存のテストを実行して影響を確認する
- 新しいコードには必ずテストを追加する
- コミットメッセージは Conventional Commits に従う
```

### 最終的なプロンプト構成

```
┌─────────────────────────────────────┐
│ SYSTEM.md の内容（またはデフォルト）   │ ← 基盤プロンプト
│                                     │
│ # Available tools                   │ ← 自動付与
│ - bash, read, write ...             │
│                                     │
│ # Environment                       │ ← 自動付与
│ - Working directory: /path/to/...   │
│ - Date: 2026-03-22                  │
├─────────────────────────────────────┤
│ SKILL.md の本文（変数展開済み）       │ ← ユーザーメッセージ
│ + context ソースの内容               │
└─────────────────────────────────────┘
```

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
model: anthropic/claude-sonnet-4-20250514
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

### agent モード（画像コンテキスト）: analyze-image

```markdown
---
name: analyze-image
description: 画像を分析してフィードバックを返す
mode: agent
inputs:
  - name: image_path
    type: text
    message: "分析する画像のパスは？"
  - name: focus
    type: text
    message: "何に注目して分析しますか？（空欄で全般）"
    required: false
context:
  - type: image
    path: "{{image_path}}"
tools:
  - read
---

# 画像分析

提供された画像を分析してください。

{{#if focus}}
特に **{{focus}}** に注目してください。
{{/if}}

## 出力フォーマット

- 画像の概要説明
- 注目すべきポイント
- 改善提案（該当する場合）
```

`context: [{ type: image }]` で指定された画像は `Uint8Array` + mediaType としてバイナリ読み込みされ、マルチモーダルコンテンツとして LLM に送信される。`path` フィールドでは `{{変数}}` による変数展開が可能。

### アクション付きスキル: task

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
      - name: priority
        type: select
        message: "優先度は？"
        choices: [low, medium, high]
        default: medium
  delete:
    description: タスクを削除する
    inputs:
      - name: id
        type: text
        message: "削除するタスクIDは？"
  list:
    description: タスク一覧を表示する
---

# タスク管理

共通スクリプト `common.sh` でタスクのCRUD操作を行う。

## action:add

新しいタスクを追加する。

\`\`\`bash
{{__skill_dir__}}/common.sh add "{{title}}" --priority {{priority}}
\`\`\`

## action:delete

指定した ID のタスクを削除する。

\`\`\`bash
{{__skill_dir__}}/common.sh delete "{{id}}"
\`\`\`

## action:list

現在のタスク一覧を表示する。

\`\`\`bash
{{__skill_dir__}}/common.sh list
\`\`\`
```
