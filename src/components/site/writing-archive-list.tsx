import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { formatReadingTime } from "@/lib/reading-time"
import {
  archiveHref,
  dateFormatter,
  shortDateFormatter,
  splitTags,
  type ArchivePost,
  type ArchiveView,
  type TimelineGroup,
} from "./writing-archive-utils"

function ArchiveThumbnail({ post, className = "h-16 w-24" }: { post: ArchivePost; className?: string }) {
  if (!post.featuredImage) {
    return (
      <span className={`block shrink-0 overflow-hidden rounded-xl border border-border bg-muted ${className}`} aria-hidden="true">
        <span className="block h-full w-full opacity-80" style={{ backgroundColor: post.coverColor }} />
      </span>
    )
  }

  return (
    <span className={`block shrink-0 overflow-hidden rounded-xl border border-border bg-muted ${className}`}>
      <img
        src={post.featuredImage}
        alt={post.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
    </span>
  )
}

function SeriesBadge({ post }: { post: ArchivePost }) {
  if (!post.seriesLabel || !post.seriesPosition || !post.seriesTotal) return null
  return (
    <span className="rounded-full border border-clay/30 bg-clay/10 px-2 py-0.5 text-[11px] text-clay">
      {post.seriesLabel} {post.seriesPosition}/{post.seriesTotal}
    </span>
  )
}

function EmptyArchive({ view }: { view: ArchiveView }) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-24 text-center">
      <p className="font-serif-display text-3xl">조건에 맞는 글이 없습니다.</p>
      <p className="mt-3 text-sm text-muted-foreground">다른 카테고리, 태그, 검색어를 선택해 보세요.</p>
      <Link href={archiveHref({ view })} className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm text-background transition-transform hover:-translate-y-0.5">
        전체 글 보기
      </Link>
    </div>
  )
}

function BoardArchive({ posts }: { posts: ArchivePost[] }) {
  const seriesLabel = posts[0]?.seriesLabel
  const usesSeriesOrder =
    Boolean(seriesLabel) &&
    posts.every((post) => post.seriesLabel === seriesLabel && post.seriesPosition && post.seriesTotal === posts.length)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="hidden grid-cols-[4rem_6rem_7rem_1fr_9rem_5rem] border-b border-border bg-muted/40 px-5 py-3 text-xs text-muted-foreground md:grid">
        <span className="text-right">{usesSeriesOrder ? "순서" : "번호"}</span>
        <span>이미지</span>
        <span>분류</span>
        <span>제목</span>
        <span>날짜</span>
        <span className="text-right">읽기</span>
      </div>
      <div className="divide-y divide-border">
        {posts.map((post, index) => {
          const displayNumber = usesSeriesOrder && post.seriesPosition ? post.seriesPosition : posts.length - index
          return (
          <Link key={post.id} href={`/writing/${post.slug}`} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[4rem_6rem_7rem_1fr_9rem_5rem] md:items-center">
            <span className="font-mono text-xs text-muted-foreground md:text-right" aria-label={`${usesSeriesOrder ? "읽기 순서" : "게시글 번호"} ${displayNumber}`}>{String(displayNumber).padStart(3, "0")}</span>
            <ArchiveThumbnail post={post} className="hidden h-16 w-24 md:block md:h-12 md:w-20" />
            <span className="hidden label-tracked-sm text-muted-foreground md:block">{post.taxonomyLabel}</span>
            <span>
              <span className="block font-serif-display text-xl leading-tight group-hover:text-clay md:font-sans md:text-sm md:font-medium">
                {post.title}
              </span>
              <span className="mt-1 inline-flex">
                <SeriesBadge post={post} />
              </span>
              <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground md:hidden">{post.excerpt}</span>
            </span>
            <span className="text-xs text-muted-foreground md:text-sm">{dateFormatter.format(post.publishedAt)}</span>
            <span className="inline-flex items-center gap-1 text-xs text-foreground md:justify-end">
              {formatReadingTime(post.readingTime)}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function TimelineArchive({ groups }: { groups: TimelineGroup[] }) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.month} className="grid gap-4 md:grid-cols-[10rem_1fr]">
          <div>
            <p className="sticky top-[4.5rem] font-serif-display text-2xl text-clay">{group.month}</p>
            <p className="mt-1 text-xs text-muted-foreground">{group.posts.length} notes</p>
          </div>
          <div className="border-l border-border pl-5 md:pl-8">
            <div className="space-y-4">
              {group.posts.map((post) => {
                const postTags = splitTags(post.tags).slice(0, 3)
                return (
                  <Link key={post.id} href={`/writing/${post.slug}`} className="group relative block rounded-2xl border border-border bg-background p-5 transition-colors hover:bg-muted/40">
                    <span className="absolute -left-[1.78rem] top-6 h-3 w-3 rounded-full border border-background" style={{ backgroundColor: post.coverColor }} />
                    <div className="mb-4 flex items-start gap-4">
                      <ArchiveThumbnail post={post} className="h-20 w-28" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{shortDateFormatter.format(post.publishedAt)}</span>
                          <span className="text-border">·</span>
                          <span>{post.taxonomyLabel}</span>
                          <SeriesBadge post={post} />
                          <span className="text-border">·</span>
                          <span>{formatReadingTime(post.readingTime)}</span>
                        </div>
                        <h2 className="mt-3 font-serif-display text-2xl leading-tight group-hover:text-clay">{post.title}</h2>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                    {postTags.length ? <TagList tags={postTags} className="mt-4" /> : null}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}

function CompactArchive({ posts }: { posts: ArchivePost[] }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3 md:px-5">
      <div className="divide-y divide-border">
        {posts.map((post) => (
          <Link key={post.id} href={`/writing/${post.slug}`} className="group grid gap-2 py-3 text-sm transition-colors hover:text-clay md:grid-cols-[1fr_auto] md:items-center">
            <span>
              <span className="font-medium">{post.title}</span>
              <span className="ml-2 hidden text-xs text-muted-foreground md:inline">{post.taxonomyLabel}</span>
              <span className="mt-0.5 block"><SeriesBadge post={post} /></span>
            </span>
            <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:justify-end">
              <span>{dateFormatter.format(post.publishedAt)}</span>
              <span>{formatReadingTime(post.readingTime)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function GridArchive({ posts }: { posts: ArchivePost[] }) {
  return (
    <div className="grid auto-rows-fr gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
      {posts.map((post) => {
        const postTags = splitTags(post.tags).slice(0, 4)
        return (
          <Link key={post.id} href={`/writing/${post.slug}`} className="group relative flex min-h-72 h-full flex-col justify-between bg-background p-7 text-left transition-colors hover:bg-muted/50 md:p-8">
            <div>
              <ArchiveThumbnail post={post} className="mb-6 h-40 w-full rounded-2xl" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="label-tracked-sm">{post.taxonomyLabel}</span>
                <SeriesBadge post={post} />
                <span className="text-border">·</span>
                <span>{dateFormatter.format(post.publishedAt)}</span>
                <span className="text-border">·</span>
                <span>{formatReadingTime(post.readingTime)}</span>
              </div>
              <h2 className="mt-4 font-serif-display text-2xl leading-tight transition-colors group-hover:text-clay md:text-3xl">{post.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              {postTags.length ? <TagList tags={postTags} className="mt-5" /> : null}
            </div>
            <div className="mt-7 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">By {post.authorName}</span>
              <span className="inline-flex items-center gap-1 text-xs text-foreground">
                읽기
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ backgroundColor: post.coverColor }} />
          </Link>
        )
      })}
    </div>
  )
}

function TagList({ tags, className }: { tags: string[]; className: string }) {
  return (
    <div className={`${className} flex flex-wrap gap-1.5`}>
      {tags.map((item) => (
        <span key={item} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          #{item}
        </span>
      ))}
    </div>
  )
}

export function WritingArchiveList({ posts, timelineGroups, view }: { posts: ArchivePost[]; timelineGroups: TimelineGroup[]; view: ArchiveView }) {
  if (posts.length === 0) return <EmptyArchive view={view} />
  if (view === "board") return <BoardArchive posts={posts} />
  if (view === "timeline") return <TimelineArchive groups={timelineGroups} />
  if (view === "compact") return <CompactArchive posts={posts} />
  return <GridArchive posts={posts} />
}
