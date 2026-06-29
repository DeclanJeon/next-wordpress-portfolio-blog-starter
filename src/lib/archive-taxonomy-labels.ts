import { db } from "@/lib/db"

type TaxonomyRecord = {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly parentId: string | null
  readonly sortOrder: number
}

type TaxonomyBreadcrumb = {
  readonly name: string
}

function buildPath(nodesById: ReadonlyMap<string, TaxonomyRecord>, node: TaxonomyRecord): readonly TaxonomyBreadcrumb[] {
  const path: TaxonomyBreadcrumb[] = []
  let current: TaxonomyRecord | undefined = node
  while (current) {
    path.unshift({ name: current.name })
    current = current.parentId ? nodesById.get(current.parentId) : undefined
  }
  return path
}

export async function getPrimaryTaxonomyLabelsForPosts(postIds: readonly string[]): Promise<ReadonlyMap<string, string>> {
  if (!postIds.length) return new Map<string, string>()

  const [nodes, mappings] = await Promise.all([
    db.taxonomyNode.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.postTaxonomy.findMany({
      where: { postId: { in: [...postIds] }, role: "primary" },
      include: { node: true },
    }),
  ])
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const labels = new Map<string, string>()

  for (const mapping of mappings) {
    const path = buildPath(nodesById, mapping.node)
    labels.set(mapping.postId, path.slice(0, 2).map((item) => item.name).join(" · "))
  }

  return labels
}
