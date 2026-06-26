import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const posts = await db.post.findMany({
      where: { status: "published" },
      select: { category: true, tags: true },
    })

    const categorySet = new Map<string, number>()
    const tagSet = new Map<string, number>()

    for (const p of posts) {
      if (p.category) {
        categorySet.set(p.category, (categorySet.get(p.category) || 0) + 1)
      }
      for (const t of p.tags.split(",").map((x) => x.trim()).filter(Boolean)) {
        tagSet.set(t, (tagSet.get(t) || 0) + 1)
      }
    }

    const categories = [...categorySet.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    const tags = [...tagSet.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ categories, tags })
  } catch (error) {
    console.error("Failed to fetch taxonomies:", error)
    return NextResponse.json(
      { error: "Failed to fetch taxonomies" },
      { status: 500 }
    )
  }
}
