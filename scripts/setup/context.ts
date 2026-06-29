import { join, resolve } from "node:path"
import type { SetupContext, SetupOptions } from "./types"
import { defaultPhpFpmSocket, sanitizeName, secret } from "./utils"

export function createContext(options: SetupOptions, now = new Date()): SetupContext {
  const appName = sanitizeName(options.domain) || "next_wordpress_blog"
  const releaseId = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)
  const installDir = resolve(options.installDir)
  const sharedDir = join(installDir, "shared")
  const envDir = "/etc/next-wordpress-blog"
  const wordpressDir = options.wordpressDir ?? `/var/www/${options.domain}`
  const serviceName = `${appName}-next.service`
  const dbName = options.dbName ?? `${appName}_wp`.slice(0, 48)
  const dbUser = options.dbUser ?? `${appName}_user`.slice(0, 48)

  return {
    ...options,
    adminPassword: options.adminPassword ?? secret(),
    wordpressDir,
    phpFpmSocket: options.phpFpmSocket ?? defaultPhpFpmSocket(),
    dbName,
    dbUser,
    dbPassword: options.dbPassword ?? secret(),
    appName,
    envDir,
    envFile: join(envDir, `${options.domain}.env`),
    releasesDir: join(installDir, "releases"),
    releaseDir: join(installDir, "releases", releaseId),
    sharedDir,
    sqlitePath: join(sharedDir, "db", "custom.db"),
    serviceName,
    nginxAvailable: `/etc/nginx/sites-available/${options.domain}`,
    nginxEnabled: `/etc/nginx/sites-enabled/${options.domain}`,
    credentialsFile: join(envDir, `${options.domain}.credentials`),
  }
}
