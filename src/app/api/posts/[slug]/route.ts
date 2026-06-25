import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const post = await db.post.findUnique({
      where: { slug, published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
        tags: true,
        coverColor: true,
        readingTime: true,
        publishedAt: true,
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Failed to fetch post:", error)
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    )
  }
}
