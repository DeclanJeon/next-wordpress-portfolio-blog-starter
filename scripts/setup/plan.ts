import { dirname, join } from "node:path"
import type { Phase, SetupContext } from "./types"
import { credentialsContent, envContent, renderTemplate, wordpressSql } from "./templates"
import { publicScheme, shellQuote } from "./utils"

const DEFAULT_PACKAGES = [
  "nginx",
  "mariadb-server",
  "php-fpm",
  "php-cli",
  "php-mysql",
  "php-xml",
  "php-mbstring",
  "php-curl",
  "php-gd",
  "php-zip",
  "unzip",
  "curl",
  "git",
  "rsync",
  "certbot",
  "python3-certbot-nginx",
] as const

function preflightPhase(ctx: SetupContext): Phase {
  return {
    name: "preflight",
    operations: [
      { kind: "command", label: "Check OS release", command: "test -f /etc/os-release && cat /etc/os-release | head -5" },
      { kind: "command", label: "Check domain DNS", command: `getent hosts ${shellQuote(ctx.domain)} || true` },
      { kind: "command", label: "Check app port", command: `command -v ss >/dev/null && ss -ltn | grep -q ':${ctx.appPort} ' && echo 'port in use' || echo 'port available'` },
    ],
  }
}

function wordpressPhase(ctx: SetupContext): Phase {
  return {
    name: "wordpress",
    operations: [
      { kind: "mkdir", label: "Create WordPress dir", path: ctx.wordpressDir },
      { kind: "command", label: "Set WordPress ownership", command: `chown -R www-data:www-data ${shellQuote(ctx.wordpressDir)}` },
      {
        kind: "command",
        label: "Install WP-CLI if missing",
        command: "command -v wp >/dev/null || { curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar || curl -fsSL --retry 5 --retry-delay 2 --retry-all-errors -o /usr/local/bin/wp https://github.com/wp-cli/builds/raw/gh-pages/phar/wp-cli.phar; chmod +x /usr/local/bin/wp; }",
      },
      { kind: "command", label: "Create WordPress database", command: `mysql -e ${shellQuote(wordpressSql(ctx))}` },
      { kind: "command", label: "Download WordPress", command: `[ -f ${shellQuote(join(ctx.wordpressDir, "wp-load.php"))} ] || WP_CLI_CACHE_DIR=/tmp/wp-cli-cache runuser -u www-data -- wp core download --path=${shellQuote(ctx.wordpressDir)} --locale=ko_KR` },
      { kind: "command", label: "Create wp-config.php", command: `[ -f ${shellQuote(join(ctx.wordpressDir, "wp-config.php"))} ] || WP_CLI_CACHE_DIR=/tmp/wp-cli-cache runuser -u www-data -- wp config create --path=${shellQuote(ctx.wordpressDir)} --dbname=${shellQuote(ctx.dbName)} --dbuser=${shellQuote(ctx.dbUser)} --dbpass=${shellQuote(ctx.dbPassword)} --dbhost=localhost` },
      { kind: "command", label: "Install WordPress core", command: `WP_CLI_CACHE_DIR=/tmp/wp-cli-cache runuser -u www-data -- wp core is-installed --path=${shellQuote(ctx.wordpressDir)} || WP_CLI_CACHE_DIR=/tmp/wp-cli-cache runuser -u www-data -- wp core install --path=${shellQuote(ctx.wordpressDir)} --url=${shellQuote(`${publicScheme(ctx)}://${ctx.domain}`)} --title=${shellQuote(ctx.siteName)} --admin_user=${shellQuote(ctx.adminUser)} --admin_password=${shellQuote(ctx.adminPassword)} --admin_email=${shellQuote(ctx.email)}` },
      { kind: "command", label: "Set permalink", command: `WP_CLI_CACHE_DIR=/tmp/wp-cli-cache runuser -u www-data -- wp option update permalink_structure '/%postname%/' --path=${shellQuote(ctx.wordpressDir)}` },
    ],
  }
}

function installPhases(ctx: SetupContext): Phase[] {
  const nginxConfig = renderTemplate("nginx-site.conf", {
    domain: ctx.domain,
    wordpressDir: ctx.wordpressDir,
    appPort: ctx.appPort,
    phpFpmSocket: ctx.phpFpmSocket,
  })
  const systemdConfig = renderTemplate("systemd.service", {
    serviceDescription: `${ctx.siteName} Next.js frontend`,
    workingDirectory: `${ctx.installDir}/current`,
    envFile: ctx.envFile,
    appPort: ctx.appPort,
  })
  const phases: Phase[] = [
    preflightPhase(ctx),
    { name: "system-packages", operations: [{ kind: "command", label: "Update apt index", command: "apt-get update" }, { kind: "command", label: "Install packages", command: `DEBIAN_FRONTEND=noninteractive apt-get install -y ${DEFAULT_PACKAGES.join(" ")}` }, { kind: "command", label: "Start package services", command: "systemctl enable --now mariadb php8.3-fpm nginx" }] },
    { name: "secrets-and-directories", operations: [{ kind: "mkdir", label: "Create install dir", path: ctx.installDir }, { kind: "mkdir", label: "Create releases dir", path: ctx.releasesDir }, { kind: "mkdir", label: "Create shared DB dir", path: dirname(ctx.sqlitePath) }, { kind: "mkdir", label: "Create env dir", path: ctx.envDir }, { kind: "write", label: "Write app environment", path: ctx.envFile, content: envContent(ctx), mode: "0600" }, { kind: "write", label: "Write generated credentials", path: ctx.credentialsFile, content: credentialsContent(ctx), mode: "0600" }] },
  ]
  if (!ctx.noWordpress) phases.push(wordpressPhase(ctx))
  phases.push(
    { name: "next-standalone", operations: [{ kind: "command", label: "Install JS dependencies", command: "bun install --frozen-lockfile || (bun pm cache rm || true; bun install --frozen-lockfile)" }, { kind: "command", label: "Initialize Prisma schema", command: `DATABASE_URL=${shellQuote(`file:${ctx.sqlitePath}`)} bun x prisma db push` }, { kind: "command", label: "Create local Next admin", command: `DATABASE_URL=${shellQuote(`file:${ctx.sqlitePath}`)} bun run scripts/create-local-admin.ts --username ${shellQuote(ctx.adminUser)} --password ${shellQuote(ctx.adminPassword)} --display-name ${shellQuote(ctx.siteName)} --role admin` }, { kind: "command", label: "Build Next standalone", command: `set -a; . ${shellQuote(ctx.envFile)}; set +a; bun run build` }, { kind: "mkdir", label: "Create release dir", path: ctx.releaseDir }, { kind: "command", label: "Copy standalone server", command: `rsync -a --delete .next/standalone/ ${shellQuote(`${ctx.releaseDir}/`)}` }, { kind: "mkdir", label: "Create release .next dir", path: join(ctx.releaseDir, ".next") }, { kind: "command", label: "Copy static assets", command: `rsync -a --delete .next/static/ ${shellQuote(`${ctx.releaseDir}/.next/static/`)}` }, { kind: "command", label: "Copy public assets", command: `rsync -a --delete public/ ${shellQuote(`${ctx.releaseDir}/public/`)}` }, { kind: "symlink", label: "Activate release", target: ctx.releaseDir, path: join(ctx.installDir, "current") }] },
    { name: "systemd-and-nginx", operations: [{ kind: "write", label: "Write systemd service", path: `/etc/systemd/system/${ctx.serviceName}`, content: systemdConfig }, { kind: "command", label: "Reload systemd", command: "systemctl daemon-reload" }, { kind: "command", label: "Enable and restart service", command: `systemctl enable --now ${shellQuote(ctx.serviceName)} && systemctl restart ${shellQuote(ctx.serviceName)}` }, { kind: "write", label: "Write Nginx site", path: ctx.nginxAvailable, content: nginxConfig }, { kind: "symlink", label: "Enable Nginx site", target: ctx.nginxAvailable, path: ctx.nginxEnabled }, { kind: "command", label: "Validate Nginx", command: "nginx -t" }, { kind: "command", label: "Reload Nginx", command: "systemctl reload-or-restart nginx" }] },
  )
  if (!ctx.skipCertbot) phases.push({ name: "tls", operations: [{ kind: "command", label: "Issue or renew certificate", command: `certbot --nginx -d ${shellQuote(ctx.domain)} --non-interactive --agree-tos -m ${shellQuote(ctx.email)} --redirect` }] })
  phases.push({ name: "health-check", operations: [{ kind: "command", label: "Check systemd service", command: `systemctl is-active ${shellQuote(ctx.serviceName)}` }, { kind: "command", label: "Check local Next app", command: `curl -fsS http://127.0.0.1:${ctx.appPort}/ >/dev/null` }, { kind: "command", label: "Check public site", command: `curl -fsS ${publicScheme(ctx)}://${ctx.domain}/ >/dev/null` }, { kind: "command", label: "Check WordPress REST", command: ctx.noWordpress ? "true" : `curl -fsS ${publicScheme(ctx)}://${ctx.domain}/wp-json/ >/dev/null` }] })
  return phases
}

function backupPhase(ctx: SetupContext): Phase {
  const backupDir = join(ctx.installDir, "backups", new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14))
  return {
    name: "backup",
    operations: [
      { kind: "mkdir", label: "Create backup dir", path: backupDir },
      { kind: "command", label: "Backup SQLite DB", command: `[ ! -f ${shellQuote(ctx.sqlitePath)} ] || cp ${shellQuote(ctx.sqlitePath)} ${shellQuote(join(backupDir, "custom.db"))}` },
      { kind: "command", label: "Backup WordPress files", command: `tar -czf ${shellQuote(join(backupDir, "wordpress.tgz"))} -C ${shellQuote(dirname(ctx.wordpressDir))} ${shellQuote(ctx.domain)} || true` },
      { kind: "command", label: "Backup Nginx config", command: `[ ! -f ${shellQuote(ctx.nginxAvailable)} ] || cp ${shellQuote(ctx.nginxAvailable)} ${shellQuote(join(backupDir, "nginx.conf"))}` },
    ],
  }
}

function rollbackPhase(ctx: SetupContext): Phase {
  return {
    name: "rollback",
    operations: [
      { kind: "command", label: "List releases", command: `ls -1dt ${shellQuote(ctx.releasesDir)}/* | sed -n '1,5p'` },
      { kind: "command", label: "Manual rollback hint", command: `echo 'Run: ln -sfn <previous-release> ${shellQuote(join(ctx.installDir, "current"))} && systemctl restart ${shellQuote(ctx.serviceName)}'` },
    ],
  }
}

export function buildPlan(ctx: SetupContext): readonly Phase[] {
  const phases = installPhases(ctx)
  if (ctx.command === "doctor") return [phases[0], phases[phases.length - 1]]
  if (ctx.command === "backup") return [backupPhase(ctx)]
  if (ctx.command === "rollback") return [rollbackPhase(ctx)]
  return phases
}
