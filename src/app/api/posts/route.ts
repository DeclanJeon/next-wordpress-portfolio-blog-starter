import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, slugify } from "@/lib/auth"
import { estimateReadingTime } from "@/lib/reading-time"
import type { PostStatus } from "@/lib/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const tag = searchParams.get("tag")
    const q = searchParams.get("q")
    const mine = searchParams.get("mine") === "1"

    const user = mine ? await getCurrentUser() : null
    if (mine && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const where = {
      ...(mine ? { authorId: user!.id } : { status: "published" as PostStatus }),
      ...(category && category !== "all" ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { excerpt: { contains: q } },
              { content: { contains: q } },
            ],
          }
        : {}),
    }

    let posts = await db.post.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    })

    // tag filter (stored as comma string)
    if (tag && tag !== "all") {
      posts = posts.filter((p) =>
        p.tags
          .split(",")
          .map((t) => t.trim())
          .includes(tag)
      )
    }

    // strip full content for list view
    const list = posts.map((p) => ({
      ...p,
      content: mine ? p.content : "",
    }))

    return NextResponse.json({ posts: list })
  } catch (error) {
    console.error("Failed to fetch posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const title = String(body.title || "").trim()
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const excerpt = String(body.excerpt || "").trim()
    const content = String(body.content || "")
    const category = String(body.category || "General").trim() || "General"
    const tags = String(body.tags || "").trim()
    const coverColor = String(body.coverColor || "#1c1917")
    const featuredImage = String(body.featuredImage || "")

    // build unique slug
    let slug = slugify(title)
    const existing = await db.post.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    }

    const post = await db.post.create({
      data: {
        slug,
        title,
        excerpt,
        content,
        category,
        tags,
        coverColor,
        featuredImage,
        status: "published", // publish immediately per spec
        readingTime: estimateReadingTime(content),
        authorId: user.id,
        authorName: user.displayName,
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("Create post failed:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
