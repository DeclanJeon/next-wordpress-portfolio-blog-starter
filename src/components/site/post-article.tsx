import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight, Eye } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { formatReadingTime } from "@/lib/reading-time"
import type { ArticleNavigation, ArticleNavigationItem, Post } from "@/lib/types"

interface PostArticleProps {
  post: Post
  navigation?: ArticleNavigation
  backHref?: string
  backLabel?: string
}

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d))
}

function tagList(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function articleHref(slug: string) {
  return `/writing/${encodeURIComponent(slug)}`
}

function formatShortDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(d))
}

function keepReadingItems(navigation?: ArticleNavigation, limit = 6) {
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

function LeftArticleRail({
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
          <p className="label-tracked-sm text-muted-foreground">Current shelf</p>
          <p className="mt-2 font-serif-display text-lg leading-snug text-foreground/85">{category}</p>
        </div>

        {navigation?.summary ? (
          <div className="border-t border-border/70 pt-4">
            <p className="label-tracked-sm text-muted-foreground">Archive map</p>
            <dl className="mt-3 space-y-2 text-xs leading-relaxed">
              <div className="flex items-center justify-between gap-4">
                <dt>All writing</dt>
                <dd className="text-foreground/80">{navigation.summary.totalPublished}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>This shelf</dt>
                <dd className="text-foreground/80">{navigation.summary.categoryPublished}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {navigation?.previous ? (
          <RailPostLink item={navigation.previous} label="Previous" direction="previous" />
        ) : null}
      </div>
    </aside>
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

function RightArticleRail({ navigation }: { navigation?: ArticleNavigation }) {
  const keepReading = keepReadingItems(navigation, 6)

  return (
    <aside aria-label="Keep reading" className="hidden xl:block">
      <div className="sticky top-24 space-y-8 text-sm text-muted-foreground">
        {navigation?.next ? <RailPostLink item={navigation.next} label="Next" prominent /> : null}

        {keepReading.length ? (
          <div>
            <p className="label-tracked-sm text-muted-foreground">Keep reading</p>
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

function ArticleBottomNavigation({ navigation }: { navigation?: ArticleNavigation }) {
  const keepReading = keepReadingItems(navigation, 4)

  if (!hasNavigation(navigation)) return null

  return (
    <nav aria-label="More writing" className="mt-14 border-y border-border py-6 xl:hidden">
      <div className="grid gap-3 sm:grid-cols-2">
        {navigation?.previous ? (
          <RailPostLink item={navigation.previous} label="Previous" direction="previous" />
        ) : null}
        {navigation?.next ? <RailPostLink item={navigation.next} label="Next" /> : null}
      </div>

      {keepReading.length ? (
        <div className="mt-6">
          <p className="label-tracked-sm text-muted-foreground">Keep reading</p>
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
  )
}

export function PostArticle({
  post,
  navigation,
  backHref = "/#writing-archive",
  backLabel = "Writing archive",
}: PostArticleProps) {
  const tags = tagList(post.tags)

  return (
    <div className="mx-auto grid w-full max-w-[88rem] grid-cols-1 px-5 py-12 md:px-8 md:py-16 xl:grid-cols-[12rem_minmax(0,48rem)_16rem] xl:items-start xl:gap-12">
      <LeftArticleRail
        navigation={navigation}
        category={post.category}
        backHref={backHref}
        backLabel={backLabel}
      />

      <article className="mx-auto w-full max-w-3xl xl:max-w-none">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <header className="mt-10">
          <span className="label-tracked-sm text-muted-foreground">
            {post.category}
          </span>
          <h1 className="mt-5 font-serif-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
            {post.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
            {post.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>By {post.authorName}</span>
            <span className="text-border">·</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span className="text-border">·</span>
            <span>{formatReadingTime(post.readingTime, "meta")}</span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.views}
            </span>
          </div>

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {post.featuredImage ? (
          <figure className="mt-10 overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="aspect-[16/8] h-full w-full object-cover"
            />
          </figure>
        ) : null}

        <div className="mt-10 h-px w-full bg-border" />

        <div className="prose-editorial mt-10">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        <ArticleBottomNavigation navigation={navigation} />

        <footer className="mt-16 flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Link href={backHref} className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <Link href="/work" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            Selected work
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </article>

      <RightArticleRail navigation={navigation} />
    </div>
  )
}
