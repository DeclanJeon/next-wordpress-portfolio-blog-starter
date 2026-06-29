import { db } from "@/lib/db"
import type { RetrospectiveItem, RetrospectiveProject, RetrospectiveResponse } from "@/lib/retrospective-contract"

const PONSLINK_TAG = "PonsLink"

type RetrospectivePost = {
  readonly slug: string
  readonly title: string
  readonly excerpt: string
  readonly category: string
  readonly tags: string
  readonly featuredImage: string
  readonly readingTime: number
  readonly publishedAt: Date
  readonly updatedAt: Date
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

function isPonsLinkPost(post: RetrospectivePost): boolean {
  return (
    post.category === PONSLINK_TAG ||
    splitTags(post.tags).includes(PONSLINK_TAG) ||
    post.title.startsWith(`[${PONSLINK_TAG}]`)
  )
}

function toRetrospectiveItem(post: RetrospectivePost): RetrospectiveItem {
  return {
    slug: post.slug,
    title: post.title,
    href: `/writing/${post.slug}`,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

export async function getRetrospectives(query: RetrospectiveQuery): Promise<RetrospectiveResponse> {
  const posts = await db.post.findMany({
    where: {
      status: "published",
      OR: [
        { category: PONSLINK_TAG },
        { tags: { contains: PONSLINK_TAG } },
        { title: { startsWith: `[${PONSLINK_TAG}]` } },
      ],
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

  const items = posts.filter(isPonsLinkPost).map(toRetrospectiveItem)
  const updatedAt = items.reduce<string | null>((latest, item) => {
    if (!latest || item.updatedAt > latest) {
      return item.updatedAt
    }

    return latest
  }, null)

  return {
    project: query.project,
    total: items.length,
    items: items.slice(0, query.limit),
    updatedAt,
    source: "db",
  }
}
