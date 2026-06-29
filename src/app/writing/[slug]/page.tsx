import type { Metadata } from "next"
import type { Post as PrismaPost } from "@prisma/client"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import {
  DEFAULT_OG_IMAGE,
  SITE_AUTHOR,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  jsonLd,
  publicImageUrl,
} from "@/lib/seo"
import type { Post } from "@/lib/types"
import { PostArticle } from "@/components/site/post-article"
import { getArticleNavigation } from "@/lib/article-navigation-data"
import { ThemeToggle } from "@/components/theme-toggle"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ slug: string }>
}

function splitPostTags(tags: string): readonly string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function toPostViewModel(post: PrismaPost): Post {
  return {
    ...post,
    publishedAt: post.publishedAt.toISOString(),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

async function getPublishedPostPage(slug: string) {
  const post = await db.post.findUnique({ where: { slug } })

  if (!post || post.status !== "published") return null

  const navigation = await getArticleNavigation(post)

  const viewedPost = await db.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } })

  return {
    post: toPostViewModel(viewedPost),
    navigation,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await db.post.findUnique({ where: { slug } })

  if (!post || post.status !== "published") {
    return {
      title: "글을 찾을 수 없습니다",
      alternates: { canonical: `${SITE_URL}/writing` },
    }
  }

  const imageUrl = publicImageUrl(post.featuredImage) ?? absoluteUrl(DEFAULT_OG_IMAGE)
  const url = `${SITE_URL}/writing/${post.slug}`
  const tags = splitPostTags(post.tags)

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    authors: [{ name: post.authorName || SITE_AUTHOR }],
    keywords: [post.category, ...tags].filter(Boolean),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName || SITE_AUTHOR],
      section: post.category,
      tags: [...tags],
      images: [
        {
          url: imageUrl,
          width: imageUrl.endsWith(DEFAULT_OG_IMAGE) ? 1200 : undefined,
          height: imageUrl.endsWith(DEFAULT_OG_IMAGE) ? 630 : undefined,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [imageUrl],
    },
  }
}

export default async function WritingPostPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getPublishedPostPage(slug)

  if (!page) notFound()

  const articleUrl = `${SITE_URL}/writing/${page.post.slug}`
  const articleImage = publicImageUrl(page.post.featuredImage) ?? absoluteUrl(DEFAULT_OG_IMAGE)
  const articleTags = splitPostTags(page.post.tags)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${articleUrl}#article`,
        mainEntityOfPage: articleUrl,
        headline: page.post.title,
        description: page.post.excerpt,
        image: [articleImage],
        datePublished: page.post.publishedAt,
        dateModified: page.post.updatedAt,
        inLanguage: "ko-KR",
        articleSection: page.post.category,
        keywords: articleTags,
        author: {
          "@type": "Person",
          name: page.post.authorName || SITE_AUTHOR,
        },
        publisher: {
          "@type": "Organization",
          name: "PonsLink",
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/icon-512.png"),
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Writing",
            item: `${SITE_URL}/writing`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: page.post.title,
            item: articleUrl,
          },
        ],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background paper-grain">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }}
      />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/#writing-archive" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Writing archive
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/work" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
              Work
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <PostArticle post={page.post} navigation={page.navigation} />
    </main>
  )
}
