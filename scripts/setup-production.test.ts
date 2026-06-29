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

})
