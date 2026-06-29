import { z } from "zod"
import type { SetupCommand, SetupOptions } from "./types"

const OptionSchema = z.object({
  command: z.enum(["install", "doctor", "backup", "rollback"]),
  domain: z.string().min(1).regex(/^[a-z0-9.-]+$/),
  email: z.string().email(),
  siteName: z.string().min(1),
  adminUser: z.string().min(1),
  adminPassword: z.string().min(12).optional(),
  installDir: z.string().min(1),
  wordpressDir: z.string().min(1).optional(),
  appPort: z.coerce.number().int().min(1024).max(65535),
  phpFpmSocket: z.string().min(1).optional(),
  dbName: z.string().min(1).optional(),
  dbUser: z.string().min(1).optional(),
  dbPassword: z.string().min(12).optional(),
  skipCertbot: z.boolean(),
  noWordpress: z.boolean(),
  dryRun: z.boolean(),
  yes: z.boolean(),
})

function parseBooleanFlag(args: string[], flag: string): boolean {
  const index = args.indexOf(flag)
  if (index === -1) return false
  args.splice(index, 1)
  return true
}

function readOption(args: string[], name: string): string | undefined {
  const prefix = `${name}=`
  const inlineIndex = args.findIndex((arg) => arg.startsWith(prefix))
  if (inlineIndex !== -1) {
    const [raw] = args.splice(inlineIndex, 1)
    return raw.slice(prefix.length)
  }

  const index = args.indexOf(name)
  if (index === -1) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`)
  args.splice(index, 2)
  return value
}

export function parseArgs(argv: readonly string[]): SetupOptions {
  const args = [...argv]
  const first = args[0]
  const command: SetupCommand = first && !first.startsWith("--") ? (args.shift() as SetupCommand) : "install"
  const parsed = OptionSchema.parse({
    command,
    domain: readOption(args, "--domain") ?? "example.com",
    email: readOption(args, "--email") ?? "admin@example.com",
    siteName: readOption(args, "--site-name") ?? "Field Notes",
    adminUser: readOption(args, "--admin-user") ?? "admin",
    adminPassword: readOption(args, "--admin-password"),
    installDir: readOption(args, "--install-dir") ?? "/opt/next-wordpress-blog",
    wordpressDir: readOption(args, "--wordpress-dir"),
    appPort: readOption(args, "--app-port") ?? "3011",
    phpFpmSocket: readOption(args, "--php-fpm-socket"),
    dbName: readOption(args, "--db-name"),
    dbUser: readOption(args, "--db-user"),
    dbPassword: readOption(args, "--db-password"),
    skipCertbot: parseBooleanFlag(args, "--skip-certbot"),
    noWordpress: parseBooleanFlag(args, "--no-wordpress"),
    dryRun: parseBooleanFlag(args, "--dry-run"),
    yes: parseBooleanFlag(args, "--yes"),
  })
  if (args.length > 0) throw new Error(`Unknown arguments: ${args.join(" ")}`)
  return parsed
}

export { OptionSchema }
