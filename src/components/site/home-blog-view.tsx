import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { PortfolioShowcase } from "@/components/site/portfolio-showcase"
import { Reveal } from "@/components/site/reveal"

const heroWorkMap = [
  { label: "PonsLink", projects: "만남 뒤 어색하게 끊기는 연락을 다시 붙잡는 쪽" },
  { label: "PonsWarp", projects: "파일을 서버에 맡기지 않고 보내보려는 쪽" },
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
              W&nbsp;o&nbsp;r&nbsp;k&nbsp;&nbsp;n&nbsp;o&nbsp;t&nbsp;e&nbsp;s
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 font-serif-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
              작은 불편을 오래{" "}
              <br />
              <span className="italic text-clay">만져보는 사람.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              뭔가 불편하면 일단 작은 화면으로 옮겨 본다. 사람을 다시 만나게 하는 흐름, 큰 파일을 덜 찝찝하게 보내는 흐름, 문서 일을 조금 덜 귀찮게 만드는 흐름을 만들고 고쳤다.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#work" className="rounded-full bg-foreground px-5 py-2.5 text-sm text-background transition-transform hover:-translate-y-0.5">
                작업들 보기
              </a>
              <Link href="/writing" className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
                글로 남긴 시행착오
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <a href="https://github.com/DeclanJeon" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                GitHub
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a href="https://ponslink.com/public-desk/declan" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                연락
                <Mail className="h-3.5 w-3.5" />
              </a>
              <a href="https://ponslink.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                PonsLink
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
              <p className="label-tracked-sm text-muted-foreground">요즘 만지는 것</p>
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
              글은 전시장이 아니라 작업대에 가깝다.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              처음 온 사람에게 필요한 글만 앞에 두고, 나머지는 주제별 서랍으로 넘겼다. 다 읽으라는 뜻이 아니라 필요한 흔적을 찾기 쉽게 해둔 것이다.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:self-end">
            <Link
              href="/writing"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm text-background transition-transform hover:-translate-y-0.5"
            >
              먼저 볼 글
            </Link>
            <Link
              href="/writing/projects"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              글 서랍 열기
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
