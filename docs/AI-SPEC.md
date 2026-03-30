# taskp — AI 連携仕様

## 概要

taskp の `agent` モードでは、Vercel AI SDK を使用して LLM と連携する。
マルチプロバイダ対応により、クラウド LLM（Claude, GPT, Gemini）とローカル LLM（Ollama）を統一的に扱う。

## プロバイダ構成

### サポートプロバイダ

| プロバイダ | パッケージ | 認証 |
|-----------|-----------|------|
| Anthropic | `@ai-sdk/anthropic` | `ANTHROPIC_API_KEY` |
| OpenAI | `@ai-sdk/openai` | `OPENAI_API_KEY` |
| Google | `@ai-sdk/google` | `GOOGLE_GENERATIVE_AI_KEY` |
| Ollama | `@ai-sdk/openai`（OpenAI 互換） | 不要 |

### モデル指定の形式

モデルは統一的に `provider/model` 形式で指定する。すべての指定箇所（CLI、フロントマター、config.toml）で同じ形式を使用する。

```bash
# provider/model 形式（推奨）
taskp run review --model anthropic/claude-sonnet-4-20250514
taskp run review --model openai/gpt-4o
taskp run review --model ollama/qwen2.5-coder:32b

# provider を省略（設定ファイルの ai.default_provider を使用）
taskp run review --model claude-sonnet-4-20250514
```

```yaml
# SKILL.md フロントマター（同じ形式）
model: anthropic/claude-sonnet-4-20250514
model: ollama/qwen2.5-coder:32b
model: claude-sonnet-4-20250514          # default_provider を使用
```

### モデル文字列のパース

`/` の有無でプロバイダを解決する:

```
"anthropic/claude-sonnet-4-20250514"
  → provider: "anthropic", model: "claude-sonnet-4-20250514"

"ollama/qwen2.5-coder:32b"
  → provider: "ollama", model: "qwen2.5-coder:32b"

"claude-sonnet-4-20250514"
  → provider: ai.default_provider, model: "claude-sonnet-4-20250514"
```

最初の `/` で分割する。モデル名にコロン（`:`）が含まれる場合（Ollama のタグ等）も正しくパースされる。

### プロバイダ・モデル解決の優先順位

```
1. --model CLI オプション
2. スキルの model フィールド（フロントマター）
3. ai.default_model（config.toml）
4. エラー（明示的な設定を要求）
```

各段階で `provider/model` 形式が使われていればプロバイダも同時に決定する。
モデル名のみの場合は `ai.default_provider` をフォールバックとして使用する。

## エージェントループ

agent モードでは、LLM とツールの間でループを回す。

```
┌─────────────────────────────────────────────┐
│                Agent Loop                    │
│                                              │
│  ┌──────────┐    ┌──────────┐               │
│  │  LLM     │───→│  ツール   │               │
│  │ (Claude  │    │ (bash,   │               │
│  │  GPT等)  │←───│  read等) │               │
│  └──────────┘    └──────────┘               │
│       │                                      │
│       ↓                                      │
│  テキスト応答（完了）                          │
└─────────────────────────────────────────────┘
```

### ループの流れ

```typescript
async function agentLoop(skill: Skill, variables: Record<string, string>): Promise<AgentResult> {
  // 1. セッション ID の受け取り（CLI/TUI で事前に発行済み）
  const sessionId = input.sessionId;

  // 2. システムプロンプト構築（セッション ID を環境情報に含める）
  const systemPrompt = buildSystemPrompt(skill, variables, sessionId);

  // 3. コンテキスト収集
  const context = await gatherContext(skill.context, variables);

  // 4. LLM 呼び出し（ツールループ）
  const result = await generateText({
    model: resolveModel(skill.model),
    system: systemPrompt,
    prompt: context,
    tools: buildTools(skill.tools),
    maxSteps: 50,                  // 最大ツール呼び出し回数
  });

  return { output: result.text, steps: result.steps.length };
}
```

### システムプロンプトの環境情報

システムプロンプトの環境情報セクションにセッション ID が含まれる。LLM がツール呼び出し時に識別子として利用できる。

```
# Environment

- Working directory: /path/to/project
- Date: 2026-03-30
- Platform: darwin
- Session ID: tskp_a1b2c3d4e5f6
```

### 最大ステップ数

| 設定 | デフォルト | 説明 |
|------|----------|------|
| `maxSteps` | `50` | 1回の実行あたりの最大ツール呼び出し回数 |

上限に達した場合はエラーとして中断する。無限ループ防止のための安全装置。

### フックとの連携

agent モードのスキルも SKILL.md フロントマターで `hooks` を定義できる。LLM の最終テキスト出力は一時ファイル（`TASKP_OUTPUT_FILE`）に書き出され、`after` / `on_failure` フックから参照可能。

```yaml
hooks:
  after:
    - "cp \"$TASKP_OUTPUT_FILE\" \"reviews/$(date +%Y%m%d).md\""
```

フックの実行順序: `skill before` → エージェントループ → `skill after` → `skill on_failure` → `global hooks`。

`before` フックが失敗した場合、エージェントループは実行されない。詳細は [スキル仕様 — スキル単位フック](SKILL-SPEC.md#スキル単位フック) を参照。

## ツール定義

agent モードで LLM に提供するツール。

### 組み込みツール

| ツール名 | 説明 | デフォルト |
|---------|------|:---------:|
| `bash` | シェルコマンドを実行する | ✅ |
| `read` | ファイルを読み込む | ✅ |
| `write` | ファイルに書き込む | ✅ |
| `glob` | パターンマッチでファイルを検索 | ❌ |
| `edit` | ファイルの一部を置換する | ❌ |
| `grep` | ファイル内容をテキスト検索する | ❌ |
| `fetch` | URL からテキストを取得する | ❌ |
| `ask_user` | ユーザーに質問する | ❌ |
| `taskp_run` | 別の taskp スキルを実行する（template モードのみ） | ❌ |

### MCP ツール

組み込みツールに加えて、外部 MCP サーバーが提供するツールも LLM に渡すことができる。`tools` フィールドで `mcp:` プレフィックスを使用する。

```yaml
tools:
  - bash
  - read
  - mcp:github              # github サーバーの全ツールを有効化
  - mcp:slack/post_message   # slack サーバーの特定ツールのみ有効化
```

MCP サーバーの接続情報は `config.toml` の `[mcp.servers]` セクションで定義する。詳細は [MCP クライアント仕様](MCP-SPEC.md) および [設定ファイル仕様](CONFIG-SPEC.md) を参照。

#### ツール統合フロー

```
SKILL.md の tools フィールド
  ↓
partitionToolRefs() — 組み込み名と MCP 参照に分離
  ↓
┌─────────────────┐  ┌──────────────────────┐
│ buildTools()    │  │ mcpToolResolver      │
│ 組み込みツール構築│  │ .resolveTools(refs)  │
└────────┬────────┘  └──────────┬───────────┘
         │                      │
         └──────────┬───────────┘
                    ↓
          mergeToolSets() — 組み込み優先でマージ
                    ↓
          AgentExecutorInput.tools: ToolSet
```

#### ツール名衝突の解決

- 組み込みツール名が常に優先される
- MCP ツールが組み込みと同名の場合: 警告ログを出力し、MCP 側をスキップ
- 複数 MCP サーバー間で同名の場合: `tools` フィールドの記述順で先に登場した方が優先

### taskp_run ツール

agent モードの LLM が別のスキル（またはアクション）を呼び出せる組み込みツール。

```typescript
const taskpRunParams = z.object({
  skill: z.string(),   // "skill" or "skill:action"
  set: z.record(z.string(), z.string()).optional(),
});
```

#### 制約

| 制約 | 理由 |
|------|------|
| template モードのスキルのみ呼び出し可能 | agent ネストによる無限ループ・コスト爆発を防止 |
| `noInput: true` で実行 | LLM からの呼び出しは非対話。`set` で変数を渡す |
| 再帰呼び出し禁止 | 呼び出しスタックで管理 |
| 最大ネスト深度: 3 | 安全装置 |

#### 有効化

デフォルトでは無効。スキルの `tools` フィールドで明示的に有効化する:

```yaml
tools:
  - bash
  - read
  - taskp_run
```

ツールの `description` には利用可能なスキル一覧が動的に注入される（agent モードスキルを除外）。

### ツールのスキーマ

```typescript
const bashTool = tool({
  description: "Run a shell command and return stdout/stderr",
  parameters: z.object({
    command: z.string().describe("The shell command to execute"),
    cwd: z.string().optional().describe("Working directory"),
    timeout: z.number().optional().describe("Timeout in milliseconds"),
  }),
  execute: async ({ command, cwd, timeout }) => {
    const result = await execa(command, {
      shell: true,
      cwd: cwd ?? process.cwd(),
      timeout: timeout ?? 30_000,
    });
    return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
  },
});

const readTool = tool({
  description: "Read the contents of a file",
  parameters: z.object({
    path: z.string().describe("File path to read"),
    encoding: z.string().optional().describe("File encoding (default: utf-8)"),
  }),
  execute: async ({ path, encoding }) => {
    return await Bun.file(path).text();
  },
});

const writeTool = tool({
  description: "Write content to a file",
  parameters: z.object({
    path: z.string().describe("File path to write"),
    content: z.string().describe("Content to write"),
  }),
  execute: async ({ path, content }) => {
    await Bun.write(path, content);
    return `Written to ${path}`;
  },
});
```

### スキルでのツール指定

```yaml
---
name: review
mode: agent
tools:
  - bash
  - read
  # write は除外 → LLM はファイルを読むだけで書き込めない
---
```

## ストリーミング

LLM の応答はストリーミングで表示する。

```typescript
import { streamText } from "ai";

const result = streamText({
  model: resolveModel(modelName),
  system: systemPrompt,
  prompt: context,
  tools: buildTools(toolNames),
  maxSteps: 50,
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### ストリーミングの挙動

```
[taskp] Running skill: code-review (agent mode)
[taskp] Session: tskp_a1b2c3d4e5f6
[taskp] Model: claude-sonnet-4-20250514
[taskp] ──────────────────────────

## レビュー結果

### 問題点
- [high] src/index.ts:42 — 未処理の Promise rejection...
  ← LLM の応答がリアルタイムで流れる

[tool: bash] git diff --cached
  ← ツール呼び出し時はツール名と引数を表示

[taskp] ──────────────────────────
[taskp] Done in 12.3s (8 steps) [tskp_a1b2c3d4e5f6]
```

## エラーハンドリング

### プロバイダエラー

| エラー | 対処 |
|--------|------|
| API キー未設定 | 設定方法を含むエラーメッセージを表示 |
| レート制限 | リトライ（exponential backoff, 最大 3 回） |
| モデル未対応 | サポートモデル一覧を表示 |
| ネットワークエラー | リトライ後、タイムアウトメッセージ |

### Ollama 固有

| エラー | 対処 |
|--------|------|
| Ollama 未起動 | `ollama serve` の実行を促す |
| モデル未ダウンロード | `ollama pull <model>` の実行を促す |
| Tool Calling 非対応モデル | 対応モデルの一覧を表示 |

### ツール実行エラー

```
ツール実行エラー
    ↓
bash コマンド失敗？
    ├─ YES → 終了コード + stderr を LLM に返す（LLM が判断）
    └─ NO ↓
ファイル読み込み失敗？
    ├─ YES → エラーメッセージを LLM に返す（LLM がパスを修正）
    └─ NO → エラーを LLM に返し、LLM に次のアクションを委ねる
```

ツール実行エラーは原則として LLM にフィードバックし、LLM 自身にリカバリを試みさせる。
致命的エラー（タイムアウト、メモリ不足等）のみ即座に中断する。
