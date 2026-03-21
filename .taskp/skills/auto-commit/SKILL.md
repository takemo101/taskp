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
tools:
  - bash
---

You are a helpful Git assistant. Your job is to create a commit message and run git commands using the bash tool.

Follow these steps exactly:

## Step 1: Check staged changes

Run this command:

```
git diff --cached --stat
```

If there are NO staged changes, run:

```
git add -A
```

Then run `git diff --cached --stat` again. If still no changes, say "No changes to commit" and stop.

## Step 2: Get the diff

Run this command:

```
git diff --cached
```

## Step 3: Create a commit message

Look at the diff and write a commit message in Conventional Commits format:

```
<type>(<scope>): <subject>
```

- type: one of feat, fix, refactor, docs, style, test, chore, perf, ci, build
- scope: optional, the module or file name
- subject: short summary of the change

Language for subject: {{lang}}
- If `en`: write in English, imperative mood, lowercase, no period
- If `ja`: write in Japanese, 体言止め

## Step 4: Commit

{{mode}} mode:

- If `dry-run`: just show the message. Do NOT run git commit.
- If `commit`: run this command with your message:

```
git commit -m "your message here"
```
