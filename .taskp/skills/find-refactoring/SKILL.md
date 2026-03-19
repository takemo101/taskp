---
name: find-refactoring
description: 指定した観点でリファクタリング箇所を検出し、GitHub Issue として起票する
mode: agent
model: claude-sonnet-4-20250514
inputs:
  - name: target
    type: text
    message: "対象のファイルまたはディレクトリは？"
    default: src
  - name: perspective
    type: select
    message: "リファクタリング観点を選んでください"
    choices:
      - naming
      - srp
      - dry
      - error-handling
      - type-safety
      - testability
      - performance
      - design-principles
      - solid
      - custom
  - name: custom_perspective
    type: text
    message: "自由記述の観点を入力してください"
    required: false
  - name: create_issues
    type: confirm
    message: "検出後に GitHub Issue を作成しますか？（No ならレポートのみ）"
    default: false
context:
  - type: glob
    pattern: "{{target}}/**/*.ts"
  - type: file
    path: "AGENTS.md"
  - type: file
    path: "docs/ARCHITECTURE.md"
  - type: file
    path: "docs/arch/coding-rules.md"
  - type: file
    path: "docs/arch/design-principles.md"
tools:
  - bash
  - read
  - write
---

# リファクタリング検出: {{perspective}}

`{{target}}` を対象に、以下の観点でリファクタリングすべき箇所を検出してください。

---

## 観点の定義

選択された観点 `{{perspective}}` に基づいて分析を行ってください。

### naming — 命名改善

- 曖昧なサフィックス（Manager, Util, Service 等）の使用
- 変数名・関数名から責務が推測できない
- ファイル名と公開型の不一致
- コーディングルール（AGENTS.md → docs/arch/coding-rules.md）への違反

### srp — 責務分離

- 1つのファイル/クラス/関数が複数の責務を持っている
- 200行を超える関数
- 500行を超えるファイル
- 「〜 and 〜」と説明できてしまう関数

### dry — 重複コード排除

- 同一または類似のロジックが複数箇所に存在
- コピペされたコードブロック
- パターンとして共通化可能な処理

### error-handling — エラーハンドリング改善

- エラーの握りつぶし（空の catch ブロック）
- 不適切な fallback 値
- Result 型を使うべき箇所で throw している
- エラーメッセージが不十分

### type-safety — 型安全性向上

- `any` の使用
- 型アサーション（as）の濫用
- optional chaining の連鎖による型の曖昧さ
- Zod スキーマと TypeScript 型の乖離

### testability — テスタビリティ向上

- 依存が直接 import されていて差し替え不可能
- グローバル状態への依存
- 副作用を持つ純粋でない関数
- テスト困難な巨大関数

### performance — パフォーマンス改善

- 不要なループ、N+1 問題
- 大量データの同期処理
- メモリリークの可能性
- 不要な再計算

### design-principles — 設計原則適合

- Tell Don't Ask 違反（getter で取得して外部で判断）
- デメテルの法則違反（a.b.c.d のようなチェーン）
- Parse Don't Validate 違反（バリデーション後も生の型を使い続ける）
- コーディングルール・設計原則ドキュメントへの違反

### solid — SOLID 原則

- 単一責任原則（SRP）違反
- 開放閉鎖原則（OCP）違反 — 拡張に閉じている設計
- リスコフの置換原則（LSP）違反
- インターフェース分離原則（ISP）違反 — 不要なメソッドを含むインターフェース
- 依存性逆転原則（DIP）違反 — 具象クラスへの直接依存

### custom — 自由記述

{{#if custom_perspective}}
ユーザー指定の観点: **{{custom_perspective}}**
{{/if}}

---

## 分析手順

1. **対象ファイルの走査**: `{{target}}` 配下の全 TypeScript ファイルを `read` で読み込む
2. **問題の検出**: 選択された観点 `{{perspective}}` の基準に照らして問題箇所を特定する
3. **プロジェクト規約との照合**: AGENTS.md・設計ドキュメントの規約に反していないか確認する
4. **重要度の判定**: 各問題を P0〜P3 に分類する

### 重要度の基準

| 優先度 | 定義 | 例 |
|--------|------|-----|
| 🚨 P0 | 機能不全やバグの原因になりうる | 型不整合、エラー握りつぶし |
| ❌ P1 | 保守性を著しく損なう | 巨大関数、重大な命名問題 |
| ⚠️ P2 | 技術的負債の蓄積 | 軽微な DRY 違反、改善可能な命名 |
| 📝 P3 | 改善推奨 | cosmetic な修正 |

---

## 出力フォーマット

検出結果は以下の形式で出力してください:

### 📋 リファクタリングレポート

**対象**: `{{target}}`
**観点**: {{perspective}}
**検出件数**: X 件

---

各問題について以下を記載:

#### [P0/P1/P2/P3] 問題タイトル

**ファイル**: `path/to/file.ts`
**行**: L42-L58

**現状**:
```typescript
// 問題のあるコード
```

**問題点**:
- 具体的な説明

**改善案**:
```typescript
// 改善後のコード例
```

**修正工数**: 小 / 中 / 大

---

## GitHub Issue 作成

{{#if create_issues}}
検出した問題を GitHub Issue として起票してください。

### Issue 分割ルール

| 検出件数 | 対応 |
|----------|------|
| 10 件以下 | 1 つの Issue にまとめる |
| 11〜20 件 | P0-P1 と P2-P3 で分割 |
| 20 件以上 | カテゴリ別に分割 |

### Issue テンプレート

```bash
gh issue create \
  --title "refactor({{perspective}}): [タイトル]" \
  --label "refactoring" \
  --body "$BODY"
```

Issue 本文には以下を含めてください:

```markdown
## 概要
`{{target}}` の {{perspective}} 観点でのリファクタリング。

## 変更対象ファイル
- `path/to/file1.ts` — N 箇所
- `path/to/file2.ts` — N 箇所

## 詳細

### [P0/P1/P2/P3] 問題タイトル

**ファイル**: `path/to/file.ts` L42-L58

**現状**:
（問題のあるコード）

**改善案**:
（改善後のコード例）

---

## 受け入れ条件
- [ ] 上記箇所を修正
- [ ] 既存テストがパス
- [ ] biome check がパス
```
{{else}}
Issue 作成はスキップします。上記レポートのみを出力してください。
{{/if}}
