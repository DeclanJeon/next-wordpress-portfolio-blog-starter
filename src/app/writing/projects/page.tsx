import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { getWritingProjectHubs } from "@/lib/blog-taxonomy"
import { collectionPageJsonLd, jsonLd, pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "글 모음",
  description: "PonsLink와 PonsWarp 외의 공부 노트, 문서 자동화, 도메인 AI, 로컬 도구, 운영 노트를 주제별로 모은 글 아카이브.",
  path: "/writing/projects",
})

export const dynamic = "force-dynamic"

export default async function WritingProjectsPage() {
  const projects = await getWritingProjectHubs()
  const total = projects.reduce((sum, project) => sum + project.count, 0)
  const projectsJsonLd = collectionPageJsonLd({
    name: "글 모음",
    description: "PonsLink와 PonsWarp 외의 공부 노트, 문서 자동화, 도메인 AI, 로컬 도구, 운영 노트를 주제별로 모은 글 아카이브.",
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
            PonsLink / PonsWarp archive
          </Link>
          <Link href="/work" className="text-sm text-clay hover:underline">
            Work
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-16 md:px-8 md:pb-14 md:pt-24">
        <span className="label-tracked text-muted-foreground">C o l l e c t i o n  P a g e s</span>
        <h1 className="mt-6 max-w-5xl font-serif-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
          핵심 블로그에서 분리한
          <br />
          <span className="italic text-clay">주제별 글 모음.</span>
        </h1>
        <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          메인 글 목록은 PonsLink와 PonsWarp에 집중하고, 공부 노트·문서 자동화·도메인 AI·로컬 도구·운영 노트는 여기서 주제 단위로 따로 읽도록 분리했습니다.
          흐름이 다른 글을 한 목록에 섞지 않기 위한 컬렉션 페이지입니다.
        </p>
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
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{project.count} posts</span>
            </div>
            <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">{project.description || "주제별로 분리한 글 모음."}</p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm text-clay group-hover:underline">
              글 보기
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </section>
    </main>
  )
}
