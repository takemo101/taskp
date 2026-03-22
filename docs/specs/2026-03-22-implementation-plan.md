# 実装計画

設計書: [スキルアクション設計](./2026-03-22-skill-actions-design.md)

## 変更の全体像

今回の変更は **3つの独立した機能** から構成される:

1. **`--provider` 廃止 → `provider/model` 統一** — 既存コードの簡素化
2. **スキルアクション機能** — 1スキルに複数アクションを持たせる
3. **`taskp_run` 組み込みツール** — agent モードから他スキルを呼び出す

依存関係:

```
1. provider/model 統一  ← 独立（先行実施）
2. スキルアクション      ← 独立（並行可能）
3. taskp_run ツール      ← 2 に依存（アクション対応の runSkill を利用）
```

---

## Phase 1: `--provider` 廃止 → `provider/model` 統一

既存の `--provider` オプションを削除し、`--model` の `provider/model` 形式に統一する。
`parseModelSpec` と `resolveModelSpec` は既に実装済みなので、CLI 層の変更が中心。

### Issue 1-1: CLI / TUI から `--provider` オプションを削除

**変更ファイル:**
- `src/cli.ts` — `run` コマンドの `provider` オプション削除、`tui` コマンドも同様
- `src/tui/app.ts` — `startTui` の引数から `provider` 削除

**変更内容:**
- `run` コマンドの options から `provider` を削除
- `runAgentMode` の `resolveModelSpec` 呼び出しから `cliProvider` を削除
- `tui` コマンドの options から `provider` を削除
- `startTui` の引数型から `provider` を削除

**テスト:**
- `tests/integration/cli.test.ts` — `--provider` 関連テストの削除/更新
- `tests/tui/app.test.ts` — provider 引数関連テストの削除/更新

**受け入れ条件:**
- `taskp run review --model anthropic/claude-sonnet-4-20250514` が動作する
- `taskp run review --provider anthropic` がエラーになる（未知オプション）
- `taskp tui --model anthropic/claude-sonnet-4-20250514` が動作する

### Issue 1-2: `ModelSource` 型から `cliProvider` を削除

**変更ファイル:**
- `src/adapter/ai-provider.ts` — `ModelSource.cliProvider` 削除、`resolveModelSpec` / `resolveWithProvider` 簡素化

**変更内容:**
- `ModelSource` から `cliProvider` フィールドを削除
- `resolveModelSpec` 内の `cliProvider` 参照を削除
- `resolveWithProvider` 内の `cliProvider` 参照を削除（`default_provider` のみフォールバック）

**テスト:**
- `tests/adapter/ai-provider.test.ts` — `cliProvider` 関連テストの削除/更新、`provider/model` 形式のテスト追加

**受け入れ条件:**
- `parseModelSpec("anthropic/claude-sonnet-4-20250514")` → `{ provider: "anthropic", model: "claude-sonnet-4-20250514" }`
- `parseModelSpec("claude-sonnet-4-20250514")` → `{ provider: "", model: "claude-sonnet-4-20250514" }` → `default_provider` で解決
- `cliProvider` を渡すコードが存在しないこと

---

## Phase 2: スキルアクション機能

### Issue 2-1: Action 型定義と Zod スキーマ

**新規ファイル:**
- `src/core/skill/action.ts`

**変更ファイル:**
- `src/core/skill/skill-metadata.ts` — `actions` フィールド追加
- `src/core/skill/index.ts` — re-export 追加

**実装内容:**
```typescript
// src/core/skill/action.ts
interface Action {
  readonly description: string;
  readonly mode?: "template" | "agent";
  readonly model?: string;
  readonly inputs?: readonly SkillInput[];
  readonly context?: readonly ContextSource[];
  readonly tools?: readonly string[];
  readonly timeout?: number;
}

function resolveActionConfig(action: Action, skill: SkillMetadata): ResolvedActionConfig
```

- `actionSchema` を Zod で定義
- `skillMetadataSchema` に `actions: z.record(z.string(), actionSchema).optional()` を追加
- `resolveActionConfig` 純粋関数: アクションの省略フィールドをスキルレベルから継承
- `actions` + `inputs` 共存時の警告ログ出力

**テスト:**
- `tests/core/skill/action.test.ts`（新規）
  - `resolveActionConfig` の継承テスト（mode, model, context, tools, timeout 各フィールド）
  - デフォルト値のフォールバック
  - inputs は継承しないことの確認
- `tests/core/skill/skill-metadata.test.ts`（更新）
  - `actions` 付きメタデータのパース成功
  - `actions` が空オブジェクトでエラー
  - アクション名にコロンを含む場合エラー

**受け入れ条件:**
- `actions` 付きフロントマターが正しくパースされる
- 各フィールドの継承が設計書通りに動作する
- バリデーションエラーが仕様通りに発生する

### Issue 2-2: アクションセクションパーサー

**新規ファイル:**
- `src/core/skill/action-section-parser.ts`

**実装内容:**
- マークダウン本文から `## action:<name>` セクションを抽出する関数
- remark AST を使用してセクション範囲を特定（既存の `skill-body.ts` と同じアプローチ）
- セクション内のコードブロック抽出（template モード用）
- セクション内のテキスト全体取得（agent モード用）

```typescript
type ActionSection = {
  readonly name: string;
  readonly content: string;           // セクション全体のテキスト
  readonly codeBlocks: readonly CodeBlock[];  // bash コードブロック
};

function parseActionSections(markdown: string): Result<readonly ActionSection[], ParseError>
function getActionSection(sections: readonly ActionSection[], name: string): ActionSection | undefined
```

**バリデーション:**
- `actions` キーに対応するセクションが本文にない → エラー
- 本文にセクションがあるが `actions` に定義がない → エラー
- template モードでコードブロックがない → エラー

**テスト:**
- `tests/core/skill/action-section-parser.test.ts`（新規）
  - 正常系: 複数アクションセクションの抽出
  - セクション範囲: 次の H2 まで / ファイル末尾まで
  - セクション外テキスト（冒頭の説明文）の除外
  - コードブロック抽出
  - バリデーションエラー各種

**受け入れ条件:**
- `## action:add` ... `## action:delete` が正しく分離される
- コードブロックがアクション単位で抽出される
- セクション不一致のバリデーションエラーが正しく発生する

### Issue 2-3: `SkillBody` のアクションセクション対応

**変更ファイル:**
- `src/core/skill/skill-body.ts` — アクション対応メソッド追加
- `src/core/skill/skill.ts` — `parseSkill` でアクションバリデーション追加

**実装内容:**
- `SkillBody` にアクションセクション関連のメソッドを追加:
  - `extractActionSection(name: string)` → セクション内容
  - `extractActionCodeBlocks(name: string, lang?: string)` → セクション内コードブロック
- `parseSkill` で `actions` 定義とセクションの整合性バリデーション

**テスト:**
- `tests/unit/skill/skill-body.test.ts`（更新）
- `tests/core/skill/skill.test.ts`（更新）
  - アクション付きスキルのパース
  - actions とセクションの不一致エラー

**受け入れ条件:**
- `skill.body.extractActionCodeBlocks("add", "bash")` で指定アクションのコードブロックが返る
- `actions` 定義とセクションの不一致がパース時にエラーになる

### Issue 2-4: `runSkill` のアクション対応（template モード）

**変更ファイル:**
- `src/usecase/run-skill.ts`

**実装内容:**
- `RunSkillInput` に `action?: string` を追加
- アクション指定時:
  - `resolveActionConfig` で実行設定を解決
  - アクションの `inputs` で質問を収集（スキルレベル `inputs` ではなく）
  - `extractActionCodeBlocks` で該当セクションのコードブロックのみ実行
- アクション未指定（`actions` ありスキル）の場合はエラー（CLI/TUI でアクション選択を強制）

**テスト:**
- `tests/usecase/run-skill.test.ts`（更新）
  - アクション指定での実行
  - アクション固有の inputs による変数収集
  - セクション内のコードブロックのみ実行される
  - 存在しないアクション指定でエラー
  - `--set` によるアクション変数の直接指定
  - `--dry-run` でのアクション表示

**受け入れ条件:**
- `runSkill({ name: "task", action: "add", ... })` でアクション add のセクションのみ実行される
- アクション固有の inputs で質問が行われる

### Issue 2-5: `runAgentSkill` のアクション対応（agent モード）

**変更ファイル:**
- `src/usecase/run-agent-skill.ts`

**実装内容:**
- `RunAgentSkillInput` に `action?: string` を追加
- アクション指定時:
  - `resolveActionConfig` で実行設定を解決（model, tools, context をアクションから取得）
  - アクションセクションの内容のみをプロンプトとして送信
  - アクション固有の `context` ソースを使用

**テスト:**
- `tests/usecase/run-agent-skill.test.ts`（更新）
  - アクション指定での agent 実行
  - アクション固有の model / tools / context の使用
  - セクション内容のみがプロンプトに渡される

**受け入れ条件:**
- agent モードのアクションがアクション固有の設定で実行される
- template/agent 混在スキルで各アクションが正しいモードで動作する

### Issue 2-6: CLI の `skill:action` パースとコマンド更新

**変更ファイル:**
- `src/cli.ts`

**実装内容:**
- `run` コマンド: skill 引数を `skill:action` 形式でパース
  - `parseSkillRef(ref: string): { name: string; action?: string }` ヘルパー関数
  - コロン複数 (`task:add:extra`) → エラー（終了コード 2）
  - アクション付きスキルでアクション未指定 → エラー（CLI ではアクション選択UIなし。TUI を使うよう案内）
- `list` コマンド: Actions カラムの追加表示
- `show` コマンド: `skill:action` 対応、アクション一覧 / アクション詳細表示
- `init` コマンド: `--actions add,delete,list` オプション追加

**テスト:**
- `tests/integration/cli.test.ts`（更新）
- `tests/e2e/run-command.test.ts`（更新）
  - `task:add` パース
  - `task:add:extra` エラー
  - `task:unknown` エラー
- `tests/integration/list-command.test.ts`（更新）
  - アクション付きスキルの表示
- `tests/e2e/init-command.test.ts`（更新）
  - `--actions` オプションでの雛形生成

**受け入れ条件:**
- `taskp run task:add` が正しくパースされて実行される
- `taskp list` でアクション一覧が表示される
- `taskp show task` でアクション一覧、`taskp show task:add` でアクション詳細が表示される
- `taskp init my-task --actions add,delete,list` で雛形が生成される

### Issue 2-7: TUI のアクション対応

**変更ファイル:**
- `src/tui/screens/skill-selector.ts` — 展開/折りたたみUI
- `src/tui/components/fuzzy-select.ts` — アクション付きスキルの検索対応
- `src/tui/screens/input-form.ts` — アクション固有 inputs への対応
- `src/tui/screens/execution-runner.ts` — アクション実行への対応
- `src/tui/app.ts` — アクション選択フロー統合

**実装内容:**
- スキル選択画面: アクション付きスキルに ▶/▼ 展開インジケータ
- Enter で展開 → アクション一覧表示 → アクション選択
- ファジー検索: `task` → スキル＋全アクション、`add` → `task:add`
- 選択後はアクション固有の inputs フォームに遷移

**テスト:**
- `tests/tui/app.test.ts`（更新）
- `tests/tui/screens/skill-selector.test.ts`（新規 or 更新）
- `tests/tui/components/fuzzy-select.test.ts`（更新）

**受け入れ条件:**
- アクション付きスキルが展開/折りたたみ可能
- アクション選択後、正しい inputs フォームが表示される
- ファジー検索でアクション名でもヒットする

### Issue 2-8: hooks のアクション対応

**変更ファイル:**
- `src/adapter/hook-executor.ts` — 環境変数追加
- `src/usecase/hook-runner.ts` — `HookContext` にアクション情報追加

**実装内容:**
- `HookContext` に `actionName?: string` を追加
- 環境変数 `TASKP_ACTION_NAME`、`TASKP_SKILL_REF` を注入

**テスト:**
- `tests/adapter/hook-executor.test.ts`（更新）
- `tests/usecase/hook-runner.test.ts`（更新）
  - アクション実行時の環境変数注入確認
  - 単一スキル実行時に `TASKP_ACTION_NAME` が空文字

**受け入れ条件:**
- `TASKP_ACTION_NAME=add` `TASKP_SKILL_REF=task:add` がフックに渡される
- 単一スキルでは `TASKP_ACTION_NAME` が空文字

---

## Phase 3: `taskp_run` 組み込みツール

### Issue 3-1: `taskp_run` ツール定義と基本実装

**変更ファイル:**
- `src/core/execution/agent-tools.ts` — `taskp_run` ツール追加、`TOOL_NAMES` 更新

**実装内容:**
- `taskpRunParams` Zod スキーマ（`skill: string`, `set: Record<string, string>`）
- `taskpRunTool` 実装:
  - skill 引数を `parseSkillRef` でパース
  - agent モードスキルの呼び出しを拒否
  - 再帰呼び出し検出（呼び出しスタック管理）
  - 最大ネスト深度 3 の制限
  - `runSkill` を `noInput: true` で内部呼び出し
- `buildTools` を拡張: `taskp_run` の場合は deps（`skillRepository` 等）が必要なため、ファクトリパターンに変更

**テスト:**
- `tests/core/execution/agent-tools.test.ts`（更新）
  - パラメータパース（`task:add`, `task`）
  - template スキルの呼び出し成功
  - agent モードスキルの呼び出し拒否
  - 再帰呼び出し検出
  - ネスト深度超過エラー
  - `set` による変数注入
  - required 入力の欠落エラー

**受け入れ条件:**
- `taskp_run({ skill: "task:list" })` で template スキルが実行される
- agent モードスキルの呼び出しが拒否される
- 再帰呼び出しが検出・ブロックされる

### Issue 3-2: 動的スキル一覧の description 注入

**変更ファイル:**
- `src/core/execution/agent-tools.ts` — `buildTaskpRunDescription` 関数
- `src/core/execution/agent-loop.ts` — ツール生成時にスキル一覧を渡す
- `src/usecase/run-agent-skill.ts` — `skillRepository` をツール生成に渡す

**実装内容:**
- `buildTaskpRunDescription(skills)`: スキル一覧（アクション展開含む）を description 文字列に変換
- `buildTools` 呼び出し時に利用可能スキル一覧を渡す
- agent モードスキル自身は一覧から除外（template のみ表示）

**テスト:**
- `tests/core/execution/agent-tools.test.ts`（更新）
  - スキル一覧の description 生成
  - アクション付きスキルの展開表示
  - agent モードスキルの除外

**受け入れ条件:**
- LLM に渡される `taskp_run` の description に利用可能スキル一覧が含まれる
- アクション付きスキルはアクションごとに展開表示される

### Issue 3-3: hooks の `TASKP_CALLER_SKILL` 対応

**変更ファイル:**
- `src/adapter/hook-executor.ts`
- `src/usecase/hook-runner.ts`

**実装内容:**
- `HookContext` に `callerSkill?: string` を追加
- `taskp_run` 経由の実行時に呼び出し元スキル名を `TASKP_CALLER_SKILL` として注入

**テスト:**
- `tests/adapter/hook-executor.test.ts`（更新）
- `tests/usecase/hook-runner.test.ts`（更新）

**受け入れ条件:**
- `taskp_run` 経由で呼ばれたスキルのフックに `TASKP_CALLER_SKILL=diagnose` が渡される
- 直接実行時は `TASKP_CALLER_SKILL` が空文字

---

## 実装順序

```
Phase 1（provider/model 統一）
  1-1  CLI/TUI から --provider 削除
  1-2  ModelSource から cliProvider 削除
    ↓
Phase 2（スキルアクション）
  2-1  Action 型定義と Zod スキーマ
  2-2  アクションセクションパーサー
    ↓ （2-1, 2-2 は並行可能）
  2-3  SkillBody のアクションセクション対応     ← 2-2 に依存
  2-4  runSkill のアクション対応               ← 2-1, 2-3 に依存
  2-5  runAgentSkill のアクション対応           ← 2-1, 2-3 に依存
    ↓ （2-4, 2-5 は並行可能）
  2-6  CLI の skill:action パースとコマンド更新  ← 2-4, 2-5 に依存
  2-7  TUI のアクション対応                    ← 2-4, 2-5 に依存
  2-8  hooks のアクション対応                   ← 2-4 に依存
    ↓
Phase 3（taskp_run ツール）
  3-1  taskp_run ツール定義と基本実装            ← 2-4 に依存
  3-2  動的スキル一覧の description 注入         ← 3-1 に依存
  3-3  hooks の TASKP_CALLER_SKILL 対応         ← 3-1, 2-8 に依存
```

## Issue 一覧（ラベル付き）

| # | Issue | Phase | 依存 | 見積 |
|---|-------|-------|------|------|
| 1-1 | CLI/TUI から `--provider` 削除 | 1 | なし | S |
| 1-2 | `ModelSource` から `cliProvider` 削除 | 1 | 1-1 | S |
| 2-1 | Action 型定義と Zod スキーマ | 2 | なし | M |
| 2-2 | アクションセクションパーサー | 2 | なし | M |
| 2-3 | `SkillBody` のアクションセクション対応 | 2 | 2-2 | S |
| 2-4 | `runSkill` のアクション対応 | 2 | 2-1, 2-3 | L |
| 2-5 | `runAgentSkill` のアクション対応 | 2 | 2-1, 2-3 | M |
| 2-6 | CLI の `skill:action` パースとコマンド更新 | 2 | 2-4, 2-5 | L |
| 2-7 | TUI のアクション対応 | 2 | 2-4, 2-5 | L |
| 2-8 | hooks のアクション対応 | 2 | 2-4 | S |
| 3-1 | `taskp_run` ツール定義と基本実装 | 3 | 2-4 | L |
| 3-2 | 動的スキル一覧の description 注入 | 3 | 3-1 | M |
| 3-3 | hooks の `TASKP_CALLER_SKILL` 対応 | 3 | 3-1, 2-8 | S |

見積: S=1-2h, M=2-4h, L=4-8h
