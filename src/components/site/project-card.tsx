"use client"

import { ArrowUpRight, ExternalLink } from "lucide-react"
import { ProductRetrospectiveLive } from "@/components/site/product-retrospective-live"
import type { PortfolioProject } from "@/lib/portfolio"
import type { RetrospectiveProject } from "@/lib/retrospective-contract"

type ProjectCardProps = {
  readonly project: PortfolioProject
  readonly compact?: boolean
}

const RETROSPECTIVE_ARCHIVE_HREFS: Record<RetrospectiveProject, string> = {
  ponslink: "/writing/category/dev-retrospective/ponslink",
  ponswarp: "/writing/category/dev-retrospective/ponswarp",
  "document-automation-suite": "/writing?q=DocuFlow",
  "ruminate-fatemirror": "/writing?q=Ruminate",
  "bible-companion": "/writing?q=Bible",
  "youtube-to-md": "/writing?q=Y2MD",
  "creator-local-tools": "/writing?q=Flucto",
  "agent-work-systems": "/writing?q=AgentDock",
}

function StatusBadge({ status }: { readonly status: string }) {
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

export function ProjectCard({ project, compact = false }: ProjectCardProps) {
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

        <ProductRetrospectiveLive
          project={project.slug}
          limit={compact ? 3 : 8}
          fallbackItems={project.retrospectiveLinks ?? []}
          archiveHref={RETROSPECTIVE_ARCHIVE_HREFS[project.slug]}
        />

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
