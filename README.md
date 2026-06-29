# Next + WordPress Portfolio Blog Starter

A production-oriented starter that combines a Next.js portfolio/blog frontend with a WordPress admin/API backend on the same domain.

The public visitor sees the Next.js editorial portfolio/blog. The owner can still use WordPress admin, login, uploads, and REST API paths. Nginx routes WordPress PHP paths to PHP-FPM and everything else to the Next.js standalone server.

## One-click production install

Target: a clean Ubuntu 22.04/24.04 VPS with DNS already pointing to the server.

```bash
curl -fsSL https://raw.githubusercontent.com/DeclanJeon/next-wordpress-portfolio-blog-starter/main/install.sh \
  | sudo bash -s -- \
    --domain blog.example.com \
    --email admin@example.com \
    --site-name "My Field Notes" \
    --admin-user admin \
    --yes
```

Use `--dry-run` first to inspect the full plan without mutating the server:

```bash
sudo bash install.sh \
  --dry-run \
  --domain blog.example.com \
  --email admin@example.com \
  --site-name "My Field Notes"
```

## What the installer provisions

- Nginx site config
- MariaDB
- PHP-FPM and required PHP extensions
- WP-CLI and WordPress core
- Certbot TLS certificate through the Nginx plugin
- Next.js standalone release under `/opt/next-wordpress-blog`
- Shared Prisma SQLite DB under `/opt/next-wordpress-blog/shared/db/custom.db`
- systemd service for the Next.js app
- Generated root-only credentials under `/etc/next-wordpress-blog`

## Important options

| Option | Default | Description |
|---|---:|---|
| `--domain` | `example.com` | Public domain. Set this in real installs. |
| `--email` | `admin@example.com` | Certbot and WordPress admin email. |
| `--site-name` | `Field Notes` | Public site name. |
| `--admin-user` | `admin` | WordPress and local Next admin username. |
| `--admin-password` | generated | Generated if omitted. |
| `--install-dir` | `/opt/next-wordpress-blog` | Next app install root. |
| `--wordpress-dir` | `/var/www/<domain>` | WordPress root. |
| `--app-port` | `3011` | Local Next.js port. |
| `--skip-certbot` | false | Skip TLS issuance. |
| `--no-wordpress` | false | Install Next-only mode. |
| `--dry-run` | false | Print operations only. |
| `--yes` | false | Required for real mutation. |

## Local development

```bash
cp .env.example .env
bun install --frozen-lockfile
bun run db:push
bun run dev
```

## Production operations

```bash
bun run setup:production -- --dry-run --domain blog.example.com --email admin@example.com
bun run doctor:production -- --dry-run --domain blog.example.com --email admin@example.com
bun run backup:production -- --dry-run --domain blog.example.com --email admin@example.com
bun run rollback:production -- --dry-run --domain blog.example.com --email admin@example.com
```

## Security notes

Do not commit production `.env`, generated credentials, SQLite DB files, backups, or server logs. This repository intentionally ignores those files.

The installer writes generated passwords to `/etc/next-wordpress-blog/<domain>.credentials` with root-only permissions.

## Design docs

- `docs/one-click-production-setup-design.md`
- `.omo/plans/one-click-production-setup.md`
