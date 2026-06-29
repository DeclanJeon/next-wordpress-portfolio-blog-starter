"use client"

import { ArrowUpRight } from "lucide-react"
import { useLiveRetrospectives } from "@/hooks/use-live-retrospectives"
import type { RetrospectiveProject } from "@/lib/retrospective-contract"

type RetrospectiveFallbackLink = {
  readonly title: string
  readonly href: string
}

type DisplayRetrospectiveLink = {
  readonly title: string
  readonly href: string
}

export type ProductRetrospectiveLiveProps = {
  readonly project: RetrospectiveProject
  readonly limit: number
  readonly fallbackItems: readonly RetrospectiveFallbackLink[]
  readonly archiveHref: string
}

function formatUpdatedAt(value: string | null): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

function toDisplayLinks(
  liveItems: readonly DisplayRetrospectiveLink[] | null,
  fallbackItems: readonly RetrospectiveFallbackLink[],
  limit: number
): readonly DisplayRetrospectiveLink[] {
  if (liveItems && liveItems.length > 0) {
    return liveItems
  }

  return fallbackItems.slice(0, limit)
}

export function ProductRetrospectiveLive({
  project,
  limit,
  fallbackItems,
  archiveHref,
}: ProductRetrospectiveLiveProps) {
  const { data, status, errorMessage } = useLiveRetrospectives({ project, limit })
  const links = toDisplayLinks(data?.items ?? null, fallbackItems, limit)
  const total = data?.total ?? fallbackItems.length
  const updatedAt = formatUpdatedAt(data?.updatedAt ?? null)
  const statusMessage = errorMessage
    ? "최신 목록 확인 실패 · 마지막 성공 목록 표시 중"
    : status === "loading"
      ? "최신 목록 확인 중"
      : updatedAt
        ? `최근 업데이트 ${updatedAt}`
        : null

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-tracked-sm text-muted-foreground">Retrospective</p>
          {statusMessage ? (
            <p className="mt-1 text-[0.68rem] leading-relaxed text-muted-foreground">
              {statusMessage}
            </p>
          ) : null}
        </div>
        <a href={archiveHref} className="shrink-0 text-xs text-clay hover:underline">
          전체 {total}편
        </a>
      </div>

      {links.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {links.map((item) => (
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
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          아직 연결된 회고가 없다
        </p>
      )}
    </div>
  )
}
