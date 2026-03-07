# エラーハンドリング

## エラー分類

### 4つの非正常状態

#### Error（エラー）
入力値と期待値の相違状態。呼び出し元が対処可能。
- スキル名が見つからない、フロントマターのパースエラー、変数未定義
- 対処: Result 型で表現し、呼び出し元に判断を委ねる

#### Defect（欠陥）
要求事項を満たしていない状態。バグを含む。本来発生してはいけないもの。
- 呼び出し元が事前条件を満たしていない
- 対処: アサーション（throw）で即座に検出・停止

#### Fault（障害）
機能遂行不可の異常状態。リカバリ不能。
- LLM API のダウン、ファイルシステムの異常
- 対処: 障害の隔離、リトライ

#### Failure（故障）
機能達成能力を失った状態。
- Fault が解消されない結果としてシステムが機能を提供できなくなる
- 対処: エラーメッセージ表示、終了コードで通知

### 判断フロー
```
非正常状態が発生
    ↓
呼び出し元で想定・対処可能か？
    ├─ YES → Error → Result 型で表現
    └─ NO ↓
        本来発生してはいけない状態か？（契約違反）
        ├─ YES → Defect → throw で即座に停止
        └─ NO ↓
            機能が遂行不可能な異常状態か？
            ├─ YES → Fault → リトライ後、エラーメッセージ
            └─ Failure → 終了コードで通知
```

## エラーハンドリングの基本方針

ドメインロジックでは Result 型を採用する。

### Result 型の実装

taskp では軽量な自前 Result 型を使用する（外部ライブラリに依存しない）。

```typescript
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

### 回復可能 vs 回復不能

| 回復可能（Result 型） | 回復不能（throw） |
|----------------------|-------------------|
| スキルが見つからない | 引数の不正（IllegalArgument） |
| フロントマターのパースエラー | 状態の矛盾（IllegalState） |
| LLM API エラー（リトライ可能） | 到達不可コード（unreachable） |
| コマンド実行失敗 | |
| ファイル読み込みエラー | |

### ドメイン層の例

```typescript
// 回復可能なエラー
function parseSkillMetadata(raw: unknown): Result<SkillMetadata, ParseError> {
  const parsed = skillMetadataSchema.safeParse(raw);
  if (!parsed.success) {
    return err(new ParseError(parsed.error.message));
  }
  return ok(parsed.data);
}

// 回復不能なエラー
function renderTemplate(template: string, variables: Record<string, string>): string {
  // 未定義変数は呼び出し元が事前に検証すべき → Defect
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in variables)) {
      throw new Error(`unreachable: undefined variable '${key}'`);
    }
    return variables[key];
  });
}
```

### CLI 層のエラー表示

```typescript
// CLI 層で Result を処理して終了コードに変換
const result = await runSkillUseCase.execute(input);

if (!result.ok) {
  switch (result.error.type) {
    case "SKILL_NOT_FOUND":
      console.error(`Skill '${result.error.name}' not found`);
      process.exit(2);
    case "PARSE_ERROR":
      console.error(`Failed to parse SKILL.md: ${result.error.message}`);
      process.exit(3);
    case "CONFIG_ERROR":
      console.error(`Configuration error: ${result.error.message}`);
      process.exit(4);
    default:
      console.error(`Execution failed: ${result.error.message}`);
      process.exit(1);
  }
}
```

## レビューチェックリスト
- [ ] Error/Defect が適切に区別されているか
- [ ] 想定内の Error を Result 型で表現しているか
- [ ] Defect（契約違反）を throw で検出しているか
- [ ] Error と Defect を混同して同じハンドリングをしていないか
- [ ] 例外を「何でも catch」して、Defect を握り潰していないか
