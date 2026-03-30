# taskp — アーキテクチャ

## 技術スタック

| レイヤー | 技術 | 用途 |
|---------|------|------|
| ランタイム | Bun | 実行・ビルド・パッケージ管理 |
| 言語 | TypeScript (ESNext, strict) | 型安全な開発 |
| CLI フレームワーク | incur | コマンド定義 + MCP サーバー自動生成 |
| バリデーション | Zod (incur 内蔵) | 入力スキーマ定義 |
| Markdown パース | gray-matter + unified/remark | フロントマター抽出 + AST 解析 |
| LLM 連携 | Vercel AI SDK | マルチプロバイダ対応 |
| MCP クライアント | @ai-sdk/mcp, @modelcontextprotocol/sdk | 外部 MCP サーバーのツール統合 |
| コマンド実行 | execa | シェルコマンド実行 |
| リンター/フォーマッター | Biome | Lint + Format |
| テスト | Vitest | ユニット・ユースケーステスト |

## モノレポ構成

```
taskp/
├── package.json              ← ルート（workspaces 定義）
├── biome.json                ← 共通 lint/format 設定
├── tsconfig.json             ← 共通 TypeScript 設定
├── packages/
│   └── taskp/                ← メインパッケージ（当面はここに集約）
│       ├── package.json
│       ├── tsconfig.json     ← パッケージ固有設定（extends ルート）
│       ├── vitest.config.ts
│       ├── src/
│       │   ├── cli.ts              ← エントリポイント（incur 定義）
│       │   ├── core/               ← ドメインロジック
│       │   │   ├── skill/          ← スキル関連
│       │   │   │   ├── skill.ts              ← Skill ドメインモデル
│       │   │   │   ├── skill-metadata.ts     ← フロントマター解析結果
│       │   │   │   ├── skill-input.ts        ← 入力定義（質問）
│       │   │   │   └── skill-body.ts         ← マークダウン本文
│       │   │   ├── execution/      ← 実行関連
│       │   │   │   ├── execution-mode.ts     ← template | agent
│       │   │   │   ├── template-executor.ts  ← テンプレート実行
│       │   │   │   ├── agent-executor.ts     ← LLM エージェント実行
│       │   │   │   ├── mcp-tool-ref.ts       ← MCP ツール参照の型・パーサー
│       │   │   │   └── session.ts            ← SessionId branded type（型定義のみ）
│       │   │   └── variable/       ← 変数展開
│       │   │       └── template-renderer.ts  ← {{var}} 展開
│       │   ├── adapter/            ← インターフェースアダプタ
│       │   │   ├── skill-loader.ts           ← ファイルシステムからスキル読み込み
│       │   │   ├── prompt-runner.ts          ← インタラクティブ質問の実行
│       │   │   ├── command-runner.ts         ← シェルコマンド実行
│       │   │   ├── ai-provider.ts            ← LLM プロバイダ管理
│       │   │   ├── hook-executor.ts          ← HookExecutorPort の実装
│       │   │   ├── output-file-store.ts     ← 出力ファイル管理（/tmp/taskp/）
│       │   │   ├── session-id-generator.ts  ← セッション ID 生成（副作用）
│       │   │   └── mcp-tool-resolver.ts     ← MCP サーバー接続・ツール解決
│       │   ├── usecase/            ← ユースケース
│       │   │   ├── run-skill.ts              ← スキル実行
│       │   │   ├── run-agent-skill.ts        ← agent モードスキル実行
│       │   │   ├── hook-runner.ts            ← グローバルフック実行
│       │   │   ├── skill-hook-runner.ts      ← スキル単位フック実行（before/after/on_failure）
│       │   │   ├── list-skills.ts            ← スキル一覧
│       │   │   └── init-skill.ts             ← スキル雛形生成
│       │   └── types/              ← 共有型定義
│       │       └── index.ts
│       └── tests/
│           ├── unit/
│           │   ├── skill/
│           │   ├── execution/
│           │   └── variable/
│           ├── usecase/
│           │   ├── run-skill.test.ts
│           │   ├── list-skills.test.ts
│           │   └── init-skill.test.ts
│           ├── integration/
│           │   └── cli.test.ts
│           └── fixtures/
│               └── skills/         ← テスト用スキル定義
├── skills/                         ← サンプルスキル（配布用）
│   ├── deploy/
│   │   └── SKILL.md
│   └── code-review/
│       └── SKILL.md
└── docs/
    ├── README.md
    ├── CONCEPT.md
    ├── ARCHITECTURE.md
    ├── SKILL-SPEC.md
    ├── CLI-SPEC.md
    ├── AI-SPEC.md
    └── arch/                       ← コーディング規約・設計原則
```

## レイヤー構成

```
┌────────────────────────────────────────────┐
│  CLI (cli.ts)                              │
│  incur コマンド定義 → MCP サーバー兼用      │
├────────────────────────────────────────────┤
│  Use Cases (usecase/)                      │
│  RunSkill, RunAgentSkill, ListSkills       │
│  Port: McpToolResolverPort                 │
│  ※ Repository Interface もここに配置       │
├────────────────────────────────────────────┤
│  Domain (core/)                            │
│  Skill, SkillInput, ExecutionMode          │
│  TemplateRenderer, McpToolRef              │
├────────────────────────────────────────────┤
│  Adapters (adapter/)                       │
│  SkillLoader, PromptRunner, CommandRunner  │
│  AiProvider, McpToolResolver               │
└────────────────────────────────────────────┘
```

### 依存方向

```
CLI → UseCase → Domain
              ↑
      Adapter ┘（UseCase の Interface を実装）
```

- Domain 層は外部依存なし（pure TypeScript のみ）
- UseCase 層は Domain を参照し、Adapter の Interface を定義
- Adapter 層は UseCase の Interface を実装
- CLI 層は UseCase を呼び出す

## 将来のパッケージ分割

モノレポ構造は最初から用意するが、パッケージは1つからスタートする。
以下の条件を満たしたときに分割を検討する：

| 分割候補 | トリガー |
|---------|---------|
| `@taskp/core` | スキル解析・実行エンジンを他ツールから使いたい |
| `@taskp/ai` | AI プロバイダ管理を独立して利用したい |
| `@taskp/cli` | CLI と SDK を明確に分離したい |

分割時は `packages/taskp/src/core/` → `packages/core/src/` に移動するだけ。

## 設定ファイル

### ~/.taskp/config.toml（グローバル設定）

```toml
[ai]
default_provider = "anthropic"       # デフォルトプロバイダ
default_model = "claude-sonnet-4-20250514"

[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"    # 環境変数名

[ai.providers.openai]
api_key_env = "OPENAI_API_KEY"

[ai.providers.ollama]
base_url = "http://localhost:11434/v1"
default_model = "qwen2.5-coder:32b"
```

### .taskp/config.toml（プロジェクト設定）

```toml
[ai]
default_provider = "ollama"          # このプロジェクトではローカルLLMを使う
default_model = "qwen2.5-coder:14b"
```

マージ順序: グローバル → プロジェクト（プロジェクト設定が優先）

## セッション ID

スキル実行ごとに一意のセッション ID を発行する。実行のトレース・識別に使用する。

### 型

`SessionId` は branded type として定義する（Parse, Don't Validate 原則）。生の `string` との取り違えを型レベルで防止する。

```typescript
// core/execution/session.ts — Domain 層（純粋、型定義のみ）
type SessionId = string & { readonly __brand: "SessionId" };
```

### 形式

```
tskp_<ランダム文字列>
```

例: `tskp_a1b2c3d4e5f6`

プレフィックス `tskp_` により、他システムの ID と視認上区別できる。

### 生成

`generateSessionId()` はランダム値生成（副作用）を伴うため、Domain 層ではなく **Adapter 層** に配置する。

```typescript
// adapter/session-id-generator.ts — Adapter 層（副作用あり）
function generateSessionId(): SessionId
```

CLI / TUI が生成し、UseCase に注入する。

### 伝搬

```
┌────────────────────────────────────────────┐
│  CLI / TUI                                 │
│  generateSessionId() で発行（Adapter 経由） │
│                                            │
├────────────────────────────────────────────┤
│  Use Cases (run-skill / run-agent-skill)   │
│  RunSkillInput.sessionId で受け取り         │
│  RunOutput.sessionId で返却                │
│  HookContext.sessionId でフックに伝搬      │
├────────────────────────────────────────────┤
│  Domain (template-renderer)                │
│  ReservedVars.sessionId として             │
│  {{__session_id__}} で SKILL.md 内参照可能 │
├────────────────────────────────────────────┤
│  Adapters (hook-executor)                  │
│  環境変数 TASKP_SESSION_ID として          │
│  フックコマンドに渡される                   │
└────────────────────────────────────────────┘
```

### ライフサイクル

- **発行タイミング**: CLI の `run` コマンド実行時、または TUI の実行画面表示時
- **スコープ**: 1回の `taskp run` / TUI 実行 = 1つのセッション ID
- **子スキル**: `taskp_run` ツールでネスト呼び出しされた子スキルは、親のセッション ID を継承する
- **TUI での連続実行**: スキル選択に戻って再実行すると新しいセッション ID が発行される

### 参照方法

| 参照元 | 方法 |
|--------|------|
| SKILL.md テンプレート | `{{__session_id__}}` 予約変数 |
| agent モード LLM | システムプロンプトの環境情報セクション |
| フックコマンド | 環境変数 `TASKP_SESSION_ID` |
| CLI 出力 | 実行結果のサマリーに表示 |
| TUI | 実行画面のタイトルバーに表示 |
