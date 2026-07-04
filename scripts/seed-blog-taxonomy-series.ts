import { PrismaClient } from "@prisma/client"
import { SERIES_SEEDS, TAXONOMY_SEEDS, type MappingResult, type ProjectKey, type PublishedPost } from "./blog-taxonomy-data"

const prisma = new PrismaClient()

function hasToken(value: string, tokens: readonly string[]): boolean {
  const lower = value.toLocaleLowerCase()
  return tokens.some((token) => lower.includes(token.toLocaleLowerCase()))
}

function projectForPost(post: PublishedPost): ProjectKey {
  const text = `${post.slug} ${post.title} ${post.category} ${post.tags}`
  if (post.category === "공부 노트" || /^2026-07-04-realtime-network-/.test(post.slug) || hasToken(text, ["공부 노트"])) return "study-note"
  if (post.title.startsWith("[PonsLink]") || /^\d{4}-\d{2}-\d{2}-ponslink-/.test(post.slug)) return "ponslink"
  if (post.title.startsWith("[PonsWarp]") || /^\d{4}-\d{2}-\d{2}-ponswarp-/.test(post.slug)) return "ponswarp"
  if (hasToken(text, ["Document Automation", "DocuFlow", "PDF마스터", "PDF Master", "문서 자동화", "HWP", "OCR"])) return "document-automation"
  if (hasToken(text, ["Ruminate", "FateMirror", "명경", "사주", "고전"])) return "domain-ai"
  if (hasToken(text, ["Essays", "Essay"])) return "essay"
  if (hasToken(text, ["Notes", "Field Notes", "Blog Ops", "SEO", "nginx", "운영"])) return "operation-note"
  return "local-tools"
}

function ponslinkPrimary(post: PublishedPost): string {
  const text = `${post.slug} ${post.title} ${post.tags}`
  if (hasToken(text, ["tech-retrospective", "reading-the-commit-log", "no-go"])) return "dev-retrospective/ponslink/metrics"
  if (hasToken(text, ["algorithm", "negotiation", "queue", "replay", "idempotency", "ponscast-protocol", "ponscast-backpressure", "ponscast-cache", "ponscast-audio", "ponscast-tradeoff"])) return "dev-retrospective/ponslink/algorithm"
  if (hasToken(text, ["deep-dive", "signaling", "broker", "mesh", "bff", "runtime", "zustand", "control-plane", "patterns-tests"])) return "dev-retrospective/ponslink/architecture"
  if (hasToken(text, ["payment", "polar", "webhook", "admin", "otp", "session-access", "token-permission", "entitlement"])) return "dev-retrospective/ponslink/operation"
  if (hasToken(text, ["ponswarp-split", "product-", "request-first", "public-desk", "request-status", "pricing", "direct-sales", "dm-screening", "calendly", "google-form", "landing-repositioning", "first-customer", "paid-consultation", "quota", "plan-enforcement"])) return "dev-retrospective/ponslink/product-decision"
  return "dev-retrospective/ponslink/origin"
}

function ponswarpPrimary(post: PublishedPost): string {
  if (post.slug === "2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink") return "dev-retrospective/ponswarp/origin"
  const text = `${post.slug} ${post.title} ${post.tags}`
  if (hasToken(text, ["flow-that-survives-failure", "incomplete-transfer-recovery", "mobile-background-resume"])) return "dev-retrospective/ponswarp/metrics"
  if (hasToken(text, ["cloud-drop", "entitlement", "payment", "direct-cloud-drop"])) return "dev-retrospective/ponswarp/operation"
  if (hasToken(text, ["rust", "wasm", "zip64", "zero-copy", "desktop", "tauri", "native"])) return "dev-retrospective/ponswarp/native-wasm"
  if (hasToken(text, ["2gb", "opfs", "browser-memory", "download-strategy", "streamsaver", "file system", "browser-download"])) return "dev-retrospective/ponswarp/browser-storage"
  if (hasToken(text, ["webrtc", "signaling", "ack", "backpressure", "pipeline", "transfer", "datachannel"])) return "dev-retrospective/ponswarp/transfer-engine"
  return "dev-retrospective/ponswarp/origin"
}

function mapPost(post: PublishedPost): MappingResult {
  const project = projectForPost(post)
  if (project === "ponslink") {
    const secondarySlugs = ["2026-06-16-ponslink-09b-file-transfer-left-room", "2026-06-16-ponslink-11-ponswarp-split"].includes(post.slug)
      ? ["dev-retrospective/ponswarp/origin"]
      : []
    return { primarySlug: ponslinkPrimary(post), secondarySlugs }
  }
  if (project === "ponswarp") {
    const secondarySlugs = post.slug === "2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink"
      ? ["dev-retrospective/ponslink/architecture"]
      : []
    return { primarySlug: ponswarpPrimary(post), secondarySlugs }
  }
  if (project === "study-note") return { primarySlug: "study-note/realtime-network", secondarySlugs: [] }
  if (project === "document-automation") return { primarySlug: "dev-retrospective/document-automation", secondarySlugs: [] }
  if (project === "domain-ai") return { primarySlug: "dev-retrospective/domain-ai", secondarySlugs: [] }
  if (project === "essay") return { primarySlug: "essay", secondarySlugs: [] }
  if (project === "operation-note") return { primarySlug: "operation-note/blog-ops", secondarySlugs: [] }
  if (project === "release-note") return { primarySlug: "release-note", secondarySlugs: [] }
  return { primarySlug: "dev-retrospective/local-tools", secondarySlugs: [] }
}


async function normalizeDevelopmentRetrospectiveCategories(): Promise<number> {
  const result = await prisma.post.updateMany({
    where: {
      status: "published",
      OR: [
        { title: { startsWith: "[PonsLink]" } },
        { title: { startsWith: "[PonsWarp]" } },
      ],
    },
    data: { category: "개발 회고" },
  })
  return result.count
}

async function seedTaxonomies(): Promise<Map<string, string>> {
  const nodeIds = new Map<string, string>()
  for (const node of TAXONOMY_SEEDS) {
    const parentId = node.parentSlug ? nodeIds.get(node.parentSlug) : null
    if (node.parentSlug && !parentId) throw new Error(`Missing taxonomy parent: ${node.parentSlug}`)
    const saved = await prisma.taxonomyNode.upsert({
      where: { slug: node.slug },
      update: { name: node.name, kind: node.kind, parentId, description: node.description, sortOrder: node.sortOrder },
      create: { slug: node.slug, name: node.name, kind: node.kind, parentId, description: node.description, sortOrder: node.sortOrder },
      select: { id: true, slug: true },
    })
    nodeIds.set(saved.slug, saved.id)
  }
  return nodeIds
}

async function seedPostTaxonomies(nodeIds: ReadonlyMap<string, string>): Promise<number> {
  await prisma.postTaxonomy.deleteMany()
  const posts = await prisma.post.findMany({ where: { status: "published" }, select: { id: true, slug: true, title: true, category: true, tags: true } })
  let created = 0
  for (const post of posts) {
    const mapping = mapPost(post)
    const primaryNodeId = nodeIds.get(mapping.primarySlug)
    if (!primaryNodeId) throw new Error(`Missing primary taxonomy: ${mapping.primarySlug}`)
    await prisma.postTaxonomy.create({ data: { postId: post.id, nodeId: primaryNodeId, role: "primary", sortOrder: 0 } })
    created += 1
    for (const [index, slug] of mapping.secondarySlugs.entries()) {
      const secondaryNodeId = nodeIds.get(slug)
      if (!secondaryNodeId) throw new Error(`Missing secondary taxonomy: ${slug}`)
      await prisma.postTaxonomy.create({ data: { postId: post.id, nodeId: secondaryNodeId, role: "secondary", sortOrder: index + 1 } })
      created += 1
    }
  }
  return created
}

async function seedSeries(): Promise<number> {
  await prisma.postSeries.deleteMany()
  let linked = 0
  for (const seed of SERIES_SEEDS) {
    const series = await prisma.series.upsert({
      where: { slug: seed.slug },
      update: { title: seed.title, description: seed.description, projectSlug: seed.projectSlug, sortOrder: seed.sortOrder },
      create: { slug: seed.slug, title: seed.title, description: seed.description, projectSlug: seed.projectSlug, sortOrder: seed.sortOrder },
      select: { id: true },
    })
    for (const [index, slug] of seed.postSlugs.entries()) {
      const post = await prisma.post.findUnique({ where: { slug }, select: { id: true } })
      if (!post) continue
      await prisma.postSeries.create({ data: { postId: post.id, seriesId: series.id, sortOrder: index + 1, isPinned: index < 3 } })
      linked += 1
    }
  }
  return linked
}

async function main(): Promise<void> {
  const normalizedCategoryCount = await normalizeDevelopmentRetrospectiveCategories()
  const nodeIds = await seedTaxonomies()
  const postTaxonomyCount = await seedPostTaxonomies(nodeIds)
  const seriesLinkCount = await seedSeries()
  const primaryCount = await prisma.postTaxonomy.count({ where: { role: "primary" } })
  const publishedCount = await prisma.post.count({ where: { status: "published" } })
  const seriesCount = await prisma.series.count()
  console.log(JSON.stringify({ taxonomyNodes: nodeIds.size, normalizedCategoryCount, postTaxonomyCount, primaryCount, publishedCount, seriesCount, seriesLinkCount }, null, 2))
}

main()
  .catch((error: unknown) => {
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error("Unknown taxonomy seed failure")
    }
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
