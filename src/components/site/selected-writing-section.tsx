import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { formatReadingTime } from "@/lib/reading-time"
import type { SelectedWritingGroup } from "@/lib/selected-writing"

export function SelectedWritingSection({ groups }: { readonly groups: readonly SelectedWritingGroup[] }) {
  if (!groups.length) return null

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16" aria-labelledby="selected-writing-title">
      <div className="mb-8 max-w-3xl">
        <span className="label-tracked text-muted-foreground">S e l e c t e d&nbsp;&nbsp;w r i t i n g</span>
        <h2 id="selected-writing-title" className="mt-4 font-serif-display text-4xl leading-tight tracking-tight md:text-5xl">
          처음 보는 사람에게 먼저 보여줄 글.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          전체 글을 시간순으로 훑기 전에, 서비스 개발자로서의 문제 정의와 기술 판단을 바로 확인할 수 있는 글만 묶었다.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {groups.map((group) => (
          <article key={group.title} className="rounded-3xl border border-border bg-background/80 p-5 shadow-sm">
            <p className="label-tracked-sm text-clay">{group.title}</p>
            <p className="mt-3 min-h-16 text-sm leading-relaxed text-muted-foreground">{group.description}</p>
            <div className="mt-5 space-y-3 border-t border-border pt-4">
              {group.posts.map((item) => (
                <Link key={item.post.slug} href={`/writing/${item.post.slug}`} className="group block rounded-2xl border border-border/70 bg-muted/20 p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block font-serif-display text-xl leading-tight transition-colors group-hover:text-clay">
                        {item.post.title}
                      </span>
                      <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
                        {item.reason}
                      </span>
                    </span>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-clay transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                  <span className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{item.post.taxonomyLabel}</span>
                    <span className="text-border">·</span>
                    <span>{formatReadingTime(item.post.readingTime)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
