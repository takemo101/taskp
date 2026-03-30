# スキル単位フック設計（フロントマター方式）

## 概要

SKILL.md のフロントマターに `hooks` フィールドを追加し、スキル/アクション単位で実行前後のフックコマンドを定義可能にする。
加えて、スキルの実行結果（AI 出力・コマンド stdout）をフックや後続スキルに受け渡すための **出力フォワーディング機構** を導入する。

## 動機

### 現状の問題

現在の `config.toml` グローバル hooks は全スキル一律適用のため：

- deploy だけ `git stash` / `git stash pop` したい → `$TASKP_SKILL_NAME` で `case` 分岐が必要
- DB migrate の前にバックアップ → グローバルだと全スキルでバックアップが走る
- agent モードの出力結果を後続処理（通知、ログ保存、次スキルへの入力）に使いたい → 渡す手段がない

### 解決方針

1. **SKILL.md フロントマター** にスキル固有 hooks を定義（Single Source of Truth）
2. 既存の **アクション継承モデル** にそのまま乗せる（`action.hooks ?? skill.hooks`）
3. **出力ファイル方式** でスキル結果をフックに受け渡す

## 設計方針

- **フロントマター方式**: スキルの振る舞いはスキルファイルに集約（`mode`, `tools`, `timeout` と同列）
- **既存パターンの踏襲**: 継承モデル、Zod スキーマ、Result 型、HookExecutorPort
- **グローバル hooks との共存**: スキル hooks → グローバル hooks の順で実行、責務を分離
- **before は blocking**: 失敗 = 前提条件未達 → スキル実行を中断
- **after は non-blocking**: 失敗 = 警告のみ（既存グローバル hooks と同じ）
- **出力フォワーディングはファイル経由**: 環境変数のサイズ制限を回避

## フロントマター仕様

### `hooks` フィールド

```yaml
---
name: deploy
description: アプリケーションをデプロイする
mode: template
hooks:
  before:
    - "git stash --include-untracked"
  after:
    - "git stash pop"
  on_failure:
    - "echo 'deploy failed: $TASKP_ERROR'"
inputs:
  - name: environment
    type: select
    message: "デプロイ先は？"
    choices: [staging, production]
---
```

### フィールド定義

| フィールド | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `hooks` | `SkillHooks` | 省略可 | スキル固有ライフサイクルフック |
| `hooks.before` | `string[]` | `[]` | スキル実行前に実行するコマンド群 |
| `hooks.after` | `string[]` | `[]` | スキル実行後に常に実行するコマンド群（成功・失敗問わず） |
| `hooks.on_failure` | `string[]` | `[]` | スキル失敗時のみ追加で実行するコマンド群 |

### アクション単位の定義

```yaml
---
name: db
description: データベースを管理する
hooks:
  after:
    - "echo 'DB operation done: $TASKP_SKILL_REF'"
actions:
  migrate:
    description: マイグレーション実行
    hooks:
      before:
        - "pg_dump $DATABASE_URL > /tmp/backup_$TASKP_SKILL_REF.sql"
      on_failure:
        - "psql $DATABASE_URL < /tmp/backup_$TASKP_SKILL_REF.sql"
  seed:
    description: シードデータ投入
    # hooks 未指定 → skill.hooks を継承
---
```

### 継承ルール

```
action.hooks ?? skill.hooks ?? undefined（フックなし）
```

既存の `mode`, `tools`, `context` 等と同じ `??`（nullish coalescing）パターン。

`hooks` は **オブジェクト単位の置き換え**。アクションが `hooks` を定義した場合、スキルレベルの `hooks` は完全に無視される（フィールド単位マージはしない）。

理由:
- フィールド単位マージ（`action.hooks.before ?? skill.hooks.before`）は「アクションの before だけ上書きして after はスキルから継承」という暗黙の挙動を生み、混乱の原因になる
- 「このアクションのフックをすべて自分で管理する」という明示的な意図表明になる
- `tools`, `context` 等も同じオブジェクト単位置き換えを採用している

## 出力フォワーディング

### 方式: 一時ファイル + 環境変数パス

スキルの実行結果を一時ファイルに書き出し、そのパスを環境変数 `TASKP_OUTPUT_FILE` でフックに渡す。

```
TASKP_OUTPUT_FILE=/tmp/taskp/<session_id>/output.txt
```

### なぜ環境変数直接ではないか

| 方式 | サイズ制限 | バイナリ安全性 | 実装コスト |
|------|-----------|--------------|-----------|
| 環境変数 `TASKP_OUTPUT` | macOS ~256KB, Linux ~2MB | ❌ 改行・特殊文字でシェル破壊 | 低 |
| 一時ファイル `TASKP_OUTPUT_FILE` | 制限なし | ✅ | 中 |
| 両方 | — | — | 高（二重管理） |

AI の出力は数千〜数万文字になりうるため、**一時ファイル方式のみ採用**。

### 出力ファイルの内容

#### template モード

```
<最後に実行されたコマンドの stdout>
```

全コマンドの stdout を改行区切りで連結。stderr は含めない（エラー情報は `TASKP_ERROR` で提供済み）。

#### agent モード

```
<LLM の最終テキスト出力>
```

`AgentExecutorResult.output` をそのまま書き出す。

### ファイルライフサイクル

```
1. スキル実行開始前: ディレクトリ /tmp/taskp/<session_id>/ を作成
2. before hooks 実行: TASKP_OUTPUT_FILE は空ファイルとして存在（パスは環境変数で参照可能）
3. スキル本体実行完了: 結果を TASKP_OUTPUT_FILE に書き込み
4. after / on_failure hooks 実行: TASKP_OUTPUT_FILE を読み取り可能
5. グローバル hooks 実行: 同じ TASKP_OUTPUT_FILE を参照可能
6. 全フック完了後: ファイルを削除（クリーンアップ）
```

### フック内での利用例

```bash
# after hook: AI 出力を Slack に通知
curl -X POST https://slack.example.com/webhook \
  -d "{\"text\": \"$(cat $TASKP_OUTPUT_FILE | head -100)\"}"

# after hook: 出力をログに保存
cp "$TASKP_OUTPUT_FILE" "logs/${TASKP_SKILL_REF}_$(date +%Y%m%d_%H%M%S).txt"

# after hook: 出力を次のスキルの入力として利用
taskp run summarize --set content="$(cat $TASKP_OUTPUT_FILE)"
```

## `taskp_run` との連携

### 子スキルの hooks

`taskp_run` 経由で実行された子スキルも **自身のスキルフックを発火する**（既存のグローバル hooks と同じ挙動）。

### 出力ファイルの共有

親スキルと子スキルは同一の出力ファイル（`/tmp/taskp/<session_id>/output.txt`）を使用する。子スキル実行中は子スキルの出力で上書きされ、子スキル完了後に親の出力で再度上書きされる。

子スキルの出力は `taskp_run` ツールの戻り値として LLM に返される（既存の `buildTaskpRunOutput` の挙動）。親スキルの `TASKP_OUTPUT_FILE` には最終的に親スキル自身の出力のみが書き込まれる。

## 環境変数一覧

既存の環境変数に加え、以下を追加:

| 変数名 | 型 | フェーズ | 説明 |
|--------|------|---------|------|
| `TASKP_OUTPUT_FILE` | `string` | before / after / on_failure | 出力ファイルの絶対パス |
| `TASKP_SESSION_ID` | `string` | before / after / on_failure | セッション ID（`tskp_xxxxx` 形式） |
| `TASKP_HOOK_PHASE` | `string` | before / after / on_failure | 現在のフックフェーズ（`before` / `after` / `on_failure`） |

### フェーズ別の環境変数状態

| 環境変数 | `before` | `after`（成功） | `after`（失敗） | `on_failure` |
|---------|----------|----------------|----------------|-------------|
| `TASKP_STATUS` | *(未設定)* | `success` | `failed` | `failed` |
| `TASKP_OUTPUT_FILE` | 空ファイル | 出力あり | 出力あり/空 | 出力あり/空 |
| `TASKP_DURATION_MS` | *(未設定)* | 実測値 | 実測値 | 実測値 |
| `TASKP_ERROR` | *(未設定)* | 空文字 | エラー | エラー |
| `TASKP_HOOK_PHASE` | `before` | `after` | `after` | `on_failure` |

`before` フェーズでは `TASKP_STATUS`, `TASKP_DURATION_MS`, `TASKP_ERROR` は環境変数に設定されない（`BeforeHookContext` にこれらのフィールドが存在しないため）。これは Parse, Don't Validate の原則に基づく — 存在しない値にダミーを入れるのではなく、型レベルで不在を表現する。

### 入力変数の注入（将来拡張）

> **Phase 2 で追加予定**: `TASKP_INPUT_<NAME>` 形式の環境変数で入力変数をフックに渡す機能は、具体的なユースケースが 3 つ以上確認されてから実装する（YAGNI）。現時点では `TASKP_SKILL_REF` による分岐で代替可能。

## 実行順序

```
taskp run deploy
  │
  ├─ スキル読み込み・フロントマター解析
  │
  ├─ inputs 収集（インタラクティブ質問）
  │
  ├─ 出力ファイル準備（/tmp/taskp/<session_id>/output.txt を空作成）
  │
  ├─ ① skill hooks.before 実行
  │   ├─ 環境変数: TASKP_HOOK_PHASE=before, TASKP_OUTPUT_FILE=...（STATUS/DURATION 未設定）
  │   ├─ 順次実行、いずれかが失敗 → スキル実行を中断（エラー返却）
  │   └─ 全成功 → 続行
  │
  ├─ ② スキル本体を実行（template or agent）
  │   └─ 実行結果を出力ファイルに書き込み
  │
  ├─ ③ skill hooks.after 実行（常に）
  │   ├─ 環境変数: TASKP_STATUS=success/failed, TASKP_OUTPUT_FILE=..., TASKP_HOOK_PHASE=after
  │   └─ 失敗しても警告のみ
  │
  ├─ ④ skill hooks.on_failure 実行（失敗時のみ）
  │   ├─ 環境変数: TASKP_STATUS=failed, TASKP_ERROR=..., TASKP_HOOK_PHASE=on_failure
  │   └─ 失敗しても警告のみ
  │
  ├─ ⑤ global hooks.on_success / on_failure 実行（config.toml）
  │   ├─ 同じ TASKP_OUTPUT_FILE を参照可能
  │   └─ 失敗しても警告のみ（既存挙動）
  │
  ├─ 出力ファイルのクリーンアップ
  │
  └─ 元の実行結果を返す
```

### before 失敗時のフロー

```
  ├─ ① skill hooks.before 実行
  │   └─ コマンド失敗
  │
  ├─ ② スキル本体: 【スキップ】
  │
  ├─ ③ skill hooks.after 実行（常に実行）
  │   └─ TASKP_STATUS=failed, TASKP_ERROR="Hook before failed: ..."
  │
  ├─ ④ skill hooks.on_failure 実行
  │
  ├─ ⑤ global hooks.on_failure 実行
  │
  └─ エラーを返す
```

`after` は **before 失敗時も実行される**。これにより「before で確保したリソースを after で解放」のペアが安全に組める。

## 型定義

### Zod スキーマ

```typescript
// src/core/skill/skill-metadata.ts に追加

const skillHooksSchema = z.object({
  before: z.array(z.string().min(1)).optional()
    .describe("Commands to run before skill execution"),
  after: z.array(z.string().min(1)).optional()
    .describe("Commands to run after skill execution (always, regardless of success/failure)"),
  on_failure: z.array(z.string().min(1)).optional()
    .describe("Commands to run only on skill failure (after 'after' hooks)"),
});

type SkillHooks = z.infer<typeof skillHooksSchema>;
```

### skillMetadataSchema 変更

```typescript
const skillMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  mode: skillModeSchema.default("template"),
  inputs: z.array(skillInputSchema).default([]),
  model: z.string().min(1).optional(),
  timeout: z.number().int().positive().max(3_600_000).optional(),
  tools: z.array(z.string().min(1)).default([...DEFAULT_TOOLS]),
  context: z.array(contextSourceSchema).default([]),
  actions: z.record(z.string(), actionSchema).optional(),
  hooks: skillHooksSchema.optional(),     // ← 追加
});
```

### actionSchema 変更

```typescript
const actionSchema = z.object({
  description: z.string().min(1),
  mode: skillModeSchema.optional(),
  model: z.string().min(1).optional(),
  inputs: z.array(skillInputSchema).optional(),
  context: z.array(contextSourceSchema).optional(),
  tools: z.array(z.string().min(1)).optional(),
  timeout: z.number().int().positive().max(3_600_000).optional(),
  hooks: skillHooksSchema.optional(),     // ← 追加
});
```

### HookContext 拡張

既存の `HookContext`（グローバル hooks 用）はそのまま維持する。スキル hooks 用には `SkillHookContext` を新設し、`before` 用と `after` 用で型を分離する。

```typescript
// src/usecase/port/hook-executor.ts

/** before フック用コンテキスト（実行前なので status / durationMs / error を持たない） */
export type BeforeHookContext = {
  readonly skillName: string;
  readonly actionName?: string;
  readonly mode: "template" | "agent";
  readonly outputFile: string;
  readonly callerSkill?: string;
};

/** after / on_failure フック用コンテキスト */
export type AfterHookContext = {
  readonly skillName: string;
  readonly actionName?: string;
  readonly mode: "template" | "agent";
  readonly status: "success" | "failed";
  readonly durationMs: number;
  readonly error?: string;
  readonly outputFile: string;
  readonly callerSkill?: string;
};
```

**設計根拠（Parse, Don't Validate）**: `before` フェーズでは `status` や `durationMs` は存在しない。`"pending"` のようなダミー値を入れるのではなく、型で「before には status がない」ことを表現する。これにより既存の `HookContext.status` が `"success" | "failed"` のままで済み、グローバル `runHooks` への影響がない。

### ResolvedActionConfig 拡張

```typescript
// src/core/skill/action.ts

type ResolvedActionConfig = {
  readonly description: string;
  readonly mode: "template" | "agent";
  readonly model: string | undefined;
  readonly inputs: readonly SkillInput[];
  readonly context: readonly ContextSource[];
  readonly tools: readonly string[];
  readonly timeout: number | undefined;
  readonly hooks: SkillHooks | undefined;  // ← 追加
};

function resolveActionConfig(action: Action, skill: SkillMetadata): ResolvedActionConfig {
  return {
    // ... 既存フィールド
    hooks: action.hooks ?? skill.hooks ?? undefined,
  };
}
```

### OutputFileStore ポート

```typescript
// src/usecase/port/output-file-store.ts（新規）

export type OutputFileStorePort = {
  /** セッション用ディレクトリと空の出力ファイルを作成。パスを返す */
  readonly prepare: (sessionId: string) => Promise<string>;
  /** 出力内容をファイルに書き込み */
  readonly write: (filePath: string, content: string) => Promise<void>;
  /** セッション用ディレクトリごとクリーンアップ */
  readonly cleanup: (sessionId: string) => Promise<void>;
};
```

## hook-runner の拡張

### 現在の `runHooks` に加え、スキル hooks 用関数を追加

```typescript
// src/usecase/skill-hook-runner.ts（新規）

type RunBeforeHooksParams = {
  readonly hookExecutor?: HookExecutorPort;
  readonly hooks?: SkillHooks;
  readonly context: BeforeHookContext;
};

type RunAfterHooksParams = {
  readonly hookExecutor?: HookExecutorPort;
  readonly hooks?: SkillHooks;
  readonly context: AfterHookContext;
};

/**
 * before フックを実行。1つでも失敗したらスキル実行を中断する。
 * 呼び出し元が中断判断を行うため Result を返す（Error 分類）。
 */
async function runBeforeHooks(params: RunBeforeHooksParams): Promise<Result<void, ExecutionError>>

/**
 * after フックを実行。失敗は内部で警告ログに出力し、呼び出し元に判断を委ねない。
 * Tell, Don't Ask: 「after が失敗したらどうするか」は after 自身が知っている（= 警告のみ）。
 */
async function runAfterHooks(params: RunAfterHooksParams): Promise<void>

/**
 * on_failure フックを実行。失敗は内部で警告ログに出力する。
 */
async function runOnFailureHooks(params: RunAfterHooksParams): Promise<void>
```

`runHooks`（既存のグローバル hooks 用）はそのまま維持。

**設計根拠（Tell, Don't Ask + Error 分類）**: `before` の失敗は呼び出し元が対処すべき Error（スキル実行を中断）。`after` / `on_failure` の失敗は内部で処理する（警告ログ）。戻り値の型でこの責務の違いを表現する。

## run-skill.ts の変更（template モード）

```typescript
async function executeAndReport(...): Promise<Result<RunOutput, DomainError>> {
  const hooks = resolveHooks(skill, input.action);
  const outputFile = await outputFileStore.prepare(sessionId);

  const beforeContext: BeforeHookContext = {
    skillName: skill.metadata.name, actionName: input.action,
    mode: "template", outputFile, callerSkill: input.callerSkill,
  };

  // ① before hooks（Result を返す — 呼び出し元が中断判断）
  const beforeResult = await runBeforeHooks({ hookExecutor, hooks, context: beforeContext });
  if (!beforeResult.ok) {
    const afterContext: AfterHookContext = {
      ...beforeContext, status: "failed", durationMs: 0,
      error: domainErrorMessage(beforeResult.error),
    };
    // before 失敗 → after は実行（リソース解放）、本体はスキップ
    await runAfterHooks({ hookExecutor, hooks, context: afterContext });    // void — 内部で警告
    await runOnFailureHooks({ hookExecutor, hooks, context: afterContext }); // void — 内部で警告
    await runHooks({ ... }); // グローバル on_failure
    return beforeResult;
  }

  // ② スキル本体実行
  const startTime = Date.now();
  const commandResults = await executeCommands(...);
  const durationMs = Date.now() - startTime;

  // 出力をファイルに書き込み
  const outputContent = buildTemplateOutput(commandResults);
  await outputFileStore.write(outputFile, outputContent);

  const afterContext: AfterHookContext = {
    ...beforeContext,
    status: commandResults.ok ? "success" : "failed",
    durationMs,
    error: commandResults.ok ? undefined : domainErrorMessage(commandResults.error),
  };

  // ③ after hooks（常に — void を返す、内部で警告処理）
  await runAfterHooks({ hookExecutor, hooks, context: afterContext });

  // ④ on_failure hooks（失敗時のみ）
  if (!commandResults.ok) {
    await runOnFailureHooks({ hookExecutor, hooks, context: afterContext });
  }

  // ⑤ グローバル hooks
  await runHooks({ ... });

  // クリーンアップ
  await outputFileStore.cleanup(sessionId);

  return commandResults;
}
```

## run-agent-skill.ts の変更（agent モード）

template モードと同じパターン。出力ファイルの内容が `AgentExecutorResult.output` になる点だけ異なる。

## adapter/hook-executor.ts の変更

`buildEnvVars` を `BeforeHookContext` / `AfterHookContext` に対応させる。共通フィールド（`skillName`, `actionName`, `mode`, `outputFile`, `callerSkill`）は共通の `buildBaseEnvVars` で構築し、`AfterHookContext` 固有のフィールド（`status`, `durationMs`, `error`）を追加する。

```typescript
function buildBaseEnvVars(context: BeforeHookContext | AfterHookContext): Record<string, string> {
  return {
    TASKP_SKILL_NAME: context.skillName,
    TASKP_ACTION_NAME: context.actionName ?? "",
    TASKP_SKILL_REF: buildSkillRef(context.skillName, context.actionName),
    TASKP_MODE: context.mode,
    TASKP_OUTPUT_FILE: context.outputFile,
    TASKP_CALLER_SKILL: context.callerSkill ?? "",
  };
}

// AfterHookContext 用（status, durationMs, error を追加）
function buildAfterEnvVars(context: AfterHookContext): Record<string, string> {
  return {
    ...buildBaseEnvVars(context),
    TASKP_STATUS: context.status,
    TASKP_DURATION_MS: String(context.durationMs),
    TASKP_ERROR: (context.error ?? "").slice(0, MAX_ERROR_LENGTH),
  };
}
```

## グローバル hooks との関係

| 観点 | スキル hooks | グローバル hooks |
|------|-------------|-----------------|
| 定義場所 | SKILL.md フロントマター | config.toml `[hooks]` |
| 適用範囲 | 該当スキル/アクションのみ | 全スキル一律 |
| トリガー | `before` / `after` / `on_failure` | `on_success` / `on_failure` |
| 実行順序 | **先** | **後** |
| 出力ファイル | `TASKP_OUTPUT_FILE` 参照可能 | 同じ `TASKP_OUTPUT_FILE` を参照可能 |
| 失敗時の挙動 | before: blocking / after, on_failure: warning | warning のみ（既存挙動） |

### マージしない理由

スキル hooks とグローバル hooks は **マージせず独立実行** する。

- グローバルは「横断的関心事」（通知、ログ）
- スキルは「スキル固有の前提・後処理」（バックアップ、リソース管理）
- 異なる責務を持つフックをマージすると意図の把握が困難になる

## Agent 互換性

外部 Agent（pi 等）はフロントマターの未知フィールドを無視するため、`hooks` フィールドの追加は **Agent の動作に影響しない**。`actions` フィールドと同じ扱い。

## ファイル構成

### 新規ファイル

| ファイル | レイヤー | 役割 |
|---------|---------|------|
| `src/usecase/skill-hook-runner.ts` | UseCase | `runBeforeHooks`, `runAfterHooks`, `runOnFailureHooks` |
| `src/usecase/port/output-file-store.ts` | UseCase (port) | `OutputFileStorePort` インターフェース |
| `src/adapter/output-file-store.ts` | Adapter | `OutputFileStorePort` の実装（/tmp/taskp/ 管理） |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/core/skill/skill-metadata.ts` | `skillHooksSchema` 追加、`SkillHooks` 型エクスポート、`hooks: skillHooksSchema.optional()` 追加 |
| `src/core/skill/action.ts` | `actionSchema` に `hooks` 追加、`resolveActionConfig` に `hooks` 継承追加 |
| `src/usecase/port/hook-executor.ts` | `BeforeHookContext`, `AfterHookContext` 型追加 |
| `src/adapter/hook-executor.ts` | `buildBaseEnvVars`, `buildAfterEnvVars` 追加 |
| `src/usecase/run-skill.ts` | before/after/on_failure フック呼び出し、出力ファイル管理 |
| `src/usecase/run-agent-skill.ts` | 同上 |
| `src/cli.ts` | `OutputFileStore` 生成、deps に注入 |
| `src/tui/app.ts` | 同上 |

**`skill-hooks.ts` を独立ファイルにしない理由**: `skillHooksSchema` は `skillMetadataSchema` からのみ参照される Zod スキーマ定義 1 つ。`hooksConfigSchema` が `config-loader.ts` に同居している前例に合わせ、`skill-metadata.ts` に配置する。将来 `SkillHooks` を他モジュールから直接参照する必要が出た場合に分離する。

## テスト方針

### ユニットテスト

| 対象 | テスト内容 |
|------|-----------|
| `skill-metadata.ts` | `skillHooksSchema` のパース・バリデーション、`hooks` 付きメタデータのパース、`hooks` なしの後方互換 |
| `action.ts` | `hooks` の継承（action.hooks ?? skill.hooks）、オブジェクト単位置き換えの確認 |
| `hook-executor.ts` | `BeforeHookContext` / `AfterHookContext` の環境変数構築、`before` で STATUS/DURATION が未設定であること |
| `skill-hook-runner.ts` | before: 成功→Result ok、失敗→Result err。after: 失敗しても void（警告ログ確認）。on_failure: 呼び出し条件 |

### ユースケーステスト

| 対象 | テスト内容 |
|------|-----------|
| `run-skill.ts` | ① before → 本体 → after の順序、② before 失敗でスキップ＆after 実行、③ on_failure の条件、④ グローバル hooks との共存 |
| `run-agent-skill.ts` | 同上（agent モード） |
| `run-skill.ts` | 出力ファイルに template stdout が書き込まれる |
| `run-agent-skill.ts` | 出力ファイルに AI 出力テキストが書き込まれる |
| `run-skill.ts` | `taskp_run` 経由の子スキルが自身のフックを発火する |

### Adapter テスト

| 対象 | テスト内容 |
|------|-----------|
| `output-file-store.ts` | prepare → write → cleanup のライフサイクル、ディレクトリ作成、ファイル書き込み |

## サンプル

### deploy スキル（before/after ペア）

```yaml
---
name: deploy
description: アプリケーションをデプロイする
mode: template
hooks:
  before:
    - "git stash --include-untracked"
    - "echo 'Starting $TASKP_SKILL_REF'"
  after:
    - "git stash pop || true"
  on_failure:
    - "curl -X POST https://slack.example.com/webhook -d '{\"text\": \"❌ Deploy failed: $TASKP_ERROR\"}'"
inputs:
  - name: environment
    type: select
    message: "デプロイ先は？"
    choices: [staging, production]
---
```

### code-review スキル（出力フォワーディング）

```yaml
---
name: code-review
description: コードレビューを実行する
mode: agent
model: anthropic/claude-sonnet-4-20250514
hooks:
  after:
    - "cp \"$TASKP_OUTPUT_FILE\" \"reviews/$(date +%Y%m%d)_review.md\""
    - "echo 'Review saved. Summary:' && head -20 \"$TASKP_OUTPUT_FILE\""
inputs:
  - name: target
    type: text
    message: "レビュー対象は？"
context:
  - type: glob
    pattern: "{{target}}"
---
```

### DB 操作スキル（アクション単位フック）

```yaml
---
name: db
description: データベースを管理する
mode: template
hooks:
  after:
    - "echo 'DB operation completed: $TASKP_SKILL_REF in ${TASKP_DURATION_MS}ms'"
actions:
  migrate:
    description: マイグレーション実行
    hooks:
      before:
        - "pg_dump $DATABASE_URL > /tmp/backup_$(date +%s).sql"
      on_failure:
        - "echo '⚠️ Migration failed. Backup available at /tmp/backup_*.sql'"
    inputs:
      - name: direction
        type: select
        message: "方向は？"
        choices: [up, down]
  seed:
    description: シードデータ投入
    # hooks なし → skill.hooks を継承（after のみ）
  reset:
    description: データベースリセット
    hooks:
      before:
        - "pg_dump $DATABASE_URL > /tmp/backup_reset_$(date +%s).sql"
        - "echo '⚠️ This will destroy all data'"
      after:
        - "echo 'Database reset complete'"
      on_failure:
        - "psql $DATABASE_URL < /tmp/backup_reset_*.sql"
---
```

### 出力を次スキルに渡すパターン

```yaml
---
name: analyze-and-fix
description: コードを分析して修正案を出す
mode: agent
hooks:
  after:
    - "taskp run apply-fix --set suggestion=\"$(cat $TASKP_OUTPUT_FILE)\""
---
```

## エッジケース

| ケース | 挙動 |
|--------|------|
| `hooks` なしのスキル（既存） | フック処理をスキップ。完全な後方互換 |
| `hooks: {}` （空オブジェクト） | 有効だがフックなしと同等。Zod パースは通る |
| `before` と `after` の片方だけ定義 | 定義されたフェーズのみ実行 |
| `before` 失敗時の `after` 実行 | **実行する**（リソース解放のため） |
| `dryRun` 時 | フックを**実行しない**（dry-run はプレビュー目的） |
| `taskp_run` 経由の子スキル | 子スキル自身の hooks を発火。親スキルの hooks は影響しない |
| グローバル hooks なし + スキル hooks あり | スキル hooks のみ実行 |
| グローバル hooks あり + スキル hooks なし | グローバル hooks のみ実行（既存挙動） |
| `noInput` モード（`--no-input`） | フックは通常通り実行される |
| 出力ファイルのディスク書き込み失敗 | 警告ログを出力し、`TASKP_OUTPUT_FILE` を空文字でフックに渡す |

## 将来の拡張候補

- **`TASKP_INPUT_*` 環境変数**: ユーザーが入力した変数を `TASKP_INPUT_<NAME>` 形式でフックに渡す。具体ユースケースが 3 つ以上確認されてから実装
- **`before` の non-blocking オプション**: `before` コマンドに `!` プレフィックスで「失敗しても続行」を指定（例: `"!echo optional check"`）
- **フックのタイムアウト設定**: `hooks.timeout` でフェーズ全体のタイムアウトを設定可能に
- **フックの条件式**: `hooks.after_if: "template"` で mode ベースのフィルタ
- **出力ファイルのフォーマット指定**: JSON / Markdown / プレーンテキストの選択
- **config.toml でのスキル単位オーバーライド**: `[hooks.skills.deploy]` でプロジェクト固有の上書き（フロントマターを変更せずに）
- **子スキルの個別出力ファイル**: `taskp_run` 経由の子スキルごとに個別の出力ファイルを生成（現在は親と共有）
