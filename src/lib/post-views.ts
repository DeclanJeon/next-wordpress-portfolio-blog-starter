import { db } from "@/lib/db"

export async function incrementPostViews(postId: string): Promise<number> {
  const rows = await db.$queryRaw<Array<{ views: number }>>`
    UPDATE "Post"
    SET "views" = "views" + 1
    WHERE "id" = ${postId}
    RETURNING "views"
  `

  const updatedViews = rows[0]?.views
  if (typeof updatedViews !== "number") {
    throw new Error(`Failed to increment views for post ${postId}`)
  }

  return updatedViews
}
