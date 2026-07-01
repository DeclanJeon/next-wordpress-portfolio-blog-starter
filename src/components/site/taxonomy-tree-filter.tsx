"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, ChevronDown } from "lucide-react"
import { archiveHref, type ArchiveView } from "@/components/site/writing-archive-utils"
import type { TaxonomyTreeNode } from "@/lib/blog-taxonomy"

export function TaxonomyTreeFilter({
  nodes,
  activeSlug,
  tag,
  q,
  view,
}: {
  readonly nodes: readonly TaxonomyTreeNode[]
  readonly activeSlug: string
  readonly tag: string
  readonly q: string
  readonly view: ArchiveView
}) {
  if (!nodes.length) return null

  return (
    <div className="rounded-2xl border border-border bg-background/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="label-tracked-sm text-muted-foreground">Category tree</p>
        <Link href={archiveHref({ tag, q, view })} className="text-xs text-clay hover:underline">
          Tree reset
        </Link>
      </div>
      <div className="mt-3 space-y-1">
        {nodes
          .filter((node) => node.count > 0 || hasDescendantPosts(node))
          .map((node) => (
            <TaxonomySection
              key={node.slug}
              node={node}
              activeSlug={activeSlug}
              tag={tag}
              q={q}
              view={view}
              defaultExpanded={Boolean(activeSlug && activeSlug.startsWith(node.slug))}
            />
          ))}
      </div>
    </div>
  )
}

function hasDescendantPosts(node: TaxonomyTreeNode): boolean {
  return node.children.some((child) => child.count > 0 || hasDescendantPosts(child))
}

function TaxonomySection({
  node,
  activeSlug,
  tag,
  q,
  view,
  defaultExpanded,
}: {
  readonly node: TaxonomyTreeNode
  readonly activeSlug: string
  readonly tag: string
  readonly q: string
  readonly view: ArchiveView
  readonly defaultExpanded: boolean
}) {
  const selected = activeSlug === node.slug
  const childActive = Boolean(activeSlug && activeSlug.startsWith(`${node.slug}/`))
  const hasVisibleChildren = node.children.filter((c) => c.count > 0 || hasDescendantPosts(c)).length > 0
  const [expanded, setExpanded] = useState(defaultExpanded || selected)

  return (
    <div>
      <div className="flex items-center gap-1">
        {hasVisibleChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="h-6 w-6 shrink-0" />
        )}
        <Link
          href={archiveHref({ taxonomy: node.slug, tag, q, view })}
          className={`flex flex-1 items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
            selected
              ? "bg-foreground text-background font-medium"
              : childActive
                ? "bg-clay/10 text-foreground"
                : "text-foreground hover:bg-muted"
          }`}
        >
          <span>{node.name}</span>
          <span className={`tabular-nums ${selected ? "opacity-70" : "opacity-50"}`}>{node.count}</span>
        </Link>
      </div>

      {expanded && hasVisibleChildren ? (
        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {node.children
            .filter((child) => child.count > 0 || hasDescendantPosts(child))
            .map((child) => (
              <TaxonomyLeaf
                key={child.slug}
                node={child}
                activeSlug={activeSlug}
                tag={tag}
                q={q}
                view={view}
              />
            ))}
        </div>
      ) : null}
    </div>
  )
}

function TaxonomyLeaf({
  node,
  activeSlug,
  tag,
  q,
  view,
}: {
  readonly node: TaxonomyTreeNode
  readonly activeSlug: string
  readonly tag: string
  readonly q: string
  readonly view: ArchiveView
}) {
  const selected = activeSlug === node.slug
  const childActive = Boolean(activeSlug && activeSlug.startsWith(`${node.slug}/`))
  const hasVisibleChildren = node.children.filter((c) => c.count > 0).length > 0
  const [expanded, setExpanded] = useState(childActive || selected)

  return (
    <div>
      <div className="flex items-center gap-1">
        {hasVisibleChildren ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}
        <Link
          href={archiveHref({ taxonomy: node.slug, tag, q, view })}
          className={`flex flex-1 items-center justify-between gap-2 rounded-md px-2 py-1 text-xs transition-colors ${
            selected
              ? "bg-clay text-background font-medium"
              : childActive
                ? "bg-clay/10 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>{node.name}</span>
          <span className={`tabular-nums ${selected ? "opacity-70" : "opacity-50"}`}>{node.count}</span>
        </Link>
      </div>

      {expanded && hasVisibleChildren ? (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border/50 pl-1.5">
          {node.children
            .filter((child) => child.count > 0)
            .map((child) => (
              <TaxonomyLeaf
                key={child.slug}
                node={child}
                activeSlug={activeSlug}
                tag={tag}
                q={q}
                view={view}
              />
            ))}
        </div>
      ) : null}
    </div>
  )
}
