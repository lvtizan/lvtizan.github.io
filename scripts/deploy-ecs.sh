#!/usr/bin/env bash
# 把站点同步到广州 ECS。GitHub Pages 那条通道不受影响（push 即上线），
# 这个脚本是国内通道，两条并行，互不干扰。
#
#   用法： ./scripts/deploy-ecs.sh            # 正式同步
#          ./scripts/deploy-ecs.sh --dry-run  # 只看会传什么，不动服务器
#
# 密码认证：SSH key 在这台机器上经常出问题，直接用密码。
#   export DEPLOY_SSH_PASSWORD='你的root密码'
# 未设置时会交互式提示输入。

set -euo pipefail

HOST="8.138.243.8"
USER="root"
REMOTE="/var/www/yoyant"
LOCAL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DRY=""
[[ "${1:-}" == "--dry-run" ]] && DRY="--dry-run" && echo "== DRY RUN：只列文件，不实际传输 =="

# 不上传的：git 元数据、PNG 母版（线上只用 webp）、脚本、文档、本地草稿
EXCLUDES=(
  --exclude '.git/'
  --exclude '.gitignore'
  --exclude '.playwright-mcp/'
  --exclude 'scripts/'
  --exclude 'docs/'
  --exclude 'TODO.md'
  --exclude 'README.md'
  --exclude 'CLAUDE.md'
  --exclude 'hero-preview.html'
  --exclude '.DS_Store'
  --exclude 'uploads/*.png'   # PNG 母版留在 git，不占服务器带宽
)

# sshpass 有就用（免交互），没有就走正常 ssh 提示
SSH_CMD="ssh -o StrictHostKeyChecking=accept-new"
if [[ -n "${DEPLOY_SSH_PASSWORD:-}" ]]; then
  if command -v sshpass >/dev/null 2>&1; then
    SSH_CMD="sshpass -p $DEPLOY_SSH_PASSWORD ssh -o StrictHostKeyChecking=accept-new"
  else
    echo "提示：设了 DEPLOY_SSH_PASSWORD 但没装 sshpass（brew install sshpass），将改为交互式输入密码"
  fi
fi

echo "→ 同步 $LOCAL  →  $USER@$HOST:$REMOTE"
rsync -avz --delete $DRY \
  -e "$SSH_CMD" \
  "${EXCLUDES[@]}" \
  "$LOCAL/" "$USER@$HOST:$REMOTE/"

if [[ -z "$DRY" ]]; then
  $SSH_CMD "$USER@$HOST" "chown -R www-data:www-data $REMOTE && nginx -t && systemctl reload nginx"
  echo
  echo "→ 线上自测（备案前只能用 IP 访问）"
  curl -s -o /dev/null -w "   http://$HOST/           %{http_code}\n" "http://$HOST/"
  curl -s -o /dev/null -w "   http://$HOST/about/     %{http_code}\n" "http://$HOST/about/"
  curl -s -o /dev/null -w "   http://$HOST/work/reson/ %{http_code}\n" "http://$HOST/work/reson/"
  echo "   三个都是 200 就算成功"
fi
