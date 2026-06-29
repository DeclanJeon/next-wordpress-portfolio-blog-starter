import { describe, expect, it } from "bun:test"
import { buildPlan, createContext, parseArgs } from "./setup-production"

describe("setup-production CLI", () => {
  it("parses dry-run install options", () => {
    const options = parseArgs([
      "--dry-run",
      "--domain",
      "blog.example.com",
      "--email",
      "admin@example.com",
      "--site-name",
      "Example Notes",
      "--admin-user",
      "owner",
    ])

    expect(options.command).toBe("install")
    expect(options.domain).toBe("blog.example.com")
    expect(options.dryRun).toBe(true)
    expect(options.siteName).toBe("Example Notes")
    expect(options.adminUser).toBe("owner")
  })

  it("renders a plan without ponslink-specific domains", () => {
    const ctx = createContext(
      parseArgs([
        "--dry-run",
        "--domain",
        "blog.example.com",
        "--email",
        "admin@example.com",
        "--skip-certbot",
      ]),
      new Date("2026-06-29T00:00:00Z"),
    )
    const plan = buildPlan(ctx)
    const serialized = JSON.stringify(plan)

    expect(serialized).toContain("blog.example.com")
    expect(serialized).not.toContain("ponslink.com")
    expect(serialized).toContain("systemd-and-nginx")
  })

  it("supports doctor mode with only preflight and health checks", () => {
    const ctx = createContext(parseArgs(["doctor", "--domain", "blog.example.com", "--email", "admin@example.com", "--dry-run"]))
    const plan = buildPlan(ctx)

    expect(plan.map((phase) => phase.name)).toEqual(["preflight", "health-check"])
  })

  it("quotes env values and prepares sqlite before building", () => {
    const ctx = createContext(parseArgs(["--domain", "local.test", "--email", "admin@example.com", "--skip-certbot"]))
    const plan = buildPlan(ctx)
    const secretPhase = plan.find((phase) => phase.name === "secrets-and-directories")
    const nextPhase = plan.find((phase) => phase.name === "next-standalone")

    const envWrite = secretPhase?.operations.find((operation) => operation.kind === "write" && operation.label === "Write app environment")
    const labels = nextPhase?.operations.map((operation) => operation.label) ?? []

    expect(envWrite?.kind).toBe("write")
    if (envWrite?.kind === "write") {
      expect(envWrite.content).toContain('NEXT_PUBLIC_SITE_TOPICS="Product retrospective,Portfolio,Technical writing,Operations notes"')
    }
    expect(labels.indexOf("Initialize Prisma schema")).toBeLessThan(labels.indexOf("Build Next standalone"))
  })

  it("uses bun x and starts nginx during production setup", () => {
    const ctx = createContext(parseArgs(["--domain", "local.test", "--email", "admin@example.com", "--skip-certbot"]))
    const plan = buildPlan(ctx)
    const serialized = JSON.stringify(plan)

    expect(serialized).toContain("bun x prisma db push")
    expect(serialized).not.toContain("bunx prisma")
    expect(serialized).toContain("systemctl enable --now mariadb php8.3-fpm nginx")
    expect(serialized).toContain("systemctl reload-or-restart nginx")
    expect(serialized).toContain("WP_CLI_CACHE_DIR=/tmp/wp-cli-cache")
  })

  it("retries Bun installs after clearing cache", () => {
    const ctx = createContext(parseArgs(["--domain", "local.test", "--email", "admin@example.com", "--skip-certbot"]))
    const plan = buildPlan(ctx)
    const serialized = JSON.stringify(plan)

    expect(serialized).toContain("bun pm cache rm")
  })

  it("runs the standalone service with Bun", () => {
    const ctx = createContext(parseArgs(["--domain", "local.test", "--email", "admin@example.com", "--skip-certbot"]))
    const plan = buildPlan(ctx)
    const systemdPhase = plan.find((phase) => phase.name === "systemd-and-nginx")
    const serviceWrite = systemdPhase?.operations.find((operation) => operation.kind === "write" && operation.label === "Write systemd service")

    expect(serviceWrite?.kind).toBe("write")
    if (serviceWrite?.kind === "write") {
      expect(serviceWrite.content).toContain("ExecStart=/usr/bin/env bun server.js")
      expect(serviceWrite.content).not.toContain("/usr/bin/env node")
    }
  })

  it("retries WP-CLI download with a fallback URL", () => {
    const ctx = createContext(parseArgs(["--domain", "local.test", "--email", "admin@example.com", "--skip-certbot"]))
    const plan = buildPlan(ctx)
    const serialized = JSON.stringify(plan)

    expect(serialized).toContain("--retry 5")
    expect(serialized).toContain("github.com/wp-cli/builds/raw/gh-pages/phar/wp-cli.phar")
  })

  it("waits for HTTP readiness during health checks", () => {
    const ctx = createContext(parseArgs(["--domain", "local.test", "--email", "admin@example.com", "--skip-certbot"]))
    const plan = buildPlan(ctx)
    const healthPhase = plan.find((phase) => phase.name === "health-check")
    const serialized = JSON.stringify(healthPhase)

    expect(serialized).toContain("seq 1 30")
    expect(serialized).toContain("http://127.0.0.1:3011/")
    expect(serialized).toContain("/wp-json/")
  })

})
