#!/usr/bin/env bun
import { existsSync, mkdirSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { Database } from "bun:sqlite"
import sharp from "sharp"

const ROOT = process.cwd()
const DB_PATH = join(ROOT, "db", "custom.db")
const P2P_SLUGS = [
  "2026-06-16-p2p-00-grid-computing-first-step",
  "2026-06-16-p2p-01-client-server-vs-peer-to-peer",
  "2026-06-16-p2p-02-mesh-sfu-mcu-topology",
  "2026-06-16-p2p-03-what-can-we-build-with-p2p",
  "2026-06-16-p2p-04-grid-computing-from-p2p",
  "2026-06-16-p2p-05-signaling-stun-turn-ice",
  "2026-06-16-p2p-06-realtime-product-patterns",
] as const

const BATCH_01_SLUGS = [
  "2026-06-16-ponslink-00-link-only-room",
  "2026-06-16-ponslink-01-why-i-came-back-to-connection",
  "2026-06-16-ponslink-01b-room-before-product",
  "2026-06-16-ponslink-02-webrtc-first-hell",
  "2026-06-16-ponslink-02b-signal-behind-link",
] as const

const TARGET_SLUGS = [...P2P_SLUGS, ...BATCH_01_SLUGS]

type PostRow = {
  readonly slug: string
  readonly title: string
  readonly content: string
  readonly featuredImage: string
}

type MigrationReport = {
  readonly slug: string
  readonly removedDuplicateTitle: boolean
  readonly duplicateTitlePresent: boolean
  readonly convertedBodyImages: number
  readonly updatedBodyRefs: number
  readonly bodyImages: readonly string[]
  readonly chars: number
  readonly readingTime: number
}

function titleWithoutPrefix(title: string): string {
  return title.replace(/^\[[^\]]+\]\s*/, "").trim()
}

function stripDuplicateMarkdownTitle(title: string, content: string): { content: string; removed: boolean } {
  const firstHeading = content.match(/^#\s+(.+?)\s*\n+/)
  if (!firstHeading) return { content, removed: false }
  const heading = firstHeading[1]?.trim() ?? ""
  const normalizedHeading = heading.replace(/^\[[^\]]+\]\s*/, "").trim()
  const normalizedTitle = titleWithoutPrefix(title)
  if (normalizedHeading !== normalizedTitle) return { content, removed: false }
  return { content: content.slice(firstHeading[0].length).replace(/^\n+/, ""), removed: true }
}

function hasDuplicateMarkdownTitle(title: string, content: string): boolean {
  const firstHeading = content.match(/^#\s+(.+?)\s*\n+/)
  if (!firstHeading) return false
  const heading = firstHeading[1]?.trim().replace(/^\[[^\]]+\]\s*/, "").trim() ?? ""
  return heading === titleWithoutPrefix(title)
}

function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function readingTime(content: string): number {
  return Math.max(2, Math.round(plainText(content).length / 780))
}

function markdownImages(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1] ?? "")
}

function isP2pBodySvg(slug: string, imagePath: string): boolean {
  return imagePath.startsWith(`/tistory/p2p-foundations/varied/${slug}-`) && imagePath.endsWith(".svg") && !imagePath.includes("featured")
}

async function convertP2pBodyImage(slug: string, imagePath: string): Promise<string> {
  const source = join(ROOT, "public", imagePath.slice(1))
  if (!existsSync(source)) throw new Error(`Missing source SVG: ${imagePath}`)
  const targetPath = `/tistory/body-images/${slug}/${basename(imagePath, ".svg")}.webp`
  const target = join(ROOT, "public", targetPath.slice(1))
  mkdirSync(dirname(target), { recursive: true })
  await sharp(source).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 86 }).toFile(target)
  return targetPath
}

async function migratePost(row: PostRow): Promise<{ content: string; report: MigrationReport }> {
  const stripped = stripDuplicateMarkdownTitle(row.title, row.content)
  let content = stripped.content
  let convertedBodyImages = 0
  let updatedBodyRefs = 0
  const imageMap = new Map<string, string>()

  for (const imagePath of markdownImages(content)) {
    if (!isP2pBodySvg(row.slug, imagePath)) continue
    if (!imageMap.has(imagePath)) {
      imageMap.set(imagePath, await convertP2pBodyImage(row.slug, imagePath))
      convertedBodyImages += 1
    }
  }

  for (const [oldPath, newPath] of imageMap) {
    content = content.split(oldPath).join(newPath)
    updatedBodyRefs += 1
  }

  const duplicateTitlePresent = hasDuplicateMarkdownTitle(row.title, content)
  const bodyImages = markdownImages(content).filter((image) => image.startsWith(`/tistory/body-images/${row.slug}/`))
  const chars = plainText(content).length
  const rt = readingTime(content)
  return {
    content,
    report: {
      slug: row.slug,
      removedDuplicateTitle: stripped.removed,
      duplicateTitlePresent,
      convertedBodyImages,
      updatedBodyRefs,
      bodyImages,
      chars,
      readingTime: rt,
    },
  }
}

async function main(): Promise<void> {
  const db = new Database(DB_PATH)
  const now = new Date().toISOString()
  const reports: MigrationReport[] = []
  const update = db.query("update Post set content = ?, readingTime = ?, updatedAt = ? where slug = ?")
  try {
    for (const slug of TARGET_SLUGS) {
      const row = db.query("select slug,title,content,featuredImage from Post where slug = ? and status = 'published'").get(slug) as PostRow | null
      if (!row) throw new Error(`Published post not found: ${slug}`)
      const migrated = await migratePost(row)
      update.run(migrated.content, migrated.report.readingTime, now, slug)
      reports.push(migrated.report)
    }
  } finally {
    db.close()
  }

  const failures = reports.filter((report) => report.duplicateTitlePresent || report.bodyImages.length < 3 || report.bodyImages.some((image) => !image.endsWith(".webp")))
  console.log(JSON.stringify({ migrated: reports.length, failures, reports }, null, 2))
  if (failures.length > 0) process.exit(1)
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message)
    process.exit(1)
  }
  console.error(String(error))
  process.exit(1)
})
