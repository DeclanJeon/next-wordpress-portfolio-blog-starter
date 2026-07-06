"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"
import { ProjectCard } from "@/components/site/project-card"
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

function SignatureSystems() {
  return (
    <section className="border-t border-border bg-muted/25" id="systems">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-start">
          <div>
            <SectionLabel>S&nbsp;y&nbsp;s&nbsp;t&nbsp;e&nbsp;m&nbsp;s</SectionLabel>
            <h2 className="mt-4 font-serif-display text-4xl leading-none md:text-5xl">
              반복해서 걸리는 부분을 조금씩 줄였다.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            {signatureSystems.map((item) => (
              <a key={item.title} href={`#${item.projectSlug}`} className="group bg-background p-5 transition-colors hover:bg-muted/60 md:p-6">
                <span className="label-tracked-sm text-clay">자주 돌아간 작업</span>
                <h3 className="mt-3 font-serif-display text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-foreground">
                  자세히 열어보기
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
    () => portfolioProjects.filter((project) => compact ? project.tier === "primary" : filter === "All" || project.category === filter),
    [compact, filter]
  )
  const primaryProjects = React.useMemo(
    () => visible.filter((project) => project.tier === "primary"),
    [visible]
  )
  const bonusProjects = React.useMemo(
    () => compact ? [] : visible.filter((project) => project.tier === "bonus"),
    [compact, visible]
  )

  return (
    <section className="border-t border-border" id="work">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>W&nbsp;o&nbsp;r&nbsp;k</SectionLabel>
            <h2 className="mt-4 max-w-3xl font-serif-display text-4xl leading-none md:text-6xl">
              요즘 가장 오래 붙잡은 두 흐름.
            </h2>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              PonsLink와 PonsWarp를 앞에 둔다. 다만 “대표작”이라고 치켜세우기보다, 만들면서 반복해서 고친 연결·전송 문제를 먼저 보여준다. 다른 작업은 같은 손버릇이 남은 옆 기록으로 둔다.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <a className="inline-flex items-center gap-1 text-sm text-clay hover:underline" href="/work">
              작업 더 보기
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <a href="https://github.com/DeclanJeon" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
                GitHub
              </a>
              <a href="mailto:syas0301@gmail.com" className="hover:text-foreground hover:underline">
                연락
              </a>
            </div>
          </div>
        </div>

        {!compact ? (
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
        ) : null}

        {primaryProjects.length > 0 ? (
          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="label-tracked-sm text-clay">먼저 꺼내는 두 작업</p>
                <h3 className="mt-2 font-serif-display text-3xl leading-tight">PonsLink / PonsWarp</h3>
              </div>
              <span className="text-xs text-muted-foreground">Live · GitHub · 쓴 글</span>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {primaryProjects.map((project) => (
                <div id={project.slug} key={project.slug}>
                  <ProjectCard project={project} compact={compact} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {bonusProjects.length > 0 ? (
          <div className="mt-10 border-t border-border pt-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="label-tracked-sm text-muted-foreground">옆 기록</p>
                <h3 className="mt-2 font-serif-display text-3xl leading-tight">작게 해본 것들</h3>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                문서 자동화, 도메인 AI, 제작 도구, 에이전트 작업 시스템은 “이런 것도 했다”보다 같은 문제 감각이 어디로 번졌는지 보는 용도다.
              </p>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {bonusProjects.map((project) => (
                <div id={project.slug} key={project.slug}>
                  <ProjectCard project={project} compact={compact} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-muted/25 p-6 text-sm text-muted-foreground">
            선택한 필터에 맞는 프로젝트가 아직 없다.
          </div>
        ) : null}
      </div>
    </section>
  )
}

function WritingGateway({ compact = false }: { compact?: boolean }) {
  const visibleCaseStudies = compact ? writingCaseStudies.slice(0, 2) : writingCaseStudies

  return (
    <section className="border-t border-border bg-muted/25" id="writing-brief">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:py-20">
        <div>
          <SectionLabel>W&nbsp;r&nbsp;i&nbsp;t&nbsp;i&nbsp;n&nbsp;g</SectionLabel>
          <h2 className="mt-4 font-serif-display text-4xl leading-none md:text-5xl">
            글은 필요한 사람에게만 오래 열리면 된다.
          </h2>
          <p className="mt-5 text-muted-foreground">
            메인 목록은 처음 온 사람이 길을 잃지 않을 정도로만 둔다. 긴 글은 프로젝트별 서랍에 두고, 제목·요약·읽는 순서를 붙여 필요한 글만 골라 읽게 한다.
          </p>
          <a href="/writing" className="mt-5 inline-flex items-center gap-1 text-sm text-clay hover:underline">
            먼저 볼 글 열기
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          {visibleCaseStudies.map((title, index) => (
            <div key={title} className="flex gap-4 border-b border-border p-5 last:border-b-0">
              <span className="font-serif-display text-3xl text-clay/70">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-medium leading-snug">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">만든 이유 · 고친 흔적 · 나중에 바꿀 점</p>
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
        <SectionLabel>T&nbsp;r&nbsp;a&nbsp;c&nbsp;e&nbsp;s</SectionLabel>
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
      <WritingGateway compact />
      <EvidenceStrip />
    </>
  )
}
