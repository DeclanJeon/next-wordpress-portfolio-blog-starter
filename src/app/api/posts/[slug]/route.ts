import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, calcReadingTime } from "@/lib/auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const post = await db.post.findUnique({ where: { slug } })

    if (!post || post.status !== "published") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // increment views (fire and forget)
    db.post
      .update({ where: { id: post.id }, data: { views: post.views + 1 } })
      .catch(() => {})

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Failed to fetch post:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await db.post.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    if (existing.authorId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.title === "string" && body.title.trim()) {
      data.title = body.title.trim()
    }
    if (typeof body.excerpt === "string") data.excerpt = body.excerpt.trim()
    if (typeof body.content === "string") {
      data.content = body.content
      data.readingTime = calcReadingTime(body.content)
    }
    if (typeof body.category === "string") data.category = body.category
    if (typeof body.tags === "string") data.tags = body.tags
    if (typeof body.coverColor === "string") data.coverColor = body.coverColor
    if (typeof body.featuredImage === "string") data.featuredImage = body.featuredImage

    const post = await db.post.update({ where: { slug }, data })
    return NextResponse.json({ post })
  } catch (error) {
    console.error("Update post failed:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existing = await db.post.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    if (existing.authorId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Move to trash (soft delete)
    const post = await db.post.update({
      where: { slug },
      data: { status: "trash", updatedAt: new Date() },
    })
    return NextResponse.json({ post })
  } catch (error) {
    console.error("Delete post failed:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
