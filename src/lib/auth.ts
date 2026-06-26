import { cookies } from "next/headers"
import { db } from "@/lib/db"
import type { User } from "@/lib/types"

export const SESSION_COOKIE = "pl_session"

function encode(userId: string, username: string) {
  return Buffer.from(`${userId}:${username}`).toString("base64")
}

function decode(token: string): { userId: string; username: string } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const [userId, username] = decoded.split(":")
    if (!userId || !username) return null
    return { userId, username }
  } catch {
    return null
  }
}

export function mockVerify(password: string, hash: string): boolean {
  // Mirror of seed.ts mockHash
  const expected = "pl$" + Buffer.from(password).reverse().toString("base64")
  return expected === hash
}

export async function setSession(userId: string, username: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, encode(userId, username), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const decoded = decode(token)
  if (!decoded) return null
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      bio: true,
    },
  })
  return user
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

export function calcReadingTime(content: string): number {
  const words = content
    .replace(/[#>*_`~\-\[\]\(\)!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
