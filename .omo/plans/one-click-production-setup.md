# one-click-production-setup - Work Plan
## TL;DR (For humans)
Build a public-safe one-click production setup system for this WordPress + Next.js portfolio/blog starter before committing and pushing. The implementation will add an installable CLI, Nginx/systemd/WordPress templates, dry-run/idempotency/doctor/rollback checks, public README guidance, and a sanitized GitHub publish path. It will not publish production `.env`, production SQLite DB, private tokens, or ponslink-specific credentials.

## Scope
IN:
- Add one-click setup design and implementation for Ubuntu VPS.
- Provision Nginx, PHP-FPM, MariaDB, WP-CLI/WordPress, Certbot, Next.js standalone, Prisma SQLite, and systemd.
- Add public-safe docs, templates, scripts, `.env.example`, and README setup instructions.
- Add validation/doctor commands and smoke checks.
- Commit and push to GitHub after implementation and verification.

OUT:
- DNS provider API automation.
- Multi-tenant SaaS hosting.
- Managed cloud-specific Terraform.
- Shipping current production `.env` or `db/custom.db` as user seed data.

## Verification strategy
- Unit-test option parsing, template rendering, redaction, and command plan generation.
- Run dry-run CLI locally without root side effects.
- Use shellcheck-like syntax checks for generated shell templates where available.
- Validate generated Nginx config with `nginx -t` in a controlled environment or container if available.
- Validate Next app with `bun test`, `bunx tsc --noEmit`, and `bun run build`.
- For live production, do not run destructive setup against the current server; use current server configs only as evidence.
- Before GitHub push, scan for `.env`, DB files, tokens, and ponslink-only hardcoded defaults.

## Execution strategy
- Keep production deployment changes and public-starter setup changes in separate atomic commits where possible.
- Preserve unrelated dirty work; stage only files related to setup/public packaging when committing.
- Prefer TypeScript for CLI orchestration and shell templates for privileged system commands.
- Every privileged operation must support dry-run and print the exact command group it would run.
- Every installed artifact must have a deterministic path and backup/rollback path.

## Todos

### T1 — Public repository safety baseline
References:
- `.env`
- `db/custom.db`
- `package.json`
- `docs/one-click-production-setup-design.md`
Acceptance criteria:
- `.env.example` exists with generic values only.
- `.gitignore` excludes production `.env`, local DBs, backups, logs, build outputs, and generated setup state.
- README or docs explicitly warns not to commit production DB/secrets.
- No setup path requires ponslink-specific domains or credentials.
QA:
- Happy: run `git status --short` and confirm production `.env` is not staged.
- Failure: run a secret/path grep for `ponslink.com`, AdSense, Google verification, and token-like strings in files planned for public commit; either remove or document intentional examples.
Commit: `Harden starter repository for public setup`

### T2 — CLI contract and dry-run runner
References:
- `docs/one-click-production-setup-design.md#cli-ux`
- `package.json`
Acceptance criteria:
- `install.sh` exists and delegates to repo CLI.
- `scripts/setup-production.ts` parses documented options.
- `--dry-run` performs no system mutation and prints ordered phases.
- Secrets are redacted in logs.
QA:
- Happy: `bun run setup:production -- --dry-run --domain example.com --email admin@example.com --yes` exits 0 and prints phases.
- Failure: missing `--domain` exits non-zero with usage.
Commit: `Add production setup CLI skeleton`

### T3 — System templates and preflight
References:
- Remote `/etc/systemd/system/ponslink-blog-next.service`
- Remote `/etc/nginx/sites-enabled/blog.ponslink.com`
- `next.config.ts`
Acceptance criteria:
- Nginx, systemd, env, and WordPress config templates exist under setup templates.
- Preflight checks root/sudo, OS family, domain DNS, port collisions, PHP-FPM socket, install dirs, and existing Nginx configs.
- Template rendering is deterministic and test-covered.
QA:
- Happy: render templates for `blog.example.com` and assert no `ponslink.com` remains.
- Failure: occupied app port or invalid domain fails preflight before mutation.
Commit: `Add production preflight and service templates`

### T4 — WordPress provisioning phase
References:
- Current Nginx WordPress locations in `blog.ponslink.com`
- WP-CLI official install/config docs listed in design doc
Acceptance criteria:
- CLI can install required apt packages or print them in dry-run.
- CLI installs WP-CLI if missing.
- CLI creates MariaDB database/user/password idempotently.
- CLI downloads/configures WordPress and runs `wp core install` only when not already installed.
- WordPress REST and login health checks are defined.
QA:
- Happy: dry-run shows package, DB, WP-CLI, and WordPress commands in order.
- Failure: existing WordPress install causes skip, not overwrite.
Commit: `Plan WordPress provisioning in setup CLI`

### T5 — Next standalone deployment phase
References:
- `next.config.ts`
- `package.json` build/start scripts
- Current release layout `/opt/ponslink-blog-next/releases/<timestamp>`
Acceptance criteria:
- CLI builds Next standalone output.
- CLI creates release/current/shared layout.
- CLI initializes or preserves SQLite DB.
- CLI installs/updates systemd unit and restarts service only after release is ready.
QA:
- Happy: dry-run shows build, copy, symlink, systemd reload/restart.
- Failure: failed build leaves `current` symlink untouched.
Commit: `Add Next standalone deployment phase`

### T6 — Nginx, TLS, doctor, backup, rollback
References:
- Current Nginx config for WordPress + Next routing
- Certbot official docs listed in design doc
Acceptance criteria:
- CLI writes Nginx config to sites-available, symlinks sites-enabled, tests config, then reloads.
- CLI supports `--skip-certbot` and default Certbot Nginx issuance.
- `doctor` validates app, WordPress REST, login, systemd, Nginx, TLS.
- `backup` archives app DB, WordPress DB/root, Nginx config, and systemd unit.
- rollback restores previous Next release and Nginx config.
QA:
- Happy: dry-run doctor lists exact probes.
- Failure: invalid Nginx template does not reload and restores previous config.
Commit: `Add production doctor backup and rollback design`

### T7 — Public README and GitHub push
References:
- `gh repo list` output: `ponslink-blog-next-frontend` private, `wordpress_main_1` public
- `docs/one-click-production-setup-design.md#github-public-strategy`
Acceptance criteria:
- README includes one-click install command, prerequisites, options, upgrade/rollback, and troubleshooting.
- Public repo target is chosen as new public starter unless existing repo is intentionally selected.
- Commit history follows Lore protocol.
- Remote is set and branch pushed.
QA:
- Happy: `gh repo view <repo>` confirms visibility/URL after push.
- Failure: if repo creation fails, no local commit is lost; final report includes exact blocker.
Commit: `Document one-click production setup`

## Final verification wave
- F1 Plan compliance: confirm every documented CLI option has an implementation or TODO test.
- F2 Security scan: grep staged files for secrets, production DB, `.env`, and ponslink-only hardcoded defaults.
- F3 Build/test: run `bun test`, `bunx tsc --noEmit`, `bun run build`.
- F4 Dry-run UX: run the one-click setup dry-run with a sample domain and inspect phase output.
- F5 GitHub: verify remote URL, pushed branch, and public repository visibility.

## Commit strategy
- Commit 1: public safety baseline and docs.
- Commit 2: setup CLI skeleton and dry-run runner.
- Commit 3: templates/preflight/WordPress/Next/Nginx phases.
- Commit 4: doctor/backup/rollback/README.
- Commit 5 if needed: existing Read-time/blog fixes already deployed, staged separately from setup work.

Commit messages must use the Lore protocol required by AGENTS.md.

## Success criteria
- A new user can run a documented one-click command on a clean Ubuntu VPS and get a working WordPress + Next.js portfolio/blog.
- The setup is configurable, idempotent, dry-run capable, and rollback-aware.
- The public repo contains no private operational data.
- All local verification commands pass before push.
- GitHub remote exists and the branch is pushed.
