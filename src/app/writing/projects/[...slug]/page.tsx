import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getArchiveSeriesMetadataForPosts } from "@/lib/archive-series-metadata"
import { decorateArchivePosts, postSelect } from "@/lib/archive-post-decoration"
import { getPostIdsForTaxonomySlug, getTaxonomyNode, getTaxonomyPath, isCoreWritingProjectSlug } from "@/lib/blog-taxonomy"
import { db } from "@/lib/db"
import { collectionPageJsonLd, jsonLd, pageMetadata } from "@/lib/seo"
import { WritingArchiveList } from "@/components/site/writing-archive-list"
import { CollectionReadingGuidePanel } from "@/components/site/collection-reading-guide"
import { monthFormatter, type ArchivePost, type TimelineGroup } from "@/components/site/writing-archive-utils"
import { getCollectionReadingGuide } from "@/lib/selected-writing"

export const dynamic = "force-dynamic"

type PageProps = {
  readonly params: Promise<{ readonly slug: readonly string[] }>
}

function taxonomySlug(parts: readonly string[]): string {
  return parts.map((part) => decodeURIComponent(part)).join("/")
}

function timelineGroupsFor(posts: readonly ArchivePost[]): readonly TimelineGroup[] {
  const groups: TimelineGroup[] = []
  for (const post of posts) {
    const month = monthFormatter.format(post.publishedAt)
    const active = groups[groups.length - 1]
    if (active?.month === month) active.posts.push(post)
    else groups.push({ month, posts: [post] })
  }
  return groups
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const path = taxonomySlug(slug)
  const node = await getTaxonomyNode(path)
  if (!node) return pageMetadata({ title: "글 모음을 찾을 수 없습니다", description: "요청한 글 모음 페이지를 찾을 수 없습니다.", path: "/writing/projects" })
  return pageMetadata({
    title: `${node.name} 글 모음`,
    description: node.description || `${node.name}에 속한 글 모음.`,
    path: `/writing/projects/${path}`,
  })
}

export default async function WritingProjectDetailPage({ params }: PageProps) {
  const { slug } = await params
  const path = taxonomySlug(slug)
  if (isCoreWritingProjectSlug(path)) redirect(`/writing?taxonomy=${encodeURIComponent(path)}`)

  const [node, breadcrumbs, postIds] = await Promise.all([
    getTaxonomyNode(path),
    getTaxonomyPath(path),
    getPostIdsForTaxonomySlug(path),
  ])
  if (!node) notFound()

  const taxonomyMappings = await db.postTaxonomy.findMany({
    where: { role: "primary", postId: { in: [...postIds] } },
    orderBy: [{ node: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { postId: true },
  })
  const taxonomyOrderByPostId = new Map(taxonomyMappings.map((mapping, index) => [mapping.postId, index]))

  const postRecords = await db.post.findMany({
    where: { status: "published", id: { in: [...postIds] } },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    select: postSelect,
  })
  const decoratedPosts = await decorateArchivePosts(postRecords)
  const seriesByPost = await getArchiveSeriesMetadataForPosts(decoratedPosts.map((post) => post.id))
  const posts = decoratedPosts
    .map((post) => ({ ...post, ...seriesByPost.get(post.id) }))
    .sort((a, b) => {
      const seriesOrderA = a.seriesPosition ?? Number.MAX_SAFE_INTEGER
      const seriesOrderB = b.seriesPosition ?? Number.MAX_SAFE_INTEGER
      const taxonomyOrderA = taxonomyOrderByPostId.get(a.id) ?? Number.MAX_SAFE_INTEGER
      const taxonomyOrderB = taxonomyOrderByPostId.get(b.id) ?? Number.MAX_SAFE_INTEGER
      return seriesOrderA - seriesOrderB || taxonomyOrderA - taxonomyOrderB || b.publishedAt.getTime() - a.publishedAt.getTime() || b.id.localeCompare(a.id)
    })
  const readingGuide = getCollectionReadingGuide(path, posts)
  const projectJsonLd = collectionPageJsonLd({
    name: `${node.name} 글 모음`,
    description: node.description || `${node.name}에 속한 글 모음.`,
    path: `/writing/projects/${path}`,
    breadcrumbs: [
      { name: "Writing", href: "/writing" },
      { name: "글 모음", href: "/writing/projects" },
      ...breadcrumbs.map((item) => ({ name: item.name, href: item.href })),
    ],
    items: posts.slice(0, 40).map((post) => ({
      name: post.title,
      href: `/writing/${post.slug}`,
      description: post.excerpt,
      image: post.featuredImage,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      type: "BlogPosting",
    })),
  })

  return (
    <main className="min-h-screen bg-background paper-grain">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(projectJsonLd) }}
      />
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/writing/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            글 서랍
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/writing" className="text-muted-foreground transition-colors hover:text-foreground">
              먼저 볼 글
            </Link>
            <Link href="/work" className="text-clay hover:underline">
              작업
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <span key={item.slug} className="inline-flex items-center gap-2">
              {index > 0 ? <span className="text-border">/</span> : null}
              <Link href={item.href} className="hover:text-foreground hover:underline">{item.name}</Link>
            </span>
          ))}
        </div>
        <h1 className="mt-5 font-serif-display text-5xl leading-tight md:text-7xl">{node.name}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">{node.description}</p>
        <p className="mt-4 text-sm text-muted-foreground">{posts.length}편의 글</p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <CollectionReadingGuidePanel guide={readingGuide} />
        <WritingArchiveList posts={posts} timelineGroups={[...timelineGroupsFor(posts)]} view="board" />
      </section>
    </main>
  )
}
