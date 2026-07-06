import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PortfolioShowcase } from "@/components/site/portfolio-showcase"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "만들고 고친 작업들",
  description: "PonsLink, PonsWarp, 문서 자동화, 도메인 AI, 로컬 도구처럼 직접 만들고 고친 흐름을 정리한 작업 노트.",
  path: "/work",
})

export default function WorkPage() {
  return (
    <main className="min-h-screen bg-background paper-grain">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            작업노트
          </Link>
          <Link href="/writing" className="text-sm text-clay hover:underline">
            쓴 글 보기
          </Link>
        </nav>
      </header>
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16 md:px-8 md:pb-16 md:pt-24">
        <span className="label-tracked text-muted-foreground">S&nbsp;e&nbsp;l&nbsp;e&nbsp;c&nbsp;t&nbsp;e&nbsp;d&nbsp;&nbsp;w&nbsp;o&nbsp;r&nbsp;k</span>
        <h1 className="mt-6 max-w-4xl font-serif-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
          오래 붙잡은 문제들,{" "}
          <br />
          <span className="italic text-clay">아직 고치는 중인 화면들.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          PonsLink와 PonsWarp를 먼저 열어둔다. 둘이 이 페이지의 중심인 건 맞지만, 자랑 목록보다 “무엇이 계속 거슬려서 여기까지 왔는지”를 보이게 하려 한다.
        </p>
      </section>
      <PortfolioShowcase mode="work" />
    </main>
  )
}
