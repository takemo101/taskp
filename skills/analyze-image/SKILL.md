---
name: analyze-image
description: 画像ファイルを読み込んで分析・フィードバックを返す
mode: agent
inputs:
  - name: image_path
    type: text
    message: "分析する画像のパスは？"
  - name: purpose
    type: select
    message: "分析の目的は？"
    choices:
      - general
      - ui-review
      - diagram
      - screenshot
    default: general
  - name: focus
    type: text
    message: "特に注目してほしい点は？（空欄で目的に応じた標準分析）"
    required: false
context:
  - type: image
    path: "{{image_path}}"
---

# 画像分析

提供された画像を分析してください。

## 分析目的

{{purpose}} モードで分析します。

{{#if focus}}
特に **{{focus}}** に注目してください。
{{/if}}

## 目的別の観点

### general（全般）

- 画像の内容・構成の説明
- 気になる点・改善提案

### ui-review（UI レビュー）

以下の観点で評価してください:

1. **視認性** — テキストの読みやすさ、コントラスト
2. **レイアウト** — 要素の配置・余白のバランス
3. **一貫性** — フォント・色・スタイルの統一感
4. **UX** — 操作の分かりやすさ、導線

### diagram（図・ダイアグラム）

- 図の種類と目的の説明
- 内容の要約
- 不明瞭な部分・改善できる表現の指摘

### screenshot（スクリーンショット）

- 画面の状態・表示内容の説明
- エラーや警告があれば内容の読み取り
- 気になる挙動・問題点の指摘

## 出力フォーマット

### 概要

（画像の内容を2〜3文で説明）

### 分析結果

（目的に応じた詳細分析を箇条書き）

### 提案・所感

（改善案や気づきがあれば。なければ省略）
