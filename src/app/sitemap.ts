import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { getWritingProjectHubs } from "@/lib/blog-taxonomy"
import { SITE_URL } from "@/lib/seo"


function latestDate(dates: readonly Date[]): Date {
  if (dates.length === 0) return new Date()
  return dates.reduce((latest, date) => (date > latest ? date : latest), dates[0])
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
  })

  const projectHubs = await getWritingProjectHubs()
  const latestPostDate = latestDate(posts.flatMap((post) => [post.updatedAt, post.publishedAt]))
  const series = await db.series.findMany({
    where: { posts: { some: { post: { status: "published" } } } },
    select: {
      slug: true,
      updatedAt: true,
      posts: {
        where: { post: { status: "published" } },
        select: { post: { select: { updatedAt: true, publishedAt: true } } },
      },
    },
  })


  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: latestPostDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/writing`,
      lastModified: latestPostDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/work`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/writing/projects`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/writing/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const projectRoutes: MetadataRoute.Sitemap = projectHubs.map((project) => ({
    url: `${SITE_URL}${project.href}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }))

  const seriesRoutes: MetadataRoute.Sitemap = series.map((entry) => ({
    url: `${SITE_URL}/writing/series/${entry.slug}`,
    lastModified: latestDate([
      entry.updatedAt,
      ...entry.posts.flatMap((item) => [item.post.updatedAt, item.post.publishedAt]),
    ]),
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }))

  return [...staticRoutes, ...projectRoutes, ...seriesRoutes, ...postRoutes]
}
