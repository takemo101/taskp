---
name: auto-commit
description: gitのステージング済み差分からコミットメッセージを自動生成してコミットする
mode: agent
inputs:
  - name: lang
    type: select
    message: "コミットメッセージの言語は？"
    choices: [en, ja]
    default: en
  - name: mode
    type: select
    message: "実行モードを選んでください"
    choices: [commit, dry-run]
    default: commit
context:
  - type: command
    run: "git diff --cached --stat"
  - type: command
    run: "git diff --cached"
tools:
  - bash
---

# Auto Commit

git のステージング済み変更からコミットメッセージを生成し、コミットする。

実行モード: {{mode}}

## 手順

### 1. ステージング状態を確認

`git diff --cached --stat` の結果を確認する。

- ステージング済みの変更がない場合は `git add -A` で全変更をステージングする
- それでも変更がなければ「コミットする変更がありません」と伝えて終了する

### 2. 差分を分析してコミットメッセージを生成

コンテキストに含まれる `git diff --cached` の内容を分析し、以下のルールでコミットメッセージを生成する。

#### Conventional Commits 形式

```
<type>(<scope>): <subject>
```

- **type**: feat, fix, refactor, docs, style, test, chore, perf, ci, build のいずれか
- **scope**: 変更対象のモジュール名やファイル名（省略可）
- **subject**: 変更内容の要約（{{lang}} で記述）
  - en の場合: 英語、命令形、小文字始まり、末尾にピリオドなし
  - ja の場合: 日本語、体言止め

#### 例

- `feat(auth): add login endpoint`
- `fix(parser): handle empty input gracefully`
- `refactor(config): configローダーの簡素化`

### 3. コミットの実行

- {{mode}} が `dry-run` の場合: 生成したコミットメッセージを表示して終了する。コミットは実行しない。
- {{mode}} が `commit` の場合: 生成したコミットメッセージで `git commit -m "<message>"` を実行する。
