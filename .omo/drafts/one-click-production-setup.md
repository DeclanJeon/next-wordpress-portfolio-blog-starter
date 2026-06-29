status: plan-written
slug: one-click-production-setup
intent: clear
objective: Before commit/push, design and then implement a one-click production setup CLI that provisions WordPress + Next.js portfolio/blog on an Ubuntu server for external users.

components:
  - id: public-repo-safety
    outcome: prevent private env/db/domain secrets from being published
    status: planned
    evidence: .env, db/custom.db, docs/one-click-production-setup-design.md
  - id: setup-cli
    outcome: provide install.sh + repo CLI with dry-run and idempotent execution
    status: planned
    evidence: package.json, docs/one-click-production-setup-design.md
  - id: wordpress
    outcome: install MariaDB/PHP-FPM/WP-CLI/WordPress and expose admin/API paths
    status: planned
    evidence: remote /etc/nginx/sites-enabled/blog.ponslink.com, docs/one-click-production-setup-design.md
  - id: next-app
    outcome: build/deploy Next standalone release with shared SQLite DB and systemd
    status: planned
    evidence: next.config.ts, package.json, remote ponslink-blog-next.service
  - id: nginx-tls
    outcome: route WordPress paths to PHP-FPM, app paths to Next, and issue TLS with Certbot
    status: planned
    evidence: remote nginx configs, docs/one-click-production-setup-design.md
  - id: github-publish
    outcome: commit and push to a public GitHub repo suitable for other users
    status: planned
    evidence: gh repo list found private ponslink-blog-next-frontend and public wordpress_main_1

adopted defaults:
  - target_os: Ubuntu 22.04/24.04 VPS
  - web_server: Nginx
  - tls: Certbot nginx plugin by default, skippable
  - wordpress_db: MariaDB
  - app_db: SQLite under /opt/<app>/shared/db/custom.db
  - node_runtime: Bun for setup/build, Node for standalone server under systemd
  - public_repo_strategy: create a new public starter repo unless user explicitly wants to repurpose an existing repo

owner decisions resolved by stated intent:
  - repo must be usable by other users, therefore public-safe starter packaging is required before commit/push.
  - domain/site name remain user-configurable, not hardcoded.
