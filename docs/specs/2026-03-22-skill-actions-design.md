# スキルアクション設計

## 概要

1つのスキルが複数の「アクション」を持てるようにする拡張。
共通のリソース（シェルスクリプト、設定ファイル等）を共有しつつ、操作ごとに異なる inputs・mode・model 等を定義できる。

SKILL.md 1ファイルに全情報を持つ **フロントマター方式** を採用し、
taskp のアクション実行と通常の Agent Skills としての利用（pi 等）を **Single Source of Truth** で両立する。

## ユースケース

- タスク管理スキル: add / delete / list を1スキルにまとめる
- DB 操作スキル: migrate / seed / reset を1スキルにまとめる
- Docker 操作スキル: build / push / run を1スキルにまとめる
- template と agent を混在させたスキル: migrate(template) + diagnose(agent)

## 設計方針

- **Single Source of Truth**: SKILL.md 1ファイルに全情報を持つ（フロントマター方式）
- **1スキル = 1ディレクトリ**の原則は維持
- **Agent 互換**: フロントマターの `actions` は未知フィールドとして無視され、本文マークダウンがそのまま LLM コンテキストになる
- **コロン区切り**: `taskp run skill:action` で直接指定
- **後方互換**: `actions` がなければ従来の単一スキルとして動作
- **フィールド継承**: アクション固有の設定がない場合はスキルレベルの値をフォールバック

## 先行事例

| ツール | パターン | 参考点 |
|--------|---------|--------|
| Taskfile (go-task) | `namespace:task` のコロン区切り | 命名規約・呼び出し UI |
| Taskfile `includes` | 別ファイルの namespace 分割 | ファイル分離の選択肢として検討し、Agent 互換性の理由で不採用 |
| GitHub Actions Composite | 複数ステップを1 action.yml に束ねる | 単一定義で複数処理 |
| Spring CLI | command.yaml + actions.yaml の分離 | メタデータと実装の分離 |

## 不採用案: 別ファイル方式

各アクションを `actions/add.md` のように独立ファイルにする方式も検討した。
構造は整理しやすいが、**Agent 互換性の観点で不採用**とした。

- Agent（pi 等）は `SKILL.md` だけを読む。`actions/` ディレクトリの存在を知らない
- SKILL.md に Agent 用リファレンス、actions/*.md に taskp 用手順を書くと**二重管理**になる
- コマンドの引数変更時に両方のファイルを更新する必要があり、不整合リスクがある

## ディレクトリ構成

### アクション付きスキル

```
<skill-name>/
├── SKILL.md              ← 共通メタデータ + アクション定義 + 本文（実行手順 & Agent コンテキスト）
└── common.sh             ← 共通リソース（任意）
```

### 従来のスキル（変更なし）

```
<skill-name>/
└── SKILL.md              ← 従来通り
```

## フロントマター仕様

### 新規フィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:---:|------|
| `actions` | `Record<string, Action>` | - | アクション定義マップ。存在する場合、スキルレベルの `inputs` は無視される |

### Action 型

各アクションは、通常の SKILL.md のオプションフィールドと同じフィールドを持つ。
すべて省略可能で、省略時はスキルレベルの値を継承する。

| フィールド | 型 | 継承元 | 説明 |
|-----------|-----|--------|------|
| `description` | `string` | **必須** | アクションの説明 |
| `mode` | `"template" \| "agent"` | `skill.mode` → `"template"` | 実行モード |
| `model` | `string` | `skill.model` → config default | LLM モデル。`provider/model` 形式でプロバイダも同時に指定可能 |
| `inputs` | `Input[]` | なし（デフォルト: `[]`） | 入力定義。アクション間で共有しない |
| `context` | `ContextSource[]` | `skill.context` → `[]` | コンテキストソース |
| `tools` | `string[]` | `skill.tools` → `["bash", "read", "write"]` | agent モード用ツール |
| `timeout` | `number` | `skill.timeout` → コマンドランナーのデフォルト | template モードのタイムアウト（ms） |

### 継承ルール

```
action.mode    ?? skill.mode    ?? "template"
action.model   ?? skill.model   ?? undefined
action.context ?? skill.context ?? []
action.tools   ?? skill.tools   ?? ["bash", "read", "write"]
action.timeout ?? skill.timeout ?? undefined
```

`inputs` は継承しない。各アクションが独立した入力セットを持つため、スキルレベルの `inputs` からの暗黙の継承は混乱を招く。

> **Note**: `timeout` が未指定の場合、コマンドランナーのデフォルト値（30000ms）が適用される。

### スキルレベルの `inputs` との排他

`actions` が定義されている場合:

- スキルレベルの `inputs` は**無視される**（警告をログ出力）
- 各アクションが独自の `inputs` を持つ
- アクションに `inputs` がない場合は質問なしで実行

## 型定義

### TypeScript

```typescript
interface Action {
  readonly description: string;
  readonly mode?: "template" | "agent";
  readonly model?: string;
  readonly inputs?: readonly Input[];
  readonly context?: readonly ContextSource[];
  readonly tools?: readonly string[];
  readonly timeout?: number;
}

interface SkillFrontmatter {
  readonly name: string;
  readonly description: string;
  readonly mode?: "template" | "agent";
  readonly model?: string;
  readonly inputs?: readonly Input[];
  readonly context?: readonly ContextSource[];
  readonly tools?: readonly string[];
  readonly timeout?: number;
  readonly actions?: Readonly<Record<string, Action>>;
}
```

### Zod スキーマ（skill-loader に追加）

```typescript
const actionSchema = z.object({
  description: z.string().min(1),
  mode: z.enum(["template", "agent"]).optional(),
  model: z.string().min(1).optional(),
  inputs: z.array(inputSchema).optional(),
  context: z.array(contextSourceSchema).optional(),
  tools: z.array(z.string().min(1)).optional(),
  timeout: z.number().int().min(1).max(3_600_000).optional(),
});

const skillFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  mode: z.enum(["template", "agent"]).optional(),
  model: z.string().min(1).optional(),
  inputs: z.array(inputSchema).optional(),
  context: z.array(contextSourceSchema).optional(),
  tools: z.array(z.string().min(1)).optional(),
  timeout: z.number().int().min(1).max(3_600_000).optional(),
  actions: z.record(z.string(), actionSchema).optional(),
});
```

## 本文マークダウン仕様

### デュアルパーパス設計

本文は2つの役割を同時に果たす:

| 利用者 | 読む部分 | 解釈 |
|--------|---------|------|
| **taskp** | `## action:<name>` セクション | 選択されたアクションのコードブロックを実行 |
| **Agent (pi 等)** | 本文全体 | LLM へのコンテキスト（コマンドリファレンスとして機能） |

Agent から見ると `## action:add` は単なる見出しであり、コードブロックはコマンド例として解釈される。
`{{title}}` のようなテンプレート変数も「ここにタスク名が入る」と LLM が理解できる。

### アクションセクションの構文

```markdown
## action:<name>

（任意の説明テキスト）

｀｀｀bash
コマンド
｀｀｀
```

- **見出しレベル**: H2（`##`）固定
- **書式**: `## action:<name>`（`action:` プレフィックス + フロントマターの actions キー名）
- **セクション範囲**: 次の H2 見出しまで、またはファイル末尾まで

### アクションセクション外の本文

`## action:*` に属さない本文（冒頭の説明文など）:

- **taskp**: 無視（実行対象外）
- **Agent**: コンテキストの一部として LLM に渡される

冒頭に共通の説明文を書くことで、Agent が全体の文脈を理解しやすくなる。

### template モードのセクション実行

1. 選択されたアクションの `## action:<name>` セクションを特定
2. セクション内のコードブロック（```bash）を上から順に抽出
3. アクションの inputs で収集した値で変数展開
4. execa で順次実行
5. 非ゼロ終了コードで中断（`--force` で続行可能）

### agent モードのセクション実行

1. 選択されたアクションの `## action:<name>` セクションを特定
2. セクション内容全体を変数展開
3. context ソースの内容を付加
4. LLM にプロンプトとして送信
5. ツール呼び出しで自律実行

### 変数展開

- アクション内で使用できる変数は、**そのアクションの inputs で定義された変数**と**予約変数**のみ
- 他のアクションの inputs で定義された変数はスコープ外（未定義変数エラー）
- 条件ブロック（`{{#if}}`）は従来通り使用可能

## 処理フロー

### アクション選択あり（`taskp run task`）

```
taskp run task
  │
  ├─ SKILL.md 読み込み・フロントマター解析
  │
  ├─ actions フィールドを検出
  │
  ├─ アクション選択 UI を表示
  │   ┌──────────────────────────────────┐
  │   │ タスクを管理する                   │
  │   │                                    │
  │   │ > add      タスクを追加する         │
  │   │   delete   タスクを削除する         │
  │   │   list     タスク一覧を表示する     │
  │   └──────────────────────────────────┘
  │
  ├─ 選択されたアクションの inputs で質問
  │
  ├─ 本文から `## action:<name>` セクションを抽出
  │
  ├─ 変数展開
  │
  └─ 実行（template or agent）
```

### アクション直接指定（`taskp run task:add`）

```
taskp run task:add
  │
  ├─ "task:add" を skill="task", action="add" に分解
  │
  ├─ SKILL.md 読み込み・フロントマター解析
  │
  ├─ actions.add の inputs で質問
  │
  ├─ 本文から `## action:add` セクションを抽出
  │
  ├─ 変数展開
  │
  └─ 実行（template or agent）
```

### 従来スキル（`actions` なし）

```
taskp run deploy
  │
  ├─ SKILL.md 読み込み・フロントマター解析
  │
  ├─ actions フィールドなし → 従来フロー
  │
  ├─ inputs で質問
  │
  ├─ 本文全体からコードブロックを抽出（template）/ 全体をプロンプト（agent）
  │
  └─ 実行
```

## CLI インターフェース

### run コマンド

```bash
# アクション選択 UI を表示
taskp run task

# 直接指定（コロン区切り）
taskp run task:add

# 変数を直接指定
taskp run task:add --set title="買い物する" --set priority=high

# dry-run
taskp run task:delete --dry-run

# skip-prompt（各 input のデフォルト値を使用）
taskp run task:add --skip-prompt
```

#### skill 引数のパース

```
<skill>       → skill="<skill>", action=null     → actions ありならアクション選択 UI
<skill>:<action> → skill="<skill>", action="<action>" → 直接実行
```

コロンは1つのみ許可。`task:add:extra` はエラー（終了コード: 2）。

### list コマンド

```bash
taskp list
```

```
Name            Description              Actions
task            タスクを管理する          add, delete, list
deploy          アプリをデプロイする       -
code-review     コードレビューする        -
```

`Actions` カラムは `actions` が存在する場合のみ表示。全スキルがアクションなしなら従来と同じ出力。

```typescript
// 実装では Skill[] を直接使用。Skill.metadata.actions にアクション定義を含む。
type ListOutput = {
  readonly skills: readonly Skill[];
  readonly failures: readonly SkillLoadFailure[];
};
```

### show コマンド

```bash
taskp show task
```

```
Skill: task
Description: タスクを管理する
Mode: template (default)
Location: ./.taskp/skills/task/SKILL.md

Actions:
  add       タスクを追加する        [template]
  delete    タスクを削除する        [template]
  list      タスク一覧を表示する     [template]
```

```bash
taskp show task:add
```

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

```typescript
type ActionSummary = {
  readonly name: string;
  readonly description: string;
};

type ActionDetail = {
  readonly name: string;
  readonly description: string;
  readonly mode: SkillMode;
};

type ShowOutput = {
  readonly name: string;
  readonly description: string;
  readonly mode: SkillMode;
  readonly location: string;
  readonly inputs: readonly SkillInput[];
  readonly context: readonly ContextSource[];
  readonly actions?: readonly ActionSummary[];
  readonly actionDetail?: ActionDetail;
};
```

### init コマンド

```bash
# 従来（変更なし）
taskp init my-task

# アクション付きスキルの雛形
taskp init my-task --actions add,delete,list
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `--actions` | `string` | - | カンマ区切りのアクション名。指定するとアクション付きスキルの雛形を生成 |

生成される雛形:

```markdown
---
name: my-task
description: TODO
mode: template
actions:
  add:
    description: TODO
    inputs: []
  delete:
    description: TODO
    inputs: []
  list:
    description: TODO
    inputs: []
---

# my-task

TODO: スキルの説明を書いてください。

## action:add

｀｀｀bash
echo "TODO: add"
｀｀｀

## action:delete

｀｀｀bash
echo "TODO: delete"
｀｀｀

## action:list

｀｀｀bash
echo "TODO: list"
｀｀｀
```

## TUI インターフェース

### スキル選択画面

アクション付きスキルは展開可能な項目として表示:

```
> task                    タスクを管理する          ▶
  deploy                  アプリをデプロイする
  code-review             コードレビューする
```

Enter で展開 / 折りたたみをトグル:

```
  task                    タスクを管理する          ▼
> task:add                タスクを追加する
  task:delete             タスクを削除する
  task:list               タスク一覧を表示する
  deploy                  アプリをデプロイする
  code-review             コードレビューする
```

展開状態でアクションを選択すると、そのアクションの inputs フォームに遷移。

### ファジー検索

- `task` → `task`, `task:add`, `task:delete`, `task:list` がマッチ
- `add` → `task:add` がマッチ
- `task:d` → `task:delete` がマッチ

検索ヒット時はアクション付きスキルを自動展開。

## Agent 互換性

### 動作原理

通常の Agent Skills（pi 等）は以下の手順でスキルを利用する:

1. `SKILL.md` を発見（name / description でマッチ）
2. フロントマターを解析（未知フィールドは無視）
3. **本文マークダウン全体を LLM コンテキストとして渡す**

アクション付き SKILL.md を Agent が読んだ場合:

- `actions` フィールド → **無視**（未知フィールド）
- `## action:add` → **通常の H2 見出し**として解釈
- コードブロック → **コマンドリファレンス**として解釈
- `{{title}}` → **「ここにタスク名が入る」と LLM が推論**

### 本文の書き方ガイドライン

Agent 互換性を高めるために:

1. **冒頭に概要を書く**: Agent が全体の文脈を把握できるようにする
2. **アクションセクションに説明文を含める**: コードブロックだけでなく、何をするかの自然言語説明
3. **変数名を意味のある名前にする**: `{{title}}` は Agent にも理解しやすい

```markdown
# タスク管理

共通スクリプト `common.sh` でタスクのCRUD操作を行う。

## action:add

新しいタスクを追加する。タスク名と優先度を指定する。

｀｀｀bash
{{__skill_dir__}}/common.sh add "{{title}}" --priority {{priority}}
｀｀｀

## action:delete

指定した ID のタスクを削除する。

｀｀｀bash
{{__skill_dir__}}/common.sh delete "{{id}}"
｀｀｀
```

## バリデーション

### パースエラー（終了コード: 3）

| 条件 | エラーメッセージ |
|------|----------------|
| `actions` 内のキーに対応する `## action:<name>` が本文にない | `Action "<name>" is defined in metadata but has no corresponding ## action:<name> section in body` |
| 本文に `## action:<name>` があるが `actions` に定義がない | `Section ## action:<name> exists in body but "<name>" is not defined in actions metadata` |
| template モードのアクションセクションにコードブロックがない | `Template action "<name>" requires at least one code block in ## action:<name> section` |
| `actions` のキーにコロンが含まれる | `action name must not contain ':'` |
| `actions` が空オブジェクト | `actions must not be empty` |

### 警告（実行は継続）

| 条件 | 警告メッセージ |
|------|----------------|
| `actions` と `inputs` が同時にスキルレベルで定義 | `Skill-level "inputs" is ignored when "actions" is defined` |

### 実行時エラー

| 条件 | 終了コード | エラーメッセージ |
|------|:----------:|----------------|
| `taskp run task:unknown`（存在しないアクション） | 2 | `Error: Action "unknown" not found in skill "task". Available actions: add, delete, list` |
| `taskp run task:add:extra`（コロン複数） | 2 | `Error: Invalid skill reference "task:add:extra": expected "skill" or "skill:action"` |

## 後方互換性

| ケース | 動作 |
|--------|------|
| `actions` なしのスキル | 完全に従来通り。変更なし |
| `actions` ありのスキルに `taskp run task` | アクション選択 UI を表示 |
| `actions` ありのスキルに `taskp run task:add` | 直接実行 |
| 既存の `mode`, `context`, `tools`, `timeout` | 単一スキルでは直接使用。アクション付きスキルではアクションのデフォルト値 |
| 既存の `inputs` | 単一スキルでは直接使用。アクション付きスキルでは無視（警告） |

## hooks との連携

フック（`config.toml` の `hooks.on_success` / `hooks.on_failure`）の環境変数に以下を追加:

| 変数名 | 型 | 説明 | 例 |
|--------|------|------|-----|
| `TASKP_SKILL_NAME` | `string` | スキル名 | `task` |
| `TASKP_ACTION_NAME` | `string` | アクション名（アクション実行時のみ、単一スキルは空文字） | `add` |
| `TASKP_SKILL_REF` | `string` | 完全参照（`skill` or `skill:action`） | `task:add` |

## ファイル構成

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/core/skill/skill.ts` | `Skill` 型, アクションセクションのバリデーション |
| `src/core/skill/skill-metadata.ts` | `skillMetadataSchema` に `actions` フィールド追加、バリデーション |
| `src/adapter/skill-loader.ts` | スキルファイルの読み込み |
| `src/usecase/run-skill.ts` | アクション選択フロー、セクション抽出、変数スコープ制御 |
| `src/usecase/run-agent-skill.ts` | agent モードのアクションセクション抽出 |
| `src/cli.ts` | skill 引数の `<skill>:<action>` パース、`--actions` オプション（init） |
| `src/tui/app.ts` | スキル一覧の展開/折りたたみ UI、ファジー検索対応 |
| `src/adapter/hook-executor.ts` | `TASKP_ACTION_NAME`, `TASKP_SKILL_REF` 環境変数追加 |

### 新規ファイル

| ファイル | 役割 |
|---------|------|
| `src/core/skill/action.ts` | `Action` 型定義、`actionSchema`、`resolveActionConfig`（継承解決）純粋関数 |
| `src/core/skill/action-section-parser.ts` | 本文から `## action:<name>` セクションを抽出するパーサー |

## テスト方針

### ユニットテスト

| 対象 | テスト内容 |
|------|-----------|
| `action.ts` | `resolveActionConfig`: 各フィールドの継承・フォールバック・デフォルト値 |
| `action-section-parser.ts` | セクション抽出、範囲特定、存在しないセクション、セクション外テキストの除外 |
| `skill-loader.ts` | `actions` のパース、バリデーションエラー、警告（`actions` + `inputs` 共存） |

### 統合テスト

| 対象 | テスト内容 |
|------|-----------|
| `run-skill.ts` | アクション選択 → inputs → セクション実行の一連のフロー |
| `run-skill.ts` | `--set` による変数直接指定 |
| `run-skill.ts` | template/agent 混在アクション |
| `run-skill.ts` | `--dry-run` でのアクション表示 |
| CLI | `task:add` パース、`task:add:extra` エラー、`task:unknown` エラー |
| hooks | `TASKP_ACTION_NAME`, `TASKP_SKILL_REF` の注入確認 |

### バリデーションテスト

| 対象 | テスト内容 |
|------|-----------|
| パースエラー | actions キーとセクションの不一致、空 actions、コロン含むキー |
| 警告 | `actions` + `inputs` 共存時の警告出力 |
| 後方互換 | `actions` なしスキルが従来通り動作すること |

## サンプル: タスク管理スキル（完全版）

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
      - name: confirm
        type: confirm
        message: "本当に削除しますか？"
  list:
    description: タスク一覧を表示する
---

# タスク管理

共通スクリプト `common.sh` でタスクのCRUD操作を行う。

## action:add

新しいタスクを追加する。

｀｀｀bash
{{__skill_dir__}}/common.sh add "{{title}}" --priority {{priority}}
｀｀｀

## action:delete

{{#if confirm}}
指定した ID のタスクを削除する。

｀｀｀bash
{{__skill_dir__}}/common.sh delete "{{id}}"
｀｀｀
{{else}}
削除をキャンセルしました。
{{/if}}

## action:list

現在のタスク一覧を表示する。

｀｀｀bash
{{__skill_dir__}}/common.sh list
｀｀｀
```

## サンプル: DB 操作スキル（template / agent 混在）

```markdown
---
name: db
description: データベースを管理する
mode: template
actions:
  migrate:
    description: マイグレーションを実行する
    inputs:
      - name: direction
        type: select
        message: "方向は？"
        choices: [up, down]
  seed:
    description: シードデータを投入する
    inputs:
      - name: confirm
        type: confirm
        message: "既存データを上書きします。よろしいですか？"
  diagnose:
    description: DB の問題を診断する
    mode: agent
    model: anthropic/claude-sonnet-4-20250514
    tools: [bash, read]
    inputs:
      - name: symptom
        type: text
        message: "症状を説明してください"
    context:
      - type: file
        path: "prisma/schema.prisma"
---

# データベース管理

Prisma を使用したデータベース操作。

## action:migrate

マイグレーションを実行する。

｀｀｀bash
npx prisma migrate {{direction}}
｀｀｀

## action:seed

{{#if confirm}}
シードデータを投入する。

｀｀｀bash
npx prisma db seed
｀｀｀
{{else}}
シード投入をキャンセルしました。
{{/if}}

## action:diagnose

以下の症状について、データベースの状態を調査し原因を特定してください:

**症状**: {{symptom}}

### 調査手順

1. マイグレーション状態を確認（`npx prisma migrate status`）
2. 接続テスト（`npx prisma db execute --stdin <<< "SELECT 1"`）
3. テーブル構造と最近の変更を確認
4. 原因の特定と修正案の提示
```

## 組み込みツール: `taskp_run`

agent モードの LLM がタスク処理中に別のスキル（またはアクション）を呼び出せるようにする組み込みツール。

### 動機

agent モードで複雑なタスクを処理中に、LLM が「この作業には別のスキルが適している」と判断した場合、
自律的に他のスキルを実行して結果を取得できると、スキル間の連携が自然になる。

```
taskp run diagnose (agent モード)
  │
  LLM: 「まず現在のタスク一覧を確認したい」
  │
  ├─ tool: taskp_run({ skill: "task:list" })
  │   └─ タスク一覧の結果が返る
  │
  LLM: 「問題を特定した。レポートを作成する」
```

### bash ツール経由との比較

現状でも LLM は `bash` ツールで `taskp run task:list --skip-prompt` を実行できる。
専用ツールのメリット:

| | bash 経由 | 専用 taskp_run ツール |
|---|---|---|
| スキル発見 | LLM がスキル名を知っている必要あり | ツール説明にスキル一覧を含められる |
| パフォーマンス | 別プロセス起動 | 同一プロセス内で実行 |
| inputs の受け渡し | `--set key=value` 文字列 | 構造化されたパラメータ |
| 結果の形式 | stdout/stderr テキスト | 構造化された実行結果 |
| エラーハンドリング | exit code のパース | 型付きエラー |

### ツール定義

```typescript
const taskpRunParams = z.object({
  skill: z.string().describe(
    "Skill reference to run. Format: '<skill>' or '<skill>:<action>'. " +
    "Examples: 'deploy', 'task:add', 'db:migrate'"
  ),
  set: z.record(z.string()).optional().describe(
    "Variables to pass to the skill inputs (skips interactive prompts). " +
    "Example: { \"title\": \"Buy groceries\", \"priority\": \"high\" }"
  ),
});

type TaskpRunInput = z.infer<typeof taskpRunParams>;

type TaskpRunResult = {
  readonly status: "success" | "failed";
  readonly output: string;
  readonly error?: string;
};

const taskpRunTool: Tool<TaskpRunInput, TaskpRunResult> = {
  description:
    "Run another taskp skill or action. " +
    "Use this to delegate subtasks to existing skills. " +
    "Only template-mode skills can be invoked (agent-mode skills cannot be nested).",
  inputSchema: zodToJsonSchema(taskpRunParams),
  execute: async ({ skill, set }) => {
    // runSkill を内部呼び出し（同一プロセス）
  },
};
```

### 制約

| 制約 | 理由 |
|------|------|
| **template モードのスキルのみ呼び出し可能** | agent モードのネスト（agent が agent を呼ぶ）は無限ループのリスクがあり、コスト制御も困難 |
| **`--skip-prompt` 相当で実行** | LLM からの呼び出しは非対話。`set` で変数を渡すか、デフォルト値を使用 |
| **inputs に `required: true` で `set` に値がない場合はエラー** | 対話プロンプトを出せないため |
| **再帰呼び出し禁止** | A → taskp_run(B) → taskp_run(A) のループを防止。呼び出し元スキル名をスタックで管理 |
| **最大ネスト深度: 3** | taskp_run 内で別の taskp_run を呼ぶケースの安全装置 |

### agent モードスキルの呼び出し制限

agent モードスキルの呼び出しを禁止する理由:

1. **コスト爆発**: 外側の agent が内側の agent を呼び、内側も taskp_run を呼ぶと制御不能
2. **コンテキスト喪失**: 内側の agent は外側の会話コンテキストを持たない
3. **タイムアウト管理**: agent モードは実行時間が予測不能

将来的に agent ネストが必要になった場合は、明示的なオプトイン（`allow_agent_nesting: true`）で対応を検討する。

### ツール説明への動的スキル一覧注入

LLM がどのスキルを呼べるかを知るために、ツールの `description` にスキル一覧を動的注入する:

```typescript
function buildTaskpRunDescription(skills: readonly Skill[]): string {
  const skillList = skills
    .map(s => {
      if (s.metadata.actions) {
        const actions = Object.entries(s.metadata.actions)
          .map(([name, a]) => `  - ${s.metadata.name}:${name}: ${a.description}`)
          .join("\n");
        return `- ${s.metadata.name}: ${s.metadata.description}\n${actions}`;
      }
      return `- ${s.metadata.name}: ${s.metadata.description}`;
    })
    .join("\n");

  return (
    "Run another taskp skill or action. " +
    "Only template-mode skills can be invoked.\n\n" +
    "Available skills:\n" +
    skillList
  );
}
```

LLM に渡される description の例:

```
Run another taskp skill or action. Only template-mode skills can be invoked.

Available skills:
- task: タスクを管理する
  - task:add: タスクを追加する
  - task:delete: タスクを削除する
  - task:list: タスク一覧を表示する
- deploy: アプリケーションをデプロイする
```

### TOOL_NAMES への追加

```typescript
const TOOL_NAMES = ["bash", "read", "write", "glob", "ask_user", "taskp_run"] as const;
```

デフォルトでは無効。スキルの `tools` フィールドで明示的に有効化する:

```yaml
tools:
  - bash
  - read
  - taskp_run    # ← 明示的に有効化
```

### 内部実装の概要

`taskp_run` ツールは既存の `runSkill` ユースケースを内部呼び出しする:

```typescript
execute: async ({ skill, set }) => {
  // 1. skill 文字列を name:action にパース
  const { name, action } = parseSkillRef(skill);

  // 2. 再帰チェック（呼び出しスタック）
  if (callStack.includes(name)) {
    return { status: "failed", output: "", error: `Recursive call detected: ${name}` };
  }

  // 3. スキル読み込み
  const findResult = await skillRepository.findByName(name);

  // 4. agent モードチェック
  const mode = action
    ? findResult.value.metadata.actions?.[action]?.mode ?? findResult.value.metadata.mode
    : findResult.value.metadata.mode;
  if (mode === "agent") {
    return { status: "failed", output: "", error: "Cannot invoke agent-mode skills from taskp_run" };
  }

  // 5. runSkill を呼び出し（skip-prompt、set で変数注入）
  const result = await runSkill(
    { name: skill, presets: set ?? {}, dryRun: false, force: false, noInput: true },
    deps,
  );

  // 6. 結果を構造化して返す
  if (!result.ok) {
    return { status: "failed", output: "", error: domainErrorMessage(result.error) };
  }
  const output = result.value.commands.map(c => c.result.stdout).join("\n");
  return { status: "success", output };
}
```

### hooks との連携

`taskp_run` で呼び出されたスキルも hooks を発火する。環境変数に呼び出し元情報を追加:

| 変数名 | 型 | 説明 | 例 |
|--------|------|------|-----|
| `TASKP_CALLER_SKILL` | `string` | 呼び出し元スキル名（taskp_run 経由の場合のみ、直接実行時は空文字） | `diagnose` |

### ファイル構成

| ファイル | 変更内容 |
|---------|---------|
| `src/core/execution/agent-tools.ts` | `taskp_run` ツール定義追加、`TOOL_NAMES` 更新 |
| `src/core/execution/agent-loop.ts` | ツール生成時にスキル一覧を渡して description を動的構築 |
| `src/usecase/run-agent-skill.ts` | `taskp_run` の deps（skillRepository 等）をツールに注入 |

### テスト方針

| 対象 | テスト内容 |
|------|-----------|
| `agent-tools.ts` | taskp_run のパラメータパース、template のみ制約、再帰検出 |
| `agent-tools.ts` | set による変数注入、required 入力の欠落エラー |
| `agent-tools.ts` | 動的 description 生成（スキル一覧、アクション展開） |
| 統合テスト | agent スキルから taskp_run で template スキルを呼び出し、結果を取得 |
| 統合テスト | agent モードスキルの呼び出し拒否 |
| 統合テスト | 再帰呼び出しの検出・ブロック |

### サンプル: 診断スキルからタスク管理を呼び出す

```yaml
---
name: diagnose
description: プロジェクトの問題を診断する
mode: agent
model: anthropic/claude-sonnet-4-20250514
tools:
  - bash
  - read
  - taskp_run
---

# プロジェクト診断

プロジェクトの現状を調査し、問題点を特定してください。

## 調査方法

1. `taskp_run` で `task:list` を呼び出し、未完了タスクを確認
2. `bash` でテスト実行（`bun test`）
3. `bash` で lint 実行（`bun run lint`）
4. 発見した問題をまとめてレポートする

必要に応じて他のスキルも活用してください。
```

## 将来の拡張候補

### アクション関連

- **アクション間の依存関係**: `depends: [migrate]` で前提アクションを自動実行
- **共通 inputs**: 全アクションで共通する入力を `shared_inputs` として定義
- **アクションのエイリアス**: `aliases: [a]` で短縮名を定義（`taskp run task:a`）
- **MCP サーバーモードでの公開**: `taskp_run_task_add` のようにアクション単位のツール公開

### taskp_run 関連

- **agent モードスキルのネスト**: `allow_agent_nesting: true` で明示的にオプトイン
- **外部 MCP サーバー連携**: `mcp:github`, `mcp:slack` のようなツール名で外部 MCP を呼び出し
- **実行結果のキャッシュ**: 同一スキル・同一引数の呼び出し結果を会話内でキャッシュ
- **コスト制御**: taskp_run 経由の LLM 呼び出し回数・トークン制限
