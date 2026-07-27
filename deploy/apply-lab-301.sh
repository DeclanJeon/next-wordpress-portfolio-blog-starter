#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
REMOTE="${REMOTE:-ponslink}"
CONF_SRC="$ROOT/lab.ponslink.com.nginx.conf"
ssh "$REMOTE" "sudo cp /etc/nginx/sites-available/lab.ponslink.com /etc/nginx/sites-available/lab.ponslink.com.bak.\$(date +%Y%m%d%H%M%S) || true"
scp "$CONF_SRC" "$REMOTE:/tmp/lab.ponslink.com.nginx.conf"
ssh "$REMOTE" "sudo mv /tmp/lab.ponslink.com.nginx.conf /etc/nginx/sites-available/lab.ponslink.com && sudo ln -sfn /etc/nginx/sites-available/lab.ponslink.com /etc/nginx/sites-enabled/lab.ponslink.com && sudo nginx -t && sudo systemctl reload nginx"
echo "lab.ponslink.com now 301 -> blog.ponslink.com"
