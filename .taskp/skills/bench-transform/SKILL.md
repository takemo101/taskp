---
name: bench-transform
description: "[Benchmark] サーバーログを分析し、複数の集計軸でインシデントレポートを生成する"
mode: agent
inputs:
  - name: output
    type: text
    message: "出力先ファイルパス"
    default: "bench-transform-result.json"
context:
  - type: command
    run: "bash {{__skill_dir__}}/generate-logs.sh"
tools:
  - write
---

# ログ分析・インシデントレポート生成タスク

あなたはサイト信頼性エンジニア（SRE）です。コンテキストとして渡されるサーバーログを分析し、構造化されたインシデントレポートを JSON として出力してください。

## 分析ルール

### ルール1: ログレベル別集計

各ログレベル（INFO, WARN, ERROR）の出現回数を集計してください。

### ルール2: エラー検出

ERROR レベルのログを抽出し、以下の情報を含めてください:
- タイムスタンプ
- コンポーネント（`[xxx]` の部分）
- エラーメッセージ（`error="..."` の部分、ない場合はログ行全体の要約）

### ルール3: セキュリティイベント検出

以下の条件に合致するものをセキュリティイベントとして抽出してください:
- 同一ユーザーの連続ログイン失敗（3回以上）→ severity: "high"
- レートリミット発動 → severity: "medium"
- 外部 IP（192.168.x.x, 10.x.x.x, 172.16.x.x 以外）からのアクセス → severity: "low"

### ルール4: パフォーマンス分析

- API リクエスト（`[api]` コンポーネント）の平均レスポンスタイム（`duration_ms`）を計算。小数点以下切り捨て。
- レスポンスタイムが 1000ms を超えるリクエストを slow_requests としてリストアップ。

### ルール5: ユーザーアクティビティ

ユーザー別の操作回数（auth ログ + api ログで `user=xxx` が含まれるもの）を集計してください。

## 出力フォーマット

以下の JSON を `write` ツールで `{{output}}` に書き出してください。

```json
{
  "log_level_counts": {
    "INFO": <数値>,
    "WARN": <数値>,
    "ERROR": <数値>
  },
  "errors": [
    {
      "timestamp": "2026-03-22T...",
      "component": "コンポーネント名",
      "message": "エラー内容"
    }
  ],
  "security_events": [
    {
      "type": "brute_force | rate_limit | external_access",
      "severity": "high | medium | low",
      "user": "ユーザー名または null",
      "ip": "IPアドレスまたは null",
      "detail": "説明"
    }
  ],
  "performance": {
    "api_avg_response_ms": <整数>,
    "slow_requests": [
      {
        "timestamp": "2026-03-22T...",
        "method_path": "POST /api/posts",
        "duration_ms": <数値>,
        "status": <数値>
      }
    ]
  },
  "user_activity": {
    "ユーザー名": <操作回数>
  }
}
```

## 注意

- 計算は正確に行ってください
- すべてのルール（5つ）の結果を含めてください
- 質問や確認は不要です。即座に分析を実行して結果を出力してください
