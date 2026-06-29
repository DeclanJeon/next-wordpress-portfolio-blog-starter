import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { SetupContext } from "./types"

export function renderTemplate(name: string, values: Record<string, string | number | boolean>): string {
  const template = readFileSync(join(process.cwd(), "scripts", "setup", "templates", name), "utf8")
  return Object.entries(values).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, String(value)),
    template,
  )
}

function systemdEnvValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

export function envContent(ctx: SetupContext): string {
  return renderTemplate("env.production", {
    siteUrl: `https://${ctx.domain}`,
    siteName: systemdEnvValue(ctx.siteName),
    siteTitle: systemdEnvValue(`${ctx.siteName} — Portfolio Blog`),
    siteDescription: systemdEnvValue(`${ctx.siteName}에 기록한 제품 회고, 구현 노트, 운영 문서 모음.`),
    siteAuthor: systemdEnvValue(ctx.adminUser),
    organizationName: systemdEnvValue(ctx.siteName),
    databaseUrl: `file:${ctx.sqlitePath}`,
    wordpressApiBase: `https://${ctx.domain}/wp-json/wp/v2`,
  })
}

export function credentialsContent(ctx: SetupContext): string {
  return [
    `DOMAIN=${ctx.domain}`,
    `WORDPRESS_ADMIN_USER=${ctx.adminUser}`,
    `WORDPRESS_ADMIN_PASSWORD=${ctx.adminPassword}`,
    `WORDPRESS_DB_NAME=${ctx.dbName}`,
    `WORDPRESS_DB_USER=${ctx.dbUser}`,
    `WORDPRESS_DB_PASSWORD=${ctx.dbPassword}`,
    `NEXT_LOCAL_ADMIN_USER=${ctx.adminUser}`,
    `NEXT_LOCAL_ADMIN_PASSWORD=${ctx.adminPassword}`,
    "",
  ].join("\n")
}

export function wordpressSql(ctx: SetupContext): string {
  return [
    `CREATE DATABASE IF NOT EXISTS \`${ctx.dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `CREATE USER IF NOT EXISTS '${ctx.dbUser}'@'localhost' IDENTIFIED BY '${ctx.dbPassword.replace(/'/g, "''")}';`,
    `GRANT ALL PRIVILEGES ON \`${ctx.dbName}\`.* TO '${ctx.dbUser}'@'localhost';`,
    "FLUSH PRIVILEGES;",
  ].join(" ")
}
