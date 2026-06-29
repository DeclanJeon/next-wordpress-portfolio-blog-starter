import { db } from "@/lib/db"

export type TaxonomyRole = "primary" | "secondary" | "topic"

export type TaxonomyBreadcrumb = {
  readonly slug: string
  readonly name: string
  readonly href: string
}

export type TaxonomyTreeNode = {
  readonly slug: string
  readonly name: string
  readonly kind: string
  readonly description: string
  readonly count: number
  readonly href: string
  readonly children: readonly TaxonomyTreeNode[]
}

export type SeriesPostItem = {
  readonly slug: string
  readonly title: string
  readonly excerpt: string
  readonly category: string
  readonly featuredImage: string
  readonly readingTime: number
  readonly publishedAt: string
  readonly updatedAt: string
  readonly href: string
}

export type SeriesDetail = {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly projectSlug: string
  readonly posts: readonly SeriesPostItem[]
}

export type ArticleSeriesNavigation = {
  readonly slug: string
  readonly title: string
  readonly position: number
  readonly total: number
  readonly href: string
  readonly previous: SeriesPostItem | null
  readonly next: SeriesPostItem | null
}

export type ArticleTaxonomyContext = {
  readonly breadcrumbs: readonly TaxonomyBreadcrumb[]
  readonly secondary: readonly TaxonomyBreadcrumb[]
  readonly series: ArticleSeriesNavigation | null
}

type TaxonomyRecord = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly kind: string
  readonly parentId: string | null
  readonly description: string
  readonly sortOrder: number
}


const POST_SELECT = {
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  featuredImage: true,
  readingTime: true,
  publishedAt: true,
  updatedAt: true,
} as const

function taxonomyHref(slug: string): string {
  return `/writing/category/${slug}`
}

function seriesHref(slug: string): string {
  return `/writing/series/${encodeURIComponent(slug)}`
}

function toSeriesPostItem(post: {
  readonly slug: string
  readonly title: string
  readonly excerpt: string
  readonly category: string
  readonly featuredImage: string
  readonly readingTime: number
  readonly publishedAt: Date
  readonly updatedAt: Date
}): SeriesPostItem {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    featuredImage: post.featuredImage,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    href: `/writing/${post.slug}`,
  }
}

function buildPath(nodesById: ReadonlyMap<string, TaxonomyRecord>, node: TaxonomyRecord): readonly TaxonomyBreadcrumb[] {
  const path: TaxonomyBreadcrumb[] = []
  let current: TaxonomyRecord | undefined = node
  while (current) {
    path.unshift({ slug: current.slug, name: current.name, href: taxonomyHref(current.slug) })
    current = current.parentId ? nodesById.get(current.parentId) : undefined
  }
  return path
}

function childRecords(nodes: readonly TaxonomyRecord[], parentId: string | null): readonly TaxonomyRecord[] {
  return nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

function descendantIds(nodes: readonly TaxonomyRecord[], root: TaxonomyRecord): readonly string[] {
  const ids = [root.id]
  const children = childRecords(nodes, root.id)
  for (const child of children) ids.push(...descendantIds(nodes, child))
  return ids
}

function buildTreeNode(nodes: readonly TaxonomyRecord[], countsByNodeId: ReadonlyMap<string, number>, node: TaxonomyRecord): TaxonomyTreeNode {
  const children = childRecords(nodes, node.id).map((child) => buildTreeNode(nodes, countsByNodeId, child))
  const childCount = children.reduce((total, child) => total + child.count, 0)
  return {
    slug: node.slug,
    name: node.name,
    kind: node.kind,
    description: node.description,
    count: (countsByNodeId.get(node.id) ?? 0) + childCount,
    href: taxonomyHref(node.slug),
    children,
  }
}

async function taxonomyRecords(): Promise<readonly TaxonomyRecord[]> {
  return db.taxonomyNode.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
}

export async function getTaxonomyTree(): Promise<readonly TaxonomyTreeNode[]> {
  const [nodes, groupedCounts] = await Promise.all([
    taxonomyRecords(),
    db.postTaxonomy.groupBy({
      by: ["nodeId"],
      where: { role: "primary", post: { status: "published" } },
      _count: { _all: true },
    }),
  ])
  const countsByNodeId = new Map<string, number>()
  for (const item of groupedCounts) countsByNodeId.set(item.nodeId, item._count._all)
  return childRecords(nodes, null).map((node) => buildTreeNode(nodes, countsByNodeId, node))
}

export async function getTaxonomyNode(slug: string): Promise<TaxonomyRecord | null> {
  return db.taxonomyNode.findUnique({ where: { slug } })
}

export async function getPostIdsForTaxonomySlug(slug: string): Promise<readonly string[]> {
  const nodes = await taxonomyRecords()
  const root = nodes.find((node) => node.slug === slug)
  if (!root) return []
  const ids = [...descendantIds(nodes, root)]
  const mappings = await db.postTaxonomy.findMany({
    where: { role: "primary", nodeId: { in: ids }, post: { status: "published" } },
    select: { postId: true },
  })
  return mappings.map((mapping) => mapping.postId)
}

export async function getTaxonomyPath(slug: string): Promise<readonly TaxonomyBreadcrumb[]> {
  const nodes = await taxonomyRecords()
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const node = nodes.find((item) => item.slug === slug)
  return node ? buildPath(nodesById, node) : []
}


export async function getSeriesDetail(slug: string): Promise<SeriesDetail | null> {
  const series = await db.series.findUnique({
    where: { slug },
    include: {
      posts: {
        orderBy: { sortOrder: "asc" },
        include: { post: { select: POST_SELECT } },
      },
    },
  })
  if (!series) return null
  return {
    slug: series.slug,
    title: series.title,
    description: series.description,
    projectSlug: series.projectSlug,
    posts: series.posts.map((entry) => toSeriesPostItem(entry.post)),
  }
}

export async function getStartHereSeries(projectSlug: string, limit: number): Promise<SeriesDetail | null> {
  const series = await db.series.findFirst({
    where: { projectSlug },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      posts: {
        orderBy: { sortOrder: "asc" },
        take: limit,
        include: { post: { select: POST_SELECT } },
      },
    },
  })
  if (!series) return null
  return {
    slug: series.slug,
    title: series.title,
    description: series.description,
    projectSlug: series.projectSlug,
    posts: series.posts.map((entry) => toSeriesPostItem(entry.post)),
  }
}

async function seriesNavigationForPost(postId: string): Promise<ArticleSeriesNavigation | null> {
  const membership = await db.postSeries.findFirst({
    where: { postId },
    orderBy: [{ series: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { series: true },
  })
  if (!membership) return null

  const entries = await db.postSeries.findMany({
    where: { seriesId: membership.seriesId },
    orderBy: { sortOrder: "asc" },
    include: { post: { select: POST_SELECT } },
  })
  const index = entries.findIndex((entry) => entry.postId === postId)
  if (index < 0) return null

  return {
    slug: membership.series.slug,
    title: membership.series.title,
    position: index + 1,
    total: entries.length,
    href: seriesHref(membership.series.slug),
    previous: index > 0 ? toSeriesPostItem(entries[index - 1].post) : null,
    next: index + 1 < entries.length ? toSeriesPostItem(entries[index + 1].post) : null,
  }
}

export async function getArticleTaxonomyContext(postId: string): Promise<ArticleTaxonomyContext> {
  const [nodes, primary, secondary, series] = await Promise.all([
    taxonomyRecords(),
    db.postTaxonomy.findFirst({ where: { postId, role: "primary" }, include: { node: true } }),
    db.postTaxonomy.findMany({ where: { postId, role: "secondary" }, include: { node: true }, orderBy: { sortOrder: "asc" } }),
    seriesNavigationForPost(postId),
  ])
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  return {
    breadcrumbs: primary ? buildPath(nodesById, primary.node) : [],
    secondary: secondary.flatMap((mapping) => buildPath(nodesById, mapping.node).slice(-1)),
    series,
  }
}
