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

function toNavigationItem(post: NavigationRecord): ArticleNavigationItem {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    publishedAt: post.publishedAt.toISOString(),
    readingTime: post.readingTime,
  }
}

function toNavigationItemFromSeries(post: SeriesPostItem): ArticleNavigationItem {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
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
    previous: series.previous ? toNavigationItemFromSeries(series.previous) : null,
    next: series.next ? toNavigationItemFromSeries(series.next) : null,
  }
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

  const [newerInArchive, olderInArchive, totalPublished] = await Promise.all([
    db.post.findFirst({
      where: {
        ...baseWhere,
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

  const excludedIds = [post.id, newerInArchive?.id, olderInArchive?.id].filter((id): id is string => Boolean(id))
  const related = await db.post.findMany({
    where: { ...baseWhere, id: { notIn: excludedIds } },
    orderBy: navigationOrderDesc,
    take: 4,
    select: navigationSelect,
  })
  const relatedIds = related.map((item) => item.id)
  const moreSlots = Math.max(0, 6 - related.length)
  const more = moreSlots
    ? await db.post.findMany({
        where: { ...baseWhere, id: { notIn: [...excludedIds, ...relatedIds] } },
        orderBy: navigationOrderDesc,
        take: moreSlots,
        select: navigationSelect,
      })
    : []

  return {
    breadcrumbs: [...taxonomyContext.breadcrumbs],
    secondary: [...taxonomyContext.secondary],
    series: toArticleSeriesNavigation(taxonomyContext.series),
    previous: newerInArchive ? toNavigationItem(newerInArchive) : null,
    next: olderInArchive ? toNavigationItem(olderInArchive) : null,
    related: related.map(toNavigationItem),
    more: more.map(toNavigationItem),
    summary: {
      totalPublished,
      categoryPublished: scope.categoryPublished,
    },
  }
}
