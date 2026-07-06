import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { getWritingProjectHubs } from "@/lib/blog-taxonomy"
import { collectionPageJsonLd, jsonLd, pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "글 서랍",
  description: "처음 볼 글 뒤에 남겨 둔 공부 노트, 문서 자동화, 도메인 AI, 운영 기록을 주제별로 꺼내 읽는 아카이브.",
  path: "/writing/projects",
})

export const dynamic = "force-dynamic"

export default async function WritingProjectsPage() {
  const projects = await getWritingProjectHubs()
  const total = projects.reduce((sum, project) => sum + project.count, 0)
  const projectsJsonLd = collectionPageJsonLd({
    name: "글 서랍",
    description: "처음 볼 글 뒤에 남겨 둔 공부 노트, 문서 자동화, 도메인 AI, 운영 기록을 주제별로 꺼내 읽는 아카이브.",
    path: "/writing/projects",
    breadcrumbs: [
      { name: "Writing", href: "/writing" },
      { name: "글 모음", href: "/writing/projects" },
    ],
    defaultItemType: "CollectionPage",
    items: projects.map((project) => ({
      name: `${project.name} 글 모음`,
      href: project.href,
      description: project.description || "주제별로 분리한 글 모음.",
      type: "CollectionPage",
    })),
  })

  return (
    <main className="min-h-screen bg-background paper-grain">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(projectsJsonLd) }}
      />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/writing" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            글 서랍
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/work" className="text-muted-foreground transition-colors hover:text-foreground">
              작업
            </Link>
            <Link href="/writing" className="text-clay hover:underline">
              먼저 볼 글
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-16 md:px-8 md:pb-14 md:pt-24">
        <span className="label-tracked text-muted-foreground">A r c h i v e&nbsp;&nbsp;m a p</span>
        <h1 className="mt-6 max-w-5xl font-serif-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
          다 앞에 둘 수 없어서{" "}
          <br />
          <span className="italic text-clay">서랍을 나눴다.</span>
        </h1>
        <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          처음 보는 사람은 작업 페이지와 먼저 볼 글에서 시작하면 된다. 여기는 특정 기술, 프로젝트 배경, 운영 기록을 더 깊게 따라가고 싶을 때 여는 곳이다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/work" className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-transform hover:-translate-y-0.5">작업 보기</Link>
          <Link href="/writing" className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground/40">먼저 볼 글</Link>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">{projects.length}개 모음 · {total}편의 글</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-2 md:px-8 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={project.href}
            className="group rounded-3xl border border-border bg-background/80 p-5 shadow-sm transition-colors hover:border-foreground/30 hover:bg-muted/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label-tracked-sm text-muted-foreground">{project.kind}</p>
                <h2 className="mt-3 font-serif-display text-3xl leading-tight text-foreground">{project.name}</h2>
              </div>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{project.count}편</span>
            </div>
            <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{project.description || "주제별로 분리한 글 모음."}</p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm text-clay group-hover:underline">
              열어보기
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </section>
    </main>
  )
}
