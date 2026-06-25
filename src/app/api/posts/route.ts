import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    const posts = await db.post.findMany({
      where: {
        published: true,
        ...(category && category !== "all" ? { category } : {}),
      },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        tags: true,
        coverColor: true,
        readingTime: true,
        publishedAt: true,
      },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Failed to fetch posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}
