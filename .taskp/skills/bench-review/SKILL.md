---
name: bench-review
description: "[Benchmark] TypeScript コードをレビューし、構造化された JSON レポートを生成する"
mode: agent
inputs:
  - name: output
    type: text
    message: "出力先ファイルパス"
    default: "bench-review-result.json"
context:
  - type: command
    run: "bash {{__skill_dir__}}/sample-code.sh"
tools:
  - write
---

# コードレビュータスク

あなたはシニア TypeScript エンジニアです。コンテキストとして渡される TypeScript コードをレビューしてください。

## レビュー観点

以下の **5つのカテゴリ** すべてについて問題を検出してください:

1. **security** — SQLインジェクション、XSS、認証・認可の問題
2. **error_handling** — エラーの握り潰し、不適切なエラー処理
3. **type_safety** — any 型の使用、不適切な型チェック（`==` vs `===`）
4. **maintainability** — トランザクション未使用、ハードコードされた値、関心の分離
5. **validation** — 入力バリデーションの不足、境界値チェック

## 出力フォーマット

以下の JSON を `write` ツールで `{{output}}` に書き出してください。

```json
{
  "issues": [
    {
      "category": "security | error_handling | type_safety | maintainability | validation",
      "severity": "critical | warning | info",
      "location": "関数名またはメソッド名",
      "line_hint": "問題のあるコード断片（短く）",
      "description": "問題の説明（1〜2文）",
      "suggestion": "修正案（1〜2文）"
    }
  ],
  "summary": {
    "total_issues": <数値>,
    "critical": <数値>,
    "warning": <数値>,
    "info": <数値>,
    "categories_found": ["検出されたカテゴリのリスト"]
  }
}
```

## 注意

- 5つのカテゴリすべてで最低1件は問題を見つけてください
- summary の数値は issues 配列と整合させてください
- 質問や確認は不要です。即座にレビューを実行してください
