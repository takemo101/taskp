# テスト戦略

## テスト分類

### 3層のテスト

```
ユニットテスト       — ドメインモデル・値オブジェクト・純粋関数
ユースケーステスト   — ユースケース + スタブアダプタ
統合テスト          — CLI コマンド・ファイル I/O
```

#### ユニットテスト（最優先）

対象: `src/core/` 配下の純粋なロジック

```
skill/         — スキルメタデータのパース、入力定義の検証
execution/     — テンプレート実行ロジック、実行モード判定
variable/      — テンプレート変数の展開
types/         — 型定義のコンパイルチェック（テスト不要、typecheck で検証）
```

特徴:
- 外部依存なし（ファイル I/O、ネットワーク、LLM API を使わない）
- 入力と出力が明確
- 高速（全体で数秒以内）

テスト例:
```typescript
describe("SkillMetadata.parse", () => {
  it("有効なフロントマターをパースできる", () => {
    const raw = {
      name: "deploy",
      description: "Deploy app",
      mode: "template",
      inputs: [{ name: "env", type: "select", message: "Env?", choices: ["staging", "prod"] }],
    };
    const result = SkillMetadata.parse(raw);
    expect(result.ok).toBe(true);
  });

  it("name が空の場合エラーを返す", () => {
    const raw = { name: "", description: "Deploy app" };
    const result = SkillMetadata.parse(raw);
    expect(result.ok).toBe(false);
  });
});

describe("TemplateRenderer", () => {
  it("{{variable}} を展開する", () => {
    const result = renderTemplate("deploy to {{env}}", { env: "staging" });
    expect(result).toBe("deploy to staging");
  });

  it("複数の変数を展開する", () => {
    const result = renderTemplate("{{branch}} → {{env}}", { branch: "main", env: "prod" });
    expect(result).toBe("main → prod");
  });

  it("予約変数 {{__cwd__}} を展開する", () => {
    const result = renderTemplate("dir: {{__cwd__}}", {}, { cwd: "/app" });
    expect(result).toContain("/app");
  });
});

describe("extractCodeBlocks", () => {
  it("bash コードブロックを抽出する", () => {
    const md = "# Title\n\n```bash\nnpm run build\n```\n\nText\n\n```bash\nnpm run deploy\n```";
    const blocks = extractCodeBlocks(md);
    expect(blocks).toEqual(["npm run build", "npm run deploy"]);
  });
});
```

#### ユースケーステスト

対象: `src/usecase/` のユースケース

```
run-skill      — スキル実行（template / agent）
list-skills    — スキル一覧取得
init-skill     — スキル雛形生成
```

特徴:
- アダプタをスタブ化してテスト
- LLM 依存部分はモック
- ファイル I/O を抽象化

テスト例:
```typescript
describe("RunSkillUseCase", () => {
  let useCase: RunSkillUseCase;
  let skillLoader: InMemorySkillLoader;
  let commandRunner: StubCommandRunner;

  beforeEach(() => {
    skillLoader = new InMemorySkillLoader([
      makeSkill({ name: "deploy", mode: "template", body: "```bash\necho hello\n```" }),
    ]);
    commandRunner = new StubCommandRunner();
    useCase = new RunSkillUseCase(skillLoader, commandRunner);
  });

  it("template スキルを実行できる", async () => {
    const result = await useCase.execute({
      skillName: "deploy",
      variables: {},
    });
    expect(result.ok).toBe(true);
    expect(result.value.status).toBe("success");
    expect(commandRunner.executedCommands).toEqual(["echo hello"]);
  });

  it("存在しないスキルでエラーを返す", async () => {
    const result = await useCase.execute({ skillName: "unknown", variables: {} });
    expect(result.ok).toBe(false);
    expect(result.error.type).toBe("SKILL_NOT_FOUND");
  });
});

describe("ListSkillsUseCase", () => {
  it("ローカルとグローバルのスキルを統合して返す", async () => {
    const loader = new InMemorySkillLoader([
      makeSkill({ name: "deploy", scope: "local" }),
      makeSkill({ name: "review", scope: "global" }),
    ]);
    const useCase = new ListSkillsUseCase(loader);
    const result = await useCase.execute();
    expect(result.value.skills).toHaveLength(2);
  });

  it("同名スキルはローカルを優先する", async () => {
    const loader = new InMemorySkillLoader([
      makeSkill({ name: "deploy", scope: "local", description: "Local deploy" }),
      makeSkill({ name: "deploy", scope: "global", description: "Global deploy" }),
    ]);
    const useCase = new ListSkillsUseCase(loader);
    const result = await useCase.execute();
    expect(result.value.skills).toHaveLength(1);
    expect(result.value.skills[0].description).toBe("Local deploy");
  });
});
```

#### 統合テスト

対象: CLI コマンドの実行、ファイル読み書き

```
CLI 引数パース → コマンド実行 → 出力確認
```

特徴:
- 実際のファイルシステムを使用（テンポラリディレクトリ）
- LLM API を呼ぶテストは含めない
- 実行頻度はユニットテストより低くてよい

## テストディレクトリ構成

```
tests/
├── unit/
│   ├── skill/
│   │   ├── skill-metadata.test.ts
│   │   ├── skill-input.test.ts
│   │   └── skill-body.test.ts
│   ├── execution/
│   │   ├── template-executor.test.ts
│   │   └── execution-mode.test.ts
│   └── variable/
│       └── template-renderer.test.ts
├── usecase/
│   ├── run-skill.test.ts
│   ├── list-skills.test.ts
│   └── init-skill.test.ts
├── integration/
│   └── cli.test.ts
└── fixtures/
    └── skills/
        ├── valid-template/
        │   └── SKILL.md
        ├── valid-agent/
        │   └── SKILL.md
        ├── invalid-frontmatter/
        │   └── SKILL.md
        └── no-inputs/
            └── SKILL.md
```

## テスト原則

1. **テストファースト** — ドメインモデルの振る舞いをテストとして先に定義する
2. **fixture ベース** — テスト用 SKILL.md をフィクスチャとして管理する
3. **LLM 依存を分離** — agent モードのテストは LLM をモック化する
4. **高速を維持** — `bun run test` が 10 秒以内に完了すること
5. **決定的** — 同じ入力で常に同じ結果

## 実行コマンド

```bash
bun run test                         # 全テスト実行
bun run test:watch                   # ウォッチモード
bun x vitest run tests/unit          # ユニットテストのみ
bun x vitest run tests/usecase       # ユースケーステストのみ
```

## CI での実行

```yaml
- bun run test
- bun run typecheck
- bun run check
```

テストは毎コミットで実行する。高速（10 秒以内）なので CI のボトルネックにならない。
