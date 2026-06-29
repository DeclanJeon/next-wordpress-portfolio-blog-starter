import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { retrospectiveQuerySchema } from "@/lib/retrospective-contract"
import { getRetrospectives } from "@/lib/retrospectives"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const

function parseQuery(request: Request) {
  const { searchParams } = new URL(request.url)
  return retrospectiveQuerySchema.parse({
    project: searchParams.get("project") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })
}

export async function GET(request: Request) {
  try {
    const query = parseQuery(request)
    const response = await getRetrospectives(query)

    return NextResponse.json(response, { headers: NO_STORE_HEADERS })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid retrospective query" },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    console.error("Failed to fetch retrospectives:", error)
    return NextResponse.json(
      { error: "Failed to fetch retrospectives" },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
