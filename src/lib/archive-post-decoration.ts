import type { Prisma } from "@prisma/client"
import { getPrimaryTaxonomyLabelsForPosts } from "@/lib/archive-taxonomy-labels"
import type { ArchivePost, ArchivePostRecord } from "@/components/site/writing-archive-utils"

export const postSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  tags: true,
  coverColor: true,
  featuredImage: true,
  readingTime: true,
  authorName: true,
  publishedAt: true,
} satisfies Record<keyof ArchivePostRecord, true>

export type PostWhereInput = Prisma.PostWhereInput

export async function decorateArchivePosts(posts: readonly ArchivePostRecord[]): Promise<ArchivePost[]> {
  if (!posts.length) return []

  const postIds = posts.map((post) => post.id)
  const labels = await getPrimaryTaxonomyLabelsForPosts(postIds)
  return posts.map((post) => ({
    ...post,
    taxonomyLabel: labels.get(post.id) ?? post.category,
  }))
}
