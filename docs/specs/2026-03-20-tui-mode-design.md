# TUI モード設計

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `taskp tui` コマンドでフルスクリーン TUI を起動し、スキルの検索・選択・入力・実行をリッチな画面で行えるようにする。

**Architecture:** OpenTUI（`@opentui/core`）の Construct API を使い、3 画面（スキル選択 → 入力フォーム → 実行表示）の遷移型 TUI を構築する。既存の CLI（`taskp run <skill>`）はそのまま維持し、TUI は独立したエントリポイントとして追加する。

**Tech Stack:** OpenTUI (`@opentui/core`)、fuzzysort（ファジー検索）、既存の adapter 層を再利用

---

## 1. 要件

### 1.1 機能要件

| ID | 要件 | 優先度 |
|---|---|---|
| F1 | `taskp tui` コマンドで TUI を起動する | 必須 |
| F2 | スキル一覧を fzf 風ファジー検索で絞り込み・選択できる | 必須 |
| F3 | 選択したスキルの inputs を TUI 上で入力できる | 必須 |
| F4 | agent モード実行中のストリーミングをリアルタイム表示する | 必須 |
| F5 | ツール呼び出し時にスピナー + ツール名 + 引数サマリを表示する | 必須 |
| F6 | ツール結果のサマリを表示する | 必須 |
| F7 | template モードのコマンド実行結果を表示する | 必須 |
| F8 | 実行完了後にサマリ（所要時間・ステップ数）を表示する | 必須 |
| F9 | Ctrl+C で安全に終了できる | 必須 |
| F10 | `taskp run <skill>` は既存動作を維持する | 必須 |

### 1.2 非機能要件

- OpenTUI の Construct API（宣言的 API）を優先して使う
- 既存の usecase / adapter 層を直接変更せず、port を介して TUI 用の adapter を追加する
- `@opentui/core` のみ使用（React/SolidJS バインディングは使わない）

---

## 2. 画面設計

### 2.1 画面遷移

```
[起動] → [スキル選択画面] → [入力フォーム画面] → [実行画面] → [完了 or 戻る]
                 ↑                                         |
                 └─────────────────────────────────────────┘
```

### 2.2 スキル選択画面

```
┌─ taskp ───────────────────────────────────────────┐
│                                                    │
│  🔍 Search: code-r█                                │
│                                                    │
│  ┌────────────────────────────────────────────────┐│
│  │ ▸ code-review     コードレビューを実行する     ││
│  │   find-refactoring リファクタリング箇所を検出  ││
│  │   deploy          アプリケーションをデプロイ   ││
│  └────────────────────────────────────────────────┘│
│                                                    │
│  ↑↓ 移動  Enter 選択  Esc 終了                     │
└────────────────────────────────────────────────────┘
```

**コンポーネント構成:**
- `InputRenderable` — 検索入力欄
- `SelectRenderable` — フィルタ済みスキルリスト（name + description 表示）
- `TextRenderable` — キーバインドヘルプ

**検索ロジック:**
- `fuzzysort` で `name` と `description` を対象にファジーマッチ
- 入力ごとに `SelectRenderable.setOptions()` でリストを更新

### 2.3 入力フォーム画面

```
┌─ find-refactoring ────────────────────────────────┐
│                                                    │
│  リファクタリング箇所を検出し、Issue として起票する │
│                                                    │
│  対象のファイルまたはディレクトリは？               │
│  ┌──────────────────────────────────────┐          │
│  │ src█                                 │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  リファクタリング観点を選んでください               │
│  ┌──────────────────────────────────────┐          │
│  │ ▸ naming                             │          │
│  │   srp                                │          │
│  │   dry                                │          │
│  └──────────────────────────────────────┘          │
│                                                    │
│  Tab 次へ  Shift+Tab 前へ  Enter 実行  Esc 戻る    │
└────────────────────────────────────────────────────┘
```

**コンポーネント構成:**
- `ScrollBoxRenderable` — フォーム全体（スクロール可能）
- `TextRenderable` — ラベル（質問文）
- `InputRenderable` — text / number / password 入力
- `SelectRenderable` — select 入力
- `TextRenderable` — confirm 入力（Y/N）

**Tab ナビゲーション:**
- Tab / Shift+Tab でフォーカスを次/前の入力へ移動
- Enter で全入力完了 → 実行画面へ

### 2.4 実行画面

```
┌─ find-refactoring [実行中] ───────────────────────┐
│                                                    │
│  ⣾ [bash] find src -name "*.ts" ...               │
│                                                    │
│  ┌─ 出力 ─────────────────────────────────────────┐│
│  │ ## 📋 リファクタリングレポート                  ││
│  │                                                 ││
│  │ **対象**: `src`                                  ││
│  │ **観点**: type-safety                            ││
│  │ **検出件数**: 3 件                               ││
│  │                                                 ││
│  │ ### [P1] any 型の使用                            ││
│  │ **ファイル**: `src/adapter/ai-provider.ts`       ││
│  │ **行**: L45                                      ││
│  │ ...                                              ││
│  └─────────────────────────────────────────────────┘│
│                                                    │
│  Done in 12.3s (8 steps)                           │
│                                                    │
│  Enter 戻る  Esc 終了                               │
└────────────────────────────────────────────────────┘
```

**コンポーネント構成:**
- `TextRenderable` — ヘッダー（スキル名 + ステータス）
- `TextRenderable` — ツールステータス行（スピナー + ツール名 + 引数サマリ）
- `ScrollBoxRenderable` + `MarkdownRenderable` — LLM 出力のストリーミング表示（streaming モード）
- `TextRenderable` — 完了サマリ

**ストリーミング表示:**
- `MarkdownRenderable({ streaming: true })` を使用
- `text-delta` イベントで `content` を追記していく
- ツール呼び出し時はステータス行を更新（スピナーアニメーション）
- `stickyScroll: true` + `stickyStart: "bottom"` で自動スクロール

---

## 3. アーキテクチャ

### 3.1 ファイル構成

```
src/
├── tui/                            ← 新規ディレクトリ
│   ├── app.ts                      ← TUI エントリポイント（renderer 作成・画面遷移制御）
│   ├── screens/
│   │   ├── skill-selector.ts       ← スキル選択画面
│   │   ├── input-form.ts           ← 入力フォーム画面
│   │   └── execution-view.ts       ← 実行画面
│   ├── components/
│   │   ├── fuzzy-select.ts         ← fzf 風検索 + 選択コンポーネント
│   │   ├── tool-status.ts          ← ツール呼び出しステータス表示
│   │   └── key-help.ts             ← キーバインドヘルプ
│   └── tui-stream-writer.ts        ← StreamWriter の TUI 実装
├── cli.ts                          ← tui コマンドを追加
└── ...
```

### 3.2 依存関係

```
cli.ts
  └── tui/app.ts
        ├── tui/screens/skill-selector.ts
        │     └── tui/components/fuzzy-select.ts
        ├── tui/screens/input-form.ts
        └── tui/screens/execution-view.ts
              └── tui/tui-stream-writer.ts

既存 adapter 層（変更なし）:
  ├── adapter/skill-loader.ts      ← SkillRepository
  ├── adapter/config-loader.ts     ← Config
  ├── adapter/ai-provider.ts       ← LanguageModel
  ├── adapter/context-collector.ts ← ContextCollector
  └── adapter/agent-executor.ts    ← AgentExecutor（StreamWriter を差し替えて再利用）

既存 usecase 層（変更なし）:
  ├── usecase/run-agent-skill.ts
  ├── usecase/run-skill.ts
  └── usecase/list-skills.ts
```

### 3.3 既存コードとの境界

**変更するファイル:**
- `src/cli.ts` — `tui` コマンドの追加（10 行程度）
- `package.json` — `@opentui/core`, `fuzzysort` 依存追加

**変更しないファイル:**
- `src/usecase/` — そのまま再利用
- `src/adapter/` — そのまま再利用（`StreamWriter` のインターフェースは同一）
- `src/core/` — 一切変更なし

### 3.4 StreamWriter の差し替え戦略

既存の `createAgentExecutor(writer: StreamWriter)` の設計を活かし、TUI 用の `StreamWriter` を注入する。

```typescript
// 既存（CLI 用）
const writer = createStreamWriter({ verbose: false, output: process.stdout });
const agentExecutor = createAgentExecutor(writer);

// TUI 用
const tuiWriter = createTuiStreamWriter(executionView);
const agentExecutor = createAgentExecutor(tuiWriter);
```

`TuiStreamWriter` は `StreamWriter` インターフェースを実装し、内部で OpenTUI のコンポーネントを更新する:

- `writeText()` → `MarkdownRenderable.content` に追記
- `writeToolCall()` → ステータス行のテキスト + スピナーを更新
- `writeToolResult()` → ステータス行をクリア
- `writeSummary()` → サマリテキストを表示

### 3.5 PromptCollector の差し替え戦略

既存の `createPromptRunner()` は `@inquirer/prompts` を使って CLI で質問する。TUI では入力フォーム画面がこの役割を担う。

```typescript
// TUI 用 PromptCollector
function createTuiPromptCollector(inputForm: InputFormScreen): PromptCollector {
  return {
    collect: (inputs, presets) => inputForm.collectInputs(inputs, presets),
  };
}
```

---

## 4. 主要コンポーネントの設計

### 4.1 `tui/app.ts` — アプリケーションコントローラ

#### 初期化シーケンス

```
1. createCliRenderer() で OpenTUI を初期化
2. createDefaultSkillLoader(cwd) でスキル一覧を取得
3. スキルが 0 件の場合は「No skills found.」を表示して終了
4. createDefaultConfigLoader(cwd).load() で config.toml を読み込み
5. resolveModelSpec() + createLanguageModel() で LLM モデルを解決
   - 解決失敗時は model = null とし、agent モード実行時にエラー表示
6. 画面遷移ループへ
```

#### 画面遷移ループ

```typescript
import { createCliRenderer } from "@opentui/core";

export async function startTui(): Promise<void> {
  const renderer = await createCliRenderer({ exitOnCtrlC: true });

  // 1. スキル一覧取得
  const skillRepository = createDefaultSkillLoader(process.cwd());
  const skills = await skillRepository.listAll();
  if (skills.length === 0) {
    renderer.destroy();
    console.log("No skills found.");
    return;
  }

  // 2. LLM モデル解決（失敗時は null → agent モード実行時にエラー表示）
  const model = await resolveModel();

  // 3. 画面遷移ループ
  while (true) {
    const skill = await showSkillSelector(renderer, skills);
    if (!skill) break; // Esc → TUI 終了

    const variables = await showInputForm(renderer, skill);
    if (!variables) continue; // Esc → スキル選択に戻る

    const action = await showExecution(renderer, skill, variables, model);
    if (action === "exit") break; // Esc → TUI 終了
    // "back" → ループ先頭のスキル選択に戻る
  }

  renderer.destroy();
}

// config.toml からデフォルトの LLM モデルを解決する。
// いずれかの段階で失敗した場合は null を返す（agent モード実行時にエラー表示）。
async function resolveModel(): Promise<LanguageModelV3 | null> {
  const configLoader = createDefaultConfigLoader(process.cwd());
  const configResult = await configLoader.load();
  if (!configResult.ok) return null;

  const aiConfig = configResult.value.ai ?? {};
  const specResult = resolveModelSpec({ config: aiConfig });
  if (!specResult.ok) return null;

  const modelResult = createLanguageModel(specResult.value, aiConfig);
  if (!modelResult.ok) return null;

  return modelResult.value;
}
```

#### PromptCollector の注入

TUI では入力フォーム画面が `PromptCollector` の役割を担う。
`showInputForm()` で値が確定済みなので、実行時は確定済みの値をそのまま返すダミーの `PromptCollector` を使う。

```typescript
// showExecution 内部で使用
const promptCollector: PromptCollector = {
  collect: async (_inputs, _presets) => variables, // 確定済みの値を返す
};
```

これにより `runAgentSkill()` の依存を変更せずに TUI から利用できる。

#### showExecution のエラーハンドリング

```typescript
async function showExecution(renderer, skill, variables, model): Promise<"back" | "exit"> {
  // agent モードで model が null の場合
  if (skill.metadata.mode === "agent" && model === null) {
    viewPort.appendOutput("❌ Error: LLM model not configured.\n");
    viewPort.appendOutput("Set default_provider and default_model in .taskp/config.toml\n");
    viewPort.showSummary(0, 0);
    // 完了後のキー待ち → "back" or "exit" を返す
  }

  // 実行中のエラーは try-catch で捕捉
  try {
    await executeSkill(skill, variables, model, viewPort);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    viewPort.appendOutput(`\n❌ Error: ${message}\n`);
    viewPort.showSummary(0, 0);
  }

  // 完了後: Enter → "back", Esc → "exit"
  return waitForAction(renderer);
}

// 実行完了後、ユーザーのキー操作を待って "back" or "exit" を返す
function waitForAction(renderer: CliRenderer): Promise<"back" | "exit"> {
  return new Promise((resolve) => {
    const handler = (key: { name: string }) => {
      if (key.name === "return") {
        renderer.keyInput.off("keypress", handler);
        resolve("back");
      }
      if (key.name === "escape") {
        renderer.keyInput.off("keypress", handler);
        resolve("exit");
      }
    };
    renderer.keyInput.on("keypress", handler);
  });
}

// スキルの実行を行う。agent モードでは StreamWriter 経由で出力し、
// template モードではコマンド結果を直接 viewPort に書き込む。
async function executeSkill(
  skill: Skill,
  variables: Readonly<Record<string, string>>,
  model: LanguageModelV3,
  viewPort: ExecutionViewPort,
): Promise<void> {
  if (skill.metadata.mode === "agent") {
    const writer = createTuiStreamWriter(viewPort);
    const agentExecutor = createAgentExecutor(writer);
    const contextCollector = createContextCollector(/* ... 既存と同じ依存 ... */);
    const promptCollector: PromptCollector = {
      collect: async () => variables as Record<string, string>,
    };

    await runAgentSkill(
      { name: skill.metadata.name, presets: variables, model },
      {
        skillRepository: { findByName: async () => ok(skill), listAll: async () => [], listLocal: async () => [], listGlobal: async () => [] },
        promptCollector,
        contextCollector,
        agentExecutor,
      },
    );
  } else {
    // template モード
    const commandExecutor = createCommandRunner();
    const promptCollector: PromptCollector = {
      collect: async () => variables as Record<string, string>,
    };

    const result = await runSkill(
      { name: skill.metadata.name, presets: variables, dryRun: false, force: false },
      {
        skillRepository: { findByName: async () => ok(skill), listAll: async () => [], listLocal: async () => [], listGlobal: async () => [] },
        promptCollector,
        commandExecutor,
      },
    );

    if (result.ok) {
      for (const cmd of result.value.commands) {
        viewPort.appendOutput(`\n$ ${cmd.command}\n`);
        if (cmd.result.stdout) viewPort.appendOutput(cmd.result.stdout);
        if (cmd.result.stderr) viewPort.appendOutput(cmd.result.stderr);
      }
      viewPort.showSummary(0, result.value.commands.length);
    } else {
      viewPort.appendOutput(`\n❌ Error: ${result.error.message}\n`);
      viewPort.showSummary(0, 0);
    }
  }
}
```

### 4.2 `tui/components/fuzzy-select.ts` — ファジー検索コンポーネント

```typescript
import fuzzysort from "fuzzysort";

// InputRenderable の INPUT イベントで検索を実行し、
// SelectRenderable の options を更新する
function filterSkills(query: string, skills: SkillOption[]): SkillOption[] {
  if (!query) return skills;
  const results = fuzzysort.go(query, skills, {
    keys: ["name", "description"],
  });
  return results.map(r => r.obj);
}
```

### 4.3 `tui/tui-stream-writer.ts` — TUI 用 StreamWriter

#### ExecutionViewPort インターフェース

```typescript
// TUI 用 StreamWriter が依存するビューのインターフェース。
// 実行画面（execution-view.ts）がこのインターフェースを実装する。
export type ExecutionViewPort = {
  readonly appendOutput: (text: string) => void;
  readonly showToolStatus: (toolName: string, args: Record<string, unknown>) => void;
  readonly clearToolStatus: () => void;
  readonly showSummary: (elapsedMs: number, steps: number) => void;
};
```

#### StreamWriter 実装

```typescript
import type { StreamWriter } from "../adapter/stream-writer";

export function createTuiStreamWriter(view: ExecutionViewPort): StreamWriter {
  return {
    writeText(text) {
      view.appendOutput(text); // MarkdownRenderable.content += text
    },
    writeToolCall(toolName, args) {
      view.showToolStatus(toolName, args); // スピナー + ツール情報
    },
    writeToolResult(_toolName, _result) {
      view.clearToolStatus(); // スピナー停止、ステータス行クリア
      // ツール結果の中身は表示しない（LLM が次の text-delta で要約する）
    },
    writeSummary(elapsedMs, steps) {
      view.showSummary(elapsedMs, steps); // 完了表示
    },
  };
}
```

### 4.4 `tui/components/key-help.ts` — キーバインドヘルプ

画面下部に表示するキーバインドの一覧。各画面が自分のキーバインドを `KeyBinding[]` として渡す。

```typescript
export type KeyBinding = {
  readonly key: string;        // 例: "↑↓", "Enter", "Esc"
  readonly description: string; // 例: "移動", "選択", "終了"
};

// Box(flexDirection: "row") の中に key=黄色, description=灰色 で横並び表示
export function KeyHelp(bindings: readonly KeyBinding[]): VNode;
```

各画面のキーバインド:

| 画面 | キーバインド |
|------|------------|
| スキル選択 | `↑↓` 移動 / `Enter` 選択 / `Esc` 終了 |
| 入力フォーム | `Tab` 次へ / `Shift+Tab` 前へ / `Enter` 確定 / `Esc` 戻る |
| 実行中 | （ヘルプ非表示） |
| 実行完了 | `Enter` 戻る / `Esc` 終了 |

---

## 5. エラーハンドリング

### 5.1 エラー分類と対応

| エラー | 発生箇所 | 対応 |
|--------|---------|------|
| スキル 0 件 | 初期化時 | renderer.destroy() して「No skills found.」を console.log |
| config.toml 読み込み失敗 | 初期化時 | model = null とし、agent モード実行時にエラーメッセージ表示 |
| LLM モデル解決失敗 | 初期化時 | 同上 |
| agent モードで model が null | 実行画面 | 「Error: LLM model not configured」を出力エリアに表示、サマリで完了扱い |
| LLM API エラー（401, 400 等） | 実行中 | try-catch で捕捉、出力エリアにエラーメッセージ表示 |
| template モードコマンド失敗 | 実行中 | 失敗したコマンドの stderr を表示、サマリに失敗数を含める |
| OpenTUI レンダリングエラー | 任意 | uncaughtException ハンドラで renderer.destroy() → process.exit(1) |

### 5.2 エッジケース

| ケース | 対応 |
|--------|------|
| 検索結果 0 件 | SelectRenderable に空の options を渡す（OpenTUI が空状態を表示） |
| inputs が 0 件のスキル | 入力フォームをスキップし、空の variables で実行画面へ直行 |
| 非常に長い LLM 出力 | ScrollBox + stickyScroll で自動スクロール。MarkdownRenderable が内部で処理 |
| ターミナルリサイズ | OpenTUI が自動対応（width: "100%", flexGrow 等の相対レイアウト） |

---

## 6. 画面遷移とフォーカス管理

### 5.1 画面遷移

各画面は `Promise` を返す関数として実装し、ユーザーの操作結果を戻り値で返す。

```typescript
// スキル選択 → Skill | null（null = TUI 終了）
async function showSkillSelector(renderer, skills): Promise<Skill | null>

// 入力フォーム → Record<string, string> | null（null = スキル選択に戻る）
async function showInputForm(renderer, skill): Promise<Record<string, string> | null>

// 実行画面 → "back"（スキル選択に戻る）| "exit"（TUI 終了）
async function showExecution(renderer, skill, variables, model): Promise<"back" | "exit">
```

### 6.2 入力フォームのフォーカス順

- フォーカス順序は `skill.metadata.inputs` の配列順（SKILL.md の定義順）に従う
- Tab で次の入力へ、Shift+Tab で前の入力へ移動
- select / confirm の場合、Enter（ITEM_SELECTED）で値確定後に自動で次の入力へ移動
- 最後の入力で Enter → 全入力完了、実行画面へ遷移

### 6.3 画面切替の実装

各画面関数（`showSkillSelector`, `showInputForm`, `showExecution`）が自身で `renderer.root` に add/remove を行う。
画面関数の冒頭で既存の子を削除し、自身のコンテナを追加する。
関数の終了時（resolve 前）に自身のコンテナを削除する。

OpenTUI API リファレンス（`docs/references/opentui/03-renderables.md`）:
- `renderer.root.getChildren()` — 子の配列を返す
- `renderer.root.remove(id: string)` — ID で子を削除
- `renderer.root.add(renderable | vnode)` — 子を追加

```typescript
// 各画面関数の冒頭で呼ぶ共通パターン
function clearScreen(renderer: CliRenderer): void {
  for (const child of renderer.root.getChildren()) {
    renderer.root.remove(child.id);
  }
}
```

### 6.4 inputs=0 のスキルの処理

app.ts の画面遷移ループで、`showInputForm` が inputs=0 の場合は空の Record を即座に返す（フォーム画面をスキップ）。
これは `showInputForm` 内部で処理する:

```typescript
// input-form.ts 冒頭
if (inputs.length === 0) {
  return {}; // 即座に空の変数を返し、実行画面へ直行
}
```

---

## 7. テスト戦略

### 6.1 テスト対象

| レイヤー | テスト方法 | 対象 |
|---------|-----------|------|
| `fuzzy-select` ロジック | ユニットテスト | `filterSkills()` 関数 |
| `tui-stream-writer` | ユニットテスト | モック `ExecutionView` で検証 |
| 画面遷移ロジック | ユニットテスト | 状態遷移の正しさ |
| OpenTUI コンポーネント | 手動テスト | 実際のターミナルで確認 |

### 6.2 テスト不要な箇所

- 既存の usecase / adapter — 既にテスト済み
- OpenTUI 自体のレンダリング — フレームワークの責務

---

## 8. 依存パッケージ

```bash
bun add @opentui/core fuzzysort
```

| パッケージ | 用途 | 備考 |
|-----------|------|------|
| `@opentui/core` | TUI フレームワーク | Zig ビルドが必要 |
| `fuzzysort` | ファジー検索 | 軽量、依存なし |

---

## 9. 実装フェーズ

### Phase 1: 基盤 + スキル選択画面
1. `@opentui/core`, `fuzzysort` をインストール
2. `tui/app.ts` — renderer 作成・画面遷移ループ
3. `tui/components/fuzzy-select.ts` — ファジー検索ロジック
4. `tui/screens/skill-selector.ts` — スキル選択画面
5. `cli.ts` に `tui` コマンド追加
6. テスト: fuzzy-select ユニットテスト

### Phase 2: 入力フォーム画面
1. `tui/screens/input-form.ts` — 入力フォーム画面
2. Tab ナビゲーション実装
3. 各 InputType（text, select, confirm, number, password）対応
4. Esc で戻る実装

### Phase 3: 実行画面
1. `tui/tui-stream-writer.ts` — TUI 用 StreamWriter
2. `tui/screens/execution-view.ts` — 実行画面
3. `tui/components/tool-status.ts` — スピナー + ステータス表示
4. MarkdownRenderable でのストリーミング表示
5. template モード対応
6. テスト: tui-stream-writer ユニットテスト

### Phase 4: 統合・仕上げ
1. 画面遷移の統合テスト（手動）
2. エラーハンドリング（API エラー、スキル未発見等）
3. キーバインドヘルプの統一
4. README / CLI-SPEC の更新
