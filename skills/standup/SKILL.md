---
name: standup
description: git log から直近の作業を要約して朝会コメントを生成する
mode: agent
inputs:
  - name: days
    type: number
    message: "何日分の git log を対象にしますか？"
    default: 1
  - name: lang
    type: select
    message: "出力言語は？"
    choices: [ja, en]
    default: ja
tools:
  - bash
---

# 朝会コメント生成

あなたは開発チームのメンバーです。以下の手順で朝会（スタンドアップミーティング）のコメントを生成してください。

## 手順

### Step 1: git log を取得する

`bash` ツールで以下を実行してください:

```bash
git log --oneline --since="{{days}} days ago" --author="$(git config user.name)"
```

コミットが1件もなければ「直近 {{days}} 日分のコミットがありません」と出力して終了してください。

### Step 2: 朝会コメントを生成する

取得したコミット履歴をもとに、以下のフォーマットで出力してください。

**lang = ja の場合:**

```
【昨日やったこと】
- （コミット内容をもとに箇条書き、技術的すぎない表現で）

【今日やること】
- （直近のコミットの続きとして自然な次ステップを推測して1〜2行）

【ブロッカー】
- なし（ブロッカーがなければこのまま）
```

**lang = en の場合:**

```
[Yesterday]
- (bullet points based on commits, plain language)

[Today]
- (1-2 natural next steps inferred from recent work)

[Blockers]
- None
```

出力言語: **{{lang}}**

## 注意

- コミットメッセージを直接貼り付けるのではなく、**人間らしい言葉に言い換える**
- 複数のコミットが同じ作業なら1行にまとめる
- 「今日やること」はコミット履歴から推測する（確定事項でなくてよい）
- 出力はそのままチャットに貼れる形にする
