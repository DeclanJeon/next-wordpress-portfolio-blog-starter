import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { PortfolioShowcase } from "@/components/site/portfolio-showcase"
import { Reveal } from "@/components/site/reveal"

const heroWorkMap = [
  { label: "연결", projects: "PonsLink / PonsWarp" },
  { label: "문서", projects: "DocuFlow / PDF마스터" },
  { label: "해석", projects: "Ruminate / 명경" },
  { label: "도구", projects: "Local tools / Agent workflow" },
] as const

export function HomeBlogView() {
  return (
    <motion.div
      key="blog"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-16 md:grid-cols-[minmax(0,1fr)_22rem] md:px-8 md:pb-16 md:pt-24 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div>
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
              연락이 끊기는 순간, 문서 작업이 반복되는 순간, AI가 너무 쉽게 단정하는 순간을 작은 서비스로 다시 설계합니다. PonsLink, 문서 자동화, 도메인 AI, 로컬 도구를 만들고 운영하며 남긴 선택과 실패를 기록합니다.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#work" className="rounded-full bg-foreground px-5 py-2.5 text-sm text-background transition-transform hover:-translate-y-0.5">
                만든 서비스 보기
              </a>
              <Link href="/writing" className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
                작업 기록 읽기
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <figure className="relative mx-auto w-full max-w-[20rem] overflow-hidden rounded-[2rem] border border-border bg-card p-3 shadow-sm md:max-w-none">
            <div className="absolute inset-6 rounded-full bg-clay/10 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.5rem] bg-background">
              <Image
                src="/brand/profileforge-header.webp"
                alt="PonsLink와 운영형 도구를 만드는 개발자 프로필 일러스트"
                width={256}
                height={256}
                className="aspect-square w-full object-cover"
                priority
              />
            </div>
            <div className="relative mt-4 rounded-[1.25rem] border border-border/70 bg-background/75 p-4">
              <p className="label-tracked-sm text-muted-foreground">작업 지도</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                {heroWorkMap.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/70 bg-card/80 p-3">
                    <p className="text-xs font-medium text-clay">{item.label}</p>
                    <p className="mt-1 text-sm leading-snug text-foreground">{item.projects}</p>
                  </div>
                ))}
              </div>
            </div>
          </figure>
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
