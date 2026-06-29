import { z } from "zod"
import { parseArgs } from "./setup/args"
import { createContext } from "./setup/context"
import { executeOperation, printPlan } from "./setup/execute"
import { buildPlan } from "./setup/plan"

export { parseArgs } from "./setup/args"
export { createContext } from "./setup/context"
export { buildPlan } from "./setup/plan"
export type { Phase, Operation, SetupCommand, SetupContext, SetupOptions } from "./setup/types"

export function run(argv: readonly string[]): void {
  const options = parseArgs(argv)
  const ctx = createContext(options)
  const phases = buildPlan(ctx)
  if (options.dryRun) {
    printPlan(phases, true)
    return
  }
  if (typeof process.getuid === "function" && process.getuid() !== 0) {
    throw new Error("Production setup must run as root. Re-run with sudo or use --dry-run.")
  }
  if (!options.yes) throw new Error("Refusing to mutate production without --yes. Use --dry-run to inspect the plan.")
  for (const phase of phases) {
    console.log(`\n[${phase.name}]`)
    for (const operation of phase.operations) executeOperation(operation, false)
  }
}

if (import.meta.main) {
  try {
    run(process.argv.slice(2))
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error(error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"))
      process.exit(2)
    }
    if (error instanceof Error) {
      console.error(error.message)
      process.exit(1)
    }
    console.error(String(error))
    process.exit(1)
  }
}
