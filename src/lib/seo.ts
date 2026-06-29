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

export const SITE_URL = env("NEXT_PUBLIC_SITE_URL", "https://example.com")
export const SITE_NAME = env("NEXT_PUBLIC_SITE_NAME", "Field Notes")
export const SITE_TITLE = env("NEXT_PUBLIC_SITE_TITLE", `${SITE_NAME} — Portfolio Blog`)
export const SITE_DESCRIPTION = env(
  "NEXT_PUBLIC_SITE_DESCRIPTION",
  "제품 회고, 구현 노트, 운영 문서를 함께 담는 Next.js + WordPress 포트폴리오 블로그.",
)
export const SITE_LOCALE = env("NEXT_PUBLIC_SITE_LOCALE", "ko_KR")
export const SITE_AUTHOR = env("NEXT_PUBLIC_SITE_AUTHOR", "Site Owner")
export const ORGANIZATION_NAME = env("NEXT_PUBLIC_ORGANIZATION_NAME", SITE_NAME)
export const SITE_SAME_AS = envList("NEXT_PUBLIC_SITE_SAME_AS", [])
export const SITE_TOPICS = envList("NEXT_PUBLIC_SITE_TOPICS", [
  "Product retrospective",
  "Portfolio",
  "Technical writing",
  "Operations notes",
])
export const DEFAULT_OG_IMAGE = env("NEXT_PUBLIC_OG_IMAGE", "/brand/pons-field-notes-og.png")
export const DEFAULT_TWITTER_IMAGE = env("NEXT_PUBLIC_TWITTER_IMAGE", "/brand/pons-field-notes-twitter.png")
export const SQUARE_IMAGE = env("NEXT_PUBLIC_SQUARE_IMAGE", "/brand/pons-field-notes-square.png")

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
      alternateName: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl(SQUARE_IMAGE),
      sameAs: SITE_SAME_AS,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "ko-KR",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
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
      publisher: { "@id": `${SITE_URL}/#organization` },
      about: SITE_TOPICS,
    },
  ],
} as const
