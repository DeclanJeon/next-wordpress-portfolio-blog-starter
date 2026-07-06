import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import type { User } from "@/lib/types"

export type HomeView = "blog" | "login" | "write" | "edit" | "my-posts"

export function HomeHeader({
  view,
  user,
  onBlog,
  onMyPosts,
}: {
  view: HomeView
  user: User | null
  onBlog: () => void
  onMyPosts: () => void
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <button onClick={onBlog} className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            <span className="font-serif-display text-lg italic">p</span>
          </span>
          <span className="font-serif-display text-xl tracking-tight">Declan's work notes</span>
        </button>

        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/work" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            작업
          </Link>
          <Link href="/writing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            생각 정리
          </Link>
          <Link href="/contact" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            연락
          </Link>
          {view !== "blog" ? (
            <button onClick={onBlog} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">블로그로</span>
            </button>
          ) : null}
          {user ? (
            <button onClick={onMyPosts} className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex">
              내 글
            </button>
          ) : null}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}

export function HomeFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground md:flex-row md:px-8">
        <span>© {new Date().getFullYear()} Declan Jeon. Work notes, not a brochure.</span>
        <span className="label-tracked-sm">Build · Break · Write</span>
      </div>
    </footer>
  )
}
