# taskp タスクランナー

set shell := ["bash", "-euo", "pipefail", "-c"]

# デフォルト: タスク一覧を表示
default:
    @just --list

# 依存関係をインストール
deps:
    bun install

# ビルド
build: deps
    bun run build

# ローカルにインストール (bun link)
install: build
    @# bun build --target bun は shebang を付与しないため、手動で追加する
    @if ! head -1 dist/cli.js | grep -q '^#!/'; then \
        sed -i '' '1s|^|#!/usr/bin/env bun\n|' dist/cli.js; \
    fi
    @chmod +x dist/cli.js
    bun link
    @echo ""
    @echo "✅ taskp installed"
    @command -v taskp >/dev/null 2>&1 \
        || echo "⚠️  taskp not in PATH. Add to shell config: export PATH=\"$HOME/.bun/bin:\$PATH\""

# アンインストール
uninstall:
    #!/usr/bin/env bash
    if bun pm ls -g 2>/dev/null | grep -q taskp; then
        bun unlink 2>/dev/null || true
    fi
    rm -f "$HOME/.bun/bin/taskp"
    echo "✅ taskp uninstalled"

# 型チェック
typecheck:
    bun run typecheck

# リント
lint:
    bun run check

# リント (自動修正)
fix:
    bun run fix

# テスト
test *args:
    bun run test {{ args }}

# テスト (ウォッチモード)
test-watch:
    bun run test:watch

# 開発モードで実行
dev *args:
    bun run dev {{ args }}

# ビルド + リント + テスト
ci: build lint typecheck test

# クリーンアップ
clean:
    rm -rf dist node_modules
