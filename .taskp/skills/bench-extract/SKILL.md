---
name: bench-extract
description: "[Benchmark] JSON データから条件抽出・集計を行い、結果を JSON ファイルに出力する"
mode: agent
inputs:
  - name: output
    type: text
    message: "出力先ファイルパス"
    default: "bench-extract-result.json"
context:
  - type: command
    run: "bash {{__skill_dir__}}/generate-data.sh"
tools:
  - write
---

# データ抽出・集計タスク

あなたはデータ分析アシスタントです。

## 入力

コンテキストとして社員データの JSON 配列が渡されます。

## タスク

以下の3つの集計を行い、結果を **1つの JSON オブジェクト** として `{{output}}` に書き出してください。

### 集計1: Engineering 部門の平均給与

`department` が `"Engineering"` の社員の `salary` の平均値を計算してください。小数点以下は切り捨て（整数）。

### 集計2: rating が "A" の社員名リスト

`rating` が `"A"` の社員の `name` を、`id` の昇順で配列として列挙してください。

### 集計3: 部門別の人数

`department` ごとの人数を集計してオブジェクトにしてください。

## 出力フォーマット

以下の JSON を `write` ツールで `{{output}}` に書き出してください。**JSON のみ**を出力し、余計なテキストは含めないでください。

```json
{
  "engineering_avg_salary": <整数>,
  "rating_a_names": ["名前1", "名前2", ...],
  "department_counts": {
    "Engineering": <数>,
    "Marketing": <数>,
    "Sales": <数>
  }
}
```

## 注意

- 計算は正確に行ってください
- JSON として有効な形式で出力してください
- 質問や確認は不要です。即座に計算して結果を出力してください
