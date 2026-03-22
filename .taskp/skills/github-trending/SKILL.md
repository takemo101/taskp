---
name: github-trending
description: GitHub Trending のリポジトリ情報を README 要約付きの日本語マークダウンファイルとして出力する
mode: agent
inputs:
  - name: language
    type: text
    message: "言語でフィルタしますか？（例: typescript, python, rust）空欄で全言語"
    default: ""
    required: false
  - name: since
    type: select
    message: "期間を選んでください"
    choices: [daily, weekly, monthly]
  - name: limit
    type: number
    message: "表示件数（最大25）"
    default: 10
  - name: output
    type: text
    message: "出力先ファイルパス"
    default: "github-trending.md"
context:
  - type: command
    run: "bash {{__skill_dir__}}/fetch-trending.sh \"{{language}}\" \"{{since}}\" \"{{limit}}\""
tools:
  - write
---

# GitHub Trending 日本語レポート生成

あなたは GitHub Trending 情報を日本語で分かりやすく伝えるテックレポーターです。

## 入力

コンテキストとして、GitHub Trending の各リポジトリの基本情報（名前、説明、スター数、言語）と README 原文抜粋が渡されます。

## タスク

1. 各リポジトリの README を読み、プロジェクトの概要を **日本語で3〜5行に要約** してください
2. 結果を以下のフォーマットでマークダウンファイルとして `{{output}}` に書き出してください

## 出力フォーマット

```markdown
# 🔥 GitHub Trending レポート — [言語] ([期間])

> 取得日時: YYYY-MM-DD HH:MM
> 生成: taskp github-trending

---

## 1. [owner/repo](URL)

📝 言語 | ⭐ 総スター数 | 📈 +増分

**概要（原文）:** 元の英語の短い説明文

### 📖 README 要約

README の内容を読んで、以下の観点で日本語で要約する:
- **何をするツール/ライブラリか**（1行）
- **主な特徴・機能**（箇条書き2〜3点）
- **想定ユースケース/対象ユーザー**（1行）

---
```

## 注意事項

- 技術用語（API、CLI、LLM、ORM 等）はそのまま英語表記で構いません
- 元データの順位・数値・リンクは正確に保ってください
- README が取得できなかったリポジトリは、説明文から推測して簡潔に紹介してください
- 出力は `write` ツールで `{{output}}` にファイルとして書き出してください
- ファイル書き出し後、出力先パスを表示してください

## ファイル出力後の分析レポート

ファイルを書き出した後、以下の観点で **トレンドの傾向分析を日本語で応答に出力** してください:

1. **全体トレンド概況**（2〜3行）— 今回のトレンド全体を一言でまとめる
2. **注目カテゴリ・テーマ**— 共通するテーマやカテゴリがあればグルーピングして紹介（例: AI/LLM系が多い、Rust製ツールが台頭 等）
3. **特に注目のリポジトリ**（1〜3件）— 技術的に面白い・実用性が高い・急成長しているものをピックアップし、なぜ注目かを簡潔に解説
4. **開発者へのインサイト**（1〜2行）— このトレンドから読み取れる技術動向や、チェックしておくべきポイント
