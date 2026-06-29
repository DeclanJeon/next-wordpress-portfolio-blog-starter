import Link from "next/link"
import { motion } from "framer-motion"
import { PortfolioShowcase } from "@/components/site/portfolio-showcase"
import { Reveal } from "@/components/site/reveal"

export function HomeBlogView() {
  return (
    <motion.div
      key="blog"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16 md:px-8 md:pb-16 md:pt-24">
        <Reveal>
          <span className="label-tracked text-muted-foreground">
            P&nbsp;o&nbsp;n&nbsp;s&nbsp;&nbsp;L&nbsp;a&nbsp;b
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="mt-6 font-serif-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            마찰을 흐름으로
            <br />
            <span className="italic text-clay">바꾸는 개발자.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            연락이 끊기는 순간, 문서 작업이 막히는 순간, AI가 너무 쉽게 단정하는 순간을 그냥 넘기지 않습니다. PonsLink, 문서 자동화, 도메인 AI, 로컬 도구처럼 사람이 실제로 겪는 불편을 작은 서비스로 만들고 운영합니다.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#work" className="rounded-full bg-foreground px-5 py-2.5 text-sm text-background transition-transform hover:-translate-y-0.5">
              만든 서비스 보기
            </a>
            <a href="/writing" className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
              작업 기록 읽기
            </a>
          </div>
        </Reveal>
      </section>

      <PortfolioShowcase />

      <section id="writing-brief" className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-[1fr_auto] md:px-8 md:py-16">
          <div>
            <span className="label-tracked-sm text-muted-foreground">Writing archive</span>
            <h2 className="mt-4 max-w-3xl font-serif-display text-3xl leading-tight md:text-5xl">
              글 목록은 메인이 아니라 archive에서 탐색한다.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              홈은 포트폴리오와 방향성을 설명하고, 실제 블로그 글·카테고리·태그 탐색은 `/writing`에서 처리한다.
            </p>
          </div>
          <Link
            href="/writing"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm text-background transition-transform hover:-translate-y-0.5 md:self-end"
          >
            전체 글 보러가기
          </Link>
        </div>
      </section>
    </motion.div>
  )
}
