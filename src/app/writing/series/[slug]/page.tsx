import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { getSeriesDetail, taxonomyHref } from "@/lib/blog-taxonomy"
import { formatReadingTime } from "@/lib/reading-time"
import { collectionPageJsonLd, jsonLd, pageMetadata } from "@/lib/seo"

export const dynamic = "force-dynamic"

type PageProps = {
  readonly params: Promise<{ readonly slug: string }>
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value))
}
function seriesProjectHref(projectSlug: string): string {
  return taxonomyHref(projectSlug.includes("/") ? projectSlug : `dev-retrospective/${projectSlug}`)
}


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const series = await getSeriesDetail(slug)
  if (!series) return pageMetadata({ title: "시리즈를 찾을 수 없습니다", description: "요청한 시리즈를 찾을 수 없습니다.", path: "/writing" })
  return pageMetadata({ title: series.title, description: series.description, path: `/writing/series/${series.slug}` })
}

export default async function WritingSeriesPage({ params }: PageProps) {
  const { slug } = await params
  const series = await getSeriesDetail(slug)
  if (!series) notFound()
  const seriesJsonLd = collectionPageJsonLd({
    name: series.title,
    description: series.description,
    path: `/writing/series/${series.slug}`,
    breadcrumbs: [
      { name: "Writing", href: "/writing" },
      { name: series.title, href: `/writing/series/${series.slug}` },
    ],
    items: series.posts.map((post) => ({
      name: post.title,
      href: post.href,
      description: post.excerpt,
      image: post.featuredImage,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      type: "BlogPosting",
    })),
  })

  return (
    <main className="min-h-screen bg-background paper-grain">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(seriesJsonLd) }}
      />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/writing" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            글 목록
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href={seriesProjectHref(series.projectSlug)} className="text-muted-foreground transition-colors hover:text-foreground">
              글 서랍
            </Link>
            <Link href="/work" className="text-clay hover:underline">
              작업
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <p className="label-tracked-sm text-muted-foreground">먼저 읽을 묶음</p>
        <h1 className="mt-5 font-serif-display text-5xl leading-tight md:text-7xl">{series.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{series.description}</p>
        <p className="mt-4 text-sm text-muted-foreground">총 {series.posts.length}편 · 서사순 정렬</p>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20 md:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-background">
          {series.posts.map((post, index) => (
            <Link key={post.slug} href={post.href} className="group grid gap-4 border-b border-border p-5 transition-colors last:border-b-0 hover:bg-muted/40 md:grid-cols-[4rem_10rem_1fr_auto] md:items-center">
              <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
              {post.featuredImage ? (
                <span className="block h-20 overflow-hidden rounded-xl border border-border bg-muted">
                  <img src={post.featuredImage} alt={`${post.title} thumbnail`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                </span>
              ) : (
                <span className="block h-20 rounded-xl border border-border bg-muted" aria-hidden="true" />
              )}
              <span>
                <span className="block font-serif-display text-2xl leading-tight group-hover:text-clay">{post.title}</span>
                <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-muted-foreground">{post.excerpt}</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground md:justify-end">
                {formatDate(post.publishedAt)} · {formatReadingTime(post.readingTime)}
                <ArrowRight className="h-3.5 w-3.5 text-clay transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
