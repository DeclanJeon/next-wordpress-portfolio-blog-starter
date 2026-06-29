import { randomBytes } from "node:crypto"
import { readdirSync } from "node:fs"
import type { SetupContext } from "./types"

export function sanitizeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").toLowerCase()
}

export function secret(): string {
  return randomBytes(24).toString("base64url")
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

export function defaultPhpFpmSocket(): string {
  try {
    const sockets = readdirSync("/run/php")
      .filter((name) => /^php.*-fpm\.sock$/.test(name))
      .sort()
    const socket = sockets.at(-1)
    if (socket) return `/run/php/${socket}`
  } catch {
    // Fall through to the Ubuntu 24.04 default used by the production template.
  }
  return "/run/php/php8.3-fpm.sock"
}

export function publicScheme(ctx: SetupContext): "http" | "https" {
  return ctx.skipCertbot ? "http" : "https"
}
