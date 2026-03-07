# 設計原則

## Tell, Don't Ask

### 核心原則
オブジェクトの内部状態に基づく意思決定をし、その結果で該当オブジェクトを更新してはならない。

| アプローチ | 特徴 | 問題 |
|-----------|------|------|
| Ask | 状態を取得→外部で判断→操作 | ロジックが散在、カプセル化破壊 |
| Tell | オブジェクトに直接命じる | 責任集約、変更に強い |

### アンチパターン検出
```
❌ if (obj.getX() > threshold) { obj.setY(...) }
❌ if (obj.getStatus() === 'ACTIVE') { doSomething(obj) }
❌ obj.getA().getB().doSomething()
❌ for (const item of list) { total += item.getPrice() }
```

### 変換パターン

```typescript
// ❌ Ask
if (skill.mode === "agent" && !skill.model) {
  setDefaultModel(skill);
}

// ✅ Tell
skill.ensureModelResolved(defaultModel);
```

## デメテルの法則（Law of Demeter）

### 核心原則
直接の友人とだけ話せ。見知らぬ者に話しかけるな。

### 4つのルール
メソッド M が呼び出してよいのは:
1. 自身（this）のメソッド
2. M の引数として渡されたオブジェクトのメソッド
3. M 内で生成したオブジェクトのメソッド
4. 自身のインスタンス変数（フィールド）のメソッド

### アンチパターン: Train Wreck
```
❌ skill.metadata.inputs[0].choices.length
❌ config.providers.anthropic.apiKey
```

### 例外（違反ではないケース）
1. 流暢API / ビルダーパターン（同一オブジェクトを返す）
2. データ構造（DTO / Value Object）
3. ストリーム / コレクション操作
4. 標準ライブラリの連鎖

## Parse, Don't Validate

### 核心原則
チェック結果を捨てずに型で保持する。

| アプローチ | 戻り値 | 問題 |
|-----------|--------|------|
| Validate | void / boolean | 再チェック必要、型が保証しない |
| Parse | 型付き値 | 一度のチェックで済む、型が保証 |

### 適用例

```typescript
// ❌ Validate
function validateSkillName(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name);
}
// 検証後も string のまま → 別の場所で再検証が必要

// ✅ Parse
type SkillName = string & { readonly __brand: unique symbol };

function parseSkillName(name: string): SkillName | null {
  if (/^[a-z][a-z0-9-]*$/.test(name)) {
    return name as SkillName;
  }
  return null;
}
// 以降は SkillName 型を使えば検証済みが型で保証される
```

```typescript
// ❌ Validate
function validateFrontmatter(raw: unknown): void {
  if (!raw || typeof raw !== "object") throw new Error("invalid");
  // ... 検証後も unknown のまま
}

// ✅ Parse
function parseFrontmatter(raw: unknown): Result<SkillMetadata, ParseError> {
  // Zod でパース → 検証済みの型付きオブジェクトを返す
  const result = skillMetadataSchema.safeParse(raw);
  if (!result.success) return err(new ParseError(result.error));
  return ok(result.data);
}
```

## 意図ベースの共通化判断

字面の同一性ではなく意図（目的）の同一性に基づいてコードの共通化を判断する。

判断基準:
- 字面が同じでも意図が異なる → 共通化しない
- 字面が異なっても意図が同じ → 共通化を検討
- 変更理由が同じか？ → 同じなら共通化の候補
