#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${REMOTE:-ponslink}"
RELEASE_ID="adsense-fix-$(date +%Y%m%d%H%M%S)"
REMOTE_BASE="/opt/ponslink-blog-next"
REMOTE_RELEASE="$REMOTE_BASE/releases/$RELEASE_ID"

export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://blog.ponslink.com}"
export NEXT_PUBLIC_ADSENSE_CLIENT="${NEXT_PUBLIC_ADSENSE_CLIENT:-ca-pub-6181820059897519}"
export NODE_ENV=production

cd "$ROOT"
echo "Building blog with SITE_URL=$NEXT_PUBLIC_SITE_URL ADSENSE=$NEXT_PUBLIC_ADSENSE_CLIENT"
if command -v bun >/dev/null 2>&1; then
  bun run build
else
  npm run build
fi

# Sanity: sitemap should not contain localhost when built with env
if [[ -f .next/server/app/sitemap.xml.body ]]; then
  if grep -q 'localhost:3000' .next/server/app/sitemap.xml.body; then
    echo "Build still produced localhost sitemap" >&2
    exit 1
  fi
fi

ssh "$REMOTE" "mkdir -p '$REMOTE_RELEASE'"
# Sync standalone layout used by current production releases
if [[ -d .next/standalone ]]; then
  rsync -az --delete \
    .next/standalone/ "$REMOTE:$REMOTE_RELEASE/"
  # static + public required next to standalone
  mkdir -p .next/standalone/.next
  rsync -az .next/static/ "$REMOTE:$REMOTE_RELEASE/.next/static/"
  rsync -az public/ "$REMOTE:$REMOTE_RELEASE/public/"
else
  rsync -az --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude dev.log \
    ./ "$REMOTE:$REMOTE_RELEASE/"
fi

ssh "$REMOTE" "ln -sfn '$REMOTE_RELEASE' '$REMOTE_BASE/current' && sudo systemctl restart ponslink-blog-next.service && sleep 2 && systemctl is-active ponslink-blog-next.service"
echo "Blog deployed release=$RELEASE_ID"
