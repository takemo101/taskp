---
name: taskbook
description: タスク・ノート・ボードをCLIで管理する
mode: template
actions:
  list:
    description: ボード一覧を表示する
  timeline:
    description: タイムライン表示（作成日順）
  archive:
    description: アーカイブ済みアイテムを表示する
  add-task:
    description: タスクを追加する（AIが内容を簡潔にまとめる）
    mode: agent
    tools: [bash]
    inputs:
      - name: description
        type: textarea
        message: "タスクの内容を自由に書いてください（AIが1行にまとめます）"
      - name: board
        type: text
        message: "ボード名は？（空欄でデフォルト）"
        required: false
      - name: priority
        type: select
        message: "優先度は？（1=通常, 2=中, 3=高）"
        choices: ["1", "2", "3"]
        default: "1"
  add-note:
    description: ノートを追加する（AIが内容を簡潔にまとめる）
    mode: agent
    tools: [bash]
    inputs:
      - name: description
        type: textarea
        message: "ノートの内容を自由に書いてください（AIが1行にまとめます）"
      - name: board
        type: text
        message: "ボード名は？（空欄でデフォルト）"
        required: false
  check:
    description: タスクの完了/未完了をトグルする
    inputs:
      - name: ids
        type: text
        message: "対象のID（スペース区切りで複数可）"
  begin:
    description: タスクの開始/一時停止をトグルする
    inputs:
      - name: ids
        type: text
        message: "対象のID（スペース区切りで複数可）"
  star:
    description: スター付与/解除をトグルする
    inputs:
      - name: ids
        type: text
        message: "対象のID（スペース区切りで複数可）"
  edit:
    description: アイテムの説明を編集する
    inputs:
      - name: id
        type: text
        message: "対象のIDは？"
      - name: description
        type: text
        message: "新しい説明は？"
  priority:
    description: 優先度を変更する
    inputs:
      - name: id
        type: text
        message: "対象のIDは？"
      - name: priority
        type: select
        message: "優先度は？（1=通常, 2=中, 3=高）"
        choices: ["1", "2", "3"]
  move:
    description: アイテムを別ボードへ移動する
    inputs:
      - name: id
        type: text
        message: "対象のIDは？"
      - name: board
        type: text
        message: "移動先のボード名は？"
  delete:
    description: アイテムを削除する（アーカイブへ）
    inputs:
      - name: ids
        type: text
        message: "削除するID（スペース区切りで複数可）"
      - name: confirm
        type: confirm
        message: "本当に削除しますか？"
  clear:
    description: 完了済みタスクを一括削除する
    inputs:
      - name: confirm
        type: confirm
        message: "完了済みタスクをすべてアーカイブしますか？"
  restore:
    description: アーカイブからアイテムを復元する
    inputs:
      - name: ids
        type: text
        message: "復元するID（スペース区切りで複数可）"
  search:
    description: アイテムを検索する
    inputs:
      - name: query
        type: text
        message: "検索ワードは？"
  filter:
    description: 属性でフィルタリングする
    inputs:
      - name: attribute
        type: select
        message: "フィルタ属性は？"
        choices: [pending, progress, done, star, task, note, myboard]
---

# Taskbook 管理

taskbook (`tb`) コマンドでタスク・ノート・ボードを管理する。

## セットアップ

`tb` コマンドが未インストールの場合: `npm install --global taskbook`

## 注意事項

- アイテムIDは `tb` の出力に表示される番号で指定する
- ボード名は `@` プレフィックスで指定する
- 優先度は `1`（通常）、`2`（中）、`3`（高）の3段階
- 削除したアイテムは自動アーカイブされ、`tb -r` で復元可能

## action:list

ボード一覧を表示する。

```bash
tb
```

## action:timeline

タイムライン表示（作成日順）。

```bash
tb -i
```

## action:archive

アーカイブ済みアイテムを表示する。

```bash
tb -a
```

## action:add-task

ユーザーの入力を **1行の簡潔なタスク説明** に要約して、`tb -t` コマンドで追加する。

### ルール

1. ユーザー入力（複数行の場合あり）を読んで、**日本語で1行のタスク説明**にまとめる
2. 元の意図を損なわず、具体的で行動可能な表現にする
3. 優先度は `{{priority}}`（1, 2, 3）をそのまま使う
4. コマンド実行後に `tb` で最新状態を表示する

### ユーザー入力

{{description}}

### ボード

{{#if board}}
ボード名: {{board}}
{{else}}
デフォルトボード
{{/if}}

### 優先度

{{priority}}

### 実行

要約した1行の説明を使って以下の形式で実行:

- ボードあり: `tb -t @ボード名 要約した説明 p:優先度番号`
- ボードなし: `tb -t 要約した説明 p:優先度番号`

実行後に `tb` でボードを表示して結果を報告。

## action:add-note

ユーザーの入力を **1行の簡潔なノート** に要約して、`tb -n` コマンドで追加する。

### ルール

1. ユーザー入力（複数行の場合あり）を読んで、**日本語で1行のノート**にまとめる
2. 元の意図と重要な情報を保持する
3. コマンド実行後に `tb` で最新状態を表示する

### ユーザー入力

{{description}}

### ボード

{{#if board}}
ボード名: {{board}}
{{else}}
デフォルトボード
{{/if}}

### 実行

要約した1行のノートを使って以下の形式で実行:

- ボードあり: `tb -n @ボード名 要約したノート`
- ボードなし: `tb -n 要約したノート`

実行後に `tb` でボードを表示して結果を報告。

## action:check

タスクの完了/未完了をトグルする。

```bash
tb -c {{ids}}
```

```bash
tb
```

## action:begin

タスクの開始/一時停止をトグルする。

```bash
tb -b {{ids}}
```

```bash
tb
```

## action:star

スター付与/解除をトグルする。

```bash
tb -s {{ids}}
```

```bash
tb
```

## action:edit

アイテムの説明を編集する。

```bash
tb -e @{{id}} {{description}}
```

```bash
tb
```

## action:priority

優先度を変更する。

```bash
tb -p @{{id}} {{priority}}
```

```bash
tb
```

## action:move

アイテムを別ボードへ移動する。

```bash
tb -m @{{id}} {{board}}
```

```bash
tb
```

## action:delete

{{#if confirm}}
アイテムを削除する（アーカイブへ移動）。

```bash
tb -d {{ids}}
```

```bash
tb
```
{{else}}
削除をキャンセルしました。
{{/if}}

## action:clear

{{#if confirm}}
完了済みタスクを一括削除する。

```bash
tb --clear
```

```bash
tb
```
{{else}}
一括削除をキャンセルしました。
{{/if}}

## action:restore

アーカイブからアイテムを復元する。

```bash
tb -r {{ids}}
```

```bash
tb
```

## action:search

アイテムを検索する。

```bash
tb -f {{query}}
```

## action:filter

属性でフィルタリングする。

```bash
tb -l {{attribute}}
```
