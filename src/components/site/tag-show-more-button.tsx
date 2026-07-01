"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { archiveHref, type ArchiveView } from "@/components/site/writing-archive-utils"

type TagItem = {
  readonly name: string
  readonly count: number
}

export function TagShowMoreButton({
  tags,
  activeTaxonomy,
  activeTag,
  q,
  view,
}: {
  readonly tags: readonly TagItem[]
  readonly activeTaxonomy: string
  readonly activeTag: string
  readonly q: string
  readonly view: ArchiveView
}) {
  const [expanded, setExpanded] = useState(false)
  const remaining = tags.slice(8)

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        +{remaining.length}
        <ChevronDown className="h-3 w-3" />
      </button>
    )
  }

  return (
    <>
      {remaining.map((item) => (
        <Link
          key={item.name}
          href={archiveHref({ taxonomy: activeTaxonomy, tag: item.name, q, view })}
          className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
            activeTag === item.name
              ? "bg-clay text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          #{item.name}
          <span className="ml-1 opacity-60">{item.count}</span>
        </Link>
      ))}
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        접기
      </button>
    </>
  )
}
