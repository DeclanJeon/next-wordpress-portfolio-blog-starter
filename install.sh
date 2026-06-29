#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/DeclanJeon/next-wordpress-portfolio-blog-starter.git}"
SOURCE_DIR="${SOURCE_DIR:-/opt/next-wordpress-portfolio-blog-starter/source}"
BUN_BIN="${BUN_BIN:-/root/.bun/bin/bun}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "This installer must run as root. Re-run with sudo." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git unzip

if ! command -v bun >/dev/null 2>&1 && [[ ! -x "${BUN_BIN}" ]]; then
  curl -fsSL https://bun.sh/install | bash
fi

if command -v bun >/dev/null 2>&1; then
  BUN="$(command -v bun)"
else
  BUN="${BUN_BIN}"
fi

mkdir -p "$(dirname "${SOURCE_DIR}")"
if [[ -d "${SOURCE_DIR}/.git" ]]; then
  git -C "${SOURCE_DIR}" pull --ff-only
else
  git clone "${REPO_URL}" "${SOURCE_DIR}"
fi

cd "${SOURCE_DIR}"
"${BUN}" install --frozen-lockfile
"${BUN}" run setup:production -- "$@"
