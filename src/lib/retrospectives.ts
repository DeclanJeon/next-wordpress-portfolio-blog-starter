import { getPostIdsForTaxonomySlug, getStartHereSeries, type SeriesPostItem } from "@/lib/blog-taxonomy"
import { db } from "@/lib/db"
import type { RetrospectiveItem, RetrospectiveProject, RetrospectiveResponse } from "@/lib/retrospective-contract"

type RetrospectiveProjectConfig = {
  readonly categories: readonly string[]
  readonly tags: readonly string[]
  readonly titlePrefixes: readonly string[]
  readonly terms: readonly string[]
}

const PROJECT_CONFIGS: Record<RetrospectiveProject, RetrospectiveProjectConfig> = {
  ponslink: {
    categories: ["PonsLink"],
    tags: [],
    titlePrefixes: ["[PonsLink]"],
    terms: [],
  },
  ponswarp: {
    categories: ["PonsWarp"],
    tags: [],
    titlePrefixes: ["[PonsWarp]"],
    terms: [],
  },
  "document-automation-suite": {
    categories: ["Document Automation", "문서 자동화"],
    tags: ["DocuFlow", "PDF마스터", "PDF Master", "PDFM", "문서 자동화"],
    titlePrefixes: [],
    terms: ["DocuFlow", "PDF마스터", "PDF Master", "PDFM", "HWP", "OCR"],
  },
  "ruminate-fatemirror": {
    categories: ["Ruminate", "FateMirror", "명경"],
    tags: ["Ruminate", "명경", "FateMirror", "사주", "고전"],
    titlePrefixes: [],
    terms: ["Ruminate", "명경", "FateMirror", "사주", "고전"],
  },
  "bible-companion": {
    categories: ["Bible Companion"],
    tags: ["Bible Companion", "Bible", "성경"],
    titlePrefixes: [],
    terms: ["Bible Companion", "Bible", "성경"],
  },
  "youtube-to-md": {
    categories: ["YouTube-to-MD", "MediaScribe", "Y2MD"],
    tags: ["YouTube-to-MD", "MediaScribe", "Y2MD", "Transcript"],
    titlePrefixes: [],
    terms: ["YouTube-to-MD", "MediaScribe", "Y2MD", "유튜브", "자막", "Transcript"],
  },
  "creator-local-tools": {
    categories: ["Flucto", "ClickCap", "CaptureBrain", "Local Tools"],
    tags: ["Flucto", "ClickCap", "CaptureBrain", "Local Tools"],
    titlePrefixes: [],
    terms: ["Flucto", "ClickCap", "CaptureBrain", "로컬 도구", "화면 녹화"],
  },
  "agent-work-systems": {
    categories: ["Agent Tools"],
    tags: ["page-production-skills", "AgentDock", "TraceForge", "Agent Tools"],
    titlePrefixes: [],
    terms: ["page-production-skills", "AgentDock", "TraceForge", "AI 작업", "agent workflow"],
  },
}

type RetrospectivePost = {
  readonly slug: string
  readonly title: string
  readonly excerpt: string
  readonly category: string
  readonly tags: string
  readonly featuredImage: string
  readonly readingTime: number
  readonly publishedAt: Date
  readonly updatedAt: Date | null
}

export type RetrospectiveQuery = {
  readonly project: RetrospectiveProject
  readonly limit: number
}

function splitTags(tags: string): readonly string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function includesTerm(value: string, terms: readonly string[]): boolean {
  const normalizedValue = value.toLocaleLowerCase()
  return terms.some((term) => normalizedValue.includes(term.toLocaleLowerCase()))
}

function matchesProject(post: RetrospectivePost, config: RetrospectiveProjectConfig): boolean {
  const postTags = splitTags(post.tags)

  return (
    config.categories.includes(post.category) ||
    postTags.some((tag) => config.tags.includes(tag)) ||
    config.titlePrefixes.some((prefix) => post.title.startsWith(prefix)) ||
    includesTerm(`${post.title} ${post.excerpt}`, config.terms)
  )
}

function toRetrospectiveItem(post: RetrospectivePost): RetrospectiveItem {
  const updatedAt = post.updatedAt ?? post.publishedAt

  return {
    slug: post.slug,
    title: post.title,
    href: `/writing/${post.slug}`,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

function toRetrospectiveSeriesItem(post: SeriesPostItem): RetrospectiveItem {
  return {
    slug: post.slug,
    title: post.title,
    href: post.href,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  }
}

function latestUpdatedAt(items: readonly RetrospectiveItem[]): string | null {
  return items.reduce<string | null>((latest, item) => {
    if (!latest || item.updatedAt > latest) return item.updatedAt
    return latest
  }, null)
}

async function getNarrativeRetrospectives(query: RetrospectiveQuery): Promise<RetrospectiveResponse | null> {
  if (query.project !== "ponslink" && query.project !== "ponswarp") return null

  const taxonomySlug = `dev-retrospective/${query.project}`
  const [series, postIds] = await Promise.all([
    getStartHereSeries(query.project, query.limit),
    getPostIdsForTaxonomySlug(taxonomySlug),
  ])
  if (!series) return null

  const items = series.posts.map(toRetrospectiveSeriesItem)
  return {
    project: query.project,
    total: postIds.length,
    items,
    updatedAt: latestUpdatedAt(items),
    source: "db",
    series: {
      title: series.title,
      href: `/writing/series/${series.slug}`,
      label: "Start here",
    },
  }
}

export async function getRetrospectives(query: RetrospectiveQuery): Promise<RetrospectiveResponse> {
  const narrative = await getNarrativeRetrospectives(query)
  if (narrative) return narrative

  const config = PROJECT_CONFIGS[query.project]
  const searchableTerms = [
    ...config.categories,
    ...config.tags,
    ...config.titlePrefixes,
    ...config.terms,
  ]

  const posts = await db.post.findMany({
    where: {
      status: "published",
      OR: searchableTerms.flatMap((term) => [
        { category: term },
        { tags: { contains: term } },
        { title: { contains: term } },
        { excerpt: { contains: term } },
      ]),
    },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      tags: true,
      featuredImage: true,
      readingTime: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
  })

  const items = posts
    .filter((post) => matchesProject(post, config))
    .map(toRetrospectiveItem)

  return {
    project: query.project,
    total: items.length,
    items: items.slice(0, query.limit),
    updatedAt: latestUpdatedAt(items),
    source: "db",
    series: null,
  }
}
