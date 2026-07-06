import { afterAll, describe, expect, it } from "bun:test"
import { db } from "./db"
import { getRetrospectives } from "./retrospectives"

const FIRST_BATCH_BY_PROJECT = {
  ponslink: [
    "2026-06-16-ponslink-00-link-only-room",
    "2026-06-16-ponslink-01-why-i-came-back-to-connection",
    "2026-06-16-ponslink-01b-room-before-product",
  ],
  ponswarp: [
    "2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink",
    "2026-06-29-main-ponswarp-01-server-does-not-own-file",
    "2026-06-29-ponswarp-01-browser-direct-transfer",
  ],
  "document-automation-suite": [
    "2026-06-29-main-docuflow-03-local-security-boundary",
    "2026-06-29-main-docuflow-02-korean-document-context",
    "2026-06-29-main-docuflow-01-tools-to-flow",
  ],
  "ruminate-fatemirror": [
    "2026-07-06-navid-fatemirror-failed-prototype",
    "2026-06-29-main-fatemirror-01-mirror-not-fortune",
    "2026-06-29-main-ruminate-02-classic-text-as-question",
  ],
} as const

afterAll(async () => {
  await db.$disconnect()
})

describe("getRetrospectives", () => {
  for (const [project, expectedSlugs] of Object.entries(FIRST_BATCH_BY_PROJECT)) {
    it(`keeps the first main-service batch grouped under ${project}`, async () => {
      const response = await getRetrospectives({
        project: project as keyof typeof FIRST_BATCH_BY_PROJECT,
        limit: 3,
      })

      expect(response.items.map((item) => item.slug)).toEqual([...expectedSlugs])
      expect(response.items.every((item) => item.featuredImage.length > 0)).toBe(true)
      expect(response.items.every((item) => item.readingTime >= 1)).toBe(true)
    })
  }

  it("uses the narrative Start here series for PonsLink", async () => {
    const response = await getRetrospectives({
      project: "ponslink",
      limit: 3,
    })

    expect(response.series?.href).toBe("/writing/series/ponslink-origin-story")
    expect(response.series?.label).toBe("Start here")
    expect(response.items.map((item) => item.slug)).toEqual([...FIRST_BATCH_BY_PROJECT.ponslink])
  })

  it("does not leak PonsWarp posts into PonsLink product retrospectives", async () => {
    const response = await getRetrospectives({
      project: "ponslink",
      limit: 24,
    })

    expect(response.items.length).toBeGreaterThan(0)
    expect(response.items.every((item) => item.title.startsWith("[PonsLink]"))).toBe(true)
    expect(response.items.some((item) => item.slug.includes("ponswarp"))).toBe(false)
  })
})
