#!/usr/bin/env bash
set -euo pipefail

LANGUAGE="${1:-}"
SINCE="${2:-daily}"
LIMIT="${3:-10}"
README_MAX_CHARS="${4:-3000}"

# URL 構築
URL="https://github.com/trending"
if [[ -n "$LANGUAGE" ]]; then
  URL="${URL}/${LANGUAGE}"
fi
URL="${URL}?since=${SINCE}"

# HTML 取得
HTML=$(curl -s -L -H "Accept-Language: en-US,en;q=0.9" "$URL")

# 期間ラベル
case "$SINCE" in
  daily)   PERIOD="今日" ;;
  weekly)  PERIOD="今週" ;;
  monthly) PERIOD="今月" ;;
  *)       PERIOD="$SINCE" ;;
esac

# ヘッダー出力
if [[ -n "$LANGUAGE" ]]; then
  echo "# 🔥 GitHub Trending — ${LANGUAGE} (${PERIOD})"
else
  echo "# 🔥 GitHub Trending (${PERIOD})"
fi
echo ""
echo "> 取得日時: $(date '+%Y-%m-%d %H:%M')"
echo ""

# パース → リポジトリ一覧 + README 取得
echo "$HTML" | python3 -c "
import sys
import html
import re
import urllib.request
import urllib.error

content = sys.stdin.read()
limit = int('${LIMIT}')
readme_max = int('${README_MAX_CHARS}')

articles = re.findall(r'<article[^>]*>.*?</article>', content, re.DOTALL)

def fetch_readme(owner, repo, max_chars):
    \"\"\"GitHub API で README を取得し、先頭 max_chars 文字を返す\"\"\"
    # raw.githubusercontent.com から直接取得（API rate limit を避ける）
    for branch in ['main', 'master']:
        url = f'https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                text = resp.read().decode('utf-8', errors='replace')
                if len(text) > max_chars:
                    text = text[:max_chars] + '\n\n... (truncated)'
                return text
        except urllib.error.HTTPError:
            continue
        except Exception:
            continue
    return '(README の取得に失敗しました)'

count = 0
for article in articles:
    if count >= limit:
        break

    # リポジトリ名 (owner/repo)
    repo_match = re.search(r'href=\"/([^\"]+)\"[^>]*>\s*(?:<svg[^>]*>.*?</svg>)?\s*<span[^>]*>([^<]+)</span>\s*/\s*<span[^>]*>([^<]+)</span>', article, re.DOTALL)
    if not repo_match:
        repo_match = re.search(r'<h2[^>]*>.*?href=\"/([^\"]+)\"', article, re.DOTALL)
        if not repo_match:
            continue
        repo_path = repo_match.group(1).strip()
        parts = repo_path.split('/')
        if len(parts) >= 2:
            owner = parts[0].strip()
            repo = parts[1].strip()
        else:
            continue
    else:
        owner = repo_match.group(2).strip()
        repo = repo_match.group(3).strip()

    count += 1

    # 説明
    desc_match = re.search(r'<p[^>]*class=\"[^\"]*col-9[^\"]*\"[^>]*>(.*?)</p>', article, re.DOTALL)
    desc = ''
    if desc_match:
        desc = re.sub(r'<[^>]+>', '', desc_match.group(1)).strip()
        desc = html.unescape(desc)

    # 言語
    lang_match = re.search(r'<span[^>]*itemprop=\"programmingLanguage\"[^>]*>([^<]+)</span>', article)
    lang = lang_match.group(1).strip() if lang_match else ''

    # スター数
    star_match = re.search(r'href=\"/[^\"]+/stargazers\"[^>]*>\s*(?:<svg[^>]*>.*?</svg>)?\s*([\d,]+)', article, re.DOTALL)
    if not star_match:
        star_match = re.search(r'([\d,]+)\s*stars', article, re.IGNORECASE)
    stars = star_match.group(1).strip().replace(',', '') if star_match else ''

    # 今期のスター増分
    trend_match = re.search(r'([\d,]+)\s*stars\s*(today|this\s*week|this\s*month)', article, re.IGNORECASE)
    trend = trend_match.group(1).strip() if trend_match else ''

    # README 取得
    sys.stderr.write(f'  📖 README 取得中: {owner}/{repo} ...\n')
    readme = fetch_readme(owner, repo, readme_max)

    # 出力
    print(f'## {count}. [{owner}/{repo}](https://github.com/{owner}/{repo})')
    print()
    if desc:
        print(f'> {desc}')
        print()
    meta = []
    if lang:
        meta.append(f'📝 {lang}')
    if stars:
        meta.append(f'⭐ {int(stars):,}')
    if trend:
        meta.append(f'📈 +{trend}')
    if meta:
        print(' | '.join(meta))
        print()
    print('### README (原文抜粋)')
    print()
    print(readme)
    print()
    print('---')
    print()

if count == 0:
    print('トレンドリポジトリが見つかりませんでした。')
"
