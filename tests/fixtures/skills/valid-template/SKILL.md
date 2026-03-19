---
name: deploy
description: アプリケーションをデプロイする
mode: template
inputs:
  - name: environment
    type: select
    message: "デプロイ先を選んでください"
    choices: [staging, production]
  - name: branch
    type: text
    message: "ブランチ名は？"
    default: main
---

# Deploy to {{environment}}

{{environment}} 環境に {{branch}} ブランチをデプロイします。

```bash
git checkout {{branch}}
git pull origin {{branch}}
npm run build
npm run deploy:{{environment}}
```
