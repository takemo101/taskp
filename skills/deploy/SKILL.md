---
name: deploy
description: アプリケーションをステージングまたは本番環境にデプロイする
mode: template
inputs:
  - name: environment
    type: select
    message: "デプロイ先を選んでください"
    choices: [staging, production]
  - name: branch
    type: text
    message: "デプロイするブランチ名は？"
    default: main
  - name: confirm
    type: confirm
    message: "{{environment}} に {{branch}} をデプロイします。よろしいですか？"
---

# Deploy to {{environment}}

{{branch}} ブランチを {{environment}} 環境にデプロイします。

## ブランチの準備

```bash
git fetch origin
git checkout {{branch}}
git pull origin {{branch}}
```

## テスト

```bash
npm run typecheck
npm run test
```

## ビルド

```bash
npm run build
```

## デプロイ

```bash
npm run deploy:{{environment}}
```
