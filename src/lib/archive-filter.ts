export type ArchiveFilter = {
  readonly category: string
  readonly taxonomy: string
  readonly tag: string
  readonly q: string
}

const PROJECT_TAG_TAXONOMY_ALIASES: Readonly<Record<string, string>> = {
  ponslink: "dev-retrospective/ponslink",
  ponswarp: "dev-retrospective/ponswarp",
}

function projectTaxonomyAlias(tag: string): string | undefined {
  return PROJECT_TAG_TAXONOMY_ALIASES[tag.toLowerCase()]
}

export function normalizeArchiveFilter(filter: ArchiveFilter): ArchiveFilter {
  const aliasTaxonomy = projectTaxonomyAlias(filter.tag)
  if (!filter.taxonomy && aliasTaxonomy) {
    return {
      ...filter,
      taxonomy: aliasTaxonomy,
      tag: "",
    }
  }
  return filter
}

export function archiveFilterCanonicalHref(filter: ArchiveFilter, view: string): string | null {
  const aliasTaxonomy = projectTaxonomyAlias(filter.tag)
  if (filter.taxonomy || !aliasTaxonomy) return null

  const params = new URLSearchParams()
  if (filter.category && filter.category !== "all") params.set("category", filter.category)
  params.set("taxonomy", aliasTaxonomy)
  if (filter.q.trim()) params.set("q", filter.q.trim())
  if (view && view !== "board") params.set("view", view)
  return `/writing?${params.toString()}`
}
