import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { getPortfolioCaseStudy, portfolioCaseStudies } from "@/lib/case-studies"
import { pageMetadata } from "@/lib/seo"

type PageProps = {
  readonly params: Promise<{ readonly slug: string }>
}

export function generateStaticParams() {
  return portfolioCaseStudies.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const study = getPortfolioCaseStudy(slug)
  if (!study) {
    return pageMetadata({
      title: "Case study not found",
      description: "요청한 작업 사례를 찾을 수 없습니다.",
      path: "/work",
    })
  }

  return pageMetadata({
    title: study.title,
    description: study.summary,
    path: `/work/${study.slug}`,
  })
}

function SectionGrid({
  title,
  items,
}: {
  readonly title: string
  readonly items: readonly { readonly title: string; readonly body: string }[]
}) {
  return (
    <section className="border-t border-border py-10">
      <p className="label-tracked-sm text-clay">{title}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-2xl border border-border bg-background/75 p-5">
            <h2 className="font-serif-display text-2xl leading-tight">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default async function WorkCaseStudyPage({ params }: PageProps) {
  const { slug } = await params
  const study = getPortfolioCaseStudy(slug)
  if (!study) notFound()

  return (
    <main className="min-h-screen bg-background paper-grain">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/work" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Work
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/writing" className="text-muted-foreground transition-colors hover:text-foreground">
              Writing
            </Link>
            <Link href="/contact" className="text-clay hover:underline">
              Contact
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <span className="label-tracked text-muted-foreground">{study.kicker}</span>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div>
            <h1 className="max-w-4xl font-serif-display text-5xl leading-[0.98] tracking-tight md:text-7xl">
              {study.title}
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {study.summary}
            </p>
          </div>
          <aside className="rounded-3xl border border-border bg-background/75 p-5 shadow-sm">
            <p className="label-tracked-sm text-muted-foreground">Inspect</p>
            <div className="mt-4 grid gap-3">
              {study.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group flex items-start justify-between gap-3 rounded-2xl border border-border px-4 py-3 text-sm transition-colors hover:border-foreground/30 hover:bg-muted/30"
                >
                  <span>
                    <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">{link.kind}</span>
                    <span className="mt-1 block text-foreground">{link.label}</span>
                  </span>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-clay transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-border bg-muted/25">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:grid-cols-[0.75fr_1.25fr] md:px-8">
          <div>
            <p className="label-tracked-sm text-clay">Problem</p>
            <h2 className="mt-3 font-serif-display text-3xl leading-tight md:text-4xl">어떤 마찰을 줄였나.</h2>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground">{study.projectProblem}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <section className="py-10">
          <p className="label-tracked-sm text-clay">Constraints</p>
          <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {study.constraints.map((item) => (
              <p key={item} className="bg-background p-5 text-sm leading-relaxed text-muted-foreground">{item}</p>
            ))}
          </div>
        </section>

        <SectionGrid title="Architecture" items={study.architecture} />
        <SectionGrid title="Product decisions" items={study.decisions} />
        <SectionGrid title="Rejected trade-offs" items={study.rejected} />
        <SectionGrid title="Debugging evidence" items={study.debuggingEvidence} />

        <section className="grid gap-6 border-t border-border py-10 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background/75 p-6">
            <p className="label-tracked-sm text-clay">Verifiable evidence</p>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {study.verifiableEvidence.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-border bg-background/75 p-6">
            <p className="label-tracked-sm text-clay">Known limits</p>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {study.knownLimits.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}
