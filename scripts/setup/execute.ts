import { mkdirSync, writeFileSync, chmodSync } from "node:fs"
import { dirname } from "node:path"
import { spawnSync } from "node:child_process"
import type { Operation, Phase } from "./types"
import { shellQuote } from "./utils"

function redact(value: string): string {
  return value
    .replace(/(WORDPRESS_ADMIN_PASSWORD=|WORDPRESS_DB_PASSWORD=|NEXT_LOCAL_ADMIN_PASSWORD=)[^\s]+/g, "$1***")
    .replace(/(IDENTIFIED BY )'[^']*'/g, "$1'***'")
    .replace(/(--admin_password=|--dbpass=|--password\s+|--admin-password\s+)((('[^']*')|([^\s]+)))/g, "$1'***'")
}

function printOperation(operation: Operation): void {
  if (operation.kind === "command") {
    if (operation.label === "Create WordPress database") {
      console.log("  $ mysql -e 'CREATE DATABASE ... IDENTIFIED BY ***; GRANT ...;'")
      return
    }
    console.log(`  $ ${redact(operation.command)}`)
  }
  if (operation.kind === "mkdir") console.log(`  mkdir -p ${operation.path}`)
  if (operation.kind === "write") console.log(`  write ${operation.path}${operation.mode ? ` (${operation.mode})` : ""}`)
  if (operation.kind === "symlink") console.log(`  ln -sfn ${operation.target} ${operation.path}`)
}

function runShell(command: string): void {
  const result = spawnSync("bash", ["-lc", command], { stdio: "inherit" })
  if (result.status !== 0) throw new Error(`Command failed: ${command}`)
}

export function executeOperation(operation: Operation, dryRun: boolean): void {
  if (dryRun) {
    printOperation(operation)
    return
  }
  if (operation.kind === "command") runShell(operation.command)
  if (operation.kind === "mkdir") mkdirSync(operation.path, { recursive: true })
  if (operation.kind === "write") {
    mkdirSync(dirname(operation.path), { recursive: true })
    writeFileSync(operation.path, operation.content, { mode: operation.mode ? Number.parseInt(operation.mode, 8) : 0o644 })
    if (operation.mode) chmodSync(operation.path, Number.parseInt(operation.mode, 8))
  }
  if (operation.kind === "symlink") runShell(`ln -sfn ${shellQuote(operation.target)} ${shellQuote(operation.path)}`)
}

export function printPlan(phases: readonly Phase[], dryRun: boolean): void {
  console.log(dryRun ? "mode=dry-run" : "mode=apply")
  for (const phase of phases) {
    console.log(`\n[${phase.name}]`)
    for (const operation of phase.operations) printOperation(operation)
  }
}
