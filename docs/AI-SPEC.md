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
  // 1. システムプロンプト構築
  const systemPrompt = buildSystemPrompt(skill, variables);

  // 2. コンテキスト収集
  const context = await gatherContext(skill.context, variables);

  // 3. LLM 呼び出し（ツールループ）
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

### 最大ステップ数

| 設定 | デフォルト | 説明 |
|------|----------|------|
| `maxSteps` | `50` | 1回の実行あたりの最大ツール呼び出し回数 |

上限に達した場合はエラーとして中断する。無限ループ防止のための安全装置。

## ツール定義

agent モードで LLM に提供するツール。

### 組み込みツール

| ツール名 | 説明 | デフォルト |
|---------|------|:---------:|
| `bash` | シェルコマンドを実行する | ✅ |
| `read` | ファイルを読み込む | ✅ |
| `write` | ファイルに書き込む | ✅ |
| `glob` | パターンマッチでファイルを検索 | ❌ |
| `grep` | ファイル内容をテキスト検索する | ❌ |
| `fetch` | URL からテキストを取得する | ❌ |
| `ask_user` | ユーザーに質問する | ❌ |
| `taskp_run` | 別の taskp スキルを実行する（template モードのみ） | ❌ |

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
[taskp] Model: claude-sonnet-4-20250514
[taskp] ──────────────────────────

## レビュー結果

### 問題点
- [high] src/index.ts:42 — 未処理の Promise rejection...
  ← LLM の応答がリアルタイムで流れる

[tool: bash] git diff --cached
  ← ツール呼び出し時はツール名と引数を表示

[taskp] ──────────────────────────
[taskp] Done in 12.3s (8 steps)
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
