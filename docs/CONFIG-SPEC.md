# taskp — 設定ファイル仕様

## 概要

taskp は TOML 形式の設定ファイルで AI/LLM プロバイダを構成する。

| パス | 用途 |
|------|------|
| `~/.taskp/config.toml` | グローバル設定（全プロジェクト共通） |
| `.taskp/config.toml` | プロジェクト設定（プロジェクト固有） |

マージ順序: **グローバル → プロジェクト**（プロジェクト設定が優先）

### 初期化

`taskp setup` でテンプレート付きの設定ファイルを自動生成できる。詳細は [CLI 仕様](CLI-SPEC.md) の `taskp setup` セクションを参照。

## JSON Schema

エディタ補完・バリデーション用の JSON Schema:

```
.taskp/config.schema.json
```

Zod スキーマ（`src/adapter/config-loader.ts`）から自動生成:

```bash
bun run scripts/generate-config-schema.ts
```

### Taplo（TOML LSP）との連携

`.taplo.toml` をプロジェクトルートに配置:

```toml
[schema]
path = ".taskp/config.schema.json"
```

## スキーマ定義

### `[ai]` — AI/LLM 設定

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|:---:|----------|------|
| `default_provider` | `string` | - | なし（明示的な設定を要求） | デフォルトプロバイダ |
| `default_model` | `string` | - | なし（明示的な設定を要求） | デフォルトモデル名 |
| `providers` | `table` | - | `{}` | プロバイダ別設定 |

#### サポートプロバイダ

| プロバイダ名 | 種別 | デフォルト `base_url` | 認証 |
|-------------|------|----------------------|------|
| `anthropic` | クラウド | Anthropic API | `ANTHROPIC_API_KEY` |
| `openai` | クラウド | OpenAI API | `OPENAI_API_KEY` |
| `google` | クラウド | Google AI API | `GOOGLE_GENERATIVE_AI_KEY` |
| `ollama` | ローカル | `http://localhost:11434/v1` | 不要 |
| `omlx` | ローカル | `http://localhost:8000/v1` | 不要 |
| `lmstudio` | ローカル | `http://localhost:1234/v1` | 不要 |
| その他 | カスタム | `base_url` 必須 | 任意 |

### `[ai.providers.<name>]` — プロバイダ別設定

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|:---:|----------|------|
| `api_key_env` | `string` | - | プロバイダ固有の環境変数名 | API キーの環境変数名 |
| `base_url` | `string` | - | プロバイダ固有 | カスタムエンドポイント URL |
| `default_model` | `string` | - | なし | プロバイダ別デフォルトモデル ※ |
| `api_type` | `"chat" \| "responses"` | - | `"chat"` | カスタムプロバイダの API 形式。`chat` = Chat Completions API、`responses` = Responses API。組み込みプロバイダでは無視される |

> ※ `default_model` はスキーマ上定義されているが、現在の実装（`resolveModelSpec`）では `ai.default_model` のみが参照される。プロバイダ別デフォルトモデルは将来対応予定。

## モデル解決の優先順位

```
1. --model CLI オプション            (最優先)
2. スキルの model フィールド
3. ai.default_model                 (config.toml)
4. エラー（明示的な設定を要求）
```

プロバイダはモデル文字列から解決する（`provider/model` 形式）:

```
"anthropic/claude-sonnet-4-20250514"  → provider: anthropic
"claude-sonnet-4-20250514"            → provider: ai.default_provider
```

詳細は [AI 連携仕様](AI-SPEC.md) の「モデル文字列のパース」を参照。

## 設定例

### ローカル LLM のみ

```toml
[ai]
default_provider = "omlx"
default_model = "Qwen3.5-4B-MLX-4bit"

[ai.providers.omlx]
base_url = "http://127.0.0.1:8124/v1"
```

### クラウド LLM（Anthropic）

```toml
[ai]
default_provider = "anthropic"
default_model = "claude-sonnet-4-20250514"

[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"
```

### 複数プロバイダ併用

```toml
[ai]
default_provider = "anthropic"
default_model = "claude-sonnet-4-20250514"

[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"

[ai.providers.ollama]
base_url = "http://localhost:11434/v1"
default_model = "qwen2.5-coder:32b"
```

```bash
# デフォルト（Anthropic）
taskp run code-review

# Ollama に切り替え
taskp run code-review --model ollama/qwen2.5-coder:32b
```

### カスタム OpenAI 互換サーバー

```toml
[ai]
default_provider = "my-server"

[ai.providers.my-server]
base_url = "http://192.168.1.100:8080/v1"
default_model = "my-model"
```

未登録のプロバイダ名でも `base_url` が設定されていれば OpenAI 互換プロトコルで接続する。

デフォルトでは Chat Completions API を使用する。Responses API を使いたい場合は `api_type` を指定する:

```toml
[ai.providers.my-server]
base_url = "http://192.168.1.100:8080/v1"
default_model = "my-model"
api_type = "responses"
```

## `[cli]` — CLI 動作設定

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|:---:|----------|------|
| `command_timeout_ms` | `integer` | - | `30000` | コマンド実行のデフォルトタイムアウト（ミリ秒） |
| `max_agent_steps` | `integer` | - | `50` | エージェントループの最大ステップ数（1〜200） |

### 設定例

```toml
[cli]
command_timeout_ms = 60000
max_agent_steps = 100
```

- `command_timeout_ms`: 長時間実行するコマンド（大規模データ処理など）がタイムアウトする場合に増やす。
- `max_agent_steps`: 複雑なタスクでエージェントのステップ数が不足する場合に増やす。上限は 200。

## `[mcp]` — MCP サーバー設定

外部 MCP サーバーの接続情報を定義する。agent モードで `mcp:` プレフィックス付きのツールを使用する際に必要。

### `[mcp.servers.<name>]` — サーバー定義

transport の値によって必要なフィールドが異なる（discriminated union）。

#### stdio トランスポート

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:---:|------|
| `transport` | `"stdio"` | ✅ | トランスポート種別 |
| `command` | `string` | ✅ | 実行コマンド |
| `args` | `string[]` | - | コマンド引数 |
| `env` | `Record<string, string>` | - | 環境変数名のマップ（値は環境変数名、実行時に `process.env[値]` で解決） |

#### http トランスポート

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:---:|------|
| `transport` | `"http"` | ✅ | トランスポート種別 |
| `url` | `string` (URL) | ✅ | HTTP エンドポイント URL |
| `headers_env` | `Record<string, string>` | - | HTTP ヘッダーの環境変数名マップ（値は環境変数名、実行時に解決） |

#### sse トランスポート

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:---:|------|
| `transport` | `"sse"` | ✅ | トランスポート種別 |
| `url` | `string` (URL) | ✅ | SSE エンドポイント URL |
| `headers_env` | `Record<string, string>` | - | HTTP ヘッダーの環境変数名マップ |

### マージ戦略

同名サーバーはプロジェクト側が**丸ごと上書き**する（フィールド単位マージなし）。transport 自体が変わりうるため。

### 設定例

```toml
# stdio: ローカルコマンドで MCP サーバーを起動
[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_TOKEN = "GITHUB_TOKEN" }

# http: リモート MCP サーバーに接続
[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/mcp"
headers_env = { Authorization = "MCP_API_TOKEN" }

# sse: SSE エンドポイントに接続
[mcp.servers.local-db]
transport = "sse"
url = "http://localhost:3001/sse"
```

詳細は [MCP クライアント仕様](MCP-SPEC.md) を参照。

## `[hooks]` — ライフサイクルフック設定

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|:---:|----------|------|
| `on_success` | `string[]` | - | `[]` | スキル成功時に実行するコマンド群 |
| `on_failure` | `string[]` | - | `[]` | スキル失敗時に実行するコマンド群 |

マージ戦略: プロジェクト設定がグローバル設定を上書き（フィールド単位）。

### フックに渡される環境変数

フックコマンド実行時、以下の環境変数が自動的に設定される:

| 環境変数 | 説明 |
|---------|------|
| `TASKP_SESSION_ID` | セッション ID（`tskp_xxxxx` 形式） |
| `TASKP_SKILL_NAME` | 実行したスキル名 |
| `TASKP_ACTION_NAME` | 実行したアクション名（アクションなしの場合は空文字） |
| `TASKP_SKILL_REF` | スキル参照（`skill` または `skill:action` 形式） |
| `TASKP_MODE` | 実行モード（`template` \| `agent`） |
| `TASKP_STATUS` | 実行結果（`success` \| `failed`） |
| `TASKP_DURATION_MS` | 実行時間（ミリ秒） |
| `TASKP_ERROR` | エラーメッセージ（失敗時、最大 1024 文字） |
| `TASKP_CALLER_SKILL` | 呼び出し元スキル名（`taskp_run` 経由の場合） |
| `TASKP_HOOK_PHASE` | フックフェーズ（`before` / `after` / `on_failure` / `on_success`）。グローバル hooks では `on_success` または `on_failure` |
| `TASKP_OUTPUT_FILE` | スキル出力ファイルの絶対パス（[出力フォワーディング](SKILL-SPEC.md#出力フォワーディング)参照） |

### スキル単位フックとの関係

`config.toml` のグローバル hooks に加え、SKILL.md フロントマターでスキル/アクション単位のフックを定義できる。詳細は [スキル仕様 — スキル単位フック](SKILL-SPEC.md#スキル単位フック) を参照。

#### 実行順序

```
① skill hooks.before       ← SKILL.md で定義（失敗→スキル中断）
② スキル本体実行
③ skill hooks.after         ← SKILL.md で定義（常に実行、warning only）
④ skill hooks.on_failure    ← SKILL.md で定義（失敗時のみ、warning only）
⑤ global hooks.on_success   ← config.toml で定義（成功時のみ、warning only）
   or on_failure             ← config.toml で定義（失敗時のみ、warning only）
```

スキル hooks とグローバル hooks はマージされず、独立して順次実行される。

- **スキル hooks**: スキル固有のセットアップ・クリーンアップ（`git stash`, バックアップ等）
- **グローバル hooks**: 横断的関心事（通知、ログ記録等）

### 設定例

```toml
[hooks]
on_success = ["echo 'done'"]
on_failure = ["echo 'failed'"]
```

セッション ID を利用したフックの例:

```toml
[hooks]
on_success = ["curl -X POST https://api.example.com/notify -d '{\"session\":\"'$TASKP_SESSION_ID'\"}'"]
on_failure = ["echo \"Session $TASKP_SESSION_ID failed: $TASKP_ERROR\""]
```

出力ファイルを利用したフックの例:

```toml
[hooks]
on_success = ["cp \"$TASKP_OUTPUT_FILE\" \"logs/${TASKP_SKILL_REF}_$(date +%Y%m%d).log\" 2>/dev/null || true"]
```
