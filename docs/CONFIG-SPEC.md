# taskp — 設定ファイル仕様

## 概要

taskp は TOML 形式の設定ファイルで AI/LLM プロバイダを構成する。

| パス | 用途 |
|------|------|
| `~/.taskp/config.toml` | グローバル設定（全プロジェクト共通） |
| `.taskp/config.toml` | プロジェクト設定（プロジェクト固有） |

マージ順序: **グローバル → プロジェクト**（プロジェクト設定が優先）

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
4. エラー
```

プロバイダ解決:

```
1. "provider/model" 形式で指定      → provider 部分を使用
2. モデル名のみ指定                 → ai.default_provider を適用
3. 未指定                           → エラー
```

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

### 設定例

```toml
[cli]
command_timeout_ms = 60000
```

長時間実行するコマンド（大規模データ処理など）がタイムアウトする場合に増やす。
