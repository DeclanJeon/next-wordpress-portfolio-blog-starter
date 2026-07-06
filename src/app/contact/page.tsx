import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "Declan Jeon에게 작업 문의를 보내거나 공개 작업 증거를 확인하는 연락 페이지.",
  path: "/contact",
})

const contactLinks = [
  {
    label: "Email",
    value: "syas0301@gmail.com",
    href: "mailto:syas0301@gmail.com",
    description: "제품 설계, 브라우저 기반 서비스, 기술 글 문의는 이메일이 가장 빠르다.",
  },
  {
    label: "GitHub",
    value: "github.com/DeclanJeon",
    href: "https://github.com/DeclanJeon",
    description: "PonsWarp, 제작 도구, agent workflow repo proof를 확인할 수 있다.",
  },
  {
    label: "Writing",
    value: "Selected writing",
    href: "/writing",
    description: "PonsLink와 PonsWarp의 제품 판단, 실패, 구조 변경 기록을 먼저 볼 수 있다.",
  },
] as const

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background paper-grain">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Portfolio Blog
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/work" className="text-muted-foreground transition-colors hover:text-foreground">
              Work
            </Link>
            <Link href="/writing" className="text-clay hover:underline">
              Writing
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <span className="label-tracked text-muted-foreground">C o n t a c t</span>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div>
            <h1 className="max-w-4xl font-serif-display text-5xl leading-[0.98] tracking-tight md:text-7xl">
              작업 맥락을 먼저 보내 주세요.
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              WebRTC, 브라우저 파일 전송, 문서 자동화, 제품 운영 기록처럼 사용자의 막힌 흐름을 실제 서비스 구조로 바꾸는 일을 다룬다. 공개 resume 파일은 아직 확인된 것이 없어 노출하지 않는다.
            </p>
          </div>
          <aside className="rounded-3xl border border-border bg-background/75 p-5 shadow-sm">
            <p className="label-tracked-sm text-muted-foreground">Preferred route</p>
            <a href="mailto:syas0301@gmail.com" className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-foreground px-4 py-3 text-sm text-background transition-transform hover:-translate-y-0.5">
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Declan
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
          <p className="label-tracked-sm text-clay">Before contact</p>
          <h2 className="mt-3 font-serif-display text-3xl leading-tight">가장 도움이 되는 문의 정보.</h2>
          <ul className="mt-5 grid gap-3 text-sm leading-relaxed text-muted-foreground md:grid-cols-3">
            <li>• 만들거나 고치려는 사용자 흐름</li>
            <li>• 현재 막힌 기술/운영 경계</li>
            <li>• 이미 있는 코드, URL, 문서 증거</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
