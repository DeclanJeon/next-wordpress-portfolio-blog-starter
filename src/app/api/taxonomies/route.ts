import { NextResponse } from "next/server"
import { getTaxonomyTree } from "@/lib/blog-taxonomy"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const

function splitTags(tags: string): readonly string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export async function GET() {
  try {
    const [posts, tree] = await Promise.all([
      db.post.findMany({
        where: { status: "published" },
        select: { category: true, tags: true },
      }),
      getTaxonomyTree(),
    ])

    const categorySet = new Map<string, number>()
    const tagSet = new Map<string, number>()

    for (const post of posts) {
      if (post.category) categorySet.set(post.category, (categorySet.get(post.category) ?? 0) + 1)
      for (const tag of splitTags(post.tags)) tagSet.set(tag, (tagSet.get(tag) ?? 0) + 1)
    }

    const categories = [...categorySet.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    const tags = [...tagSet.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    return NextResponse.json({ tree, categories, tags }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    if (error instanceof Error) console.error("Failed to fetch taxonomies:", error.message)
    return NextResponse.json(
      { error: "Failed to fetch taxonomies" },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
