type Check = {
  readonly name: string
  readonly run: () => Promise<void>
}

const args = new Map<string, string>()
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index]
  if (arg?.startsWith("--")) {
    args.set(arg.slice(2), process.argv[index + 1] ?? "")
    index += 1
  }
}

const baseUrl = (args.get("base") || "https://blog.ponslink.com").replace(/\/$/, "")
const cacheBust = `seo-smoke=${Date.now()}`

function withCacheBust(path: string): string {
  const separator = path.includes("?") ? "&" : "?"
  return `${baseUrl}${path}${separator}${cacheBust}`
}

async function fetchText(path: string): Promise<string> {
  const response = await fetch(withCacheBust(path), {
    headers: {
      "user-agent": "Portfolio Blog SEO smoke check (+https://blog.ponslink.com)",
      accept: "text/html,application/xml,text/plain;q=0.9,*/*;q=0.8",
    },
  })
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`)
  }
  return response.text()
}

function assertIncludes(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`${label}: missing ${needle}`)
  }
}

function assertNotIncludes(haystack: string, needle: string, label: string): void {
  if (haystack.includes(needle)) {
    throw new Error(`${label}: unexpected ${needle}`)
  }
}

function titleOf(html: string): string {
  return html.match(/<title>(.*?)<\/title>/i)?.[1] ?? ""
}

const checks: Check[] = [
  {
    name: "home metadata presents Portfolio Blog brand",
    async run() {
      const html = await fetchText("/")
      const title = titleOf(html)
      assertIncludes(title, "Portfolio Blog", "home title brand")
      assertIncludes(title, "PonsLink / PonsWarp", "home title topics")
      assertIncludes(html, "개발 포트폴리오이자 기술 블로그", "home description brand")
      assertIncludes(html, "Portfolio Blog", "home visible brand")
      assertIncludes(html, "PonsWarp", "home body")
      assertIncludes(html, "WebRTC", "home body")
      assertIncludes(html, "href=\"/writing\"", "home writing link")
      assertIncludes(html, "href=\"/writing/projects\"", "home project link")
      assertIncludes(html, "href=\"/work\"", "home work link")
      assertNotIncludes(html, "Pons Field Notes", "home stale brand")
      assertNotIncludes(html, "Pons Lab", "home stale lab brand")
      assertNotIncludes(html, "Pons Notes", "home stale manifest brand")
      assertNotIncludes(html, "PonsLink는 WordPress, 자동화, SEO, AI 도구", "home stale Google snippet")
      assertNotIncludes(html, "아직 연결된 회고가 없다", "home retrospective fallback")
      assertNotIncludes(html, "전체 <!-- -->0<!-- -->편", "home PonsWarp retrospective count")
      assertNotIncludes(html, "https://lab.ponslink.com", "home stale canonical host")
    },
  },
  {
    name: "writing archive exposes structured index",
    async run() {
      const html = await fetchText("/writing")
      assertIncludes(titleOf(html), "Portfolio Blog", "writing title brand")
      assertIncludes(titleOf(html), "PonsLink / PonsWarp 글 아카이브", "writing title")
      assertIncludes(html, "application/ld+json", "writing JSON-LD")
      assertIncludes(html, "CollectionPage", "writing collection schema")
      assertIncludes(html, "BlogPosting", "writing list schema")
      assertIncludes(html, "/writing/2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink", "writing PonsWarp link")
      assertNotIncludes(html, "https://lab.ponslink.com", "writing stale canonical host")
    },
  },
  {
    name: "representative article has article schema",
    async run() {
      const html = await fetchText("/writing/2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink")
      assertIncludes(titleOf(html), "PonsWarp", "article title")
      assertIncludes(html, "BlogPosting", "article schema")
      assertIncludes(html, "wordCount", "article word count")
      assertIncludes(html, "timeRequired", "article reading time")
      assertIncludes(html, "rel=\"canonical\" href=\"https://blog.ponslink.com/writing/2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink\"", "article canonical")
      assertNotIncludes(html, "https://lab.ponslink.com", "article stale canonical host")
    },
  },
  {
    name: "project and series pages are crawlable",
    async run() {
      const projectHtml = await fetchText("/writing/projects")
      assertIncludes(projectHtml, "CollectionPage", "projects schema")
      assertIncludes(projectHtml, "/writing/projects/dev-retrospective/document-automation", "project detail link")
      assertIncludes(projectHtml, "/writing/projects/study-note/realtime-network", "study-note detail link")

      const seriesHtml = await fetchText("/writing/series/ponswarp-origin-story")
      assertIncludes(titleOf(seriesHtml), "PonsWarp Origin Story", "series title")
      assertIncludes(seriesHtml, "CollectionPage", "series schema")
      assertIncludes(seriesHtml, "/writing/2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink", "series first article")

      const realtimeSeriesHtml = await fetchText("/writing/series/realtime-network-deep-dive")
      assertIncludes(titleOf(realtimeSeriesHtml), "실시간 네트워크 딥다이브", "realtime series title")
      assertIncludes(realtimeSeriesHtml, "CollectionPage", "realtime series schema")
      assertIncludes(realtimeSeriesHtml, "/writing/2026-07-04-realtime-network-01-p2p-is-not-serverless", "realtime series first article")
      assertIncludes(realtimeSeriesHtml, "/writing/2026-07-04-realtime-network-22-bufferedamount-backpressure-file-transfer", "realtime series last article")

      assertNotIncludes(projectHtml, "https://lab.ponslink.com", "projects stale canonical host")
      assertNotIncludes(seriesHtml, "https://lab.ponslink.com", "series stale canonical host")
      assertNotIncludes(realtimeSeriesHtml, "https://lab.ponslink.com", "realtime series stale canonical host")
    },
  },
  {
    name: "sitemap includes core discovery routes",
    async run() {
      const xml = await fetchText("/sitemap.xml")
      assertIncludes(xml, "https://blog.ponslink.com/writing", "sitemap writing")
      assertIncludes(xml, "https://blog.ponslink.com/writing/projects", "sitemap projects")
      assertIncludes(xml, "https://blog.ponslink.com/writing/series/ponswarp-origin-story", "sitemap PonsWarp series")
      assertIncludes(xml, "https://blog.ponslink.com/writing/2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink", "sitemap PonsWarp article")
      assertIncludes(xml, "https://blog.ponslink.com/writing/series/realtime-network-deep-dive", "sitemap realtime series")
      assertIncludes(xml, "https://blog.ponslink.com/writing/2026-07-04-realtime-network-01-p2p-is-not-serverless", "sitemap realtime first article")
      assertIncludes(xml, "https://blog.ponslink.com/writing/2026-07-04-realtime-network-22-bufferedamount-backpressure-file-transfer", "sitemap realtime last article")
      assertNotIncludes(xml, "https://lab.ponslink.com", "sitemap stale canonical host")
    },
  },
]

let failures = 0
for (const check of checks) {
  try {
    await check.run()
    console.log(`PASS ${check.name}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL ${check.name}`)
    console.error(error instanceof Error ? error.message : String(error))
  }
}

if (failures > 0) {
  process.exit(1)
}

console.log(`SEO smoke checks passed for ${baseUrl}`)
