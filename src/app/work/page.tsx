import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PortfolioShowcase } from "@/components/site/portfolio-showcase"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "운영 중인 제품과 시스템",
  description: "PonsLink, 문서 자동화, 도메인 AI, 로컬 도구처럼 직접 설계하고 운영한 제품 시스템을 정리한 아카이브.",
  path: "/work",
})

export default function WorkPage() {
  return (
    <main className="min-h-screen bg-background paper-grain">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Portfolio Blog
          </Link>
          <Link href="/writing" className="text-sm text-clay hover:underline">
            Writing notes
          </Link>
        </nav>
      </header>
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16 md:px-8 md:pb-16 md:pt-24">
        <span className="label-tracked text-muted-foreground">S&nbsp;e&nbsp;l&nbsp;e&nbsp;c&nbsp;t&nbsp;e&nbsp;d&nbsp;&nbsp;w&nbsp;o&nbsp;r&nbsp;k</span>
        <h1 className="mt-6 max-w-4xl font-serif-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
          Systems I designed,{" "}
          <br />
          <span className="italic text-clay">built, and keep operating.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          먼저 PonsLink와 PonsWarp의 live URL, GitHub proof, screenshot, 회고 글을 확인하고 나머지 작업은 보조 archive로 본다.
        </p>
      </section>
      <PortfolioShowcase mode="work" />
    </main>
  )
}
