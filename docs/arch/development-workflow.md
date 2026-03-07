# 開発ワークフロー

## ドメインモデル中心の開発手順

### 開発順序

```
ドメインモデル → ユースケース → アダプタ → CLI 統合
```

### フェーズ1: テストファーストのドメインモデル設計・実装

#### 目的
外部依存に左右されない純粋なドメインロジックを実装する。

#### 手順
1. ドメインモデルの振る舞いをテストとして定義
2. テストを満たすドメインモデルの実装
3. リファクタリングによる設計の洗練

#### テスト例
```typescript
describe("Skill", () => {
  it("フロントマターから SkillMetadata を構築できる", () => {
    const raw = { name: "deploy", description: "Deploy app", mode: "template", inputs: [] };
    const result = SkillMetadata.parse(raw);
    expect(result.isOk()).toBe(true);
    expect(result.value.name).toBe("deploy");
  });

  it("無効なモードを拒否する", () => {
    const raw = { name: "deploy", description: "Deploy app", mode: "invalid" };
    const result = SkillMetadata.parse(raw);
    expect(result.isErr()).toBe(true);
  });
});

describe("TemplateRenderer", () => {
  it("{{variable}} を展開する", () => {
    const template = "deploy to {{environment}}";
    const variables = { environment: "staging" };
    expect(renderTemplate(template, variables)).toBe("deploy to staging");
  });

  it("未定義の変数でエラーを返す", () => {
    const template = "deploy to {{environment}}";
    const result = renderTemplate(template, {});
    expect(result).toBeInstanceOf(Error);
  });
});
```

### フェーズ2: ユースケース開発

#### 目的
アプリケーション層のロジックをドメインモデルを使って実装する。

#### テスト例
```typescript
describe("RunSkillUseCase", () => {
  it("template モードのスキルを実行できる", async () => {
    const loader = new InMemorySkillLoader([templateSkill]);
    const runner = new StubCommandRunner();
    const useCase = new RunSkillUseCase(loader, runner);

    const result = await useCase.execute({
      skillName: "deploy",
      variables: { environment: "staging", branch: "main" },
    });

    expect(result.isOk()).toBe(true);
    expect(result.value.status).toBe("success");
  });
});
```

### フェーズ3: アダプタ実装

1. SkillLoader: ファイルシステムからスキルを読み込む
2. PromptRunner: Inquirer でインタラクティブ質問を実行
3. CommandRunner: execa でシェルコマンドを実行
4. AiProvider: Vercel AI SDK でLLMプロバイダを管理

### フェーズ4: CLI 統合

1. incur でコマンドを定義
2. ユースケースを呼び出す
3. 出力をフォーマット

## クリーンアーキテクチャ

### 層構造

```
┌─────────────────────────────────────────────┐
│  CLI (cli.ts — incur)                       │
│  コマンド定義、引数パース                     │
├─────────────────────────────────────────────┤
│  Use Cases (usecase/)                       │
│  RunSkill, ListSkills, InitSkill            │
├─────────────────────────────────────────────┤
│  Domain (core/)                             │
│  Skill, SkillInput, ExecutionMode           │
│  TemplateRenderer, TemplateExecutor         │
├─────────────────────────────────────────────┤
│  Adapters (adapter/)                        │
│  SkillLoader, PromptRunner, CommandRunner   │
│  AiProvider                                 │
└─────────────────────────────────────────────┘
```

### 依存方向

```
CLI → UseCase → Domain
              ↑
      Adapter ┘
```

- Domain 層に外部依存がないこと
- UseCase 層が Adapter の Interface を定義すること
- Adapter 層が UseCase の Interface を実装すること

## テスト戦略

### テスト境界の対応付け

| テスト種別 | 対象 | 目的 |
|-----------|------|------|
| ユニットテスト | ドメインモデル（Skill, Input, TemplateRenderer 等） | ビジネスルールの正しさを検証 |
| ユースケーステスト | ユースケース + スタブアダプタ | アプリケーションロジックの検証 |
| 統合テスト | CLI コマンド・ファイル I/O | 境界横断の連携を検証 |

### テストの優先順位

1. ドメインモデルのテスト（最優先）: 純粋なビジネスロジック
2. ユースケースのテスト: スタブアダプタを使用
3. 統合テスト: 実際のファイルシステムを使用

## コミットルール

- 意味のある変更単位ごとにコミットを行う
- Conventional Commits に従い、英語で記述
- 無条件にすべての変更を追加しない（意味のある変更単位ごとにファイルを指定）
