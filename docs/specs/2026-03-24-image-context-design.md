# 画像コンテキスト対応設計

## 概要

スキルの `context:` に `type: image` を追加し、画像ファイルをマルチモーダルコンテンツとして LLM に送信できるようにする。これに伴い、agent 実行のプロンプト送信を `prompt: string` から `messages` 配列形式に移行する。

## ユースケース

- デザインモック（Figma エクスポート等）を渡して UI 実装させる
- スキャン画像・請求書から OCR でテキスト抽出する
- アーキテクチャ図・ER 図を読み取らせて分析させる
- エラー画面のスクリーンショットを渡してデバッグさせる

## 設計方針

- **明示的な `type: image`**: ファイル拡張子による自動判別ではなく、スキル作者が意図的に画像を指定する
- **トップダウン実装（アプローチ B）**: まず messages 形式への移行（リファクタ）、次に画像コンテキスト追加、最後に E2E 統合
- **既存動作を壊さない**: テキストのみのスキルは Issue 1 完了時点で全テストがパスすること

## SKILL.md 記述例

```yaml
---
name: analyze-image
description: 画像を分析してフィードバックを返す
mode: agent
inputs:
  - name: image_path
    type: text
    message: "分析する画像のパスは？"
  - name: focus
    type: text
    message: "何に注目して分析しますか？（空欄で全般）"
    required: false
context:
  - type: image
    path: "{{image_path}}"
tools:
  - read
---

# 画像分析

提供された画像を分析してください。

{{#if focus}}
特に **{{focus}}** に注目してください。
{{/if}}
```

---

## agent-loop.ts と agent-executor.ts の関係

本プロジェクトには `streamText` を呼ぶ箇所が2つある。

| ファイル | 役割 | 呼び出し元 |
|---------|------|-----------|
| `src/adapter/agent-executor.ts` | **本番パス**。TUI/CLI の両方から `AgentExecutorPort` 経由で呼ばれる | `run-agent-skill.ts` → `AgentExecutorPort.execute()` |
| `src/core/execution/agent-loop.ts` | **未使用コード**。テスト (`agent-loop.test.ts`) からのみ参照。本番コードからの呼び出しなし | なし（テストのみ） |

`agent-loop.ts` は `createAgentLoop()` をエクスポートするが、`src/` 内のどのモジュールからもインポートされていない。`agent-executor.ts` が `AgentExecutorPort` を実装する唯一の本番パスである。

**本設計の方針**: `agent-executor.ts`（本番パス）のみを変更する。`agent-loop.ts` は本設計のスコープ外とし、将来的に削除またはテストユーティリティとして整理する判断は別途行う。

---

## Issue 1: agent-executor を messages 形式に移行

### 目的

現在の `prompt: string` を AI SDK の `messages` 配列形式に変更するリファクタ。画像はまだ扱わない。テキストのみで既存動作と完全に同じ結果になること。

### 変更対象

| ファイル | 変更内容 |
|---------|---------|
| `src/adapter/agent-executor.ts` | `streamText({ prompt })` → `streamText({ messages })` |
| `src/usecase/port/agent-executor.ts` | `AgentExecutorInput` の型変更（`prompt: string` → `contentParts: readonly ContentPart[]`） |
| `src/usecase/run-agent-skill.ts` | コンテキスト文字列を `TextPart` として `contentParts` に変換して渡す |

`agent-loop.ts` は変更しない（本番コードから未使用のため）。

### ContentPart 型

core 層を AI SDK に依存させないため、taskp 独自の型を定義する。AI SDK 型への変換は adapter 層で行う。

```typescript
// src/core/execution/content-part.ts

type TextPart = {
  readonly type: 'text';
  readonly text: string;
};

type ImagePart = {
  readonly type: 'image';
  readonly data: Uint8Array;
  readonly mediaType: string;
};

type ContentPart = TextPart | ImagePart;
```

`ImagePart` はこの Issue では使用しないが、型定義のみ先行する。

### adapter 層での AI SDK 型変換

`agent-executor.ts` で taskp の `ContentPart` を AI SDK が受け取る形式に変換する。

```typescript
// src/adapter/agent-executor.ts

function toAiSdkContent(parts: readonly ContentPart[]) {
  return parts.map(part => {
    switch (part.type) {
      case 'text':
        return { type: 'text' as const, text: part.text };
      case 'image':
        return { type: 'image' as const, image: part.data, mimeType: part.mediaType };
    }
  });
}

// streamText 呼び出し
streamText({
  model: input.model,
  system: input.systemPrompt,
  messages: [{
    role: 'user' as const,
    content: toAiSdkContent(input.contentParts),
  }],
  tools,
  stopWhen: stepCountIs(input.maxSteps),
})
```

### Before / After

**Before (`run-agent-skill.ts`):**
```typescript
const prompt = promptParts.join("\n\n");
await deps.agentExecutor.execute({ ..., prompt });
```

**After (`run-agent-skill.ts`):**
```typescript
const contentParts: ContentPart[] = [{ type: 'text', text: promptParts.join("\n\n") }];
await deps.agentExecutor.execute({ ..., contentParts });
```

### テスト方針

- `agent-executor.test.ts` — `streamText` に渡される引数が `messages` 形式であることを検証（AI SDK モックレベル）
- `run-agent-skill.test.ts` — コンテキスト文字列が `contentParts: [TextPart]` に変換されることを検証
- `agent-loop.test.ts` — 変更なし（スコープ外）
- 既存テスト全パス

### 受け入れ基準

- [ ] `streamText` が `messages` 形式で呼ばれる
- [ ] core 層が AI SDK に依存しない（`ContentPart` は純粋な TypeScript 型）
- [ ] 既存テスト全パス
- [ ] `taskp run code-review` が CLI / TUI 両方で従来通り動作する

---

## Issue 2: context-source スキーマに image タイプ追加 + collector で画像バイナリ収集

### 目的

SKILL.md の `context:` に `type: image` を追加し、画像ファイルをバイナリとして読み込めるようにする。

### スキーマ変更

```typescript
// src/core/skill/context-source.ts に追加

const imageSourceSchema = z.object({
  type: z.literal("image"),
  path: z.string(),
});

// discriminatedUnion に追加
export const contextSourceSchema = z.discriminatedUnion("type", [
  fileSourceSchema,
  globSourceSchema,
  commandSourceSchema,
  urlSourceSchema,
  imageSourceSchema,  // 追加
]);
```

### `getContextSourceValue` / `withResolvedValue` の image 対応

`image` タイプは `file` タイプと同様に `path` フィールドを持つ。変数展開（`{{image_path}}` → 実際のパス）はこれらの関数経由で行われるため、対応が必須。

```typescript
// getContextSourceValue に追加
case "image":
  return source.path;

// withResolvedValue に追加
case "image":
  return { ...source, path: value };
```

これにより `context: [{ type: image, path: "{{image_path}}" }]` の変数展開が正しく動作する。

### CollectedContext 型の変更

`CollectedContext` は adapter 層ではなく **`src/usecase/port/context-collector.ts`（port 層）** に定義する。usecase 層と adapter 層の両方が参照するため、port に配置して依存方向を正しく保つ。

**Before:**
```typescript
// src/adapter/context-collector.ts 内のローカル型
type CollectedContext = {
  readonly source: ContextSource;
  readonly content: string;
};
```

**After:**
```typescript
// src/usecase/port/context-collector.ts にエクスポート
export type CollectedContext =
  | { readonly kind: 'text'; readonly source: ContextSource; readonly content: string }
  | { readonly kind: 'image'; readonly source: ContextSource; readonly data: Uint8Array; readonly mediaType: string };
```

### ContextCollectorPort の変更

**Before:**
```typescript
collect(sources, cwd): Promise<Result<string, ExecutionError>>
```

**After:**
```typescript
collect(sources, cwd): Promise<Result<readonly CollectedContext[], ExecutionError>>
```

### mediaType 判定

拡張子ベースで判定する。未知の拡張子はエラー。

| 拡張子 | mediaType | 備考 |
|--------|-----------|------|
| `.png` | `image/png` | |
| `.jpg`, `.jpeg` | `image/jpeg` | |
| `.gif` | `image/gif` | |
| `.webp` | `image/webp` | |

SVG (`image/svg+xml`) は **サポートしない**。主要な LLM プロバイダ（Anthropic, OpenAI）の vision API が SVG を受け付けないため、スキーマバリデーションを通過しても LLM 呼び出し時に不明瞭なエラーになる。将来プロバイダ対応が進んだ段階で追加を検討する。

### 画像読み込み実装

```typescript
// context-collector.ts に追加

async function collectImage(
  path: string,
  cwd: string,
): Promise<Result<readonly CollectedContext[], ExecutionError>> {
  const fullPath = join(cwd, path);
  const mediaType = resolveImageMediaType(fullPath);
  if (!mediaType.ok) return mediaType;

  return tryCatch(
    async () => {
      const data = new Uint8Array(await readFile(fullPath));
      return [{ kind: 'image' as const, source: { type: 'image' as const, path }, data, mediaType: mediaType.value }];
    },
    () => executionError(`Failed to read image: ${fullPath}`),
  );
}
```

### 既存テキストコンテキストの CollectedContext 対応

既存の `file`, `glob`, `command`, `url` コレクターも `CollectedContext` 形式に変更する。

```typescript
// Before: return [{ source, content }]
// After:  return [{ kind: 'text', source, content }]
```

### 影響箇所

| ファイル | 変更内容 |
|---------|---------|
| `src/core/skill/context-source.ts` | `imageSourceSchema` 追加、`getContextSourceValue` / `withResolvedValue` に `image` case 追加 |
| `src/usecase/port/context-collector.ts` | `CollectedContext` 型定義を追加、`ContextCollectorPort.collect` の戻り値型変更 |
| `src/adapter/context-collector.ts` | `collectImage` 追加、既存コレクターの戻り値を `CollectedContext` 形式に変更 |
| `src/usecase/run-agent-skill.ts` | `string` → `CollectedContext[]` を受け取り `ContentPart[]` に変換 |
| `src/adapter/context-collector-deps.ts` | 変更なし（画像読み込みは `readFile` で直接行う） |
| `docs/SKILL-SPEC.md` | `image` タイプのドキュメント追加 |

### テスト方針

- `context-source.test.ts`（既存の `skill-metadata.test.ts` 等に追加） — image スキーマのパース検証
- `context-collector.test.ts` — 画像ファイル読み込み、mediaType 判定、存在しないファイルのエラー、未知拡張子のエラー
- `run-agent-skill.test.ts` — `CollectedContext[]` → `ContentPart[]` 変換の検証

### 受け入れ基準

- [ ] `type: image` がスキルフロントマターでパース可能
- [ ] 画像ファイルが `Uint8Array` + mediaType として収集される
- [ ] 未知の拡張子（`.svg`, `.bmp` 等）でエラーが返る
- [ ] 存在しない画像パスでエラーが返る
- [ ] `{{変数}}` が image の path 内で正しく展開される
- [ ] 既存のテキスト context（file, glob, command, url）が正常動作
- [ ] `CollectedContext` 型が `src/usecase/port/context-collector.ts` に定義されている
- [ ] 既存テスト全パス

---

## Issue 3: E2E 統合 + サンプルスキル

### 目的

Issue 1 と Issue 2 を結合し、画像 context が実際に LLM へマルチモーダルメッセージとして送信されることを確認する。サンプルスキルを追加する。

### 変換ロジック

`run-agent-skill.ts` で `CollectedContext[]` → `ContentPart[]` 変換を行う。

```typescript
function toContentParts(contexts: readonly CollectedContext[]): readonly ContentPart[] {
  return contexts.map(ctx => {
    switch (ctx.kind) {
      case 'text':
        return { type: 'text' as const, text: ctx.content };
      case 'image':
        return { type: 'image' as const, data: ctx.data, mediaType: ctx.mediaType };
    }
  });
}
```

### content parts の順序

content parts はソース定義順を維持する。スキル本文の `TextPart` が先頭、続いて `context:` 配列の定義順に並ぶ。テキストと画像のグルーピングは行わない。

```yaml
context:
  - type: file
    path: "README.md"
  - type: image
    path: "mockup.png"
  - type: command
    run: "git log -5"
```

この場合の content parts:
```
[TextPart(スキル本文), TextPart(README.md), ImagePart(mockup.png), TextPart(git log)]
```

LLM はテキストと画像が混在する content parts を正しく処理できる（AI SDK / プロバイダ共に対応済み）。

### 実行フロー変更

**Before:**
```
context 収集 → string 結合 → prompt: string → streamText({ prompt })
```

**After:**
```
context 収集 → CollectedContext[] → ContentPart[]
スキル本文 → TextPart（先頭に挿入）
                ↓
messages: [{ role: 'user', content: ContentPart[] }]
                ↓
adapter 層で AI SDK 型に変換 → streamText({ messages })
```

### サンプルスキル

`skills/analyze-image/SKILL.md` を追加（本ドキュメント冒頭の SKILL.md 記述例を参照）。

### テスト方針

- E2E テスト — 画像 context を含むスキルを `taskp run` で実行し、`AgentExecutorPort.execute()` に渡される `contentParts` にテキストと画像の両方が含まれることを検証（port レベルでモック。実際の LLM / HTTP 呼び出しは行わない）
- 既存 E2E テスト全パス

### 受け入れ基準

- [ ] `taskp run analyze-image --set image_path=test.png` で `contentParts` に `ImagePart` が含まれる
- [ ] content parts がソース定義順で並ぶ（スキル本文 → context 定義順）
- [ ] テキスト context のみのスキル（code-review 等）は動作変わらず
- [ ] CLI / TUI 両方で動作する
- [ ] サンプルスキル `analyze-image` が `skills/` に存在する
- [ ] `docs/SKILL-SPEC.md` が更新されている

---

## 実装順序と依存関係

```
Issue 1 (messages 移行)
    ↓
Issue 2 (image context + collector)
    ↓
Issue 3 (E2E 統合 + サンプル)
```

各 Issue は前の Issue の完了を前提とする。Issue 1 はリファクタのみで機能追加なし。Issue 2 はスキーマとデータ層の変更。Issue 3 で統合して動作確認。
