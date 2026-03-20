# TUI モード実装プラン

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `taskp tui` コマンドでフルスクリーン TUI を起動し、スキルの検索・選択・入力・実行をリッチな画面で行えるようにする。

**Architecture:** OpenTUI Construct API + fuzzysort。既存 usecase/adapter 層を変更せず、StreamWriter と PromptCollector の TUI 実装を注入して再利用する。

**Tech Stack:** `@opentui/core`, `fuzzysort`, Bun, TypeScript

**設計書:** `docs/specs/2026-03-20-tui-mode-design.md`

---

## Chunk 1: 基盤セットアップ

### Task 1: 依存パッケージのインストール

**Files:**
- Modify: `package.json`

- [ ] **Step 1: @opentui/core と fuzzysort をインストール**

```bash
bun add @opentui/core fuzzysort
```

- [ ] **Step 2: インストール確認**

```bash
bun run -e "import { createCliRenderer } from '@opentui/core'; console.log('OpenTUI OK')"
bun run -e "import fuzzysort from 'fuzzysort'; console.log('fuzzysort OK')"
```

Expected: どちらも OK が表示される

- [ ] **Step 3: 既存テストが壊れていないことを確認**

Run: `bun test`
Expected: 252 tests passed

- [ ] **Step 4: コミット**

```bash
git add package.json bun.lock
git commit -m "chore: @opentui/core, fuzzysort を追加"
```

---

### Task 2: TUI エントリポイントと CLI コマンド追加

**Files:**
- Create: `src/tui/app.ts`
- Modify: `src/cli.ts`

- [ ] **Step 1: 最小限の TUI エントリポイントを作成**

Create `src/tui/app.ts`:

```typescript
import { createCliRenderer, Box, Text } from "@opentui/core";

export async function startTui(): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
  });

  renderer.root.add(
    Box(
      {
        width: "100%",
        height: "100%",
        borderStyle: "rounded",
        title: "taskp",
        padding: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      },
      Text({ content: "taskp TUI - Press Ctrl+C to exit", fg: "#888888" }),
    ),
  );

  // renderer は exitOnCtrlC: true で Ctrl+C 時に自動 destroy
  // プロセス終了まで待機
  await new Promise(() => {});
}
```

- [ ] **Step 2: cli.ts に tui コマンドを追加**

`src/cli.ts` の `.command("serve", ...)` の前に追加:

```typescript
.command("tui", {
  description: "Launch interactive TUI",
  async run() {
    const { startTui } = await import("./tui/app");
    await startTui();
  },
})
```

- [ ] **Step 3: 動作確認**

```bash
bun run src/cli.ts tui
```

Expected: ボーダー付きの画面が表示され、Ctrl+C で終了

- [ ] **Step 4: 既存テスト確認**

Run: `bun test`
Expected: all passed

- [ ] **Step 5: コミット**

```bash
git add src/tui/app.ts src/cli.ts
git commit -m "feat: taskp tui コマンドの骨格を追加"
```

---

## Chunk 2: ファジー検索ロジック

### Task 3: filterSkills 関数の実装

**Files:**
- Create: `src/tui/components/fuzzy-select.ts`
- Create: `tests/tui/components/fuzzy-select.test.ts`

- [ ] **Step 1: テストを作成**

Create `tests/tui/components/fuzzy-select.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { type SkillOption, filterSkills } from "../../../src/tui/components/fuzzy-select";

const skills: SkillOption[] = [
  { name: "code-review", description: "コードレビューを実行する" },
  { name: "deploy", description: "アプリケーションをデプロイする" },
  { name: "find-refactoring", description: "リファクタリング箇所を検出する" },
];

describe("filterSkills", () => {
  it("returns all skills when query is empty", () => {
    const result = filterSkills("", skills);
    expect(result).toHaveLength(3);
  });

  it("filters by name match", () => {
    const result = filterSkills("deploy", skills);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("deploy");
  });

  it("supports fuzzy matching", () => {
    const result = filterSkills("cdr", skills);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].name).toBe("code-review");
  });

  it("filters by description match", () => {
    const result = filterSkills("リファクタリング", skills);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].name).toBe("find-refactoring");
  });

  it("returns empty array when no match", () => {
    const result = filterSkills("zzzzzzz", skills);
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test tests/tui/components/fuzzy-select.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: filterSkills を実装**

Create `src/tui/components/fuzzy-select.ts`:

```typescript
import fuzzysort from "fuzzysort";

export type SkillOption = {
  readonly name: string;
  readonly description: string;
};

export function filterSkills(query: string, skills: readonly SkillOption[]): SkillOption[] {
  if (query === "") {
    return [...skills];
  }

  const results = fuzzysort.go(query, skills as SkillOption[], {
    keys: ["name", "description"],
  });

  return results.map((r) => r.obj);
}
```

- [ ] **Step 4: テストがパスすることを確認**

Run: `bun test tests/tui/components/fuzzy-select.test.ts`
Expected: 5 tests passed

- [ ] **Step 5: コミット**

```bash
git add src/tui/components/fuzzy-select.ts tests/tui/components/fuzzy-select.test.ts
git commit -m "feat: ファジー検索ロジック filterSkills を実装"
```

---

## Chunk 3: スキル選択画面

### Task 4: key-help コンポーネント

**Files:**
- Create: `src/tui/components/key-help.ts`

- [ ] **Step 1: キーバインドヘルプ表示コンポーネントを作成**

Create `src/tui/components/key-help.ts`:

```typescript
import { Box, Text, type VNode } from "@opentui/core";

export type KeyBinding = {
  readonly key: string;
  readonly description: string;
};

export function KeyHelp(bindings: readonly KeyBinding[]): VNode {
  const parts = bindings.map(
    (b) =>
      Box(
        { flexDirection: "row", gap: 1 },
        Text({ content: b.key, fg: "#FFFF00" }),
        Text({ content: b.description, fg: "#888888" }),
      ),
  );

  return Box(
    {
      flexDirection: "row",
      gap: 2,
      paddingTop: 1,
    },
    ...parts,
  );
}
```

- [ ] **Step 2: コミット**

```bash
git add src/tui/components/key-help.ts
git commit -m "feat: KeyHelp コンポーネントを追加"
```

---

### Task 5: スキル選択画面の実装

**Files:**
- Create: `src/tui/screens/skill-selector.ts`
- Modify: `src/tui/app.ts`

- [ ] **Step 1: スキル選択画面を作成**

Create `src/tui/screens/skill-selector.ts`:

```typescript
import {
  type CliRenderer,
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  SelectRenderable,
  SelectRenderableEvents,
  TextRenderable,
  type SelectOption,
} from "@opentui/core";
import type { Skill } from "../../core/skill/skill";
import { filterSkills, type SkillOption } from "../components/fuzzy-select";
import { KeyHelp } from "../components/key-help";

export async function showSkillSelector(
  renderer: CliRenderer,
  skills: readonly Skill[],
): Promise<Skill | null> {
  return new Promise((resolve) => {
    // 既存の子を削除
    for (const child of renderer.root.getChildren()) {
      renderer.root.remove(child.id);
    }

    const skillOptions: SkillOption[] = skills.map((s) => ({
      name: s.metadata.name,
      description: s.metadata.description,
    }));

    const toSelectOptions = (filtered: SkillOption[]): SelectOption[] =>
      filtered.map((s) => ({
        name: s.name,
        description: s.description,
        value: s.name,
      }));

    // コンテナ
    const container = new BoxRenderable(renderer, {
      id: "selector-container",
      width: "100%",
      height: "100%",
      borderStyle: "rounded",
      title: "taskp",
      padding: 1,
      flexDirection: "column",
    });

    // 検索入力
    const searchInput = new InputRenderable(renderer, {
      id: "search-input",
      width: "100%",
      placeholder: "Search skills...",
      backgroundColor: "#1a1a2e",
      focusedBackgroundColor: "#16213e",
      textColor: "#e2e8f0",
      cursorColor: "#00FF00",
    });

    // スキルリスト
    const selectList = new SelectRenderable(renderer, {
      id: "skill-list",
      width: "100%",
      height: 15,
      options: toSelectOptions(skillOptions),
      showDescription: true,
      wrapSelection: true,
      backgroundColor: "#0f0f1a",
      focusedBackgroundColor: "#1a1a2e",
      textColor: "#e2e8f0",
      selectedBackgroundColor: "#3b82f6",
      selectedTextColor: "#ffffff",
      descriptionColor: "#6b7280",
      selectedDescriptionColor: "#d1d5db",
    });

    // ヘルプ
    const help = KeyHelp([
      { key: "↑↓", description: "移動" },
      { key: "Enter", description: "選択" },
      { key: "Esc", description: "終了" },
    ]);

    container.add(searchInput);
    container.add(selectList);
    container.add(help);
    renderer.root.add(container);

    // 検索フィルタ
    searchInput.on(InputRenderableEvents.INPUT, (query: string) => {
      const filtered = filterSkills(query, skillOptions);
      selectList.setOptions(toSelectOptions(filtered));
    });

    // 選択確定
    selectList.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
      cleanup();
      const selected = skills.find((s) => s.metadata.name === option.value);
      resolve(selected ?? null);
    });

    // キーボードハンドラ
    const keyHandler = (key: { name: string; ctrl: boolean }) => {
      if (key.name === "escape") {
        cleanup();
        resolve(null);
      }
      // 検索入力にフォーカスがあるとき、↑↓ でリストにフォーカス移動
      if (searchInput.focused && (key.name === "down" || key.name === "up")) {
        selectList.focus();
      }
      // リストにフォーカスがあるとき、文字入力で検索入力にフォーカス移動
      if (selectList.focused && key.name.length === 1 && !key.ctrl) {
        searchInput.focus();
      }
    };

    renderer.keyInput.on("keypress", keyHandler);

    function cleanup() {
      renderer.keyInput.off("keypress", keyHandler);
      renderer.root.remove("selector-container");
    }

    // 初期フォーカス
    searchInput.focus();
  });
}
```

- [ ] **Step 2: app.ts を更新してスキル選択画面を使う**

`src/tui/app.ts` を更新:

```typescript
import { createCliRenderer } from "@opentui/core";
import { createDefaultSkillLoader } from "../adapter/skill-loader";
import { showSkillSelector } from "./screens/skill-selector";

export async function startTui(): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
  });

  const skillRepository = createDefaultSkillLoader(process.cwd());
  const skills = await skillRepository.listAll();

  if (skills.length === 0) {
    console.log("No skills found.");
    renderer.destroy();
    return;
  }

  while (true) {
    const skill = await showSkillSelector(renderer, skills);
    if (!skill) break;

    // TODO: 入力フォーム → 実行（Phase 2, 3 で実装）
    console.log(`Selected: ${skill.metadata.name}`);
  }

  renderer.destroy();
}
```

- [ ] **Step 3: 動作確認**

```bash
bun run src/cli.ts tui
```

Expected: スキル一覧が表示され、検索・選択・Esc 終了が動作

- [ ] **Step 4: コミット**

```bash
git add src/tui/screens/skill-selector.ts src/tui/app.ts
git commit -m "feat: スキル選択画面（fzf 風ファジー検索）を実装"
```

---

## Chunk 4: 入力フォーム画面

### Task 6: 入力フォーム画面の実装

**Files:**
- Create: `src/tui/screens/input-form.ts`
- Modify: `src/tui/app.ts`

- [ ] **Step 1: 入力フォーム画面を作成**

Create `src/tui/screens/input-form.ts`:

```typescript
import {
  type CliRenderer,
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  SelectRenderable,
  SelectRenderableEvents,
  TextRenderable,
  type SelectOption,
} from "@opentui/core";
import type { Skill } from "../../core/skill/skill";
import type { SkillInput } from "../../core/skill/skill-input";
import { KeyHelp } from "../components/key-help";

type InputElement = InputRenderable | SelectRenderable;

export async function showInputForm(
  renderer: CliRenderer,
  skill: Skill,
): Promise<Readonly<Record<string, string>> | null> {
  const inputs = skill.metadata.inputs;
  if (inputs.length === 0) {
    return {};
  }

  return new Promise((resolve) => {
    // 既存の子を削除
    for (const child of renderer.root.getChildren()) {
      renderer.root.remove(child.id);
    }

    const container = new BoxRenderable(renderer, {
      id: "form-container",
      width: "100%",
      height: "100%",
      borderStyle: "rounded",
      title: skill.metadata.name,
      padding: 1,
      flexDirection: "column",
    });

    // 説明文
    container.add(
      new TextRenderable(renderer, {
        id: "form-description",
        content: skill.metadata.description,
        fg: "#888888",
      }),
    );

    // 入力要素の生成
    const elements: { input: SkillInput; element: InputElement }[] = [];
    const values: Record<string, string> = {};

    for (const input of inputs) {
      // ラベル
      container.add(
        new TextRenderable(renderer, {
          id: `label-${input.name}`,
          content: input.message,
          fg: "#e2e8f0",
        }),
      );

      if (input.type === "select" && input.choices) {
        const options: SelectOption[] = input.choices.map((c) => ({
          name: c,
          value: c,
        }));
        const sel = new SelectRenderable(renderer, {
          id: `input-${input.name}`,
          width: "100%",
          height: Math.min(input.choices.length + 1, 8),
          options,
          backgroundColor: "#1a1a2e",
          focusedBackgroundColor: "#16213e",
          textColor: "#e2e8f0",
          selectedBackgroundColor: "#3b82f6",
          selectedTextColor: "#ffffff",
        });
        sel.on(SelectRenderableEvents.ITEM_SELECTED, (_i: number, opt: SelectOption) => {
          values[input.name] = opt.value;
          focusNext();
        });
        container.add(sel);
        elements.push({ input, element: sel });
      } else if (input.type === "confirm") {
        const sel = new SelectRenderable(renderer, {
          id: `input-${input.name}`,
          width: "100%",
          height: 3,
          options: [
            { name: "Yes", value: "true" },
            { name: "No", value: "false" },
          ],
          backgroundColor: "#1a1a2e",
          focusedBackgroundColor: "#16213e",
          textColor: "#e2e8f0",
          selectedBackgroundColor: "#3b82f6",
          selectedTextColor: "#ffffff",
        });
        sel.on(SelectRenderableEvents.ITEM_SELECTED, (_i: number, opt: SelectOption) => {
          values[input.name] = opt.value;
          focusNext();
        });
        container.add(sel);
        elements.push({ input, element: sel });
      } else {
        // text, number, password
        const inp = new InputRenderable(renderer, {
          id: `input-${input.name}`,
          width: "100%",
          placeholder: input.default !== undefined ? String(input.default) : "",
          backgroundColor: "#1a1a2e",
          focusedBackgroundColor: "#16213e",
          textColor: "#e2e8f0",
          cursorColor: "#00FF00",
        });
        inp.on(InputRenderableEvents.ENTER, (val: string) => {
          values[input.name] = val || String(input.default ?? "");
          focusNext();
        });
        container.add(inp);
        elements.push({ input, element: inp });
      }
    }

    // ヘルプ
    container.add(
      KeyHelp([
        { key: "Tab", description: "次へ" },
        { key: "Shift+Tab", description: "前へ" },
        { key: "Esc", description: "戻る" },
      ]),
    );

    renderer.root.add(container);

    // フォーカス管理
    let focusIndex = 0;

    function focusCurrent() {
      elements[focusIndex]?.element.focus();
    }

    function focusNext() {
      if (focusIndex < elements.length - 1) {
        focusIndex++;
        focusCurrent();
      } else {
        // 全入力完了 — デフォルト値の補完
        for (const { input } of elements) {
          if (!(input.name in values) && input.default !== undefined) {
            values[input.name] = String(input.default);
          }
          if (!(input.name in values)) {
            values[input.name] = "";
          }
        }
        cleanup();
        resolve(values);
      }
    }

    // Tab / Esc ハンドラ
    const keyHandler = (key: { name: string; shift: boolean }) => {
      if (key.name === "escape") {
        cleanup();
        resolve(null);
      }
      if (key.name === "tab") {
        if (key.shift) {
          focusIndex = Math.max(0, focusIndex - 1);
        } else {
          focusIndex = Math.min(elements.length - 1, focusIndex + 1);
        }
        focusCurrent();
      }
    };

    renderer.keyInput.on("keypress", keyHandler);

    function cleanup() {
      renderer.keyInput.off("keypress", keyHandler);
      renderer.root.remove("form-container");
    }

    focusCurrent();
  });
}
```

- [ ] **Step 2: app.ts を更新して入力フォームを接続**

`src/tui/app.ts` を更新:

```typescript
import { createCliRenderer } from "@opentui/core";
import { createDefaultSkillLoader } from "../adapter/skill-loader";
import { showSkillSelector } from "./screens/skill-selector";
import { showInputForm } from "./screens/input-form";

export async function startTui(): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
  });

  const skillRepository = createDefaultSkillLoader(process.cwd());
  const skills = await skillRepository.listAll();

  if (skills.length === 0) {
    console.log("No skills found.");
    renderer.destroy();
    return;
  }

  while (true) {
    const skill = await showSkillSelector(renderer, skills);
    if (!skill) break;

    const variables = await showInputForm(renderer, skill);
    if (!variables) continue; // Esc で戻る

    // TODO: 実行画面（Phase 3 で実装）
    console.log(`Execute: ${skill.metadata.name}`, variables);
  }

  renderer.destroy();
}
```

- [ ] **Step 3: 動作確認**

```bash
bun run src/cli.ts tui
```

Expected: スキル選択 → 入力フォーム → Tab ナビゲーション → Enter で値確定 → Esc で戻る

- [ ] **Step 4: コミット**

```bash
git add src/tui/screens/input-form.ts src/tui/app.ts
git commit -m "feat: 入力フォーム画面を実装（Tab ナビゲーション対応）"
```

---

## Chunk 5: 実行画面

### Task 7: TUI 用 StreamWriter

**Files:**
- Create: `src/tui/tui-stream-writer.ts`
- Create: `tests/tui/tui-stream-writer.test.ts`

- [ ] **Step 1: ExecutionView インターフェースを定義しテストを作成**

Create `tests/tui/tui-stream-writer.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import { type ExecutionViewPort, createTuiStreamWriter } from "../../src/tui/tui-stream-writer";

function createMockView(): ExecutionViewPort & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    appendOutput(text: string) {
      calls.push(`appendOutput:${text}`);
    },
    showToolStatus(toolName: string, _args: Record<string, unknown>) {
      calls.push(`showToolStatus:${toolName}`);
    },
    clearToolStatus() {
      calls.push("clearToolStatus");
    },
    showSummary(elapsedMs: number, steps: number) {
      calls.push(`showSummary:${elapsedMs}:${steps}`);
    },
  };
}

describe("createTuiStreamWriter", () => {
  it("writeText calls appendOutput", () => {
    const view = createMockView();
    const writer = createTuiStreamWriter(view);
    writer.writeText("hello");
    expect(view.calls).toContain("appendOutput:hello");
  });

  it("writeToolCall calls showToolStatus", () => {
    const view = createMockView();
    const writer = createTuiStreamWriter(view);
    writer.writeToolCall("bash", { command: "ls" });
    expect(view.calls).toContain("showToolStatus:bash");
  });

  it("writeToolResult calls clearToolStatus", () => {
    const view = createMockView();
    const writer = createTuiStreamWriter(view);
    writer.writeToolResult("bash", "output");
    expect(view.calls).toContain("clearToolStatus");
  });

  it("writeSummary calls showSummary", () => {
    const view = createMockView();
    const writer = createTuiStreamWriter(view);
    writer.writeSummary(1234, 5);
    expect(view.calls).toContain("showSummary:1234:5");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `bun test tests/tui/tui-stream-writer.test.ts`
Expected: FAIL

- [ ] **Step 3: TuiStreamWriter を実装**

Create `src/tui/tui-stream-writer.ts`:

```typescript
import type { StreamWriter } from "../adapter/stream-writer";

export type ExecutionViewPort = {
  readonly appendOutput: (text: string) => void;
  readonly showToolStatus: (toolName: string, args: Record<string, unknown>) => void;
  readonly clearToolStatus: () => void;
  readonly showSummary: (elapsedMs: number, steps: number) => void;
};

export function createTuiStreamWriter(view: ExecutionViewPort): StreamWriter {
  return {
    writeText(text: string): void {
      view.appendOutput(text);
    },
    writeToolCall(toolName: string, args: Record<string, unknown>): void {
      view.showToolStatus(toolName, args);
    },
    writeToolResult(_toolName: string, _result: unknown): void {
      view.clearToolStatus();
    },
    writeSummary(elapsedMs: number, steps: number): void {
      view.showSummary(elapsedMs, steps);
    },
  };
}
```

- [ ] **Step 4: テストがパスすることを確認**

Run: `bun test tests/tui/tui-stream-writer.test.ts`
Expected: 4 tests passed

- [ ] **Step 5: コミット**

```bash
git add src/tui/tui-stream-writer.ts tests/tui/tui-stream-writer.test.ts
git commit -m "feat: TUI 用 StreamWriter を実装"
```

---

### Task 8: tool-status コンポーネント

**Files:**
- Create: `src/tui/components/tool-status.ts`

- [ ] **Step 1: ツール実行ステータス表示コンポーネントを作成**

Create `src/tui/components/tool-status.ts`:

```typescript
import { type CliRenderer, TextRenderable, t, bold, fg } from "@opentui/core";

const SPINNER_FRAMES = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];

export class ToolStatusDisplay {
  private readonly text: TextRenderable;
  private spinnerIndex = 0;
  private spinnerInterval: ReturnType<typeof setInterval> | null = null;
  private currentTool = "";
  private currentSummary = "";

  constructor(renderer: CliRenderer, id: string) {
    this.text = new TextRenderable(renderer, {
      id,
      content: "",
      fg: "#888888",
    });
  }

  get renderable(): TextRenderable {
    return this.text;
  }

  show(toolName: string, args: Record<string, unknown>): void {
    this.currentTool = toolName;
    this.currentSummary = formatToolArgs(toolName, args);
    this.spinnerIndex = 0;
    this.updateContent();

    if (this.spinnerInterval) clearInterval(this.spinnerInterval);
    this.spinnerInterval = setInterval(() => {
      this.spinnerIndex = (this.spinnerIndex + 1) % SPINNER_FRAMES.length;
      this.updateContent();
    }, 80);
  }

  clear(): void {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    this.text.content = "";
  }

  destroy(): void {
    this.clear();
  }

  private updateContent(): void {
    const frame = SPINNER_FRAMES[this.spinnerIndex];
    this.text.content = `${frame} [${this.currentTool}] ${this.currentSummary}`;
  }
}

function formatToolArgs(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case "bash":
      return truncate(String(args.command ?? ""), 60);
    case "read":
      return String(args.path ?? "");
    case "write":
      return String(args.path ?? "");
    case "glob":
      return String(args.pattern ?? "");
    default:
      return truncate(JSON.stringify(args), 60);
  }
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
```

- [ ] **Step 2: コミット**

```bash
git add src/tui/components/tool-status.ts
git commit -m "feat: ToolStatusDisplay コンポーネント（スピナー付き）を追加"
```

---

### Task 9: 実行画面の実装

**Files:**
- Create: `src/tui/screens/execution-view.ts`
- Modify: `src/tui/app.ts`

- [ ] **Step 1: 実行画面を作成**

Create `src/tui/screens/execution-view.ts`:

```typescript
import {
  type CliRenderer,
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  MarkdownRenderable,
  SyntaxStyle,
  RGBA,
} from "@opentui/core";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { Skill } from "../../core/skill/skill";
import { createAgentExecutor } from "../../adapter/agent-executor";
import { createContextCollector } from "../../adapter/context-collector";
import { renderTemplate, type ReservedVars } from "../../core/variable/template-renderer";
import { runAgentSkill } from "../../usecase/run-agent-skill";
import { runSkill } from "../../usecase/run-skill";
import { createCommandRunner } from "../../adapter/command-runner";
import { ok } from "../../core/types/result";
import { ToolStatusDisplay } from "../components/tool-status";
import { type ExecutionViewPort, createTuiStreamWriter } from "../tui-stream-writer";
import { KeyHelp } from "../components/key-help";

const markdownSyntaxStyle = SyntaxStyle.fromStyles({
  "markup.heading": { fg: RGBA.fromHex("#58A6FF"), bold: true },
  "markup.bold": { fg: RGBA.fromHex("#F0F6FC"), bold: true },
  "markup.italic": { fg: RGBA.fromHex("#F0F6FC"), italic: true },
  "markup.list": { fg: RGBA.fromHex("#FF7B72") },
  "markup.raw": { fg: RGBA.fromHex("#A5D6FF") },
  "markup.link": { fg: RGBA.fromHex("#58A6FF"), underline: true },
  default: { fg: RGBA.fromHex("#E6EDF3") },
});

export async function showExecution(
  renderer: CliRenderer,
  skill: Skill,
  variables: Readonly<Record<string, string>>,
  model: LanguageModelV3 | null,
): Promise<void> {
  return new Promise((resolve) => {
    // 既存の子を削除
    for (const child of renderer.root.getChildren()) {
      renderer.root.remove(child.id);
    }

    // コンテナ
    const container = new BoxRenderable(renderer, {
      id: "exec-container",
      width: "100%",
      height: "100%",
      borderStyle: "rounded",
      title: `${skill.metadata.name} [実行中]`,
      padding: 1,
      flexDirection: "column",
    });

    // ツールステータス
    const toolStatus = new ToolStatusDisplay(renderer, "tool-status");
    container.add(toolStatus.renderable);

    // 出力エリア
    const scrollbox = new ScrollBoxRenderable(renderer, {
      id: "output-scroll",
      width: "100%",
      flexGrow: 1,
      stickyScroll: true,
      stickyStart: "bottom",
    });

    const markdown = new MarkdownRenderable(renderer, {
      id: "output-markdown",
      width: "100%",
      content: "",
      syntaxStyle: markdownSyntaxStyle,
      streaming: true,
    });

    scrollbox.add(markdown);
    container.add(scrollbox);

    // サマリ
    const summaryText = new TextRenderable(renderer, {
      id: "summary",
      content: "",
      fg: "#00FF00",
    });
    container.add(summaryText);

    // ヘルプ（実行中は非表示、完了後に表示）
    const helpBox = new BoxRenderable(renderer, {
      id: "exec-help",
      visible: false,
    });
    helpBox.add(
      KeyHelp([
        { key: "Enter", description: "戻る" },
        { key: "Esc", description: "終了" },
      ]),
    );
    container.add(helpBox);

    renderer.root.add(container);

    // ExecutionViewPort の実装
    const viewPort: ExecutionViewPort = {
      appendOutput(text: string) {
        markdown.content += text;
      },
      showToolStatus(toolName: string, args: Record<string, unknown>) {
        toolStatus.show(toolName, args);
      },
      clearToolStatus() {
        toolStatus.clear();
      },
      showSummary(elapsedMs: number, steps: number) {
        const seconds = (elapsedMs / 1000).toFixed(1);
        summaryText.content = `Done in ${seconds}s (${steps} steps)`;
        container.title = `${skill.metadata.name} [完了]`;
        helpBox.visible = true;
      },
    };

    // 実行
    executeSkill(skill, variables, model, viewPort).then(() => {
      // 完了後のキーハンドラ
      const doneHandler = (key: { name: string }) => {
        if (key.name === "return" || key.name === "escape") {
          renderer.keyInput.off("keypress", doneHandler);
          toolStatus.destroy();
          renderer.root.remove("exec-container");
          resolve();
        }
      };
      renderer.keyInput.on("keypress", doneHandler);
    });
  });
}

async function executeSkill(
  skill: Skill,
  variables: Readonly<Record<string, string>>,
  model: LanguageModelV3 | null,
  viewPort: ExecutionViewPort,
): Promise<void> {
  if (skill.metadata.mode === "agent" && model) {
    const writer = createTuiStreamWriter(viewPort);
    const agentExecutor = createAgentExecutor(writer);

    const contextCollector = createContextCollector({
      executeCommand: async (command, cwd) => {
        const { execa } = await import("execa");
        const result = await execa(command, { shell: true, cwd, reject: false });
        return ok(result.stdout);
      },
      fetchUrl: async (url) => {
        const response = await fetch(url);
        return ok(await response.text());
      },
      scanGlob: async (pattern, cwd) => {
        const { glob } = await import("node:fs/promises");
        const matches: string[] = [];
        for await (const entry of glob(pattern, { cwd })) {
          matches.push(entry);
        }
        return matches;
      },
    });

    // PromptCollector は不要（既に variables が確定済み）
    const dummyPromptCollector = {
      collect: async () => variables as Record<string, string>,
    };

    await runAgentSkill(
      { name: skill.metadata.name, presets: variables, model },
      {
        skillRepository: {
          findByName: async () => ok(skill),
          listAll: async () => [],
          listLocal: async () => [],
          listGlobal: async () => [],
        },
        promptCollector: dummyPromptCollector,
        contextCollector,
        agentExecutor,
      },
    );
  } else {
    // template モード
    const commandExecutor = createCommandRunner();
    const dummyPromptCollector = {
      collect: async () => variables as Record<string, string>,
    };

    const result = await runSkill(
      { name: skill.metadata.name, presets: variables, dryRun: false, force: false },
      {
        skillRepository: {
          findByName: async () => ok(skill),
          listAll: async () => [],
          listLocal: async () => [],
          listGlobal: async () => [],
        },
        promptCollector: dummyPromptCollector,
        commandExecutor,
      },
    );

    if (result.ok) {
      for (const cmd of result.value.commands) {
        viewPort.appendOutput(`\n$ ${cmd.command}\n`);
        if (cmd.result.stdout) viewPort.appendOutput(cmd.result.stdout);
        if (cmd.result.stderr) viewPort.appendOutput(cmd.result.stderr);
      }
      const failed = result.value.commands.filter((c) => c.result.exitCode !== 0);
      viewPort.showSummary(0, result.value.commands.length);
    } else {
      viewPort.appendOutput(`\nError: ${result.error.message}\n`);
      viewPort.showSummary(0, 0);
    }
  }
}
```

- [ ] **Step 2: app.ts を更新して全画面を接続**

`src/tui/app.ts` を更新:

```typescript
import { createCliRenderer } from "@opentui/core";
import { createLanguageModel, resolveModelSpec } from "../adapter/ai-provider";
import { createDefaultConfigLoader } from "../adapter/config-loader";
import { createDefaultSkillLoader } from "../adapter/skill-loader";
import { showSkillSelector } from "./screens/skill-selector";
import { showInputForm } from "./screens/input-form";
import { showExecution } from "./screens/execution-view";
import type { LanguageModelV3 } from "@ai-sdk/provider";

export async function startTui(): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    targetFps: 30,
  });

  const skillRepository = createDefaultSkillLoader(process.cwd());
  const skills = await skillRepository.listAll();

  if (skills.length === 0) {
    renderer.destroy();
    console.log("No skills found.");
    return;
  }

  // LLM モデル解決（agent モード用）
  const model = await resolveModel();

  while (true) {
    const skill = await showSkillSelector(renderer, skills);
    if (!skill) break;

    const variables = await showInputForm(renderer, skill);
    if (!variables) continue;

    await showExecution(renderer, skill, variables, model);
  }

  renderer.destroy();
}

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

- [ ] **Step 3: 動作確認**

```bash
bun run src/cli.ts tui
```

Expected: スキル選択 → 入力 → 実行（ストリーミング表示 + スピナー）→ 完了 → Enter で戻る

- [ ] **Step 4: 全テスト確認**

Run: `bun test`
Expected: all passed

- [ ] **Step 5: コミット**

```bash
git add src/tui/screens/execution-view.ts src/tui/components/tool-status.ts src/tui/app.ts
git commit -m "feat: 実行画面（ストリーミング表示 + スピナー）を実装"
```

---

## Chunk 6: 統合・仕上げ

### Task 10: エラーハンドリング

**Files:**
- Modify: `src/tui/screens/execution-view.ts`
- Modify: `src/tui/app.ts`

- [ ] **Step 1: 実行画面にエラー表示を追加**

`execution-view.ts` の `executeSkill` 内で例外をキャッチし、`viewPort.appendOutput` でエラーメッセージを表示:

```typescript
try {
  await executeSkill(skill, variables, model, viewPort);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  viewPort.appendOutput(`\n❌ Error: ${message}\n`);
  viewPort.showSummary(0, 0);
}
```

- [ ] **Step 2: app.ts でモデル未設定時のフォールバック**

agent モードでモデルが null の場合、実行画面でエラーメッセージを表示する。

- [ ] **Step 3: コミット**

```bash
git add src/tui/screens/execution-view.ts src/tui/app.ts
git commit -m "fix: TUI のエラーハンドリングを追加"
```

---

### Task 11: ドキュメント更新

**Files:**
- Modify: `docs/CLI-SPEC.md`
- Modify: `README.md`

- [ ] **Step 1: CLI-SPEC.md に tui コマンドを追記**

```markdown
### taskp tui

インタラクティブ TUI を起動する。

\`\`\`bash
taskp tui
\`\`\`

- fzf 風のファジー検索でスキルを選択
- 入力フォームでパラメータを入力
- agent モードの実行をストリーミング表示
\`\`\`
```

- [ ] **Step 2: README.md に TUI セクションを追加**

- [ ] **Step 3: コミット**

```bash
git add docs/CLI-SPEC.md README.md
git commit -m "docs: TUI モードのドキュメントを追加"
```

---

### Task 12: PR 作成・マージ

- [ ] **Step 1: ブランチをプッシュして PR 作成**

```bash
git push -u origin feature/tui-mode
gh pr create --title "feat: taskp tui コマンドを追加" --base main
```

- [ ] **Step 2: CI 確認後マージ**

```bash
gh pr merge --squash --delete-branch
```
