#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ORG_NAME="${ORG_NAME:-translation-intern-ops}"
REPO_NAME="${REPO_NAME:-translation-intern-ops.github.io}"
GH_BIN="${GH_BIN:-$ROOT_DIR/.tools/gh_2.93.0_macOS_amd64/bin/gh}"

cd "$ROOT_DIR"

if [[ ! -x "$GH_BIN" ]]; then
  echo "未找到 gh CLI：$GH_BIN"
  exit 1
fi

if ! "$GH_BIN" auth status >/dev/null 2>&1; then
  echo "请先登录 GitHub："
  "$GH_BIN" auth login --hostname github.com --git-protocol https --web --scopes repo,workflow,admin:org,read:org
fi

if ! "$GH_BIN" api "orgs/${ORG_NAME}" >/dev/null 2>&1; then
  echo "组织 ${ORG_NAME} 还不存在。"
  echo "请先在浏览器创建组织："
  echo "https://github.com/organizations/plan?name=${ORG_NAME}"
  echo ""
  echo "创建完成后重新运行："
  echo "  ./scripts/publish-org-pages.sh"
  exit 1
fi

FULL_REPO="${ORG_NAME}/${REPO_NAME}"

if "$GH_BIN" repo view "$FULL_REPO" >/dev/null 2>&1; then
  echo "仓库已存在：$FULL_REPO"
  if git remote get-url org-pages >/dev/null 2>&1; then
    git push org-pages main
  else
    git remote add org-pages "https://github.com/${FULL_REPO}.git"
    git push -u org-pages main
  fi
else
  echo "在组织下创建 Pages 仓库：$FULL_REPO"
  "$GH_BIN" repo create "$FULL_REPO" \
    --public \
    --description "Translation Intern Ops" \
    --source=. \
    --remote=org-pages \
    --push
fi

echo "启用 GitHub Pages（GitHub Actions）..."
if ! "$GH_BIN" api "repos/${FULL_REPO}/pages" >/dev/null 2>&1; then
  "$GH_BIN" api -X POST "repos/${FULL_REPO}/pages" -f build_type=workflow
fi

echo ""
echo "触发部署..."
"$GH_BIN" workflow run "Deploy GitHub Pages" --repo "$FULL_REPO" || true

PAGES_URL="https://${ORG_NAME}.github.io/"
echo ""
echo "组织 Pages 地址（部署完成后）："
echo "$PAGES_URL"
echo ""
echo "Actions 进度："
echo "https://github.com/${FULL_REPO}/actions"
