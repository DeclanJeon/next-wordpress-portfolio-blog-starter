"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  Mail,
  ArrowDown,
  BookOpen,
  Headphones,
  Tv,
  Hammer,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LiveClock } from "@/components/site/live-clock"
import { Reveal } from "@/components/site/reveal"
import { PostReader } from "@/components/site/post-reader"
import { ProjectReader } from "@/components/site/project-reader"
import type { Post, Project } from "@/lib/types"

const TIME_ZONE = "Europe/Lisbon"

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d))
}

// ---- Static content ----

const NAV_LINKS = [
  { label: "Work", href: "#work" },
  { label: "Writing", href: "#writing" },
  { label: "Now", href: "#now" },
  { label: "Contact", href: "#contact" },
]

const EXPERIENCE = [
  {
    role: "Senior Design Lead",
    company: "Studio Atlas",
    period: "2021 — Present",
    note: "Brand systems & digital products for cultural and civic clients.",
  },
  {
    role: "Designer",
    company: "North Field",
    period: "2019 — 2021",
    note: "Editorial and identity work for independent publishers.",
  },
  {
    role: "Visual Designer",
    company: "frog",
    period: "2018 — 2019",
    note: "Product design across health, finance, and mobility.",
  },
  {
    role: "Design Intern",
    company: "SYPartners",
    period: "2017",
    note: "Organizational design and transformation strategy.",
  },
]

const NOW_ITEMS = [
  {
    icon: BookOpen,
    label: "Reading",
    title: "The Timeless Way of Building",
    sub: "Christopher Alexander",
  },
  {
    icon: Headphones,
    label: "Listening",
    title: "Lofi girl beats, on repeat",
    sub: "while I draw",
  },
  {
    icon: Tv,
    label: "Watching",
    title: "Slow Horses, Season 5",
    sub: "and re-watching The Drama",
  },
  {
    icon: Hammer,
    label: "Building",
    title: "A typeface revival",
    sub: "evenings & weekends",
  },
]

const QA = [
  {
    q: "What makes a good designer, in your opinion?",
    a: "A good designer understands the purpose, the meaning, and the people they are designing for. The work can be cool and all — but if the audience doesn't get it, the designer has failed at the job.",
  },
  {
    q: "What do you do when you are not designing?",
    a: "I keep a quiet, disciplined life. You'll find me sweating at the gym, learning a new recipe, walking by the river, watching films, or sketching in a museum. I'm a terrible but enthusiastic cook.",
  },
  {
    q: "There is skill, and there's talent. What is a natural talent you've always had?",
    a: "I'm tuned in to rhythm — in music, in layout, in the cadence of a paragraph. Some friends say I'm a decent singer. I'd probably be better if I'd had proper training, and I did once break my voice on stage in a school competition. It didn't stop the shower concerts.",
  },
  {
    q: "If you could close your eyes and transport yourself anywhere right now, where would you go?",
    a: "Golden Beach in Australia. I went once when I was twelve, and I still remember how blue the water was and how soft the sand felt. Then I'd hop over to Haleakalā in Maui to stand above the clouds.",
  },
  {
    q: "What keeps you up at night?",
    a: "Before, it was the metaverse — mercifully dead by now. These days it's AI. On one hand, a genuine tool for accelerating craft and research; in the wrong hands, driven only by profit, it could ruin a great deal. I try to do my part to keep things from getting worse. I hope you do too.",
  },
]

const CATEGORIES = ["All", "Essay", "Notes", "Process", "Reading"]

export default function Home() {
  const [posts, setPosts] = React.useState<Post[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activePost, setActivePost] = React.useState<Post | null>(null)
  const [activeProject, setActiveProject] = React.useState<Project | null>(null)
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [emailCopied, setEmailCopied] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/posts").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ])
      .then(([postsData, projectsData]) => {
        if (cancelled) return
        setPosts(postsData.posts ?? [])
        setProjects(projectsData.projects ?? [])
      })
      .catch((e) => console.error(e))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const filteredPosts = React.useMemo(() => {
    if (activeCategory === "All") return posts
    return posts.filter((p) => p.category === activeCategory)
  }, [posts, activeCategory])

  const featuredProjects = projects.filter((p) => p.featured)
  const otherProjects = projects.filter((p) => !p.featured)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("hello@wrenhalloway.studio")
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2000)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background paper-grain">
      {/* ---- Nav ---- */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <a
            href="#top"
            className="font-serif-display text-xl tracking-tight"
          >
            Wren Halloway
          </a>
          <div className="flex items-center gap-1">
            <div className="mr-2 hidden items-center gap-6 md:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="label-tracked-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main id="top" className="flex-1">
        {/* ---- Hero ---- */}
        <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
          <Reveal>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>Lisbon, PT</span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-clay" />
                <LiveClock timeZone={TIME_ZONE} />
              </span>
              <span className="text-border">·</span>
              <span>Available for select projects, 2026</span>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="mt-8 font-serif-display text-[18vw] leading-[0.9] tracking-tight md:text-[13vw] lg:text-[11rem]">
              Wren
              <br />
              <span className="italic text-clay">Halloway</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-10 max-w-2xl text-xl leading-relaxed text-muted-foreground md:text-2xl">
              Designer and writer working on branding, digital products, and
              quiet interfaces — work that{" "}
              <span className="text-foreground">eases, beautifies, and
              delights</span>{" "}
              the small moments in a day.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#work"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
              >
                Selected work
                <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </a>
              <a
                href="#writing"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Read the journal
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </section>

        {/* ---- About ---- */}
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-12 md:px-8 md:py-24">
            <div className="md:col-span-4">
              <Reveal>
                <span className="label-tracked text-muted-foreground">
                  I&nbsp;a&nbsp;m
                </span>
              </Reveal>
            </div>
            <div className="md:col-span-8">
              <Reveal delay={0.05}>
                <p className="font-serif-display text-2xl leading-snug md:text-3xl">
                  I'm a designer who grew up by the sea in the south, now living
                  and working in Lisbon. I realize notable ideas across
                  branding, digital products, and experience design — I care
                  just as much about{" "}
                  <span className="italic text-clay">impact</span> as I do about{" "}
                  <span className="italic text-clay">craft</span>.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                  I'm a total detail freak: always asking why, always delivering
                  quality. The rest of the time I'm reading, cooking, and
                  trying (and failing) to keep a sourdough starter alive.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---- Selected Work ---- */}
        <section
          id="work"
          className="border-t border-border scroll-mt-16"
        >
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <span className="label-tracked text-muted-foreground">
                  I&nbsp;&nbsp;s&nbsp;e&nbsp;l&nbsp;e&nbsp;c&nbsp;t&nbsp;&nbsp;w&nbsp;o&nbsp;r&nbsp;k
                </span>
                <span className="text-sm text-muted-foreground">
                  {projects.length} case studies
                </span>
              </div>
            </Reveal>

            {/* Featured projects */}
            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-64 animate-pulse bg-muted/60"
                    />
                  ))
                : featuredProjects.map((p, i) => (
                    <Reveal key={p.id} delay={i * 0.05}>
                      <button
                        onClick={() => setActiveProject(p)}
                        className="group relative flex h-full w-full flex-col justify-between bg-background p-7 text-left transition-colors hover:bg-muted/50 md:p-9"
                      >
                        <div
                          className="absolute right-7 top-7 h-2 w-2 rounded-full transition-transform group-hover:scale-150"
                          style={{ backgroundColor: p.accent }}
                        />
                        <div>
                          <div className="flex items-baseline gap-3 text-sm text-muted-foreground">
                            <span>{p.year}</span>
                            <span className="text-border">·</span>
                            <span>{p.role}</span>
                          </div>
                          <h3 className="mt-4 font-serif-display text-3xl leading-tight md:text-4xl">
                            {p.title}
                          </h3>
                          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                            {p.summary}
                          </p>
                        </div>
                        <div className="mt-8 flex items-center gap-1.5 text-sm text-foreground">
                          <span>Open case study</span>
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                        {/* accent edge */}
                        <div
                          className="absolute bottom-0 left-0 h-[3px] w-0 transition-all duration-500 group-hover:w-full"
                          style={{ backgroundColor: p.accent }}
                        />
                      </button>
                    </Reveal>
                  ))}
            </div>

            {/* Other projects list */}
            {otherProjects.length > 0 && (
              <div className="mt-12">
                <Reveal>
                  <span className="label-tracked-sm text-muted-foreground">
                    More work
                  </span>
                </Reveal>
                <div className="mt-4 divide-y divide-border border-y border-border">
                  {otherProjects.map((p, i) => (
                    <Reveal key={p.id} delay={i * 0.04}>
                      <button
                        onClick={() => setActiveProject(p)}
                        className="group flex w-full items-center gap-4 py-5 text-left transition-colors hover:bg-muted/40"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: p.accent }}
                        />
                        <span className="flex-1 font-serif-display text-xl md:text-2xl">
                          {p.title}
                        </span>
                        <span className="hidden text-sm text-muted-foreground sm:block">
                          {p.summary}
                        </span>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {p.year}
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                      </button>
                    </Reveal>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ---- Writing ---- */}
        <section
          id="writing"
          className="border-t border-border scroll-mt-16 bg-muted/30"
        >
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <span className="label-tracked text-muted-foreground">
                  I&nbsp;&nbsp;w&nbsp;r&nbsp;i&nbsp;t&nbsp;e
                </span>
                <span className="text-sm text-muted-foreground">
                  {posts.length} entries
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <p className="mt-6 max-w-xl font-serif-display text-2xl leading-snug md:text-3xl">
                Slow notes on design, attention, and the craft of making things
                quietly.
              </p>
            </Reveal>

            {/* Category filter */}
            <Reveal delay={0.1}>
              <div className="mt-10 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                      activeCategory === c
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* Posts list */}
            <div className="mt-8 divide-y divide-border border-t border-border">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 animate-pulse bg-muted/60"
                    />
                  ))
                : filteredPosts.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      No entries in this category yet.
                    </p>
                  ) : (
                    filteredPosts.map((p, i) => (
                      <Reveal key={p.id} delay={i * 0.04}>
                        <button
                          onClick={() => setActivePost(p)}
                          className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 py-6 text-left transition-colors hover:bg-background md:gap-8 md:py-7"
                        >
                          <span
                            className="h-10 w-1 shrink-0 rounded-full transition-all group-hover:h-12"
                            style={{ backgroundColor: p.coverColor }}
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="label-tracked-sm">
                                {p.category}
                              </span>
                              <span className="text-border">·</span>
                              <span>{formatDate(p.publishedAt)}</span>
                              <span className="text-border">·</span>
                              <span>{p.readingTime} min</span>
                            </div>
                            <h3 className="mt-2 font-serif-display text-xl leading-tight transition-colors group-hover:text-clay md:text-2xl">
                              {p.title}
                            </h3>
                            <p className="mt-1.5 line-clamp-1 text-sm text-muted-foreground md:line-clamp-2">
                              {p.excerpt}
                            </p>
                          </div>
                          <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                        </button>
                      </Reveal>
                    ))
                  )}
            </div>
          </div>
        </section>

        {/* ---- Now ---- */}
        <section id="now" className="border-t border-border scroll-mt-16">
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
            <Reveal>
              <span className="label-tracked text-muted-foreground">
                I&nbsp;&nbsp;l&nbsp;i&nbsp;v&nbsp;e&nbsp;&nbsp;n&nbsp;o&nbsp;w
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-6 max-w-xl font-serif-display text-2xl leading-snug md:text-3xl">
                A snapshot of what's filling the margins of the working day.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {NOW_ITEMS.map((item, i) => (
                <Reveal key={item.label} delay={i * 0.05}>
                  <div className="flex h-full flex-col gap-3 bg-background p-6 md:p-7">
                    <item.icon className="h-5 w-5 text-clay" />
                    <span className="label-tracked-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <div>
                      <div className="font-serif-display text-lg leading-snug">
                        {item.title}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Experience ---- */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-12 md:px-8 md:py-24">
            <div className="md:col-span-4">
              <Reveal>
                <span className="label-tracked text-muted-foreground">
                  I&nbsp;&nbsp;w&nbsp;o&nbsp;r&nbsp;k&nbsp;&nbsp;d&nbsp;e&nbsp;s&nbsp;i&nbsp;g&nbsp;n
                </span>
              </Reveal>
              <Reveal delay={0.05}>
                <p className="mt-6 max-w-xs text-base leading-relaxed text-muted-foreground">
                  Eight years across studios, agencies, and in-house teams —
                  always chasing the same thing: work that earns its place.
                </p>
              </Reveal>
            </div>
            <div className="md:col-span-8">
              <div className="divide-y divide-border border-y border-border">
                {EXPERIENCE.map((e, i) => (
                  <Reveal key={e.company} delay={i * 0.05}>
                    <div className="group grid gap-1 py-6 md:grid-cols-12 md:gap-4">
                      <div className="text-sm text-muted-foreground md:col-span-3">
                        {e.period}
                      </div>
                      <div className="md:col-span-9">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-serif-display text-xl">
                            {e.role}
                          </span>
                          <span className="text-muted-foreground">
                            @ {e.company}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {e.note}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- Q&A ---- */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
            <Reveal>
              <span className="label-tracked text-muted-foreground">
                I&nbsp;&nbsp;a&nbsp;n&nbsp;s&nbsp;w&nbsp;e&nbsp;r
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-6 max-w-xl font-serif-display text-2xl leading-snug md:text-3xl">
                A few questions, asked & answered.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-10 md:grid-cols-2">
              {QA.map((item, i) => (
                <Reveal key={i} delay={(i % 2) * 0.05}>
                  <div className="border-t border-border pt-6">
                    <h3 className="font-serif-display text-xl leading-snug">
                      {item.q}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Contact / Colophon ---- */}
        <section
          id="contact"
          className="border-t border-border bg-foreground text-background scroll-mt-16"
        >
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
            <Reveal>
              <span className="label-tracked text-background/60">
                I&nbsp;&nbsp;c&nbsp;r&nbsp;e&nbsp;a&nbsp;t&nbsp;e&nbsp;&nbsp;w&nbsp;i&nbsp;t&nbsp;h
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-6 max-w-3xl font-serif-display text-4xl leading-[1.05] md:text-6xl">
                Let's make something
                <br />
                <span className="italic text-clay">worth keeping.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button
                  onClick={copyEmail}
                  className="group inline-flex items-center gap-2 rounded-full border border-background/30 px-5 py-2.5 text-sm transition-colors hover:bg-background hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  {emailCopied ? "Copied to clipboard" : "hello@wrenhalloway.studio"}
                </button>
                <a
                  href="https://read.cv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-background/70 transition-colors hover:text-background"
                >
                  Full résumé
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-16 grid gap-8 border-t border-background/20 pt-8 sm:grid-cols-3">
                <div>
                  <div className="label-tracked-sm text-background/50">
                    Elsewhere
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    <li>
                      <a
                        href="https://are.na"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-background/80 transition-colors hover:text-background"
                      >
                        Are.na <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://read.cv"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-background/80 transition-colors hover:text-background"
                      >
                        Read.cv <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-background/80 transition-colors hover:text-background"
                      >
                        GitHub <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="label-tracked-sm text-background/50">
                    Colophon
                  </div>
                  <p className="mt-3 text-sm text-background/70">
                    Set in Instrument Serif & Geist. Built with Next.js,
                    Tailwind, and care.
                  </p>
                </div>
                <div>
                  <div className="label-tracked-sm text-background/50">
                    Local time
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-background/80">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-clay" />
                    Lisbon, PT — <LiveClock timeZone={TIME_ZONE} />
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="bg-foreground text-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-background/50 md:flex-row md:px-8">
          <span>© 2017–2026 Wren Halloway. All rights reserved.</span>
          <span className="label-tracked-sm">
            Made slowly, in Lisbon
          </span>
        </div>
      </footer>

      {/* ---- Readers ---- */}
      <PostReader post={activePost} onClose={() => setActivePost(null)} />
      <ProjectReader
        project={activeProject}
        onClose={() => setActiveProject(null)}
      />
    </div>
  )
}
