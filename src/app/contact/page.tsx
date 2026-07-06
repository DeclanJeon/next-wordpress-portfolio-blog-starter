import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "연락",
  description: "Declan Jeon에게 작업 맥락을 보내거나 공개 작업 기록을 확인하는 연락 페이지.",
  path: "/contact",
})

const contactLinks = [
  {
    label: "Contact",
    value: "ponslink.com/public-desk/declan",
    href: "https://ponslink.com/public-desk/declan",
    description: "작업 맥락은 공개 데스크로 보내는 편이 가장 빠르다.",
  },
  {
    label: "GitHub",
    value: "github.com/DeclanJeon",
    href: "https://github.com/DeclanJeon",
    description: "PonsWarp, 작은 제작 도구, 에이전트 작업 repo를 열어볼 수 있다.",
  },
  {
    label: "Writing",
    value: "먼저 볼 글",
    href: "/writing",
    description: "PonsLink와 PonsWarp를 만들며 남긴 판단, 실패, 구조 변경 기록을 볼 수 있다.",
  },
] as const

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background paper-grain">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            작업노트
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/work" className="text-muted-foreground transition-colors hover:text-foreground">
              작업
            </Link>
            <Link href="/writing" className="text-clay hover:underline">
              글
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <span className="label-tracked text-muted-foreground">C o n t a c t</span>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div>
            <h1 className="max-w-4xl font-serif-display text-5xl leading-[0.98] tracking-tight md:text-7xl">
              이런 얘기라면 바로 보내도 좋다.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              WebRTC, 브라우저 파일 전송, 문서 자동화처럼 사용자가 멈추는 지점을 작게 쪼개는 일을 좋아한다. 공개 resume 파일은 아직 확인된 것이 없어 억지로 만들지 않았다.
            </p>
          </div>
          <aside className="rounded-3xl border border-border bg-background/75 p-5 shadow-sm">
            <p className="label-tracked-sm text-muted-foreground">가장 빠른 길</p>
            <a href="https://ponslink.com/public-desk/declan" target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-foreground px-4 py-3 text-sm text-background transition-transform hover:-translate-y-0.5">
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                연락 보내기
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-3xl border border-border bg-border px-0 md:grid-cols-3">
        {contactLinks.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group bg-background p-6 transition-colors hover:bg-muted/30"
          >
            <span className="label-tracked-sm text-clay">{item.label}</span>
            <h2 className="mt-3 font-serif-display text-2xl leading-tight">{item.value}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm text-foreground">
              열기
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </a>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="rounded-3xl border border-border bg-muted/25 p-6 md:p-8">
          <p className="label-tracked-sm text-clay">보내주면 좋은 것</p>
          <h2 className="mt-3 font-serif-display text-3xl leading-tight">처음 메일에 다 없어도 괜찮다.</h2>
          <ul className="mt-5 grid gap-3 text-sm leading-relaxed text-muted-foreground md:grid-cols-3">
            <li>• 만들거나 고치려는 사용자 흐름</li>
            <li>• 지금 막힌 기술/운영 경계</li>
            <li>• 이미 있는 코드, URL, 문서 흔적</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
