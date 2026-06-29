import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type ExpectedCrossRelation = {
  readonly slug: string
  readonly primary: string
  readonly secondary: readonly string[]
}

const EXPECTED_CROSS_RELATIONS: readonly ExpectedCrossRelation[] = [
  {
    slug: "2026-06-16-ponslink-09b-file-transfer-left-room",
    primary: "dev-retrospective/ponslink/origin",
    secondary: ["dev-retrospective/ponswarp/origin"],
  },
  {
    slug: "2026-06-16-ponslink-11-ponswarp-split",
    primary: "dev-retrospective/ponslink/product-decision",
    secondary: ["dev-retrospective/ponswarp/origin"],
  },
  {
    slug: "2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink",
    primary: "dev-retrospective/ponswarp/origin",
    secondary: ["dev-retrospective/ponslink/architecture"],
  },
]

function fail(message: string): never {
  throw new Error(message)
}

function assert(condition: boolean, message: string): void {
  if (!condition) fail(message)
}

async function assertAllPublishedPostsHavePrimary(): Promise<void> {
  const [publishedCount, primaryCount] = await Promise.all([
    prisma.post.count({ where: { status: "published" } }),
    prisma.postTaxonomy.count({ where: { role: "primary", post: { status: "published" } } }),
  ])
  assert(publishedCount === primaryCount, `published ${publishedCount} != primary mappings ${primaryCount}`)
}

async function assertProjectPrimaryPrefix(project: "PonsLink" | "PonsWarp", prefix: string): Promise<number> {
  const posts = await prisma.post.findMany({
    where: { status: "published", title: { startsWith: `[${project}]` } },
    select: {
      slug: true,
      taxonomies: { where: { role: "primary" }, include: { node: true } },
    },
  })
  for (const post of posts) {
    const primary = post.taxonomies[0]?.node.slug ?? ""
    assert(primary.startsWith(prefix), `${post.slug} primary ${primary} does not start with ${prefix}`)
  }
  return posts.length
}


async function assertProjectCategoriesAreDevelopmentRetrospective(): Promise<void> {
  const posts = await prisma.post.findMany({
    where: {
      status: "published",
      OR: [
        { title: { startsWith: "[PonsLink]" } },
        { title: { startsWith: "[PonsWarp]" } },
      ],
    },
    select: { slug: true, category: true },
  })
  for (const post of posts) {
    assert(post.category === "개발 회고", `${post.slug} category ${post.category} != 개발 회고`)
  }
}

async function assertCrossRelations(): Promise<void> {
  for (const expected of EXPECTED_CROSS_RELATIONS) {
    const post = await prisma.post.findUnique({
      where: { slug: expected.slug },
      select: {
        taxonomies: { include: { node: true }, orderBy: { role: "asc" } },
      },
    })
    assert(Boolean(post), `missing cross relation post ${expected.slug}`)
    const primary = post?.taxonomies.find((item) => item.role === "primary")?.node.slug
    const secondary = post?.taxonomies.filter((item) => item.role === "secondary").map((item) => item.node.slug).sort() ?? []
    assert(primary === expected.primary, `${expected.slug} primary ${primary} != ${expected.primary}`)
    assert(JSON.stringify(secondary) === JSON.stringify([...expected.secondary].sort()), `${expected.slug} secondary ${secondary.join(",")} mismatch`)
  }
}

async function assertSeriesSortOrders(): Promise<number> {
  const series = await prisma.series.findMany({ include: { posts: { select: { sortOrder: true } } } })
  for (const item of series) {
    const seen = new Set<number>()
    for (const post of item.posts) {
      assert(!seen.has(post.sortOrder), `${item.slug} has duplicate sortOrder ${post.sortOrder}`)
      seen.add(post.sortOrder)
    }
  }
  return series.length
}

async function assertStartHereSeries(): Promise<void> {
  const checks = [
    { slug: "ponslink-origin-story", first: "2026-06-16-ponslink-00-link-only-room" },
    { slug: "ponswarp-origin-story", first: "2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink" },
  ] as const
  for (const check of checks) {
    const entry = await prisma.postSeries.findFirst({
      where: { series: { slug: check.slug } },
      orderBy: { sortOrder: "asc" },
      include: { post: { select: { slug: true } } },
    })
    assert(entry?.post.slug === check.first, `${check.slug} starts with ${entry?.post.slug ?? "missing"}`)
  }
}

async function main(): Promise<void> {
  await assertAllPublishedPostsHavePrimary()
  await assertProjectCategoriesAreDevelopmentRetrospective()
  const [ponslinkCount, ponswarpCount, seriesCount] = await Promise.all([
    assertProjectPrimaryPrefix("PonsLink", "dev-retrospective/ponslink"),
    assertProjectPrimaryPrefix("PonsWarp", "dev-retrospective/ponswarp"),
    assertSeriesSortOrders(),
  ])
  await assertCrossRelations()
  await assertStartHereSeries()
  const secondaryCount = await prisma.postTaxonomy.count({ where: { role: "secondary" } })
  console.log(JSON.stringify({ ok: true, ponslinkCount, ponswarpCount, seriesCount, secondaryCount }, null, 2))
}

main()
  .catch((error: unknown) => {
    if (error instanceof Error) console.error(error.message)
    else console.error("Unknown taxonomy audit failure")
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
