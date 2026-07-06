import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { formatReadingTime } from "@/lib/reading-time"
import type { CollectionReadingGuide } from "@/lib/selected-writing"

export function CollectionReadingGuidePanel({ guide }: { readonly guide: CollectionReadingGuide | null }) {
  if (!guide) return null

  return (
    <section className="mb-10 space-y-6" aria-labelledby="collection-reading-guide-title">
      <div className="rounded-3xl border border-border bg-background/85 p-5 shadow-sm md:p-6">
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <p className="label-tracked-sm text-clay">{guide.kicker}</p>
            <h2 id="collection-reading-guide-title" className="mt-3 font-serif-display text-3xl leading-tight md:text-4xl">
              전체 목록 전에 읽을 길.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{guide.description}</p>
          </div>

          {guide.startHere.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {guide.startHere.map((item, index) => (
                <Link key={item.post.slug} href={`/writing/${item.post.slug}`} className="group rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40">
                  <span className="font-mono text-xs text-clay">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mt-3 block font-serif-display text-xl leading-tight transition-colors group-hover:text-clay">
                    {item.post.title}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{item.reason}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    {formatReadingTime(item.post.readingTime)}
                    <ArrowUpRight className="h-3.5 w-3.5 text-clay transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {guide.paths.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {guide.paths.map((path) => (
            <article key={path.title} className="rounded-3xl border border-border bg-background/75 p-5">
              <h3 className="font-serif-display text-2xl leading-tight">{path.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{path.description}</p>
              <div className="mt-4 grid gap-2">
                {path.posts.map((post) => (
                  <Link key={post.slug} href={`/writing/${post.slug}`} className="group flex items-start justify-between gap-3 rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-muted/40">
                    <span className="leading-relaxed group-hover:text-clay">{post.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatReadingTime(post.readingTime)}</span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
