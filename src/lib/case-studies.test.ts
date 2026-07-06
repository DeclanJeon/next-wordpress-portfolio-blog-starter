import { afterAll, describe, expect, it } from "bun:test"
import { Database } from "bun:sqlite"
import { getPortfolioCaseStudy, portfolioCaseStudies } from "@/lib/case-studies"
import { portfolioProjects } from "@/lib/portfolio"

const metricsBoundaryPattern = /(metric|사용자 수|전환율|성공률|평균 파일 크기|측정값).*(주장하지 않는다|쓰지 않는다|없으므로|분리해서 표기한다)/i

const customDb = new Database("db/custom.db", { readonly: true })

afterAll(() => {
  customDb.close()
})

describe("getPortfolioCaseStudy", () => {
  it("resolves the two published case studies and rejects unknown slugs", () => {
    expect(getPortfolioCaseStudy("ponslink")?.title).toBe("PonsLink case study")
    expect(getPortfolioCaseStudy("ponswarp")?.title).toBe("PonsWarp case study")
    expect(getPortfolioCaseStudy("missing-project")).toBeNull()
  })
})

describe("portfolio case-study evidence", () => {
  it("keeps every case study tied to live proof and an explicit no-fake-metrics boundary", () => {
    for (const study of portfolioCaseStudies) {
      const liveLink = study.links.find((link) => link.kind === "live")

      expect(liveLink?.href.startsWith("https://")).toBe(true)
      expect(study.verifiableEvidence.some((item) => item.includes("운영 URL") && item.includes("https://"))).toBe(true)
      expect(study.knownLimits.some((limit) => metricsBoundaryPattern.test(limit))).toBe(true)
    }
  })
})

describe("portfolio project case-study links", () => {
  it("exposes stable work routes for the two primary product case studies", () => {
    const primaryCaseStudyPaths = Object.fromEntries(
      portfolioProjects
        .filter((project) => project.slug === "ponslink" || project.slug === "ponswarp")
        .map((project) => [project.slug, project.caseStudyPath]),
    )

    expect(primaryCaseStudyPaths).toEqual({
      ponslink: "/work/ponslink",
      ponswarp: "/work/ponswarp",
    })
  })
})

describe("long published post readability", () => {
  it("keeps 5,000+ character published posts broken into at least four H2 sections", () => {
    const longPublishedPosts = customDb
      .query<{ slug: string; title: string; content: string }, [number]>("SELECT slug, title, content FROM Post WHERE status = 'published' AND length(content) >= ?")
      .all(5000)

    const underStructuredPosts = longPublishedPosts
      .map((post) => ({
        slug: post.slug,
        title: post.title,
        h2Count: post.content.match(/^## /gm)?.length ?? 0,
      }))
      .filter((post) => post.h2Count < 4)

    expect(longPublishedPosts.length).toBeGreaterThan(0)
    expect(underStructuredPosts).toEqual([])
  })
})
