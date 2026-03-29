# taskp — MCP クライアント対応仕様

## 概要

agent モードでスキル実行時、組み込みツール（bash, read 等）に加えて、外部 MCP サーバーが提供するツールも LLM が呼び出せるようにする。

taskp は既に MCP **サーバー**として機能する（`taskp serve`）。本仕様は MCP **クライアント**側の対応を定める。

## ユースケース

### UC-1: 外部ツールを使ったエージェント実行

```bash
taskp run pr-review
# → LLM が MCP 経由で GitHub API を呼び出し、PR 情報を取得してレビュー
```

### UC-2: 複数 MCP サーバーの併用

```yaml
---
name: deploy-notify
mode: agent
tools:
  - bash
  - mcp:github
  - mcp:slack
---
```

LLM が GitHub でリリースを作成し、Slack に通知する。

## 設定

### config.toml — MCP サーバー定義

グローバル（`~/.taskp/config.toml`）またはプロジェクト（`.taskp/config.toml`）に MCP サーバーの接続情報を定義する。

#### stdio トランスポート

```toml
[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_TOKEN = "GITHUB_TOKEN" }
```

`env` の値は環境変数名を指定する。実行時に `process.env[値]` で解決し、子プロセスの環境変数として渡す。既存の `api_key_env` パターンと同じ戦略。

#### HTTP トランスポート

```toml
[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/mcp"
headers_env = { Authorization = "MCP_API_TOKEN" }
```

`headers_env` の値は環境変数名を指定する。実行時に `process.env[値]` で解決し、HTTP ヘッダーの値として使用する。

#### SSE トランスポート

```toml
[mcp.servers.local-db]
transport = "sse"
url = "http://localhost:3001/sse"
```

### マージ戦略

グローバル → プロジェクトの順で読み込み、プロジェクト設定が優先される（既存の config マージと同じ）。

同名サーバーの場合はプロジェクト側が**丸ごと上書き**する。フィールド単位マージはしない（transport 自体が変わりうるため）。

```
global:  mcp.servers.github = { transport = "stdio", command = "npx", ... }
project: mcp.servers.github = { transport = "http", url = "https://..." }
→ result: project 側が完全に優先
```

## SKILL.md — MCP ツール参照

### 構文

`tools` フィールドで `mcp:` プレフィックスを使用する。

```yaml
tools:
  - bash
  - read
  - mcp:github              # github サーバーの全ツールを有効化
  - mcp:slack/post_message   # slack サーバーの特定ツールのみ有効化
```

### 参照形式

| 形式 | 意味 |
|------|------|
| `mcp:<server>` | 指定サーバーの全ツールを有効化 |
| `mcp:<server>/<tool>` | 指定サーバーの特定ツールのみ有効化 |

特定ツール参照は、LLM に渡すツール数を最小化してパフォーマンスを向上させるために提供する。

### ツール名衝突の解決

組み込みツール名（`bash`, `read`, `write`, `edit`, `glob`, `grep`, `fetch`, `ask_user`, `taskp_run`）が常に優先される。

- MCP ツールが組み込みと同名の場合: 警告ログを出力し、MCP 側をスキップ
- 複数 MCP サーバー間で同名の場合: `tools` フィールドの記述順で先に登場した方が優先

### アクションでの利用

アクションレベルで MCP ツールを指定できる。継承ルールは既存の `tools` と同じ。

```yaml
actions:
  review:
    description: PR をレビューする
    mode: agent
    tools:
      - read
      - mcp:github
  notify:
    description: Slack に通知する
    mode: agent
    tools:
      - mcp:slack/post_message
```

## アーキテクチャ

### レイヤー配置

```
CLI (cli.ts)
  └→ McpToolResolver の生成・DI

UseCase (usecase/)
  ├→ run-agent-skill.ts    — MCP 参照の抽出、ツール統合、ライフサイクル管理
  └→ port/mcp-tool-resolver.ts — Port インターフェース（NEW）

Domain (core/)
  └→ execution/mcp-tool-ref.ts — MCP 参照の型定義とパーサー（NEW）

Adapter (adapter/)
  └→ mcp-tool-resolver.ts — @ai-sdk/mcp を使った実装（NEW）
```

### 依存方向

```
CLI → UseCase → Domain
             ↑
     Adapter ┘（UseCase の Port を実装）
```

Domain 層には外部依存を持ち込まない。`McpToolRef` 型とそのパーサーは純粋な文字列操作のみ。

### ツール統合フロー

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
                    ↓
              streamText({ tools })
```

## ドメインモデル

### McpToolRef 型

```typescript
// core/execution/mcp-tool-ref.ts

type McpToolRef =
  | { readonly type: "all"; readonly server: string }
  | { readonly type: "specific"; readonly server: string; readonly tool: string };
```

### パーサー

```typescript
const MCP_PREFIX = "mcp:";

function isMcpToolRef(name: string): boolean {
  return name.startsWith(MCP_PREFIX);
}

function parseMcpToolRef(name: string): Result<McpToolRef, ParseError> {
  const body = name.slice(MCP_PREFIX.length);
  const slashIndex = body.indexOf("/");

  if (slashIndex === -1) {
    if (body === "") return err(parseError('Invalid MCP tool ref: empty server name'));
    return ok({ type: "all", server: body });
  }

  const server = body.slice(0, slashIndex);
  const tool = body.slice(slashIndex + 1);
  if (server === "" || tool === "") {
    return err(parseError(`Invalid MCP tool ref: "${name}"`));
  }
  return ok({ type: "specific", server, tool });
}

function partitionToolRefs(
  toolNames: readonly string[],
): Result<{ builtins: readonly string[]; mcpRefs: readonly McpToolRef[] }, ParseError> {
  const builtins: string[] = [];
  const mcpRefs: McpToolRef[] = [];

  for (const name of toolNames) {
    if (!isMcpToolRef(name)) {
      builtins.push(name);
      continue;
    }
    const ref = parseMcpToolRef(name);
    if (!ref.ok) return ref;
    mcpRefs.push(ref.value);
  }

  return ok({ builtins, mcpRefs });
}
```

## Port インターフェース

### McpToolResolverPort

```typescript
// usecase/port/mcp-tool-resolver.ts

import type { ToolSet } from "ai";
import type { McpToolRef } from "../../core/execution/mcp-tool-ref";
import type { DomainError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

type ResolvedMcpToolSet = {
  readonly server: string;
  readonly tools: ToolSet;
};

type McpToolResolverPort = {
  readonly resolveTools: (
    refs: readonly McpToolRef[],
  ) => Promise<Result<readonly ResolvedMcpToolSet[], DomainError>>;

  readonly closeAll: () => Promise<void>;
};
```

### AgentExecutorPort の変更

```typescript
// usecase/port/agent-executor.ts

// BEFORE
type AgentExecutorInput = {
  readonly model: LanguageModelV3;
  readonly systemPrompt: string;
  readonly contentParts: readonly ContentPart[];
  readonly toolNames: readonly string[];
  readonly maxSteps: number;
  readonly taskpRunDeps?: TaskpRunDeps;
  readonly toolDescriptions?: ToolDescriptions;
};

// AFTER
type AgentExecutorInput = {
  readonly model: LanguageModelV3;
  readonly systemPrompt: string;
  readonly contentParts: readonly ContentPart[];
  readonly tools: ToolSet;
  readonly maxSteps: number;
};
```

ツール構築の責務を UseCase 層（`run-agent-skill.ts`）に移動する。Adapter の `agent-executor` は渡された `ToolSet` をそのまま `streamText` に渡すだけになる。

## 設定スキーマ

### Zod スキーマ（discriminated union）

Parse, Don't Validate 原則に従い、transport ごとに discriminated union で定義する。

```typescript
// adapter/config-loader.ts に追加

const stdioServerSchema = z.object({
  transport: z.literal("stdio"),
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

const httpServerSchema = z.object({
  transport: z.literal("http"),
  url: z.string().url(),
  headers_env: z.record(z.string(), z.string()).optional(),
});

const sseServerSchema = z.object({
  transport: z.literal("sse"),
  url: z.string().url(),
  headers_env: z.record(z.string(), z.string()).optional(),
});

const mcpServerConfigSchema = z.discriminatedUnion("transport", [
  stdioServerSchema,
  httpServerSchema,
  sseServerSchema,
]);

const mcpConfigSchema = z.object({
  servers: z.record(z.string(), mcpServerConfigSchema).optional(),
});
```

`configSchema` に `mcp` フィールドを追加:

```typescript
const configSchema = z.object({
  ai: aiConfigSchema.optional(),
  hooks: hooksConfigSchema.optional(),
  cli: cliConfigSchema.optional(),
  mcp: mcpConfigSchema.optional(),
});
```

### マージ関数

```typescript
function mergeMcpConfig(global: McpConfig, project: McpConfig): McpConfig {
  return {
    servers: mergeOptional(global.servers, project.servers, (g, p) => ({ ...g, ...p })),
  };
}
```

## UseCase の変更

### run-agent-skill.ts

```typescript
export type RunAgentSkillDeps = {
  // ... 既存フィールド
  readonly mcpToolResolver?: McpToolResolverPort;
};

async function runAgentSkill(input, deps): Promise<Result<RunAgentSkillOutput, DomainError>> {
  // ... 既存の skill 解決、変数収集、テンプレート展開 ...

  // ツール構築（UseCase 層の責務）
  const partition = partitionToolRefs(toolNames);
  if (!partition.ok) return partition;
  const { builtins, mcpRefs } = partition.value;

  const builtinToolsResult = buildTools(builtins, taskpRunDeps, toolDescriptions);
  if (!builtinToolsResult.ok) return builtinToolsResult;

  let mcpToolSets: readonly ResolvedMcpToolSet[] = [];
  if (mcpRefs.length > 0) {
    if (!deps.mcpToolResolver) {
      return err(configError("MCP tools referenced but no MCP servers configured"));
    }
    const mcpResult = await deps.mcpToolResolver.resolveTools(mcpRefs);
    if (!mcpResult.ok) return mcpResult;
    mcpToolSets = mcpResult.value;
  }

  const tools = mergeToolSets(builtinToolsResult.value, mcpToolSets, logger);

  try {
    const result = await deps.agentExecutor.execute({
      model: input.model,
      systemPrompt,
      contentParts,
      tools,
      maxSteps: input.maxAgentSteps ?? DEFAULT_MAX_AGENT_STEPS,
    });
    // ...
  } finally {
    await deps.mcpToolResolver?.closeAll();
  }
}
```

### mergeToolSets（UseCase 層のプライベート関数）

```typescript
function mergeToolSets(
  builtinTools: ToolSet,
  mcpToolSets: readonly ResolvedMcpToolSet[],
  logger: Logger,
): ToolSet {
  const merged: ToolSet = { ...builtinTools };

  for (const { server, tools } of mcpToolSets) {
    for (const [name, tool] of Object.entries(tools)) {
      if (name in merged) {
        logger.warn(
          `MCP tool "${name}" from server "${server}" conflicts with existing tool, skipped`,
        );
        continue;
      }
      merged[name] = tool;
    }
  }

  return merged;
}
```

## Adapter 実装

### mcp-tool-resolver.ts

```typescript
// adapter/mcp-tool-resolver.ts

import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

function createMcpToolResolver(
  serverConfigs: Readonly<Record<string, McpServerConfig>>,
  logger: Logger,
): McpToolResolverPort {
  const clients = new Map<string, MCPClient>();

  return {
    async resolveTools(refs) {
      const serverNames = [...new Set(refs.map((r) => r.server))];

      for (const name of serverNames) {
        if (!(name in serverConfigs)) {
          return err(configError(`MCP server "${name}" not found in config`));
        }
      }

      // 並行接続
      const connectResults = await Promise.allSettled(
        serverNames.map(async (name) => {
          const client = await connectByTransport(serverConfigs[name], logger);
          clients.set(name, client);
          return { name, client };
        }),
      );

      // 接続失敗の処理
      for (const result of connectResults) {
        if (result.status === "rejected") {
          await closeAllClients(clients);
          return err(executionError(`MCP connection failed: ${String(result.reason)}`));
        }
      }

      // ツール取得 + フィルタリング
      const toolSets = await Promise.all(
        serverNames.map(async (name) => {
          const client = clients.get(name)!;
          const allTools = await client.tools();
          return { server: name, tools: filterTools(allTools, refs, name) };
        }),
      );

      return ok(toolSets);
    },

    async closeAll() {
      await closeAllClients(clients);
    },
  };
}

function connectByTransport(config: McpServerConfig, logger: Logger): Promise<MCPClient> {
  switch (config.transport) {
    case "stdio":
      return createMCPClient({
        transport: new StdioClientTransport({
          command: config.command,
          args: config.args,
          env: resolveEnvMap(config.env),
        }),
      });
    case "http":
      return createMCPClient({
        transport: {
          type: "http",
          url: config.url,
          headers: resolveHeadersEnv(config.headers_env),
        },
      });
    case "sse":
      return createMCPClient({
        transport: {
          type: "sse",
          url: config.url,
          headers: resolveHeadersEnv(config.headers_env),
        },
      });
  }
}

// env マップの値（環境変数名）を実際の環境変数値に解決する
function resolveEnvMap(
  envMap: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!envMap) return undefined;
  const resolved: Record<string, string> = {};
  for (const [key, envVarName] of Object.entries(envMap)) {
    const value = process.env[envVarName];
    if (value !== undefined) {
      resolved[key] = value;
    }
  }
  return resolved;
}

// headers_env の値（環境変数名）を実際の値に解決する
function resolveHeadersEnv(
  headersEnv: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!headersEnv) return undefined;
  const resolved: Record<string, string> = {};
  for (const [header, envVarName] of Object.entries(headersEnv)) {
    const value = process.env[envVarName];
    if (value !== undefined) {
      resolved[header] = value;
    }
  }
  return resolved;
}

function filterTools(
  allTools: ToolSet,
  refs: readonly McpToolRef[],
  serverName: string,
): ToolSet {
  const specificRefs = refs.filter(
    (r): r is Extract<McpToolRef, { type: "specific" }> =>
      r.type === "specific" && r.server === serverName,
  );

  // "all" 参照がある場合は全ツールを返す
  if (specificRefs.length === 0) return allTools;

  // specific 参照のみの場合はフィルタ
  const allowed = new Set(specificRefs.map((r) => r.tool));
  return Object.fromEntries(Object.entries(allTools).filter(([k]) => allowed.has(k)));
}

async function closeAllClients(clients: Map<string, MCPClient>): Promise<void> {
  const promises = [...clients.values()].map((c) => c.close().catch(() => {}));
  await Promise.allSettled(promises);
  clients.clear();
}
```

`connectByTransport` の switch 文で型が絞り込まれるため、`config.command!` のような非安全なアサーションは不要。discriminated union によるパースの恩恵。

## ライフサイクル

```
スキル実行開始
  ↓
tools フィールドから mcp: 参照を抽出（partitionToolRefs）
  ↓
mcp: 参照がない場合 → MCP 接続なし（既存フローと同じ）
  ↓
mcp: 参照がある場合 → 必要なサーバーのみ接続（遅延接続）
  ↓
mcpClient.tools() でツール一覧取得 + フィルタリング
  ↓
組み込みツールと MCP ツールをマージ（組み込み優先）
  ↓
Agent ループ実行
  ↓
finally → mcpToolResolver.closeAll()
```

- **遅延接続**: スキルが実際に参照するサーバーのみ接続する
- **並行接続**: 複数サーバーは `Promise.all` で並行接続
- **スキル実行スコープ**: 1 スキル実行 = 1 接続ライフサイクル
- **確実なクリーンアップ**: `finally` で必ず `closeAll()` を呼ぶ（stdio 子プロセスのリーク防止）

## エラーハンドリング

### エラー分類

| エラーケース | 分類 | 型 | ハンドリング |
|-------------|------|-----|-------------|
| config.toml に MCP サーバー未定義 | Error | `ConfigError` | 設定ファイルの修正を促すメッセージ |
| `mcp:` 参照の構文エラー | Error | `ParseError` | SKILL.md の修正を促すメッセージ |
| MCP ツール参照があるが `mcpToolResolver` 未設定 | Error | `ConfigError` | `[mcp.servers]` 設定の追加を促す |
| stdio プロセス起動失敗（コマンド不在） | Error | `ExecutionError` | コマンドパスの確認を促す |
| MCP サーバー接続タイムアウト | Fault | `ExecutionError` | 接続先の確認を促す |
| ツール実行中の MCP サーバーダウン | Fault | — | ツールエラーとして LLM にフィードバック（既存パターン） |
| `closeAll()` でのクリーンアップ失敗 | Fault | — | 握り潰して警告ログ（プロセス終了に影響させない） |

### 新規エラー型

MCP 固有のエラー型は追加しない。既存の `ConfigError` と `ExecutionError` で表現する。

- 設定の問題 → `ConfigError`（ユーザーが config.toml を修正して対処可能）
- 接続・実行の問題 → `ExecutionError`（リトライまたは環境の確認で対処可能）

理由: MCP 関連エラーの対処方法は既存のエラー型と変わらない。エラー型を増やすと `DomainError` ユニオンと `EXIT_CODE` マップの変更が波及する。

## 変更対象ファイル

### 新規作成

| ファイル | レイヤー | 内容 |
|---------|---------|------|
| `core/execution/mcp-tool-ref.ts` | Domain | `McpToolRef` 型、パーサー、`partitionToolRefs` |
| `usecase/port/mcp-tool-resolver.ts` | UseCase/Port | `McpToolResolverPort` インターフェース |
| `adapter/mcp-tool-resolver.ts` | Adapter | `@ai-sdk/mcp` を使った実装 |

### 変更

| ファイル | レイヤー | 変更内容 |
|---------|---------|---------|
| `adapter/config-loader.ts` | Adapter | `mcpConfigSchema` 追加、`configSchema` 拡張、`mergeMcpConfig` 追加 |
| `usecase/port/agent-executor.ts` | UseCase/Port | `AgentExecutorInput` の `toolNames` → `tools: ToolSet` |
| `usecase/run-agent-skill.ts` | UseCase | MCP 参照の抽出・ツール統合・ライフサイクル管理、`mergeToolSets` |
| `adapter/agent-executor.ts` | Adapter | `buildTools()` 呼び出し削除、`ToolSet` をそのまま使用 |
| `cli.ts` | CLI | `McpToolResolver` の生成・DI |

### テスト追加

| ファイル | 種別 | 内容 |
|---------|------|------|
| `tests/unit/execution/mcp-tool-ref.test.ts` | ユニット | `parseMcpToolRef`, `partitionToolRefs` のパース・分離 |
| `tests/usecase/run-agent-skill.test.ts` | ユースケース | MCP ツール統合（スタブ `McpToolResolverPort`） |

## 新規依存パッケージ

```json
{
  "@ai-sdk/mcp": "^x.x.x",
  "@modelcontextprotocol/sdk": "^x.x.x"
}
```

- `@ai-sdk/mcp`: `createMCPClient` による MCP クライアント接続とツール変換
- `@modelcontextprotocol/sdk`: `StdioClientTransport`（stdio トランスポート用）

## 後方互換性

- `mcpToolResolver` は optional。MCP 未設定のプロジェクトでは一切影響なし
- `tools` フィールドに `mcp:` プレフィックスを含まないスキルは既存の動作と同一
- `AgentExecutorInput` の型変更は内部インターフェースのため、外部 API への影響なし

## 将来の拡張余地

本仕様では対応しないが、将来検討しうる拡張:

- MCP リソースを `context` ソースとして利用（`context: [{ type: mcp_resource, server: github, uri: "..." }]`）
- MCP プロンプトをスキルテンプレートとして利用
- MCP サーバーの Elicitation（対話的入力要求）と `ask_user` ツールの統合
