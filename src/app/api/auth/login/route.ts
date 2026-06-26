import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { mockVerify, setSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { username: String(username).toLowerCase() },
    })

    if (!user || !mockVerify(String(password), user.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      )
    }

    await setSession(user.id, user.username)

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        bio: user.bio,
      },
    })
  } catch (error) {
    console.error("Login failed:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
