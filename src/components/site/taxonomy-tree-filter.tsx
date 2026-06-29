import Link from "next/link"
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
      <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {nodes.map((node) => (
          <TaxonomyNodeLink
            key={node.slug}
            node={node}
            activeSlug={activeSlug}
            tag={tag}
            q={q}
            view={view}
            depth={0}
          />
        ))}
      </div>
    </div>
  )
}

function TaxonomyNodeLink({
  node,
  activeSlug,
  tag,
  q,
  view,
  depth,
}: {
  readonly node: TaxonomyTreeNode
  readonly activeSlug: string
  readonly tag: string
  readonly q: string
  readonly view: ArchiveView
  readonly depth: number
}) {
  const selected = activeSlug === node.slug
  const childActive = Boolean(activeSlug && activeSlug.startsWith(`${node.slug}/`))
  const visibleChildren = depth < 2 ? node.children : []

  return (
    <div className={depth === 0 ? "space-y-1.5" : "space-y-1"}>
      <Link
        href={archiveHref({ taxonomy: node.slug, tag, q, view })}
        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs transition-colors ${
          selected
            ? "border-foreground bg-foreground text-background"
            : childActive
              ? "border-clay/40 bg-clay/10 text-foreground"
              : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
        }`}
      >
        <span style={{ paddingLeft: depth ? `${depth * 0.65}rem` : undefined }}>{node.name}</span>
        <span className="opacity-60">{node.count}</span>
      </Link>
      {visibleChildren.length ? (
        <div className="grid gap-1">
          {visibleChildren.map((child) => (
            <TaxonomyNodeLink
              key={child.slug}
              node={child}
              activeSlug={activeSlug}
              tag={tag}
              q={q}
              view={view}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
