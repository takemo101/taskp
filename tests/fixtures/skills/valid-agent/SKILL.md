---
name: code-review
description: コードレビューを実行する
mode: agent
model: claude-sonnet-4-20250514
inputs:
  - name: target
    type: text
    message: "レビュー対象のファイルまたはディレクトリは？"
    default: "."
  - name: focus
    type: text
    message: "特に注目してほしい観点は？"
    required: false
tools:
  - bash
  - read
---

# コードレビュー

以下の観点で {{target}} をレビューしてください:

1. バグの可能性がある箇所
2. パフォーマンスの問題
3. 可読性・保守性の改善点
