import type { Metadata } from "next"

function env(name: string, fallback: string): string {
  const value = process.env[name]
  return value && value.trim().length > 0 ? value : fallback
}

function envList(name: string, fallback: readonly string[]): readonly string[] {
  const value = process.env[name]
  if (!value) return fallback
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
  return entries.length > 0 ? entries : fallback
}

export const SITE_URL = env("NEXT_PUBLIC_SITE_URL", "https://blog.ponslink.com")
export const SITE_NAME = env("NEXT_PUBLIC_SITE_NAME", "Field Notes")
export const SITE_TITLE = env("NEXT_PUBLIC_SITE_TITLE", `${SITE_NAME} — Portfolio Blog`)
export const SITE_DESCRIPTION = env(
  "NEXT_PUBLIC_SITE_DESCRIPTION",
  "PonsLink와 PonsWarp를 중심으로 연결, WebRTC, 브라우저 직접 파일 전송, 제품 운영 회고를 정리하는 한국어 기술 블로그.",
)
export const SITE_LOCALE = env("NEXT_PUBLIC_SITE_LOCALE", "ko_KR")
export const SITE_AUTHOR = env("NEXT_PUBLIC_SITE_AUTHOR", "Declan Jeon")
export const ORGANIZATION_NAME = env("NEXT_PUBLIC_ORGANIZATION_NAME", "Pons Lab")
export const SITE_SAME_AS = envList("NEXT_PUBLIC_SITE_SAME_AS", [])
export const SITE_TOPICS = envList("NEXT_PUBLIC_SITE_TOPICS", [
  "PonsLink",
  "PonsWarp",
  "WebRTC",
  "P2P file transfer",
  "Browser direct transfer",
  "Product retrospectives",
  "Technical writing",
])
export const DEFAULT_OG_IMAGE = env("NEXT_PUBLIC_OG_IMAGE", "/brand/profileforge-og.webp")
export const DEFAULT_TWITTER_IMAGE = env("NEXT_PUBLIC_TWITTER_IMAGE", "/brand/profileforge-twitter.webp")
export const SQUARE_IMAGE = env("NEXT_PUBLIC_SQUARE_IMAGE", "/brand/profileforge-square.png")
export const PROFILE_IMAGE = env("NEXT_PUBLIC_PROFILE_IMAGE", "/brand/profileforge-header.webp")

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function publicImageUrl(src: string): string | undefined {
  if (!src) return undefined
  if (src.startsWith("/")) return absoluteUrl(src)

  try {
    const url = new URL(src)
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return absoluteUrl(`${url.pathname}${url.search}`)
    }

    return src
  } catch {
    return undefined
  }
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
}: {
  readonly title: string
  readonly description: string
  readonly path: string
  readonly image?: string
}): Metadata {
  const url = absoluteUrl(path)
  const imageUrl = absoluteUrl(image)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} 대표 이미지`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: ORGANIZATION_NAME,
      url: SITE_URL,
      logo: absoluteUrl(SQUARE_IMAGE),
      sameAs: SITE_SAME_AS,
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: SITE_AUTHOR,
      alternateName: ORGANIZATION_NAME,
      url: SITE_URL,
      image: absoluteUrl(PROFILE_IMAGE),
      sameAs: SITE_SAME_AS,
      jobTitle: "Product-minded software developer",
      description: SITE_DESCRIPTION,
      knowsAbout: SITE_TOPICS,
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "ko-KR",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#person` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/writing?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Blog",
      "@id": `${SITE_URL}/writing#blog`,
      name: SITE_NAME,
      url: `${SITE_URL}/writing`,
      inLanguage: "ko-KR",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#person` },
      about: SITE_TOPICS,
    },
  ],
} as const
