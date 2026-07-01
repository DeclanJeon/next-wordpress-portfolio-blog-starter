import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { PrismaClient } from "@prisma/client"

type Severity = "error" | "warning"

type Finding = {
  readonly severity: Severity
  readonly code: string
  readonly message: string
}

type Report = {
  readonly slug: string
  readonly title: string
  readonly chars: number
  readonly headings: readonly string[]
  readonly bodyImages: readonly string[]
  readonly findings: readonly Finding[]
}

const BOILERPLATE_PHRASES = [
  "그때는 이 문제가 이렇게 오래 따라올 줄 몰랐다",
  "기능 이름보다, 내가 그때 붙잡고 있던 질문",
  "연결이 붙었다고 방이 된 것은 아니었다",
  "사람이 신경 쓰지 않아도 제품이 기억해야 하는 것들",
  "회의 앱보다 연결 방식에 가까워진 이유",
  "처음에는 답이 단순해 보였다. 만들고, 연결하고, 버튼을 하나 더 두면 될 것 같았다",
  "이 선택은 화려하지 않았다",
]

const REPEATED_TEMPLATE_HEADINGS = new Set([
  "연결이 붙었다고 방이 된 것은 아니었다",
  "사람이 신경 쓰지 않아도 제품이 기억해야 하는 것들",
  "회의 앱보다 연결 방식에 가까워진 이유",
  "처음엔 쉽게 보였던 문제",
  "직접 만들자 달라진 기준",
  "지금 돌아보면 남는 판단",
])

function parseArgs(args: readonly string[]): { slugs: readonly string[]; strict: boolean } {
  const slugs: string[] = []
  let strict = false
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--strict") {
      strict = true
      continue
    }
    if (arg === "--slug") {
      const slug = args[index + 1]
      if (!slug) throw new Error("--slug requires a value")
      slugs.push(slug)
      index += 1
      continue
    }
    if (arg === "--slugs") {
      const value = args[index + 1]
      if (!value) throw new Error("--slugs requires a comma-separated value")
      slugs.push(...value.split(",").map((slug) => slug.trim()).filter(Boolean))
      index += 1
      continue
    }
    throw new Error(`Unsupported argument: ${arg}`)
  }
  return { slugs: [...new Set(slugs)], strict }
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

function markdownHeadings(markdown: string): string[] {
  return [...markdown.matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) => match[1]?.trim() ?? "")
}

function markdownImages(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1] ?? "")
}

function countOccurrences(content: string, phrase: string): number {
  return content.split(phrase).length - 1
}

function isProjectPost(title: string, category: string | null, tags: string | null): boolean {
  const haystack = `${title} ${category ?? ""} ${tags ?? ""}`.toLowerCase()
  return ["ponslink", "ponswarp", "p2p", "docuflow", "ruminate", "명경", "fatemirror"].some((token) =>
    haystack.includes(token.toLowerCase()),
  )
}

function inferPolicy(title: string, tags: string | null, chars: number): "case-study-long" | "field-note-short" {
  const haystack = `${title} ${tags ?? ""}`.toLowerCase()
  if (chars >= 4500) return "case-study-long"
  if (haystack.includes("p2p") || haystack.includes("ponslink") || haystack.includes("ponswarp")) return "field-note-short"
  return "field-note-short"
}

function publicFileExists(imagePath: string): boolean {
  if (!imagePath.startsWith("/")) return false
  return existsSync(join(process.cwd(), "public", imagePath.slice(1)))
}

function hasWebpHeader(imagePath: string): boolean {
  if (!imagePath.startsWith("/")) return false
  const absolutePath = join(process.cwd(), "public", imagePath.slice(1))
  if (!existsSync(absolutePath)) return false
  const header = readFileSync(absolutePath).subarray(0, 12)
  return header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP"
}

function bodyImageDirectoryPngs(slug: string): string[] {
  const directory = join(process.cwd(), "public", "tistory", "body-images", slug)
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return []
  return readdirSync(directory).filter((name) => name.toLowerCase().endsWith(".png"))
}

function finalBodyImagePrefix(slug: string): string {
  return `/tistory/body-images/${slug}/`
}

function isFinalBodyImagePath(slug: string, imagePath: string): boolean {
  return imagePath.startsWith(finalBodyImagePrefix(slug))
}

function isExternalImagePath(imagePath: string): boolean {
  return /^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith("data:")
}

function validatePost(post: {
  readonly slug: string
  readonly title: string
  readonly category: string | null
  readonly tags: string | null
  readonly content: string
}): Report {
  const chars = plainText(post.content).length
  const headings = markdownHeadings(post.content)
  const markdownImagePaths = markdownImages(post.content)
  const bodyImages = markdownImagePaths.filter((image) => isFinalBodyImagePath(post.slug, image))
  const invalidLocalBodyImages = markdownImagePaths.filter((image) => !isExternalImagePath(image) && !isFinalBodyImagePath(post.slug, image))
  const findings: Finding[] = []
  const policy = inferPolicy(post.title, post.tags, chars)
  const projectPost = isProjectPost(post.title, post.category, post.tags)

  if (headings[0]?.replace(/^\[[^\]]+\]\s*/, "") === post.title.replace(/^\[[^\]]+\]\s*/, "")) {
    findings.push({ severity: "error", code: "duplicate-markdown-title", message: "Body repeats the page title as a Markdown heading." })
  }

  const repeatedPhrases = BOILERPLATE_PHRASES.filter((phrase) => countOccurrences(post.content, phrase) > 0)
  if (repeatedPhrases.length >= 2) {
    findings.push({ severity: "error", code: "boilerplate-phrases", message: `Template phrases detected: ${repeatedPhrases.join(" / ")}` })
  }

  const repeatedTemplateHeadings = headings.filter((heading) => REPEATED_TEMPLATE_HEADINGS.has(heading))
  if (repeatedTemplateHeadings.length >= 2) {
    findings.push({ severity: "error", code: "template-headings", message: `Repeated rewrite-template headings detected: ${repeatedTemplateHeadings.join(" / ")}` })
  }

  if (projectPost && !/(실패|깨졌|막혔|한계|trade-?off|버린|문제|흔들)/i.test(post.content)) {
    findings.push({ severity: "warning", code: "missing-conflict", message: "Project post lacks a visible failure/trade-off/conflict beat." })
  }

  if (policy === "case-study-long") {
    if (chars < 4500) {
      findings.push({ severity: "error", code: "short-case-study", message: `Long case-study post is below 4,500 plain chars: ${chars}.` })
    }
    if (bodyImages.length < 3 || bodyImages.length > 5) {
      findings.push({ severity: "error", code: "case-study-image-count", message: `Long case-study requires 3–5 body images, found ${bodyImages.length}.` })
    }
  }

  if (policy === "field-note-short" && projectPost && bodyImages.length > 2) {
    findings.push({ severity: "warning", code: "short-post-image-overload", message: `Short field-note should normally use 0–2 body images, found ${bodyImages.length}.` })
  }

  for (const image of invalidLocalBodyImages) {
    findings.push({
      severity: "error",
      code: "invalid-body-image-path",
      message: `Local final body image must live under ${finalBodyImagePrefix(post.slug)}: ${image}`,
    })
  }

  for (const image of bodyImages) {
    if (image.toLowerCase().endsWith(".png")) {
      findings.push({ severity: "error", code: "png-body-ref", message: `Final body image references PNG: ${image}` })
    }
    if (!image.toLowerCase().endsWith(".webp")) {
      findings.push({ severity: "error", code: "non-webp-body-ref", message: `Final body image must be WebP: ${image}` })
    }
    if (!publicFileExists(image)) {
      findings.push({ severity: "error", code: "missing-body-image", message: `Body image file is missing: ${image}` })
    } else if (!hasWebpHeader(image)) {
      findings.push({ severity: "error", code: "invalid-webp-header", message: `Body image is not a RIFF/WEBP file: ${image}` })
    }
  }

  const leftoverPngs = bodyImageDirectoryPngs(post.slug)
  if (leftoverPngs.length > 0) {
    findings.push({ severity: "error", code: "leftover-body-png", message: `PNG files remain in body-image directory: ${leftoverPngs.join(", ")}` })
  }

  return { slug: post.slug, title: post.title, chars, headings, bodyImages, findings }
}

function printReport(reports: readonly Report[]): void {
  const failing = reports.filter((report) => report.findings.some((finding) => finding.severity === "error"))
  const warnings = reports.filter((report) => report.findings.some((finding) => finding.severity === "warning"))
  console.log(JSON.stringify({ checked: reports.length, failing: failing.length, warnings: warnings.length, reports }, null, 2))
}

async function main(): Promise<void> {
  const { slugs, strict } = parseArgs(process.argv.slice(2))
  const prisma = new PrismaClient()
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: "published",
        ...(slugs.length > 0 ? { slug: { in: slugs } } : {}),
      },
      select: {
        slug: true,
        title: true,
        category: true,
        tags: true,
        content: true,
      },
      orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
    })
    const foundSlugs = new Set(posts.map((post) => post.slug))
    const missingSlugs = slugs.filter((slug) => !foundSlugs.has(slug))
    if (missingSlugs.length > 0) {
      console.error(`Requested slug(s) not found among published posts: ${missingSlugs.join(", ")}`)
      process.exit(1)
    }
    const reports = posts.map(validatePost)
    printReport(reports)
    if (strict && reports.some((report) => report.findings.some((finding) => finding.severity === "error"))) {
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message)
    process.exit(1)
  }
  console.error(String(error))
  process.exit(1)
})
