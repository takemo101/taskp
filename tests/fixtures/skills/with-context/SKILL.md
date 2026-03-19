---
name: refactor
description: コードをリファクタリングする
mode: agent
inputs:
  - name: target
    type: text
    message: "リファクタリング対象のファイルは？"
context:
  - type: file
    path: "{{target}}"
  - type: glob
    pattern: "src/**/*.ts"
  - type: command
    run: "git diff --cached"
  - type: url
    url: "https://example.com/style-guide"
tools:
  - bash
  - read
  - write
---

# リファクタリング

{{target}} をリファクタリングしてください。

コンテキストとして以下が提供されます:
- 対象ファイルの内容
- プロジェクト内の TypeScript ファイル
- ステージ済みの差分
- スタイルガイド
