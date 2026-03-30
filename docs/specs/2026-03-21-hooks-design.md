# スキル実行フック設計

## 概要

スキルの実行完了時（成功・失敗）に任意のコマンドを自動実行するフック機能。
`config.toml` でグローバルに定義し、すべてのスキルに一律適用する。

## ユースケース

- 実行完了を Slack / Discord に通知する
- 実行履歴をログファイルに記録する
- 失敗時にデスクトップ通知を出す

## 設計方針

- **グローバル一律**: config.toml で定義し、全スキルに適用（スキル単位の定義は将来拡張）
- **成功・失敗で分離**: `on_success` / `on_failure` を明示的に分ける
- **フック失敗は警告のみ**: taskp の終了コードには影響しない
- **環境変数で情報注入**: コマンド文字列にコンテキストを渡す

## config.toml スキーマ

### 設定例

```toml
# ~/.taskp/config.toml（グローバル）
[hooks]
on_success = [
  "echo '✅ ${TASKP_SKILL_NAME} completed in ${TASKP_DURATION_MS}ms'",
  "curl -s -X POST https://slack.example.com/webhook -d '{\"text\": \"${TASKP_SKILL_NAME} done\"}'",
]
on_failure = [
  "echo '❌ ${TASKP_SKILL_NAME} failed: ${TASKP_ERROR}'",
]
```

```toml
# .taskp/config.toml（プロジェクト）
[hooks]
on_success = [
  "echo 'project-specific hook'",
]
# on_failure は未定義 → グローバルの on_failure がそのまま使われる
```

### スキーマ定義

| フィールド | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `hooks` | `object` | 省略可 | ライフサイクルフック設定 |
| `hooks.on_success` | `string[]` | `[]` | スキル成功時に実行するコマンド群 |
| `hooks.on_failure` | `string[]` | `[]` | スキル失敗時に実行するコマンド群 |

### マージ戦略

グローバル → プロジェクトの順でマージ。`on_success` / `on_failure` それぞれ独立してフィールド単位で上書き。

```
on_success: project.hooks.on_success ?? global.hooks.on_success
on_failure: project.hooks.on_failure ?? global.hooks.on_failure
```

配列の追記マージは行わない（直感に反するため）。

## 環境変数

フックのコマンドには以下の環境変数が注入される。

| 変数名 | 型 | 説明 | 例 |
|--------|------|------|-----|
| `TASKP_SKILL_NAME` | `string` | スキル名 | `deploy` |
| `TASKP_MODE` | `string` | 実行モード | `template` / `agent` |
| `TASKP_STATUS` | `string` | 実行結果 | `success` / `failed` |
| `TASKP_DURATION_MS` | `string` | 実行時間（ミリ秒） | `1234` |
| `TASKP_ERROR` | `string` | エラーメッセージ（失敗時のみ、成功時は空文字） | `Command failed: ...` |

環境変数は `execa` の `env` オプションで注入し、プロセス全体の環境変数は汚さない。
`TASKP_ERROR` は最大 1024 文字で切り詰める（シェル環境変数の安全な範囲）。

### フックプロセスの I/O

- stdin: `/dev/null`（フックは対話的入力を受け付けない）
- stdout / stderr: 親プロセスに継承（フックの出力はユーザーに表示される）

## 型定義

### Zod スキーマ（config-loader.ts に追加）

```typescript
export const hooksConfigSchema = z.object({
  on_success: z.array(z.string().min(1)).optional()
    .describe("Commands to run on skill success"),
  on_failure: z.array(z.string().min(1)).optional()
    .describe("Commands to run on skill failure"),
});

export type HooksConfig = z.infer<typeof hooksConfigSchema>;
```

```typescript
export const configSchema = z.object({
  ai: aiConfigSchema.optional().describe("AI/LLM settings"),
  hooks: hooksConfigSchema.optional().describe("Lifecycle hooks"),
});
```

### HookExecutor ポート（usecase/port/hook-executor.ts）

```typescript
export type HookContext = {
  readonly skillName: string;
  readonly mode: "template" | "agent";
  readonly status: "success" | "failed";
  readonly durationMs: number;
  readonly error?: string;
};

export type HookResult = {
  readonly command: string;
  readonly success: boolean;
  readonly error?: string;
};

export interface HookExecutorPort {
  execute(
    commands: readonly string[],
    context: HookContext,
  ): Promise<readonly HookResult[]>;
}
```

## ファイル構成

### 新規ファイル

| ファイル | 役割 |
|---------|------|
| `src/usecase/port/hook-executor.ts` | `HookExecutorPort`, `HookContext`, `HookResult` 型定義 |
| `src/adapter/hook-executor.ts` | `HookExecutorPort` の実装（execa でコマンド実行） |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/adapter/config-loader.ts` | `hooksConfigSchema` 追加、`configSchema` に `hooks` 追加、`mergeConfigs` にフックマージ追加 |
| `src/usecase/run-skill.ts` | `RunSkillDeps` に `hookExecutor` と `hooksConfig` 追加、実行後にフック呼び出し |
| `src/usecase/run-agent-skill.ts` | 同上 |
| `src/cli.ts` | `HookExecutor` を生成して deps に注入 |
| `src/tui/app.ts` | TUI からの実行時も同様にフックを呼び出す |

## 処理フロー

```
taskp run deploy
  │
  ├─ スキル読み込み・変数収集・実行（既存処理）
  │
  ├─ 実行結果を判定（success / failed）
  │
  ├─ HookContext を組み立て
  │   { skillName, mode, status, durationMs, error }
  │
  ├─ status に応じて hooks.on_success or hooks.on_failure を取得
  │
  ├─ HookExecutor.execute(commands, context)
  │   ├─ 各コマンドを順次実行（環境変数を注入）
  │   ├─ 失敗しても次のコマンドへ続行
  │   └─ 失敗時は警告を stderr に出力
  │
  └─ 元の実行結果をそのまま返す（フック失敗は終了コードに影響しない）
```

## adapter/hook-executor.ts 実装方針

- 既存の `CommandExecutor`（execa ラッパー）を内部で利用
- 環境変数は execa の `env` オプションで注入
- タイムアウトは固定 30 秒（フックの暴走防止）
- 全コマンドを順次実行し、結果を `HookResult[]` で返す
- 失敗したコマンドがあっても残りは続行する

## テスト方針

### ユニットテスト

- `config-loader.ts`: hooks スキーマのパース・バリデーション・マージ戦略
- `hook-executor.ts`: コマンド実行、環境変数注入、失敗時の続行、タイムアウト

### ユースケーステスト

- `run-skill.ts`: 成功時に `on_success` が呼ばれること、失敗時に `on_failure` が呼ばれること
- `run-agent-skill.ts`: 同上
- フック失敗時に元の実行結果が変わらないこと

## 将来の拡張候補

- ~~スキル単位のフック定義（SKILL.md フロントマターに `hooks` セクション）~~ → **設計済み**: [スキル単位フック設計](./2026-03-30-per-skill-hooks-design.md)
- ~~`on_start` フック（実行開始前）~~ → **設計済み**: `hooks.before` として [スキル単位フック設計](./2026-03-30-per-skill-hooks-design.md) に含まれる
- フック実行のタイムアウト設定（config.toml で変更可能に）
- `before` の non-blocking オプション（`!` プレフィックスで失敗しても続行）
