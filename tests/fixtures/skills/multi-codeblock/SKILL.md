---
name: setup
description: プロジェクトをセットアップする
mode: template
inputs:
  - name: project
    type: text
    message: "プロジェクト名は？"
---

# Setup {{project}}

## 依存関係のインストール

```bash
cd {{project}}
npm install
```

## データベースのセットアップ

```bash
npm run db:migrate
```

## 初期データの投入

```bash
npm run db:seed
```
