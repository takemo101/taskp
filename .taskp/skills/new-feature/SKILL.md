---
name: new-feature
description: GitHub Issue に紐づく feature ブランチを作成して作業を開始する
mode: template
inputs:
  - name: issue_number
    type: number
    message: "Issue 番号は？"
  - name: slug
    type: text
    message: "ブランチのスラッグは？（例: add-login-endpoint）"
    validate: "^[a-z0-9][a-z0-9-]*$"
  - name: base
    type: select
    message: "ベースブランチは？"
    choices: [main, develop]
    default: main
---

# Feature Branch: feature/issue-{{issue_number}}-{{slug}}

```bash
git fetch origin
git checkout {{base}}
git pull origin {{base}}
git checkout -b feature/issue-{{issue_number}}-{{slug}}
```
