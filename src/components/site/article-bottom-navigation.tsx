import Link from "next/link"
import { articleHref, BottomNavigationCard, EmptyNavigationCard, keepReadingItems } from "@/components/site/article-navigation"
import { formatReadingTime } from "@/lib/reading-time"
import type { ArticleNavigation } from "@/lib/types"

function SeriesFlow({ navigation }: { navigation?: ArticleNavigation }) {
  const series = navigation?.series
  if (!series) return null

  return (
    <section className="mt-14 rounded-3xl border border-border bg-muted/25 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-tracked-sm text-muted-foreground">시리즈 흐름</p>
          <Link href={series.href} className="mt-2 block font-serif-display text-2xl leading-tight hover:text-clay">
            {series.title}
          </Link>
        </div>
        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          {series.position} / {series.total}
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {series.previous ? <BottomNavigationCard item={series.previous} direction="previous" /> : <EmptyNavigationCard direction="previous" />}
        {series.next ? <BottomNavigationCard item={series.next} direction="next" /> : <EmptyNavigationCard direction="next" />}
      </div>
    </section>
  )
}

export function ArticleBottomNavigation({ navigation }: { navigation?: ArticleNavigation }) {
  const keepReading = keepReadingItems(navigation, 4)

  if (!navigation?.previous && !navigation?.next && !keepReading.length && !navigation?.series) return null

  return (
    <>
      <SeriesFlow navigation={navigation} />
      <nav aria-label="이전 글과 다음 글" className="mt-14 border-y border-border py-8">
        <p className="label-tracked-sm text-muted-foreground">글 흐름 이어가기</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {navigation?.previous ? <BottomNavigationCard item={navigation.previous} direction="previous" /> : <EmptyNavigationCard direction="previous" />}
          {navigation?.next ? <BottomNavigationCard item={navigation.next} direction="next" /> : <EmptyNavigationCard direction="next" />}
        </div>

        {keepReading.length ? (
          <div className="mt-6">
            <p className="label-tracked-sm text-muted-foreground">같이 읽을 글</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {keepReading.map((item) => (
                <Link
                  key={item.slug}
                  href={articleHref(item.slug)}
                  className="rounded-lg border border-border/70 p-4 text-sm transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                >
                  <span className="block font-serif-display text-lg leading-snug text-foreground/85">{item.title}</span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {item.category} · {formatReadingTime(item.readingTime)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </nav>
    </>
  )
}
