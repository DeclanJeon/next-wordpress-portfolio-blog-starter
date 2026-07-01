import { db } from "@/lib/db"

export type ArchiveSeriesMetadata = {
  readonly seriesLabel: string
  readonly seriesPosition: number
  readonly seriesTotal?: number
}

export async function getArchiveSeriesMetadataForPosts(
  postIds: readonly string[],
): Promise<ReadonlyMap<string, ArchiveSeriesMetadata>> {
  if (!postIds.length) return new Map<string, ArchiveSeriesMetadata>()

  const seriesEntries = await db.postSeries.findMany({
    where: { postId: { in: [...postIds] } },
    orderBy: [{ series: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { series: { select: { title: true } } },
  })
  const seriesIds = [...new Set(seriesEntries.map((entry) => entry.seriesId))]
  const seriesMemberships = seriesIds.length
    ? await db.postSeries.findMany({
        where: { seriesId: { in: seriesIds } },
        select: { seriesId: true },
      })
    : []

  const totalsBySeries = new Map<string, number>()
  for (const entry of seriesMemberships) {
    totalsBySeries.set(entry.seriesId, (totalsBySeries.get(entry.seriesId) ?? 0) + 1)
  }

  const seriesByPost = new Map<string, ArchiveSeriesMetadata>()
  for (const entry of seriesEntries) {
    if (!seriesByPost.has(entry.postId)) {
      seriesByPost.set(entry.postId, {
        seriesLabel: entry.series.title,
        seriesPosition: entry.sortOrder,
        seriesTotal: totalsBySeries.get(entry.seriesId),
      })
    }
  }

  return seriesByPost
}
