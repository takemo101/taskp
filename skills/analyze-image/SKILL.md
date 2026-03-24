---
name: analyze-image
description: 画像を分析してフィードバックを返す
mode: agent
inputs:
  - name: image_path
    type: text
    message: "分析する画像のパスは？"
  - name: focus
    type: text
    message: "何に注目して分析しますか？（空欄で全般）"
    required: false
context:
  - type: image
    path: "{{image_path}}"
tools:
  - read
---

# 画像分析

提供された画像を分析してください。

{{#if focus}}
特に **{{focus}}** に注目してください。
{{/if}}

## 出力フォーマット

- 画像の概要説明
- 注目すべきポイント
- 改善提案（該当する場合）
