import type { Post as PrismaPost, Prisma } from "@prisma/client"
import { getArticleTaxonomyContext, getPostIdsForTaxonomySlug, type SeriesPostItem } from "@/lib/blog-taxonomy"
import { db } from "@/lib/db"
import type { ArticleNavigation, ArticleNavigationItem, ArticleSeriesNavigation } from "@/lib/types"

type NavigationRecord = Pick<
  PrismaPost,
  "id" | "slug" | "title" | "excerpt" | "category" | "publishedAt" | "readingTime"
>

type NavigationScope = {
  readonly postIds: readonly string[] | null
  readonly categoryPublished: number
}

const navigationSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  publishedAt: true,
  readingTime: true,
} satisfies Record<keyof NavigationRecord, true>

const navigationOrderDesc = [
  { publishedAt: "desc" },
  { id: "desc" },
] satisfies Prisma.PostOrderByWithRelationInput[]

const navigationOrderAsc = [
  { publishedAt: "asc" },
  { id: "asc" },
] satisfies Prisma.PostOrderByWithRelationInput[]

function toNavigationItem(post: NavigationRecord, reason?: string): ArticleNavigationItem {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    publishedAt: post.publishedAt.toISOString(),
    readingTime: post.readingTime,
    ...(reason ? { reason } : {}),
  }
}

function toNavigationItemFromSeries(post: SeriesPostItem, reason?: string): ArticleNavigationItem {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
    ...(reason ? { reason } : {}),
  }
}

function toArticleSeriesNavigation(series: Awaited<ReturnType<typeof getArticleTaxonomyContext>>["series"]): ArticleSeriesNavigation | null {
  if (!series) return null
  return {
    slug: series.slug,
    title: series.title,
    position: series.position,
    total: series.total,
    href: series.href,
    previous: series.previous ? toNavigationItemFromSeries(series.previous, "같은 시리즈에서 바로 앞선 질문") : null,
    next: series.next ? toNavigationItemFromSeries(series.next, "같은 시리즈에서 바로 이어지는 질문") : null,
  }
}

function sameTopicReason(taxonomyContext: Awaited<ReturnType<typeof getArticleTaxonomyContext>>) {
  const topic = taxonomyContext.secondary[0] ?? taxonomyContext.breadcrumbs.at(-1)
  return topic ? `${topic.name} 흐름에서 같이 보면 좋은 글` : "같은 주제에서 같이 읽을 글"
}

function taxonomyScopeSlug(navigation: Awaited<ReturnType<typeof getArticleTaxonomyContext>>): string | null {
  const root = navigation.breadcrumbs[0]
  const project = navigation.breadcrumbs[1]
  if (root?.slug === "dev-retrospective" && project) return project.slug
  return root?.slug ?? null
}

async function navigationScope(post: PrismaPost, taxonomyContext: Awaited<ReturnType<typeof getArticleTaxonomyContext>>): Promise<NavigationScope> {
  const scopeSlug = taxonomyScopeSlug(taxonomyContext)
  if (!scopeSlug) {
    return {
      postIds: null,
      categoryPublished: await db.post.count({ where: { status: "published", category: post.category } }),
    }
  }

  const postIds = await getPostIdsForTaxonomySlug(scopeSlug)
  return {
    postIds,
    categoryPublished: postIds.length,
  }
}

function scopedWhere(scope: NavigationScope): Prisma.PostWhereInput {
  return scope.postIds ? { id: { in: [...scope.postIds] } } : {}
}

export async function getArticleNavigation(post: PrismaPost): Promise<ArticleNavigation> {
  const taxonomyContext = await getArticleTaxonomyContext(post.id)
  const scope = await navigationScope(post, taxonomyContext)
  const baseWhere = {
    status: "published",
    ...scopedWhere(scope),
  } satisfies Prisma.PostWhereInput
  const seriesNavigation = toArticleSeriesNavigation(taxonomyContext.series)
  const seriesAdjacentSlugs = [
    taxonomyContext.series?.previous?.slug,
    taxonomyContext.series?.next?.slug,
  ].filter((slug): slug is string => Boolean(slug))

  const [newerInArchive, olderInArchive, totalPublished] = await Promise.all([
    db.post.findFirst({
      where: {
        ...baseWhere,
        slug: { notIn: seriesAdjacentSlugs },
        OR: [
          { publishedAt: { gt: post.publishedAt } },
          { publishedAt: post.publishedAt, id: { gt: post.id } },
        ],
      },
      orderBy: navigationOrderAsc,
      select: navigationSelect,
    }),
    db.post.findFirst({
      where: {
        ...baseWhere,
        slug: { notIn: seriesAdjacentSlugs },
        OR: [
          { publishedAt: { lt: post.publishedAt } },
          { publishedAt: post.publishedAt, id: { lt: post.id } },
        ],
      },
      orderBy: navigationOrderDesc,
      select: navigationSelect,
    }),
    db.post.count({ where: { status: "published" } }),
  ])

  const archivePrevious = newerInArchive ? toNavigationItem(newerInArchive, "최신순 아카이브에서 바로 앞선 글") : null
  const archiveNext = olderInArchive ? toNavigationItem(olderInArchive, "최신순 아카이브에서 바로 다음 글") : null

  const excludedIds = [
    post.id,
    newerInArchive?.id,
    olderInArchive?.id,
  ].filter((id): id is string => Boolean(id))

  const sameTopic = await db.post.findMany({
    where: { AND: [baseWhere, { id: { notIn: excludedIds }, slug: { notIn: seriesAdjacentSlugs } }] },
    orderBy: navigationOrderDesc,
    take: 4,
    select: navigationSelect,
  })
  const related = sameTopic.map((item) => toNavigationItem(item, sameTopicReason(taxonomyContext)))
  const relatedSlugs = related.map((item) => item.slug)
  const moreSlots = Math.max(0, 6 - related.length)
  const more = moreSlots
    ? await db.post.findMany({
        where: { AND: [baseWhere, { id: { notIn: excludedIds }, slug: { notIn: [...seriesAdjacentSlugs, ...relatedSlugs] } }] },
        orderBy: navigationOrderDesc,
        take: moreSlots,
        select: navigationSelect,
      })
    : []

  return {
    breadcrumbs: [...taxonomyContext.breadcrumbs],
    secondary: [...taxonomyContext.secondary],
    series: seriesNavigation,
    previous: archivePrevious,
    next: archiveNext,
    archivePrevious,
    archiveNext,
    related,
    more: more.map((item) => toNavigationItem(item, "같은 흐름에서 더 볼 만한 글")),
    summary: {
      totalPublished,
      categoryPublished: scope.categoryPublished,
    },
  }
}
