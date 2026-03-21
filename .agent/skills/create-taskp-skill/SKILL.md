---
name: create-taskp-skill
description: taskp 用のスキル（SKILL.md）を対話的に設計・作成する。「taskp のスキルを作りたい」「.taskp/skills に追加したい」と言われたときに使う。
---

# taskp スキル作成ガイド

ユーザーの要望をヒアリングし、taskp の SKILL.md 仕様に準拠したスキルファイルを作成する。

## 仕様の要点

### ファイル構造

```
.taskp/skills/<skill-name>/
└── SKILL.md
```

- `name` フィールドとディレクトリ名を一致させること

### フロントマター（YAML）

```yaml
---
name: <skill-name>          # 必須: ディレクトリ名と一致
description: <説明>           # 必須: list コマンドで表示される
mode: template | agent       # 省略時は template
inputs: []                   # 入力定義
model: <model-name>          # agent モード時の LLM モデル（省略可）
tools: [bash, read, write]   # agent モード時のツール（省略可、デフォルト: bash, read, write）
context: []                  # 自動コンテキスト（省略可）
---
```

### Input 定義

```yaml
inputs:
  - name: varname         # 変数名（本文で {{varname}} として参照）
    type: text            # text | textarea | select | confirm | number | password
    message: "質問文"
    default: "デフォルト値"  # 省略可
    choices: [a, b, c]    # select 用（省略可）
    required: true        # 省略可（デフォルト: true）
    validate: "^[a-z]+$"  # 正規表現バリデーション（省略可）
```

### Context 定義

```yaml
context:
  - type: file
    path: "src/{{target}}"          # 変数展開可能
  - type: glob
    pattern: "src/**/*.ts"
  - type: command
    run: "git diff --cached"
  - type: url
    url: "https://example.com/docs"
```

### 変数展開

- 構文: `{{variable_name}}`
- 変数パターン: `\w+`（英数字とアンダースコアのみ）
- 未定義変数があるとエラーになる

#### 条件ブロック

`{{#if var}}...{{/if}}` および `{{#if var}}...{{else}}...{{/if}}` が使える。

```
{{#if confirm}}
確認済みの処理を実行します。
{{else}}
スキップしました。
{{/if}}
```

truthy / falsy 判定:
- **falsy**: 空文字 `""` と `"false"`
- **truthy**: それ以外すべて（`"true"`, `"hello"`, `"0"` 等）

制約:
- ネスト不可（`{{#if}}` の中に `{{#if}}` を書くとエラー）
- 閉じタグ `{{/if}}` 必須（なければエラー）
- 選択されなかった分岐内の未定義変数はエラーにならない

#### 予約変数（inputs で定義せずに使える）

| 変数 | 説明 |
|------|------|
| `{{__cwd__}}` | 現在の作業ディレクトリ |
| `{{__skill_dir__}}` | スキルファイルのディレクトリパス |
| `{{__date__}}` | 実行日（YYYY-MM-DD） |
| `{{__timestamp__}}` | 実行タイムスタンプ（ISO 8601） |

### 実行モードの選び方

| モード | 用途 | LLM |
|--------|------|-----|
| **template** | 確定的な手順の自動化（ビルド、デプロイ等） | 不要 |
| **agent** | 判断を伴うタスク（レビュー、生成、分析等） | 必要 |

#### template モード

- マークダウン内の ` ```bash ` コードブロックを上から順に抽出・実行
- 変数展開後に execa で実行
- 非ゼロ終了コードで中断

#### agent モード

- マークダウン全体を LLM のシステムプロンプトとして送信
- LLM が tools（bash, read, write 等）を呼び出して自律実行
- LLM が完了と判断するまでループ

## 作成手順

1. **ヒアリング**: ユーザーにスキルの目的・用途を聞く
2. **モード判定**: 確定的な手順か、判断が必要かで template / agent を決める
3. **入力設計**: 必要なパラメータを inputs として定義する
4. **コンテキスト設計**: 自動取得すべき情報があれば context を定義する
5. **本文作成**: 手順書（template）またはプロンプト（agent）を書く
6. **ファイル出力**: `.taskp/skills/<name>/SKILL.md` に書き出す

## 注意事項・よくある落とし穴

- **変数名は `\w+` のみ**: ハイフンやドットは使えない（`my_var` は OK、`my-var` は NG）
- **`{{#if}}` はネスト不可**: `{{#if a}}{{#if b}}...{{/if}}{{/if}}` はエラーになる。フラットに並べること
- **`{{/if}}` の閉じ忘れはエラー**: サイレントに壊れることはない
- **confirm 型は `{{#if}}` と組み合わせる**: `{{#if confirmed}}実行{{else}}スキップ{{/if}}`
- **required: false の空入力も `{{#if}}` で判定可能**: 空文字は falsy になる
- **`"0"` は truthy**: falsy は `""` と `"false"` のみ
- **context 内のパスも変数展開される**: `path: "src/{{target}}"` のように動的パスが使える
- **name とディレクトリ名を一致させる**: 不一致だとスキルが見つからない
- **template モードでは bash コードブロックのみ実行される**: 他の言語のコードブロックは無視される
- **スキルディレクトリにヘルパースクリプトを置ける**: `{{__skill_dir__}}/script.sh` で参照可能
