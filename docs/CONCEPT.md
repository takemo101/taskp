# taskp — コンセプト

## 概要

taskp はマークダウンで定義されたスキル（タスク手順）を、インタラクティブな質問で引数を収集し、LLM またはテンプレートエンジンで実行する CLI ツール。

## 解決する課題

### 1. 繰り返しタスクの属人化

```
問題: デプロイ手順、環境構築、コードレビュー観点などがチームメンバーの頭の中にある
解決: マークダウンで手順を定義し、誰でも `taskp run deploy` で実行可能にする
```

### 2. LLM プロンプトの再利用性

```
問題: 毎回似たようなプロンプトを書いている（コードレビュー、ドキュメント生成等）
解決: スキルとして定義・共有し、変数部分だけ質問で埋める
```

### 3. コンテキストの受け渡し

```
問題: LLM に渡すべき情報（ファイル内容、設定値等）を手動でコピペしている
解決: スキル内でファイル参照・コマンド出力を自動的にコンテキストに含める
```

## ユースケース

### UC-1: テンプレート実行（LLM なし）

```bash
taskp run deploy
# → "デプロイ先を選んでください" [staging / production]
# → "ブランチ名は？" [main]
# → git checkout main && git pull && npm run build && npm run deploy:staging
```

### UC-2: LLM エージェント実行

```bash
taskp run code-review
# → "レビュー対象ファイルは？" [src/index.ts]
# → LLM がファイルを読み、コーディング規約に基づいてレビューコメントを生成
```

### UC-3: スキルの一覧・検索

```bash
taskp list
# → deploy     - アプリをデプロイする        (~/.taskp/skills/deploy)
# → review     - コードレビューを実行する     (./.taskp/skills/review)
```

### UC-4: スキルの雛形生成

```bash
taskp init my-task
# → ./.taskp/skills/my-task/SKILL.md が生成される
```

### UC-5: プロジェクト初期化

```bash
taskp setup
# → .taskp/config.toml（設定テンプレート）
# → .taskp/config.schema.json（エディタ補完用）
# → .taskp/skills/（スキル格納ディレクトリ）
# → .taplo.toml（TOML LSP 設定）

taskp setup --global
# → ~/.taskp/config.toml（グローバル設定テンプレート）
# → ~/.taskp/skills/（グローバルスキル格納ディレクトリ）
```

## 設計方針

### 1. スキルはマークダウン

- 人間が読み書きしやすい
- Git で管理しやすい
- LLM のプロンプトとしてそのまま使える

### 2. 質問ファースト

- スキルの引数はフロントマターで宣言的に定義
- 実行時にインタラクティブに収集
- CLI オプションでの直接指定もサポート

### 3. 2つの実行モード

```
template: コードブロック内のコマンドを {{変数}} 展開して順次実行（LLM 不要）
agent:    マークダウン全体を LLM に渡し、ツール呼び出しで自律実行（LLM 必要）
```

### 4. ローカル優先の探索

```
探索順序:
  1. ./.taskp/skills/<name>/SKILL.md   ← プロジェクト固有
  2. ~/.taskp/skills/<name>/SKILL.md   ← グローバル（個人）
```

### 5. MCP サーバー自動生成

- incur を使用することで、CLI コマンドがそのまま MCP ツールとしても公開される
- pi や Claude Code から `taskp` のスキルを直接呼び出せる
