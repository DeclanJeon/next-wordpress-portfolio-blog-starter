import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { formatReadingTime } from "@/lib/reading-time"
import type { ArticleNavigation, ArticleNavigationItem } from "@/lib/types"

export function articleHref(slug: string) {
  return `/writing/${encodeURIComponent(slug)}`
}

function formatShortDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(d))
}

export function keepReadingItems(navigation?: ArticleNavigation, limit = 6) {
  if (!navigation) return []

  const seen = new Set<string>()
  return [...navigation.related, ...navigation.more].filter((item) => {
    if (seen.has(item.slug)) return false
    seen.add(item.slug)
    return true
  }).slice(0, limit)
}

function hasNavigation(navigation?: ArticleNavigation) {
  return Boolean(navigation?.previous || navigation?.next || keepReadingItems(navigation).length)
}

function RailPostLink({
  item,
  label,
  direction = "next",
  prominent = false,
}: {
  item: ArticleNavigationItem
  label: string
  direction?: "previous" | "next"
  prominent?: boolean
}) {
  const Icon = direction === "previous" ? ArrowLeft : ArrowRight

  return (
    <Link
      href={articleHref(item.slug)}
      className="group block border-t border-border/70 pt-4 text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
      aria-label={`${label}: ${item.title}`}
    >
      <span className="label-tracked-sm flex items-center gap-2 text-muted-foreground transition-colors group-hover:text-foreground">
        {direction === "previous" ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
        {direction === "next" ? <Icon className="h-3.5 w-3.5" /> : null}
      </span>
      <span className={`mt-2 block font-serif-display leading-snug text-foreground/85 transition-colors group-hover:text-foreground ${prominent ? "text-xl" : "text-lg"}`}>
        {item.title}
      </span>
      <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
        {formatShortDate(item.publishedAt)} · {formatReadingTime(item.readingTime)}
      </span>
    </Link>
  )
}

function CompactRailLink({ item }: { item: ArticleNavigationItem }) {
  return (
    <Link
      href={articleHref(item.slug)}
      className="group block border-t border-border/60 py-3 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
    >
      <span className="block text-sm leading-snug text-foreground/80 transition-colors group-hover:text-foreground">
        {item.title}
      </span>
      <span className="mt-1 block text-xs text-muted-foreground">
        {item.category} · {formatReadingTime(item.readingTime)}
      </span>
    </Link>
  )
}

export function BottomNavigationCard({
  item,
  direction,
}: {
  item: ArticleNavigationItem
  direction: "previous" | "next"
}) {
  const isPrevious = direction === "previous"
  const label = isPrevious ? "이전 글" : "다음 글"

  return (
    <Link
      href={articleHref(item.slug)}
      className={`group flex min-h-36 flex-col justify-between rounded-2xl border border-border/70 bg-background p-5 transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 ${isPrevious ? "" : "text-right"}`}
      aria-label={`${label}: ${item.title}`}
    >
      <span className={`label-tracked-sm inline-flex items-center gap-2 text-muted-foreground transition-colors group-hover:text-foreground ${isPrevious ? "" : "justify-end"}`}>
        {isPrevious ? <ArrowLeft className="h-3.5 w-3.5" /> : null}
        {label}
        {isPrevious ? null : <ArrowRight className="h-3.5 w-3.5" />}
      </span>
      <span className="mt-4 block font-serif-display text-2xl leading-tight text-foreground/85 transition-colors group-hover:text-foreground">
        {item.title}
      </span>
      <span className="mt-4 text-xs text-muted-foreground">
        {item.category} · {formatReadingTime(item.readingTime)}
      </span>
    </Link>
  )
}

export function EmptyNavigationCard({ direction }: { direction: "previous" | "next" }) {
  const isPrevious = direction === "previous"

  return (
    <div className={`flex min-h-36 flex-col justify-between rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5 text-muted-foreground ${isPrevious ? "" : "text-right"}`}>
      <span className="label-tracked-sm">{isPrevious ? "이전 글" : "다음 글"}</span>
      <span className="font-serif-display text-xl leading-tight">
        {isPrevious ? "이 글보다 앞선 기록은 아직 없습니다." : "이 글 다음에 이어질 기록은 아직 없습니다."}
      </span>
    </div>
  )
}

export function LeftArticleRail({
  navigation,
  category,
  backHref,
  backLabel,
}: {
  navigation?: ArticleNavigation
  category: string
  backHref: string
  backLabel: string
}) {
  return (
    <aside aria-label="Article context" className="hidden xl:block">
      <div className="sticky top-24 space-y-8 text-sm text-muted-foreground">
        <div className="border-t border-border/70 pt-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
        </div>

        <div className="border-t border-border/70 pt-4">
          <p className="label-tracked-sm text-muted-foreground">현재 주제</p>
          <p className="mt-2 font-serif-display text-lg leading-snug text-foreground/85">{category}</p>
        </div>

        {navigation?.summary ? (
          <div className="border-t border-border/70 pt-4">
            <p className="label-tracked-sm text-muted-foreground">아카이브 지도</p>
            <dl className="mt-3 space-y-2 text-xs leading-relaxed">
              <div className="flex items-center justify-between gap-4">
                <dt>전체 글</dt>
                <dd className="text-foreground/80">{navigation.summary.totalPublished}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>같은 주제</dt>
                <dd className="text-foreground/80">{navigation.summary.categoryPublished}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {navigation?.previous ? (
          <RailPostLink item={navigation.previous} label="이전 글" direction="previous" />
        ) : null}
      </div>
    </aside>
  )
}

export function RightArticleRail({ navigation }: { navigation?: ArticleNavigation }) {
  const keepReading = keepReadingItems(navigation, 6)

  return (
    <aside aria-label="Keep reading" className="hidden xl:block">
      <div className="sticky top-24 space-y-8 text-sm text-muted-foreground">
        {navigation?.next ? <RailPostLink item={navigation.next} label="다음 글" prominent /> : null}

        {keepReading.length ? (
          <div>
            <p className="label-tracked-sm text-muted-foreground">같이 읽을 글</p>
            <div className="mt-2">
              {keepReading.map((item) => (
                <CompactRailLink key={item.slug} item={item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

export { ArticleBottomNavigation } from "@/components/site/article-bottom-navigation"
