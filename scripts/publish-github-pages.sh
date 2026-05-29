#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_NAME="${REPO_NAME:-translation-intern-ops}"
GH_BIN="${GH_BIN:-$ROOT_DIR/.tools/gh_2.93.0_macOS_amd64/bin/gh}"

cd "$ROOT_DIR"

if [[ ! -x "$GH_BIN" ]]; then
  echo "未找到 gh CLI：$GH_BIN"
  echo "请先安装 GitHub CLI，或设置 GH_BIN 环境变量。"
  exit 1
fi

if [[ -n "${GH_TOKEN:-}" ]]; then
  echo "$GH_TOKEN" | "$GH_BIN" auth login --with-token
fi

if ! "$GH_BIN" auth status >/dev/null 2>&1; then
  echo "尚未登录 GitHub，请在浏览器中完成授权..."
  "$GH_BIN" auth login --hostname github.com --git-protocol https --web --scopes repo,workflow,read:org
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "已存在 origin 远程，直接推送..."
  git push -u origin main
else
  echo "创建 GitHub 仓库并推送：$REPO_NAME"
  "$GH_BIN" repo create "$REPO_NAME" \
    --public \
    --source=. \
    --remote=origin \
    --push \
    --description "Translation intern management system"
fi

OWNER="$("$GH_BIN" repo view --json owner -q .owner.login)"
PAGES_URL="https://${OWNER}.github.io/${REPO_NAME}/"

echo ""
echo "仓库已推送。正在检查 GitHub Pages..."
echo "首次部署通常需要 1-3 分钟，可在 Actions 页查看进度："
echo "https://github.com/${OWNER}/${REPO_NAME}/actions"
echo ""
echo "Pages 地址（部署完成后可访问）："
echo "$PAGES_URL"
echo ""
echo "若 Pages 未自动启用，请到 Settings → Pages → Source 选择 GitHub Actions。"
