import { getPostIdsForTaxonomySlug, getTaxonomyPath, getTaxonomyTree, type TaxonomyBreadcrumb } from "@/lib/blog-taxonomy"
import { normalizeArchiveFilter, type ArchiveFilter } from "@/lib/archive-filter"
import { db } from "@/lib/db"
import {
  decorateArchivePosts,
  postSelect,
  splitTags,
  type ArchivePost,
  type PostWhereInput,
} from "@/components/site/writing-archive-utils"

export type { ArchiveFilter } from "@/lib/archive-filter"

export type CountedLabel = {
  readonly name: string
  readonly count: number
}

export type ArchiveData = {
  readonly posts: ArchivePost[]
  readonly totalPublished: number
  readonly categories: readonly CountedLabel[]
  readonly tags: readonly CountedLabel[]
  readonly taxonomyTree: Awaited<ReturnType<typeof getTaxonomyTree>>
  readonly taxonomyPath: readonly TaxonomyBreadcrumb[]
}

function countedLabels(counts: ReadonlyMap<string, number>): readonly CountedLabel[] {
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export async function getArchiveData(inputFilter: ArchiveFilter): Promise<ArchiveData> {
  const filter = normalizeArchiveFilter(inputFilter)
  const publishedWhere = { status: "published" as const }
  const taxonomyPosts = await db.post.findMany({
    where: publishedWhere,
    select: { category: true, tags: true },
  })
  const categoryCounts = new Map<string, number>()
  const tagCounts = new Map<string, number>()

  for (const post of taxonomyPosts) {
    if (post.category) categoryCounts.set(post.category, (categoryCounts.get(post.category) ?? 0) + 1)
    for (const item of splitTags(post.tags)) tagCounts.set(item, (tagCounts.get(item) ?? 0) + 1)
  }

  const taxonomyPostIds = filter.taxonomy ? await getPostIdsForTaxonomySlug(filter.taxonomy) : null
  const where: PostWhereInput = {
    status: "published",
    ...(filter.category ? { category: filter.category } : {}),
    ...(taxonomyPostIds ? { id: { in: [...taxonomyPostIds] } } : {}),
    ...(filter.q
      ? {
          OR: [
            { title: { contains: filter.q } },
            { excerpt: { contains: filter.q } },
            { content: { contains: filter.q } },
          ],
        }
      : {}),
  }
  let postRecords = await db.post.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    select: postSelect,
  })

  if (filter.tag) postRecords = postRecords.filter((post) => splitTags(post.tags).includes(filter.tag))

  return {
    posts: await decorateArchivePosts(postRecords),
    totalPublished: taxonomyPosts.length,
    categories: countedLabels(categoryCounts),
    tags: countedLabels(tagCounts).slice(0, 28),
    taxonomyTree: await getTaxonomyTree(),
    taxonomyPath: filter.taxonomy ? await getTaxonomyPath(filter.taxonomy) : [],
  }
}
