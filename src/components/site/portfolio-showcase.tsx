"use client"

import * as React from "react"
import { ArrowUpRight, ExternalLink } from "lucide-react"
import { ProductRetrospectiveLive } from "@/components/site/product-retrospective-live"
import {
  evidenceItems,
  portfolioFilters,
  portfolioProjects,
  signatureSystems,
  writingCaseStudies,
  type PortfolioCategory,
} from "@/lib/portfolio"

type PortfolioShowcaseProps = {
  mode?: "home" | "work" | "writing"
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="label-tracked text-muted-foreground">{children}</span>
}

function StatusBadge({ status }: { status: string }) {
  const warning = status.includes("check") || status === "Lab"
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.18em] ${
        warning
          ? "border-clay/40 bg-clay/10 text-clay"
          : "border-border bg-background/70 text-muted-foreground"
      }`}
    >
      {status}
    </span>
  )
}

function ProjectCard({ project, compact = false }: { project: (typeof portfolioProjects)[number]; compact?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {project.screenshot ? (
        <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
          <img
            src={project.screenshot}
            alt={`${project.title} live screenshot`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/45 via-transparent to-transparent" />
          <div className="absolute left-4 top-4">
            <StatusBadge status={project.status} />
          </div>
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center border-b border-border" style={{ backgroundColor: project.accent }}>
          <span className="px-6 text-center font-serif-display text-3xl leading-none text-white/90 md:text-4xl">
            {project.title}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="label-tracked-sm">{project.category}</span>
          <span className="text-border">·</span>
          <span>{project.year}</span>
        </div>
        <h3 className="mt-3 font-serif-display text-2xl leading-tight md:text-3xl">
          {project.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
          {project.summary}
        </p>

        <div className={`mt-5 grid gap-4 border-y border-border py-4 text-sm ${compact ? "" : "md:grid-cols-2"}`}>
          <div>
            <p className="label-tracked-sm text-muted-foreground">Problem</p>
            <p className={`mt-2 leading-relaxed ${compact ? "line-clamp-2" : ""}`}>{project.problem}</p>
          </div>
          <div>
            <p className="label-tracked-sm text-muted-foreground">Decision</p>
            <p className={`mt-2 leading-relaxed ${compact ? "line-clamp-2" : ""}`}>{project.decision}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.stack.map((item) => (
            <span key={item} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {item}
            </span>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {project.proofNotes}
        </p>

        {project.retrospectiveLinks?.length ? (
          project.slug === "ponslink" ? (
            <ProductRetrospectiveLive
              project="ponslink"
              limit={compact ? 3 : 8}
              fallbackItems={project.retrospectiveLinks}
              archiveHref="/?tag=PonsLink#writing-archive"
            />
          ) : (
            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="label-tracked-sm text-muted-foreground">Retrospective</p>
                <a
                  href="/?tag=PonsLink#writing-archive"
                  className="text-xs text-clay hover:underline"
                >
                  전체 {project.retrospectiveLinks.length}편
                </a>
              </div>
              <div className="mt-3 grid gap-2">
                {project.retrospectiveLinks.slice(0, compact ? 3 : 8).map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="group/link flex items-start gap-2 text-xs leading-relaxed text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    <span>{item.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-5 text-sm">
          {project.liveUrl && (
            <a className="inline-flex items-center gap-1 text-clay hover:underline" href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              Live
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {project.repoUrl && (
            <a className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline" href={project.repoUrl} target="_blank" rel="noopener noreferrer">
              Repo
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 scale-x-0 transition-transform duration-300 group-hover:scale-x-100" style={{ backgroundColor: project.accent }} />
    </article>
  )
}

function SignatureSystems() {
  return (
    <section className="border-t border-border bg-muted/25" id="systems">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-start">
          <div>
            <SectionLabel>S&nbsp;y&nbsp;s&nbsp;t&nbsp;e&nbsp;m&nbsp;s</SectionLabel>
            <h2 className="mt-4 font-serif-display text-4xl leading-none md:text-5xl">
              불편을 운영 가능한 작은 시스템으로.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            {signatureSystems.map((item) => (
              <a key={item.title} href={`#${item.projectSlug}`} className="group bg-background p-5 transition-colors hover:bg-muted/60 md:p-6">
                <span className="label-tracked-sm text-clay">Signature</span>
                <h3 className="mt-3 font-serif-display text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-foreground">
                  해당 케이스 보기
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function WorkArchive({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = React.useState<"All" | PortfolioCategory>("All")
  const visible = React.useMemo(
    () => portfolioProjects.filter((project) => filter === "All" || project.category === filter),
    [filter]
  )

  return (
    <section className="border-t border-border" id="work">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>W&nbsp;o&nbsp;r&nbsp;k</SectionLabel>
            <h2 className="mt-4 max-w-3xl font-serif-display text-4xl leading-none md:text-6xl">
              Systems I designed, built, and keep operating.
            </h2>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              각 카드가 URL, 문제, 설계판단, 상태, proof를 함께 드러내도록 구성했다.
            </p>
          </div>
          <a className="inline-flex items-center gap-1 text-sm text-clay hover:underline" href="/work">
            전체 work route
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" aria-label="Work filters">
          {portfolioFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                filter === item
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {visible.map((project) => (
            <div id={project.slug} key={project.slug}>
              <ProjectCard project={project} compact={compact} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WritingGateway() {
  return (
    <section className="border-t border-border bg-muted/25" id="writing-brief">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:py-20">
        <div>
          <SectionLabel>W&nbsp;r&nbsp;i&nbsp;t&nbsp;i&nbsp;n&nbsp;g</SectionLabel>
          <h2 className="mt-4 font-serif-display text-4xl leading-none md:text-5xl">
            글 목록을 서비스 설계 노트로 연결한다.
          </h2>
          <p className="mt-5 text-muted-foreground">
            WordPress 글은 단순 archive가 아니라 문제정의, 운영 노트, 회고로 이어지는 evidence log다. REST/API 반영은 캐시와 revalidate 때문에 지연될 수 있음을 운영 메모로 드러낸다.
          </p>
          <a href="/writing" className="mt-5 inline-flex items-center gap-1 text-sm text-clay hover:underline">
            writing route 보기
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          {writingCaseStudies.map((title, index) => (
            <div key={title} className="flex gap-4 border-b border-border p-5 last:border-b-0">
              <span className="font-serif-display text-3xl text-clay/70">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-medium leading-snug">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">서비스 설계 · 운영 노트 · 회고 카테고리 후보</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EvidenceStrip() {
  return (
    <section className="border-t border-border" id="evidence">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <SectionLabel>E&nbsp;v&nbsp;i&nbsp;d&nbsp;e&nbsp;n&nbsp;c&nbsp;e</SectionLabel>
        <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
          {evidenceItems.map((item) => (
            <div key={item} className="bg-background p-4 text-sm leading-relaxed text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function PortfolioShowcase({ mode = "home" }: PortfolioShowcaseProps) {
  if (mode === "work") {
    return (
      <>
        <WorkArchive />
        <EvidenceStrip />
      </>
    )
  }

  if (mode === "writing") {
    return (
      <>
        <WritingGateway />
        <EvidenceStrip />
      </>
    )
  }

  return (
    <>
      <SignatureSystems />
      <WorkArchive compact />
      <WritingGateway />
      <EvidenceStrip />
    </>
  )
}
