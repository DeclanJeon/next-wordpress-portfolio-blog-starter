import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { PortfolioShowcase } from "@/components/site/portfolio-showcase"
import { Reveal } from "@/components/site/reveal"

const heroWorkMap = [
  { label: "PonsLink", projects: "연결을 세션으로 바꾸는 요청 흐름" },
  { label: "PonsWarp", projects: "서버 저장 없이 직접 전송하는 파일 흐름" },
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
              P&nbsp;o&nbsp;r&nbsp;t&nbsp;f&nbsp;o&nbsp;l&nbsp;i&nbsp;o&nbsp;&nbsp;B&nbsp;l&nbsp;o&nbsp;g
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 font-serif-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
              마찰을 흐름으로{" "}
              <br />
              <span className="italic text-clay">바꾸는 개발자.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              PonsLink는 만남 뒤 요청을 세션으로 잇고, PonsWarp는 큰 파일을 서버 보관 없이 직접 전송하게 만든다. 이 블로그는 기능 소개보다 문제, 선택, 실패 복구, 운영 증거를 먼저 보여준다.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#work" className="rounded-full bg-foreground px-5 py-2.5 text-sm text-background transition-transform hover:-translate-y-0.5">
                대표 작업 보기
              </a>
              <Link href="/writing" className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
                설계 기록 읽기
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <a href="https://github.com/DeclanJeon" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                GitHub
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a href="mailto:syas0301@gmail.com" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                Contact
                <Mail className="h-3.5 w-3.5" />
              </a>
              <a href="https://ponslink.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                PonsLink live
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <figure className="relative mx-auto w-full max-w-[20rem] overflow-hidden rounded-[2rem] border border-border bg-card p-3 shadow-sm md:max-w-none">
            <div className="absolute inset-6 rounded-full bg-clay/10 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.5rem] bg-background">
              <Image
                src="/brand/profileforge-header.webp"
                alt="PonsLink와 PonsWarp를 중심으로 작업을 정리하는 개발자 프로필 일러스트"
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
              `/writing`은 PonsLink와 PonsWarp 중심의 핵심 기록으로 좁히고, 나머지 글은 `/writing/projects`에서 프로젝트별로 탐색한다.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:self-end">
            <Link
              href="/writing"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm text-background transition-transform hover:-translate-y-0.5"
            >
              핵심 글 보러가기
            </Link>
            <Link
              href="/writing/projects"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              프로젝트별 글 보기
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
