export type ArchiveView = "grid" | "board" | "timeline" | "compact"

export type ArchivePostRecord = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string
  coverColor: string
  featuredImage: string
  readingTime: number
  authorName: string
  publishedAt: Date
}

export type ArchivePost = ArchivePostRecord & {
  taxonomyLabel: string
  seriesLabel?: string
  seriesPosition?: number
  seriesTotal?: number
}

export type TimelineGroup = {
  month: string
  posts: ArchivePost[]
}


export const archiveViews: Array<{ id: ArchiveView; label: string; description: string }> = [
  { id: "grid", label: "Grid", description: "카드로 천천히 둘러보기" },
  { id: "board", label: "Board", description: "게시판처럼 빠르게 훑기" },
  { id: "timeline", label: "Timeline", description: "시간순 맥락 따라가기" },
  { id: "compact", label: "Compact", description: "촘촘한 색인으로 찾기" },
]

export function parseArchiveView(value: string): ArchiveView {
  return archiveViews.find((option) => option.id === value)?.id ?? "board"
}

export const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

export const shortDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
})

export const monthFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
})

export function splitTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function archiveHref({
  category,
  taxonomy,
  tag,
  q,
  view,
}: {
  category?: string | null
  taxonomy?: string | null
  tag?: string | null
  q?: string | null
  view?: ArchiveView | null
}) {
  const params = new URLSearchParams()
  if (category && category !== "all") params.set("category", category)
  if (taxonomy && taxonomy !== "all") params.set("taxonomy", taxonomy)
  if (tag && tag !== "all") params.set("tag", tag)
  if (q?.trim()) params.set("q", q.trim())
  if (view && view !== "board") params.set("view", view)
  const query = params.toString()
  return query ? `/writing?${query}` : "/writing"
}

