import { PrismaClient } from "@prisma/client"
import { estimateReadingTime } from "../src/lib/reading-time"

type RecalculateMode = "dry-run" | "apply"

type ReadingTimeChange = {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly previous: number
  readonly next: number
}

class InvalidArgumentsError extends Error {
  constructor(readonly args: readonly string[]) {
    super(`Unsupported arguments: ${args.join(" ")}`)
    this.name = "InvalidArgumentsError"
  }
}

function parseMode(args: readonly string[]): RecalculateMode {
  const allowedArgs = new Set(["--dry-run", "--apply"])
  const invalidArgs = args.filter((arg) => !allowedArgs.has(arg))
  if (invalidArgs.length > 0) throw new InvalidArgumentsError(invalidArgs)
  if (args.includes("--apply")) return "apply"
  return "dry-run"
}

function toChange(post: {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly readingTime: number
  readonly content: string
}): ReadingTimeChange | null {
  const next = estimateReadingTime(post.content)
  if (next === post.readingTime) return null
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    previous: post.readingTime,
    next,
  }
}

function printChanges(changes: readonly ReadingTimeChange[], mode: RecalculateMode): void {
  console.log(`mode=${mode}`)
  console.log(`changes=${changes.length}`)
  for (const change of changes) {
    console.log(`${change.previous} -> ${change.next} | ${change.slug} | ${change.title}`)
  }
}

async function main(): Promise<void> {
  const mode = parseMode(process.argv.slice(2))
  const prisma = new PrismaClient()
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        readingTime: true,
        content: true,
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    })
    const changes = posts.flatMap((post) => {
      const change = toChange(post)
      return change ? [change] : []
    })

    printChanges(changes, mode)
    if (mode === "apply" && changes.length > 0) {
      await prisma.$transaction(
        changes.map((change) =>
          prisma.post.update({
            where: { id: change.id },
            data: { readingTime: change.next },
          }),
        ),
      )
      console.log(`updated=${changes.length}`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  if (error instanceof InvalidArgumentsError) {
    console.error(error.message)
    console.error("Usage: bun run scripts/recalculate-reading-time.ts [--dry-run|--apply]")
    process.exit(2)
  }
  if (error instanceof Error) {
    console.error(error.stack ?? error.message)
    process.exit(1)
  }
  console.error(String(error))
  process.exit(1)
})
