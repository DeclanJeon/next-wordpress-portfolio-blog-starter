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
  readonly h2Headings: readonly string[]
  readonly findings: readonly Finding[]
}

type ValidationOptions = {
  readonly requireImagegenProvenance: boolean
}

type BlogPostInput = {
  readonly slug: string
  readonly title: string
  readonly category: string | null
  readonly tags: string | null
  readonly content: string
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

const AI_TELL_PHRASES = [
  "이 글은 실시간 네트워크 딥다이브",
  "목표는",
  "공부 노트로 따로 분리한 이유",
  "숫자를 적어두는 이유는",
  "이 목록은 겁을 주기 위한 것이 아니라",
  "이 연결은 회고를 끌어오기 위한 장식이 아니다",
  "추가 메모",
]
const META_OPENING_PREFIXES = ["이 글은", "이번 글은", "본 글에서는", "이번 글에서는", "목표는"]


const DEEP_DIVE_TEMPLATE_HEADINGS = new Set([
  "용어를 정확히 나누기",
  "구조를 말로 설명하면",
  "숫자로 보면 어디서 부담이 생기는가",
  "실패하거나 무거워지는 지점",
  "실제 서비스에서는 어떤 선택을 하는가",
  "PonsLink/PonsWarp를 다시 보면",
  "체크리스트",
  "FAQ",
  "다음 글과 연결",
])

const FORBIDDEN_IMAGE_SOURCE_EXTENSIONS = new Set([".svg", ".html", ".htm", ".js", ".mjs", ".ts", ".tsx", ".py"])
const IMAGEGEN_PROVENANCE_FILE = ".imagegen-provenance.json"

const REPEATED_TEMPLATE_HEADINGS = new Set([
  "연결이 붙었다고 방이 된 것은 아니었다",
  "사람이 신경 쓰지 않아도 제품이 기억해야 하는 것들",
  "회의 앱보다 연결 방식에 가까워진 이유",
  "처음엔 쉽게 보였던 문제",
  "직접 만들자 달라진 기준",
  "지금 돌아보면 남는 판단",
])

function parseArgs(args: readonly string[]): {
  slugs: readonly string[]
  strict: boolean
  requireImagegenProvenance: boolean
  postsJson: string | null
  expectedPostCount: number | null
  expectedImagesPerPost: number | null
  expectedTotalBodyImages: number | null
} {
  const slugs: string[] = []
  let strict = false
  let requireImagegenProvenance = false
  let postsJson: string | null = null
  let expectedPostCount: number | null = null
  let expectedImagesPerPost: number | null = null
  let expectedTotalBodyImages: number | null = null
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--strict") {
      strict = true
      continue
    }
    if (arg === "--require-imagegen-provenance") {
      requireImagegenProvenance = true
      continue
    }
    if (arg === "--posts-json") {
      const value = args[index + 1]
      if (!value) throw new Error("--posts-json requires a path")
      postsJson = value
      index += 1
      continue
    }
    if (arg === "--expected-post-count") {
      const value = args[index + 1]
      if (!value) throw new Error("--expected-post-count requires a value")
      expectedPostCount = parsePositiveInteger("--expected-post-count", value)
      index += 1
      continue
    }
    if (arg === "--expected-images-per-post") {
      const value = args[index + 1]
      if (!value) throw new Error("--expected-images-per-post requires a value")
      expectedImagesPerPost = parsePositiveInteger("--expected-images-per-post", value)
      index += 1
      continue
    }
    if (arg === "--expected-total-body-images") {
      const value = args[index + 1]
      if (!value) throw new Error("--expected-total-body-images requires a value")
      expectedTotalBodyImages = parsePositiveInteger("--expected-total-body-images", value)
      index += 1
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
  return { slugs: [...new Set(slugs)], strict, requireImagegenProvenance, postsJson, expectedPostCount, expectedImagesPerPost, expectedTotalBodyImages }
}

function parsePositiveInteger(flag: string, value: string): number {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || String(parsed) !== value.trim()) {
    throw new Error(`${flag} requires a positive integer`)
  }
  return parsed
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

function markdownHeadingsByLevel(markdown: string, level: number): string[] {
  const hashes = "#".repeat(level)
  return [...markdown.matchAll(new RegExp(`^${hashes}\\s+(.+)$`, "gm"))].map((match) => match[1]?.trim() ?? "")
}

function markdownImages(markdown: string): string[] {
  return [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1] ?? "")
}

function countOccurrences(content: string, phrase: string): number {
  return content.split(phrase).length - 1
}

function phraseOccurrences(content: string, phrases: readonly string[]): Array<{ phrase: string; count: number }> {
  return phrases
    .map((phrase) => ({ phrase, count: countOccurrences(content, phrase) }))
    .filter((entry) => entry.count > 0)
}

function firstBodyParagraph(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .filter((paragraph) => !paragraph.startsWith("#"))
    .filter((paragraph) => !paragraph.startsWith("!"))
    .filter((paragraph) => !paragraph.startsWith("<!--"))
    .map(plainText)[0] ?? ""
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

function extensionOf(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".")
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : ""
}

function bodyImageDirectory(slug: string): string {
  return join(process.cwd(), "public", "tistory", "body-images", slug)
}

function bodyImageDirectoryFiles(slug: string, directory = bodyImageDirectory(slug), prefix = ""): string[] {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return []
  return readdirSync(directory).flatMap((name) => {
    const absolutePath = join(directory, name)
    const relativePath = prefix ? `${prefix}/${name}` : name
    if (statSync(absolutePath).isDirectory()) return bodyImageDirectoryFiles(slug, absolutePath, relativePath)
    return [relativePath]
  })
}

function bodyImageDirectoryPngs(slug: string): string[] {
  return bodyImageDirectoryFiles(slug).filter((name) => name.toLowerCase().endsWith(".png"))
}

function forbiddenBodyImageSources(slug: string): string[] {
  return bodyImageDirectoryFiles(slug).filter((name) => FORBIDDEN_IMAGE_SOURCE_EXTENSIONS.has(extensionOf(name)))
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

function manifestStringValues(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap((entry) => manifestStringValues(entry))
  if (value && typeof value === "object") {
    return Object.values(value).flatMap((entry) => manifestStringValues(entry))
  }
  return []
}

function manifestPathValues(value: unknown): string[] {
  return manifestStringValues(value).filter((entry) => /[/.]/.test(entry))
}

function manifestStringValuesForKeys(value: unknown, names: readonly string[]): string[] {
  if (!value || typeof value !== "object") return []
  if (Array.isArray(value)) return value.flatMap((entry) => manifestStringValuesForKeys(entry, names))

  return Object.entries(value).flatMap(([key, entry]) => {
    const nested = manifestStringValuesForKeys(entry, names)
    return names.includes(key) ? [...manifestStringValues(entry), ...nested] : nested
  })
}

function hasAnyStringKey(value: unknown, names: readonly string[]): boolean {
  if (!value || typeof value !== "object") return false
  if (Array.isArray(value)) return value.some((entry) => hasAnyStringKey(entry, names))

  return Object.entries(value).some(([key, entry]) => {
    if (names.includes(key) && manifestStringValues(entry).some((text) => text.trim().length > 0)) return true
    return hasAnyStringKey(entry, names)
  })
}

function imagegenProvenanceIssues(slug: string, bodyImages: readonly string[]): string[] {
  const manifestPath = join(bodyImageDirectory(slug), IMAGEGEN_PROVENANCE_FILE)
  if (!existsSync(manifestPath)) {
    return [`Missing ${IMAGEGEN_PROVENANCE_FILE} for generated body images.`]
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      return [`Invalid ${IMAGEGEN_PROVENANCE_FILE}: root must be an object.`]
    }

    const record = manifest as Record<string, unknown>
    const backend = typeof record.backend === "string" ? record.backend.trim() : ""
    const model = typeof record.model === "string" ? record.model.trim() : ""
    const sourceType = typeof record.sourceType === "string" ? record.sourceType.trim() : ""
    const lineageStrings = manifestStringValuesForKeys(record, [
      "backend",
      "model",
      "sourceType",
      "source",
      "sourceAsset",
      "sourcePath",
      "sourceAssetPath",
      "sourceAssetPaths",
      "finalAsset",
      "finalAssetPath",
      "finalAssetPaths",
      "finalPath",
      "finalPaths",
      "output",
      "outputs",
      "outputPath",
      "outputPaths",
      "asset",
      "assets",
    ])
    const pathStrings = manifestPathValues(record)
    const finalWebpPaths = pathStrings.filter((value) => value.startsWith(finalBodyImagePrefix(slug)) && value.toLowerCase().endsWith(".webp"))

    const issues: string[] = []
    if (!/(codex\s*)?imagegen|imagen/i.test(backend)) {
      issues.push(`Image provenance backend must be Codex imagegen/Imagen, got "${backend || "missing"}".`)
    }
    if (!/gpt[-\s]?5\.5/i.test(model)) {
      issues.push(`Image provenance model must be gpt5.5, got "${model || "missing"}".`)
    }
    if (!sourceType) {
      issues.push("Image provenance sourceType must be a non-empty Codex Imagen raster source type.")
    } else if (/unknown|missing|n\/a|none|null|tbd|todo/i.test(sourceType)) {
      issues.push(`Image provenance sourceType must not be unknown or placeholder: "${sourceType}".`)
    } else if (!/codex|imagen|imagegen|raster/i.test(sourceType) || /(svg|canvas|html|python|code[-\s]?rendered|sharp|card|screenshot|fallback|provider-cache-only)/i.test(sourceType)) {
      issues.push(`Image provenance sourceType is forbidden: "${sourceType}".`)
    }
    if (lineageStrings.some((value) => /(fallback|svg|canvas|html screenshot|python[-\s]?drawn|code[-\s]?rendered|sharp|agbrowse|chat-provider|provider-cache-only)/i.test(value))) {
      issues.push("Image provenance source/final asset lineage contains forbidden fallback/source terms.")
    }
    if (!hasAnyStringKey(record, ["prompt", "promptId", "generationId", "generationUrl", "sourceAsset", "sourcePath", "sourceAssetPath", "sourceAssetPaths"])) {
      issues.push("Image provenance must include source or generation evidence such as prompt, promptId, generationId, generationUrl, sourceAsset, or sourcePath.")
    }
    if (finalWebpPaths.length === 0) {
      issues.push("Image provenance must include final WebP asset paths under the post body-image directory.")
    }
    for (const image of bodyImages) {
      if (!finalWebpPaths.includes(image)) {
        issues.push(`Image provenance missing final WebP mapping for ${image}.`)
      }
    }
    return issues
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return [`Invalid ${IMAGEGEN_PROVENANCE_FILE}: ${message}`]
  }
}

function validatePost(
  post: BlogPostInput,
  options: ValidationOptions,
): Report {
  const chars = plainText(post.content).length
  const headings = markdownHeadings(post.content)
  const h2Headings = markdownHeadingsByLevel(post.content, 2)
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

  const firstParagraph = firstBodyParagraph(post.content)
  const metaOpeningPrefix = META_OPENING_PREFIXES.find((prefix) => {
    if (firstParagraph === prefix) return true
    const nextCharacter = firstParagraph.at(prefix.length)
    return firstParagraph.startsWith(prefix) && (nextCharacter === undefined || /\s|[,.，。:：]/.test(nextCharacter))
  })
  if (metaOpeningPrefix) {
    findings.push({
      severity: "error",
      code: "ai-meta-opening",
      message: `Opening starts with generated meta framing "${metaOpeningPrefix}" instead of a concrete scene: ${firstParagraph.slice(0, 120)}`,
    })
  }

  const aiTellPhraseOccurrences = phraseOccurrences(post.content, AI_TELL_PHRASES)
  const repeatedAiTellPhrases = aiTellPhraseOccurrences.filter((entry) => entry.count >= 2)
  const aiTellPhraseTotal = aiTellPhraseOccurrences.reduce((total, entry) => total + entry.count, 0)
  if (repeatedAiTellPhrases.length > 0 || aiTellPhraseTotal >= 2) {
    const details = aiTellPhraseOccurrences.map((entry) => `${entry.phrase}×${entry.count}`).join(" / ")
    findings.push({ severity: "error", code: "ai-tell-phrases", message: `AI-tell phrase repetition detected: ${details}` })
  }

  const paddingHeadings = headings.filter((heading) => /^추가 메모/.test(heading))
  if (paddingHeadings.length > 0) {
    findings.push({ severity: "error", code: "padding-section", message: `Padding-style section headings detected: ${paddingHeadings.join(" / ")}` })
  }

  const deepDiveTemplateHeadings = h2Headings.filter((heading) => DEEP_DIVE_TEMPLATE_HEADINGS.has(heading))
  if (deepDiveTemplateHeadings.length >= 3) {
    findings.push({ severity: "error", code: "deep-dive-template-headings", message: `Generated deep-dive heading template detected: ${deepDiveTemplateHeadings.join(" / ")}` })
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

  const forbiddenSources = forbiddenBodyImageSources(post.slug)
  if (forbiddenSources.length > 0) {
    findings.push({
      severity: "error",
      code: "forbidden-image-source",
      message: `Body-image directory contains forbidden source/fallback files: ${forbiddenSources.join(", ")}`,
    })
  }

  if (options.requireImagegenProvenance && bodyImages.length > 0) {
    for (const issue of imagegenProvenanceIssues(post.slug, bodyImages)) {
      findings.push({ severity: "error", code: "missing-imagegen-provenance", message: issue })
    }
  }

  return { slug: post.slug, title: post.title, chars, headings, h2Headings, bodyImages, findings }
}

function normalizeCandidatePost(value: unknown, index: number): BlogPostInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`posts-json entry ${index} must be an object`)
  }
  const record = value as Record<string, unknown>
  const slug = typeof record.slug === "string" ? record.slug.trim() : ""
  const title = typeof record.title === "string" ? record.title.trim() : ""
  const content = typeof record.content === "string" ? record.content : ""
  const category = typeof record.category === "string" ? record.category : null
  const rawTags = record.tags
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((tag): tag is string => typeof tag === "string").join(",")
    : typeof rawTags === "string"
      ? rawTags
      : null

  if (!slug) throw new Error(`posts-json entry ${index} is missing non-empty slug`)
  if (!title) throw new Error(`posts-json entry ${index} is missing non-empty title`)
  if (!content) throw new Error(`posts-json entry ${index} is missing non-empty content`)
  return { slug, title, category, tags, content }
}

function readCandidatePosts(postsJson: string): BlogPostInput[] {
  const parsed = JSON.parse(readFileSync(postsJson, "utf8")) as unknown
  if (!Array.isArray(parsed)) throw new Error("--posts-json must point to a JSON array of post objects")
  return parsed.map((entry, index) => normalizeCandidatePost(entry, index))
}

function addCrossPostFindings(reports: readonly Report[]): readonly Report[] {
  const reportsBySignature = new Map<string, Report[]>()

  for (const report of reports) {
    const signatureHeadings = report.h2Headings.filter((heading) => !/^처음 헷갈린 지점/.test(heading))
    if (signatureHeadings.length < 5) continue
    const signature = signatureHeadings.join(" > ")
    const existing = reportsBySignature.get(signature) ?? []
    existing.push(report)
    reportsBySignature.set(signature, existing)
  }

  const repeatedSignatureSlugs = new Map<string, string>()
  for (const group of reportsBySignature.values()) {
    if (group.length < 2) continue
    const sample = group[0]
    if (!sample) continue
    const peerSlugs = group.map((report) => report.slug).join(", ")
    for (const report of group) {
      repeatedSignatureSlugs.set(report.slug, `Same H2 sequence appears in ${group.length} posts: ${peerSlugs}`)
    }
  }

  return reports.map((report) => {
    const message = repeatedSignatureSlugs.get(report.slug)
    if (!message) return report
    return {
      ...report,
      findings: [
        ...report.findings,
        {
          severity: "error",
          code: "repeated-heading-signature",
          message,
        },
      ],
    }
  })
}

function addExpectedImageCountFindings(reports: readonly Report[], expectedImagesPerPost: number | null): readonly Report[] {
  if (expectedImagesPerPost === null) return reports

  return reports.map((report) => {
    if (report.bodyImages.length === expectedImagesPerPost) return report
    return {
      ...report,
      findings: [
        ...report.findings,
        {
          severity: "error",
          code: "exact-body-image-count",
          message: `Expected exactly ${expectedImagesPerPost} body image(s), found ${report.bodyImages.length}.`,
        },
      ],
    }
  })
}

function collectionFindings(
  reports: readonly Report[],
  options: {
    readonly expectedPostCount: number | null
    readonly expectedTotalBodyImages: number | null
  },
): readonly Finding[] {
  const findings: Finding[] = []
  const totalBodyImages = reports.reduce((sum, report) => sum + report.bodyImages.length, 0)

  if (options.expectedPostCount !== null && reports.length !== options.expectedPostCount) {
    findings.push({
      severity: "error",
      code: "exact-post-count",
      message: `Expected exactly ${options.expectedPostCount} post(s), checked ${reports.length}.`,
    })
  }

  if (options.expectedTotalBodyImages !== null && totalBodyImages !== options.expectedTotalBodyImages) {
    findings.push({
      severity: "error",
      code: "exact-total-body-image-count",
      message: `Expected exactly ${options.expectedTotalBodyImages} body image(s), found ${totalBodyImages}.`,
    })
  }

  return findings
}

function hasErrorFindings(reports: readonly Report[], collection: readonly Finding[]): boolean {
  return (
    collection.some((finding) => finding.severity === "error")
    || reports.some((report) => report.findings.some((finding) => finding.severity === "error"))
  )
}

function printReport(reports: readonly Report[], collection: readonly Finding[]): void {
  const failing = reports.filter((report) => report.findings.some((finding) => finding.severity === "error"))
  const warnings = reports.filter((report) => report.findings.some((finding) => finding.severity === "warning"))
  console.log(JSON.stringify({ checked: reports.length, failing: failing.length, warnings: warnings.length, collectionFindings: collection, reports }, null, 2))
}

async function main(): Promise<void> {
  const { slugs, strict, requireImagegenProvenance, postsJson, expectedPostCount, expectedImagesPerPost, expectedTotalBodyImages } = parseArgs(process.argv.slice(2))
  const posts = postsJson
    ? readCandidatePosts(postsJson).filter((post) => slugs.length === 0 || slugs.includes(post.slug))
    : null

  if (posts) {
    const foundSlugs = new Set(posts.map((post) => post.slug))
    const missingSlugs = slugs.filter((slug) => !foundSlugs.has(slug))
    if (missingSlugs.length > 0) {
      console.error(`Requested slug(s) not found in posts JSON: ${missingSlugs.join(", ")}`)
      process.exit(1)
    }
    const reports = addExpectedImageCountFindings(
      addCrossPostFindings(
        posts.map((post) => validatePost(post, { requireImagegenProvenance })),
      ),
      expectedImagesPerPost,
    )
    const collection = collectionFindings(reports, { expectedPostCount, expectedTotalBodyImages })
    printReport(reports, collection)
    if (strict && hasErrorFindings(reports, collection)) {
      process.exit(1)
    }
    return
  }

  const prisma = new PrismaClient()
  try {
    const dbPosts = await prisma.post.findMany({
      where: {
        status: "published",
        ...(slugs.length > 0 ? { slug: { in: [...slugs] } } : {}),
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
    const foundSlugs = new Set(dbPosts.map((post) => post.slug))
    const missingSlugs = slugs.filter((slug) => !foundSlugs.has(slug))
    if (missingSlugs.length > 0) {
      console.error(`Requested slug(s) not found among published posts: ${missingSlugs.join(", ")}`)
      process.exit(1)
    }
    const reports = addExpectedImageCountFindings(
      addCrossPostFindings(
        dbPosts.map((post) => validatePost(post, { requireImagegenProvenance })),
      ),
      expectedImagesPerPost,
    )
    const collection = collectionFindings(reports, { expectedPostCount, expectedTotalBodyImages })
    printReport(reports, collection)
    if (strict && hasErrorFindings(reports, collection)) {
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
