import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getTaxonomyNode, taxonomyHref } from "@/lib/blog-taxonomy"
import { pageMetadata } from "@/lib/seo"

export const dynamic = "force-dynamic"

type PageProps = {
  readonly params: Promise<{ readonly slug: readonly string[] }>
}

function taxonomySlug(parts: readonly string[]): string {
  return parts.map((part) => decodeURIComponent(part)).join("/")
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const path = taxonomySlug(slug)
  const node = await getTaxonomyNode(path)
  if (!node) return pageMetadata({ title: "카테고리를 찾을 수 없습니다", description: "요청한 카테고리를 찾을 수 없습니다.", path: "/writing" })
  return pageMetadata({
    title: `${node.name} 글`,
    description: node.description || `${node.name}에 속한 개발 회고 글 모음.`,
    path: taxonomyHref(path),
  })
}

export default async function WritingCategoryRedirectPage({ params }: PageProps) {
  const { slug } = await params
  const path = taxonomySlug(slug)
  const node = await getTaxonomyNode(path)
  if (!node) notFound()

  redirect(taxonomyHref(path))
}
