# エージェントツール拡張設計（grep / edit / fetch）

## 概要

agent モードの組み込みツールに `grep`、`edit`、`fetch` の3つを追加する。いずれも `bash` ツールで代用可能だが、専用ツールとして提供することで LLM の判断精度とトークン効率を向上させる。

## 背景

主要な AI エージェント（Claude Code, Cursor, Cline, Codex）はすべて「テキスト検索」「部分編集」の専用ツールを持つ。taskp の現状では `bash` でこれらを実行できるが、LLM がシェルコマンドの組み立てに余計なトークンを消費し、OS 依存のコマンド差異（grep vs ripgrep、BSD grep vs GNU grep 等）で失敗するリスクもある。

## 設計方針

- **既存アーキテクチャに乗せる**: `agent-tools.ts` の `staticTools` に追加、`TOOL_NAMES` に登録するだけ
- **デフォルト無効**: 既存スキルへの影響ゼロ。`tools:` で明示指定した場合のみ有効
- **3 Issue 独立**: 各ツールに依存関係なし。並列実装可能
- **クロスプラットフォーム**: シェルコマンドに依存せず、Node/Bun API のみで実装する

---

## Issue 1: `grep` ツール追加

### 目的

ファイル内容のテキスト検索を専用ツールとして提供する。LLM がコードベースの探索を効率的に行えるようにする。

### ツール定義

```typescript
const grepParams = z.object({
  pattern: z.string().describe("Search pattern (regex supported)"),
  path: z.string().optional().describe("File or directory to search (default: cwd)"),
  include: z.string().optional().describe("Glob pattern to filter files (e.g. '*.ts')"),
});
```

### 実装方針: 純粋 Node/Bun 実装

macOS の BSD grep は `--include` を未サポート。GNU grep との差異を回避するため、OS の `grep` コマンドは使わず Node/Bun API で実装する。

1. `include` 指定時: `node:fs/promises` の `glob()` でファイル一覧を取得（既存の `globTool` と同パターン）
2. `include` 未指定 + `path` がディレクトリ: `glob("**/*")` で再帰探索
3. `include` 未指定 + `path` がファイル: そのファイルのみ対象
4. 各ファイルを `readFile` で読み、`RegExp` でパターンマッチ
5. マッチ行を `ファイルパス:行番号:行内容` 形式で返す

```typescript
const MAX_GREP_MATCHES = 500;

const grepTool: Tool<GrepInput, GrepResult> = {
  description: "Search file contents for a pattern and return matching lines with file paths and line numbers",
  inputSchema: zodToJsonSchema(grepParams),
  execute: async ({ pattern, path, include }) => {
    const cwd = process.cwd();
    const searchPath = path ?? ".";
    const regex = new RegExp(pattern);

    // ファイル一覧を取得
    const files = await resolveSearchFiles(searchPath, include, cwd);

    const lines: string[] = [];
    for (const file of files) {
      if (lines.length >= MAX_GREP_MATCHES) break;
      const fullPath = join(cwd, file);
      try {
        const content = await readFile(fullPath, "utf-8");
        for (const [i, line] of content.split("\n").entries()) {
          if (regex.test(line)) {
            lines.push(`${file}:${i + 1}:${line}`);
            if (lines.length >= MAX_GREP_MATCHES) break;
          }
        }
      } catch {
        // バイナリファイル等の読み込み失敗はスキップ
      }
    }

    return {
      matches: lines.join("\n"),
      count: lines.length,
      truncated: lines.length >= MAX_GREP_MATCHES,
    };
  },
};
```

`resolveSearchFiles` は `include` があれば `glob(include, { cwd })` で、なければ対象パスがファイルかディレクトリかを判定して適切にファイル一覧を返す。

### 戻り値型

```typescript
type GrepResult = {
  readonly matches: string;     // パス:行番号:行内容（改行区切り）
  readonly count: number;       // マッチ数
  readonly truncated: boolean;  // MAX_GREP_MATCHES に達して打ち切られたか
};
```

### 変更対象

| ファイル | 変更内容 |
|---------|---------|
| `src/core/execution/agent-tools.ts` | `grepParams`、`grepTool`、`resolveSearchFiles` 追加。`TOOL_NAMES` に `"grep"` 追加、`staticTools` に登録、`PRIMARY_ARG_KEYS` に `grep: "pattern"` 追加。**注意**: `TOOL_NAMES` と `PRIMARY_ARG_KEYS` は連動する（`ToolName` 型が `TOOL_NAMES` から派生し、`PRIMARY_ARG_KEYS` は全キーを要求する）。両方を同時に更新すること |
| `docs/AI-SPEC.md` | ツール一覧に `grep` 追加 |
| `docs/SKILL-SPEC.md` | ツール一覧に `grep` 追加 |

### テスト

- `tests/core/execution/agent-tools.test.ts` — `buildTools` に `"grep"` を渡してツールが生成されること
- grep の実行テスト — 一時ディレクトリにファイルを作成し:
  - パターンマッチの結果がファイルパス・行番号付きで返ること
  - `include` でファイル種別を絞り込めること
  - マッチなしの場合は空文字列・count: 0 で返ること（エラーにしない）
  - `MAX_GREP_MATCHES` で打ち切りが発生すること
  - 不正な正規表現でエラーが返ること

### 受け入れ基準

- [ ] `tools: [grep]` を含むスキルで `grep` ツールが LLM に提供される
- [ ] パターンマッチ結果がファイルパス・行番号付きで返る
- [ ] `include` でファイル種別を絞り込める
- [ ] マッチなしの場合は空文字列・count: 0 を返す（エラーにしない）
- [ ] 結果が 500 件を超えると打ち切り（`truncated: true`）
- [ ] OS の `grep` コマンドに依存しない（純粋 Node/Bun 実装）
- [ ] デフォルトでは無効（既存スキルに影響なし）
- [ ] 既存テスト全パス

---

## Issue 2: `edit` ツール追加

### 目的

ファイルの部分編集（文字列置換）を専用ツールとして提供する。`write` によるファイル全体の上書きを避け、大きなファイルの一部修正を効率的に行えるようにする。

### ツール定義

```typescript
const editParams = z.object({
  path: z.string().describe("File path to edit"),
  oldString: z.string().describe("The exact string to find and replace"),
  newString: z.string().describe("The replacement string"),
});
```

### 実装

既存の `readTool` / `writeTool` と同じエラーハンドリングパターン（`try/catch` で wrap）に従う。

```typescript
const editTool: Tool<EditInput, string> = {
  description: "Replace a specific string in a file. The oldString must match exactly one location in the file.",
  inputSchema: zodToJsonSchema(editParams),
  execute: async ({ path, oldString, newString }) => {
    const fullPath = resolve(process.cwd(), path);

    let content: string;
    try {
      content = await readFile(fullPath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read file: ${path}`, { cause: error });
    }

    const index = content.indexOf(oldString);
    if (index === -1) {
      throw new Error(`String not found in ${path}`);
    }

    // 複数マッチの検出（意図しない箇所を書き換えるのを防ぐ）
    const secondIndex = content.indexOf(oldString, index + 1);
    if (secondIndex !== -1) {
      throw new Error(
        `Multiple matches found in ${path}. Provide more context in oldString to uniquely identify the location.`
      );
    }

    const updated = content.slice(0, index) + newString + content.slice(index + oldString.length);

    try {
      await writeFile(fullPath, updated, "utf-8");
    } catch (error) {
      throw new Error(`Failed to write file: ${path}`, { cause: error });
    }

    return `Edited ${path}`;
  },
};
```

### エラーケース

| ケース | 挙動 |
|--------|------|
| ファイルが存在しない | `Error: Failed to read file: <path>` |
| `oldString` が見つからない | `Error: String not found in <path>` |
| `oldString` が複数箇所にマッチ | `Error: Multiple matches found in <path>. Provide more context...` |
| ファイルが書き込み不可 | `Error: Failed to write file: <path>` |

### 変更対象

| ファイル | 変更内容 |
|---------|---------|
| `src/core/execution/agent-tools.ts` | `editParams`、`editTool` 追加。`TOOL_NAMES` に `"edit"` 追加、`staticTools` に登録、`PRIMARY_ARG_KEYS` に `edit: "path"` 追加。`TOOL_NAMES` と `PRIMARY_ARG_KEYS` は同時更新 |
| `docs/AI-SPEC.md` | ツール一覧に `edit` 追加 |
| `docs/SKILL-SPEC.md` | ツール一覧に `edit` 追加 |

### テスト

- `tests/core/execution/agent-tools.test.ts` — `buildTools` に `"edit"` を渡してツールが生成されること
- edit の実行テスト — 一時ファイルに対して:
  - 正常な置換（ファイル内容が部分的に変わること）
  - `oldString` が見つからない場合のエラー
  - 複数マッチ時のエラー
  - 存在しないファイルのエラー

### 受け入れ基準

- [ ] `tools: [edit]` を含むスキルで `edit` ツールが LLM に提供される
- [ ] ファイルの一部だけが正確に置換される
- [ ] マッチなし・複数マッチ・ファイル不在で適切なエラーメッセージが返る
- [ ] エラーメッセージが既存ツール（`readTool`, `writeTool`）と一貫したフォーマット
- [ ] デフォルトでは無効（既存スキルに影響なし）
- [ ] 既存テスト全パス

---

## Issue 3: `fetch` ツール追加

### 目的

URL からテキストコンテンツを取得するツールを提供する。エージェント実行中にドキュメントや API リファレンスを能動的に取得できるようにする。

### context の `url` タイプとの違い

| | context `url` | `fetch` ツール |
|---|---|---|
| 実行タイミング | スキル実行前（静的） | エージェント実行中（動的） |
| URL の決定者 | スキル作者 | LLM |
| 用途 | 事前に決まったドキュメント | 必要に応じた調査・参照 |

### ツール定義

```typescript
const fetchParams = z.object({
  url: z.string().url().describe("URL to fetch (http or https only)"),
  maxLength: z.number().optional().describe("Maximum response length in characters (default: 50000)"),
});
```

### URL バリデーション

LLM が URL を自由に決定するため、SSRF（Server-Side Request Forgery）対策が必要。

```typescript
function validateFetchUrl(url: string): void {
  const parsed = new URL(url);

  // http/https のみ許可（file://, ftp:// 等を拒否）
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported protocol: ${parsed.protocol}. Only http and https are allowed.`);
  }

  // ループバック・プライベートアドレスを拒否
  const hostname = parsed.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.") ||
    hostname.startsWith("192.168.") ||
    hostname === "169.254.169.254"  // クラウドメタデータエンドポイント
  ) {
    throw new Error(`Access to internal/private addresses is not allowed: ${hostname}`);
  }
}
```

### 実装

```typescript
const MAX_FETCH_LENGTH = 50_000;
const FETCH_TIMEOUT_MS = 30_000;

const fetchTool: Tool<FetchInput, FetchResult> = {
  description: "Fetch text content from a URL (http/https only). Useful for reading documentation, API references, or web pages.",
  inputSchema: zodToJsonSchema(fetchParams),
  execute: async ({ url, maxLength }) => {
    validateFetchUrl(url);

    const limit = maxLength ?? MAX_FETCH_LENGTH;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // テキスト以外のレスポンスを拒否
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/") && !contentType.includes("application/json") && !contentType.includes("application/xml")) {
      throw new Error(`Non-text content type: ${contentType}. Only text content is supported.`);
    }

    const text = await response.text();
    const truncated = text.length > limit;
    const content = truncated ? text.slice(0, limit) : text;

    return { content, truncated, length: text.length };
  },
};
```

### 戻り値型

```typescript
type FetchResult = {
  readonly content: string;     // 取得したテキスト（maxLength で切り詰め済み）
  readonly truncated: boolean;  // 切り詰めが発生したか
  readonly length: number;      // 元のテキスト全体の長さ
};
```

### エラーケース

| ケース | 挙動 |
|--------|------|
| `file://` や `ftp://` などの非 HTTP スキーム | `Error: Unsupported protocol: ...` |
| localhost / プライベート IP | `Error: Access to internal/private addresses is not allowed: ...` |
| HTTP エラー（404, 500 等） | `Error: HTTP <status>: <statusText>` |
| 非テキストコンテンツ（画像、バイナリ等） | `Error: Non-text content type: ...` |
| タイムアウト（30秒超過） | AbortError（fetch の標準動作） |

### 変更対象

| ファイル | 変更内容 |
|---------|---------|
| `src/core/execution/agent-tools.ts` | `fetchParams`、`fetchTool`、`validateFetchUrl` 追加。`TOOL_NAMES` に `"fetch"` 追加、`staticTools` に登録、`PRIMARY_ARG_KEYS` に `fetch: "url"` 追加。`TOOL_NAMES` と `PRIMARY_ARG_KEYS` は同時更新 |
| `docs/AI-SPEC.md` | ツール一覧に `fetch` 追加 |
| `docs/SKILL-SPEC.md` | ツール一覧に `fetch` 追加 |

### テスト

- `tests/core/execution/agent-tools.test.ts` — `buildTools` に `"fetch"` を渡してツールが生成されること
- `validateFetchUrl` のユニットテスト:
  - `https://example.com` → OK
  - `http://example.com` → OK
  - `file:///etc/passwd` → エラー
  - `http://localhost:8080` → エラー
  - `http://127.0.0.1` → エラー
  - `http://169.254.169.254` → エラー
  - `http://192.168.1.1` → エラー
- 切り詰めロジック（`maxLength` による）のユニットテスト（関数切り出し）

### 受け入れ基準

- [ ] `tools: [fetch]` を含むスキルで `fetch` ツールが LLM に提供される
- [ ] http/https の URL のみ許可される
- [ ] `file://`、localhost、プライベート IP がブロックされる
- [ ] 非テキストレスポンスがエラーになる
- [ ] `maxLength` で出力が切り詰められる（デフォルト 50,000 文字）
- [ ] HTTP エラー時に適切なエラーメッセージが返る
- [ ] タイムアウト（30秒）が設定されている
- [ ] デフォルトでは無効（既存スキルに影響なし）
- [ ] 既存テスト全パス

---

## ツール一覧（拡張後）

| ツール名 | 説明 | デフォルト |
|---------|------|:---------:|
| `bash` | シェルコマンドを実行する | ✅ |
| `read` | ファイルを読み込む | ✅ |
| `write` | ファイルに書き込む | ✅ |
| `glob` | パターンマッチでファイルを検索 | ❌ |
| `grep` | ファイル内容をテキスト検索する | ❌ |
| `edit` | ファイルの一部を置換する | ❌ |
| `fetch` | URL からテキストを取得する | ❌ |
| `ask_user` | ユーザーに質問する | ❌ |
| `taskp_run` | 別の taskp スキルを実行する | ❌ |

新規3ツールはすべてデフォルト無効。`tools:` で明示指定した場合のみ有効。

## 実装順序

3つの Issue に依存関係はない。並列実装可能。
