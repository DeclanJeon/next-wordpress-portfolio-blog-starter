import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Search, X } from "lucide-react"
import { pageMetadata } from "@/lib/seo"
import { WritingArchiveList } from "@/components/site/writing-archive-list"
import { TaxonomyTreeFilter } from "@/components/site/taxonomy-tree-filter"
import { getArchiveData } from "@/lib/writing-archive-data"
import { archiveFilterCanonicalHref, normalizeArchiveFilter } from "@/lib/archive-filter"
import {
  archiveHref,
  archiveViews,
  monthFormatter,
  parseArchiveView,
  type ArchivePost,
  type ArchiveView,
} from "@/components/site/writing-archive-utils"

export const metadata: Metadata = pageMetadata({
  title: "글 아카이브",
  description: "PonsLink와 제품 회고, WebRTC, 문서 자동화, 도메인 AI를 만들며 남긴 설계 판단과 운영 노트 모음.",
  path: "/writing",
})

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{
    category?: string | string[]
    tag?: string | string[]
    taxonomy?: string | string[]
    q?: string | string[]
    view?: string | string[]
  }>
}


export default async function WritingPage({ searchParams }: PageProps) {
  const params = await searchParams
  const rawCategory = params.category
  const rawTag = params.tag
  const rawTaxonomy = params.taxonomy
  const rawQuery = params.q
  const rawView = params.view
  const category = (Array.isArray(rawCategory) ? rawCategory[0] ?? "" : rawCategory ?? "").trim()
  const tag = (Array.isArray(rawTag) ? rawTag[0] ?? "" : rawTag ?? "").trim()
  const taxonomy = (Array.isArray(rawTaxonomy) ? rawTaxonomy[0] ?? "" : rawTaxonomy ?? "").trim()
  const q = (Array.isArray(rawQuery) ? rawQuery[0] ?? "" : rawQuery ?? "").trim()
  const requestedView = (Array.isArray(rawView) ? rawView[0] ?? "" : rawView ?? "").trim()
  const view = parseArchiveView(requestedView)
  const canonicalHref = archiveFilterCanonicalHref({ category, taxonomy, tag, q }, view)
  if (canonicalHref) redirect(canonicalHref)

  const filter = normalizeArchiveFilter({ category, taxonomy, tag, q })
  const viewLabel = archiveViews.find((option) => option.id === view)?.label ?? "Board"
  const { posts, categories, tags, totalPublished, taxonomyTree, taxonomyPath } = await getArchiveData(filter)
  const hasFilter = Boolean(filter.category || filter.taxonomy || filter.tag || filter.q)
  const timelineGroups: Array<{ month: string; posts: ArchivePost[] }> = []

  for (const post of posts) {
    const month = monthFormatter.format(post.publishedAt)
    const activeGroup = timelineGroups[timelineGroups.length - 1]
    if (activeGroup?.month === month) {
      activeGroup.posts.push(post)
    } else {
      timelineGroups.push({ month, posts: [post] })
    }
  }

  return (
    <main className="min-h-screen bg-background paper-grain">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Pons home
          </Link>
          <Link href="/work" className="text-sm text-clay hover:underline">
            Selected work
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-16 md:px-8 md:pb-14 md:pt-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <span className="label-tracked text-muted-foreground">P&nbsp;o&nbsp;n&nbsp;s&nbsp;&nbsp;F&nbsp;i&nbsp;e&nbsp;l&nbsp;d&nbsp;&nbsp;N&nbsp;o&nbsp;t&nbsp;e&nbsp;s</span>
            <h1 className="mt-6 max-w-5xl font-serif-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
              만들고, 고치고,
              <br />
              <span className="italic text-clay">다시 굴린 기록.</span>
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              PonsLink, 문서 자동화, 도메인 AI, 로컬 도구를 만들며 남긴 선택과 실패, 운영 메모를 모았습니다. 기술 이름보다 왜 그렇게 만들었는지,
              어디서 막혔는지, 다음에는 무엇을 고쳤는지부터 읽을 수 있게 정리합니다.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-background/75 p-5 text-sm text-muted-foreground shadow-sm">
            <p className="label-tracked-sm text-muted-foreground">작업 노트</p>
            <p className="mt-3 font-serif-display text-5xl leading-none text-foreground">{totalPublished}</p>
            <p className="mt-1">공개된 기록</p>
            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <p>문제를 발견하고</p>
              <p>흐름을 설계하고</p>
              <p>운영하며 고칩니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-background/70">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={archiveHref({ q: filter.q, view })}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                !filter.category && !filter.taxonomy && !filter.tag && !filter.q
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              All <span className="ml-1.5 opacity-60">{totalPublished}</span>
            </Link>
            {categories.map((item) => (
              <Link
                key={item.name}
                href={archiveHref({ category: item.name, q: filter.q, view })}
                className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                  filter.category === item.name
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {item.name}
                <span className="ml-1.5 opacity-60">{item.count}</span>
              </Link>
            ))}
          </div>

          <TaxonomyTreeFilter
            nodes={taxonomyTree}
            activeSlug={filter.taxonomy}
            tag={filter.tag}
            q={filter.q}
            view={view}
          />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="label-tracked-sm mr-1 text-muted-foreground">Tags</span>
              {tags.map((item) => (
                <Link
                  key={item.name}
                  href={archiveHref({ taxonomy: filter.taxonomy, tag: item.name, q: filter.q, view })}
                  className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                    filter.tag === item.name
                      ? "bg-clay text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  #{item.name}
                  <span className="ml-1 opacity-60">{item.count}</span>
                </Link>
              ))}
            </div>

            <form action="/writing" className="relative w-full max-w-sm shrink-0">
              {filter.category ? <input type="hidden" name="category" value={filter.category} /> : null}
              {filter.taxonomy ? <input type="hidden" name="taxonomy" value={filter.taxonomy} /> : null}
              {filter.tag ? <input type="hidden" name="tag" value={filter.tag} /> : null}
              {view !== "board" ? <input type="hidden" name="view" value={view} /> : null}
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={filter.q}
                placeholder="글 검색…"
                className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm outline-none transition-colors focus:border-foreground/40"
              />
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <div className="mb-5 flex flex-col gap-4 text-sm text-muted-foreground lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p>
              {hasFilter ? "Filtered archive" : "All writing"} · {posts.length} post{posts.length === 1 ? "" : "s"} · view: <span className="text-foreground">{viewLabel}</span>
              {taxonomyPath.length ? <span> · taxonomy: <span className="text-foreground">{taxonomyPath.map((item) => item.name).join(" > ")}</span></span> : null}
              {filter.category ? <span> · legacy category: <span className="text-foreground">{filter.category}</span></span> : null}
              {filter.tag ? <span> · tag: <span className="text-foreground">#{filter.tag}</span></span> : null}
              {filter.q ? <span> · search: <span className="text-foreground">{filter.q}</span></span> : null}
            </p>
            <div className="flex flex-wrap gap-2" aria-label="Archive viewer modes">
              {archiveViews.map((option) => (
                <Link
                  key={option.id}
                  href={archiveHref({ category: filter.category, taxonomy: filter.taxonomy, tag: filter.tag, q: filter.q, view: option.id })}
                  aria-current={view === option.id ? "page" : undefined}
                  className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                    view === option.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  }`}
                  title={option.description}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          {hasFilter ? (
            <Link href={archiveHref({ view })} className="inline-flex items-center gap-1 text-clay hover:underline">
              <X className="h-3.5 w-3.5" />
              Reset filters
            </Link>
          ) : null}
        </div>

        <WritingArchiveList posts={posts} timelineGroups={timelineGroups} view={view} />
      </section>
    </main>
  )
}
