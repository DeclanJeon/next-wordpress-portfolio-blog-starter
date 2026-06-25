import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const projects = await db.project.findMany({
      where: {},
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        year: true,
        role: true,
        category: true,
        client: true,
        url: true,
        accent: true,
        featured: true,
        order: true,
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}
