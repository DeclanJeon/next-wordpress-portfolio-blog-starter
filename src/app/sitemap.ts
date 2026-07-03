import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { getWritingProjectHubs } from "@/lib/blog-taxonomy"
import { SITE_URL } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
  })

  const projectHubs = await getWritingProjectHubs()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/writing`,
      lastModified: new Date(),
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
      lastModified: new Date(),
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

  return [...staticRoutes, ...projectRoutes, ...postRoutes]
}
