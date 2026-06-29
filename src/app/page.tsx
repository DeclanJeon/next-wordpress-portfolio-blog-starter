"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowUpRight,
  PenLine,
  FileText,
  Trash2,
  Pencil,
  Eye,
  LogIn,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react"
import { useAuth } from "@/lib/auth-store"
import { useToast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/site/confirm-dialog"
import { PostEditor, type PostFormData } from "@/components/site/post-editor"
import { WriterFab } from "@/components/site/writer-fab"
import { PortfolioShowcase } from "@/components/site/portfolio-showcase"
import { ThemeToggle } from "@/components/theme-toggle"
import { Reveal } from "@/components/site/reveal"
import type { Post, User } from "@/lib/types"

type View = "blog" | "login" | "write" | "edit" | "my-posts"

interface TaxCategory {
  name: string
  count: number
}
interface TaxTag {
  name: string
  count: number
}

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d))
}

// WordPress-handled routes live on the same public domain as the Next.js frontend.
const WP_ROUTES = {
  write: "/write/",
  myPosts: "/my-posts/",
  login: "/writer-login/",
}

export default function Home() {
  const { user, hydrate, login, logout, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const confirm = useConfirm()

  const [view, setView] = React.useState<View>("blog")
  const [myPosts, setMyPosts] = React.useState<Post[]>([])
  const [categories, setCategories] = React.useState<TaxCategory[]>([])
  const [tags, setTags] = React.useState<TaxTag[]>([])
  const [editPost, setEditPost] = React.useState<Post | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    hydrate()
  }, [hydrate])


  const loadTaxonomies = React.useCallback(async () => {
    try {
      const res = await fetch("/api/taxonomies")
      const data = await res.json()
      setCategories(data.categories ?? [])
      setTags(data.tags ?? [])
    } catch {
      /* noop */
    }
  }, [])


  React.useEffect(() => {
    loadTaxonomies()
  }, [loadTaxonomies])


  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tag = params.get("tag")
    const category = params.get("category")
    const q = params.get("q")
    const postSlug = params.get("post")

    if (postSlug) {
      window.location.replace(`/writing/${encodeURIComponent(postSlug)}`)
      return
    }

    if (tag || category || q) {
      window.location.replace(`/writing?${params.toString()}`)
    }
  }, [])

  const loadMyPosts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/posts?mine=1", { credentials: "include" })
      const data = await res.json()
      setMyPosts(data.posts ?? [])
    } catch {
      setMyPosts([])
    }
  }, [])

  const handleLogin = async (username: string, password: string) => {
    const result = await login(username, password)
    if (result.ok) {
      toast({ title: "로그인 되었습니다", description: "글을 작성할 수 있어요." })
      setView("blog")
    } else {
      toast({
        title: "로그인 실패",
        description: result.error,
        variant: "destructive",
      })
    }
    return result
  }

  const handleLogout = async () => {
    await logout()
    setView("blog")
    toast({ title: "로그아웃 되었습니다" })
  }

  const handlePublish = async (data: PostFormData) => {
    setSubmitting(true)
    try {
      const tagsString = data.tags
      const payload = {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        tags: tagsString,
        coverColor: data.coverColor,
        featuredImage: data.featuredImage,
      }
      if (view === "edit" && editPost) {
        const res = await fetch(`/api/posts/${editPost.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.error || "수정 실패")
        }
        toast({ title: "글이 수정되었습니다" })
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.error || "발행 실패")
        }
        toast({ title: "글이 발행되었습니다", description: data.title })
      }
      setEditPost(null)
      setView("blog")
      loadTaxonomies()
    } catch (err) {
      toast({
        title: "오류",
        description: err instanceof Error ? err.message : "알 수 없는 오류",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTrash = async (slug: string) => {
    const ok = await confirm({
      title: "휴지통으로 보낼까요?",
      description: "글이 휴지통 상태로 변경됩니다. 나중에 복구할 수 있어요.",
      confirmText: "휴지통으로",
      cancelText: "취소",
      destructive: true,
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error("삭제 실패")
      toast({ title: "휴지통으로 이동했습니다" })
      setMyPosts((prev) => prev.filter((p) => p.slug !== slug))
    } catch (err) {
      toast({
        title: "오류",
        description: err instanceof Error ? err.message : "오류",
        variant: "destructive",
      })
    }
  }

  const startEdit = (post: Post) => {
    setEditPost(post)
    setView("edit")
  }

  const editorCategories = React.useMemo(
    () => [
      { name: "General" },
      ...categories
        .filter((c) => c.name !== "General")
        .map((c) => ({ name: c.name })),
    ],
    [categories]
  )
  const editorTags = React.useMemo(() => tags.map((t) => ({ name: t.name })), [tags])

  return (
    <div className="relative flex min-h-screen flex-col bg-background paper-grain">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <button
            onClick={() => setView("blog")}
            className="flex items-center gap-2"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
              <span className="font-serif-display text-lg italic">p</span>
            </span>
            <span className="font-serif-display text-xl tracking-tight">
              Pons
            </span>
          </button>

          <div className="flex items-center gap-2 md:gap-4">
            <a
              href="/work"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Work
            </a>
            <a
              href="/writing"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              Writing
            </a>
            {view !== "blog" && (
              <button
                onClick={() => setView("blog")}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">블로그로</span>
              </button>
            )}
            {user ? (
              <button
                onClick={() => setView("my-posts")}
                className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted md:inline-flex"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-clay" />
                {user.displayName}
              </button>
            ) : (
              <button
                onClick={() => setView("login")}
                className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
              >
                <LogIn className="h-4 w-4" />
                Writer login
              </button>
            )}
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {/* ===================== BLOG VIEW ===================== */}
          {view === "blog" && (
            <motion.div
              key="blog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Hero */}
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
                    <span className="label-tracked-sm text-muted-foreground">
                      Writing archive
                    </span>
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
          )}

          {/* ===================== LOGIN VIEW ===================== */}
          {view === "login" && (
            <LoginView
              key="login"
              onLogin={handleLogin}
              onCancel={() => setView("blog")}
              loading={authLoading}
            />
          )}

          {/* ===================== WRITE / EDIT VIEW ===================== */}
          {(view === "write" || view === "edit") && (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <span className="label-tracked text-muted-foreground">
                    {view === "edit" ? "I&nbsp;&nbsp;e&nbsp;d&nbsp;i&nbsp;t" : "I&nbsp;&nbsp;w&nbsp;r&nbsp;i&nbsp;t&nbsp;e"}
                  </span>
                  <h1 className="mt-2 font-serif-display text-3xl md:text-4xl">
                    {view === "edit" ? "글 수정" : "새 글 작성"}
                  </h1>
                </div>
                <a
                  href={WP_ROUTES.write}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                >
                  워드프레스 에디터
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <PostEditor
                initial={
                  editPost
                    ? {
                        title: editPost.title,
                        excerpt: editPost.excerpt,
                        content: editPost.content,
                        category: editPost.category,
                        tags: editPost.tags,
                        coverColor: editPost.coverColor,
                        featuredImage: editPost.featuredImage,
                      }
                    : undefined
                }
                categories={editorCategories}
                tags={editorTags}
                onSubmit={handlePublish}
                onCancel={() => {
                  setEditPost(null)
                  setView("blog")
                }}
                submitLabel={view === "edit" ? "수정 저장" : "발행하기"}
              />
            </motion.div>
          )}

          {/* ===================== MY POSTS VIEW ===================== */}
          {view === "my-posts" && (
            <motion.div
              key="my-posts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14"
            >
              <MyPostsView
                user={user}
                posts={myPosts}
                onLoad={loadMyPosts}
                onEdit={startEdit}
                onTrash={handleTrash}
                onWrite={() => setView("write")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground md:flex-row md:px-8">
          <span>© {new Date().getFullYear()} PonsLink. Bridges, not walls.</span>
          <span className="label-tracked-sm">Made for writers</span>
        </div>
      </footer>

      {/* ---- Floating writer buttons ---- */}
      <WriterFab
        user={user}
        onWrite={() => setView("write")}
        onMyPosts={() => {
          loadMyPosts()
          setView("my-posts")
        }}
        onLogin={() => setView("login")}
        onLogout={handleLogout}
      />

    </div>
  )
}

/* ===================== Login View ===================== */

function LoginView({
  onLogin,
  onCancel,
  loading,
}: {
  onLogin: (u: string, p: string) => Promise<{ ok: boolean; error?: string }>
  onCancel: () => void
  loading: boolean
}) {
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await onLogin(username, password)
    if (!res.ok) setError(res.error || "로그인 실패")
  }

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto flex max-w-md flex-col px-5 py-20 md:px-8 md:py-28"
    >
      <span className="label-tracked text-muted-foreground">
        W&nbsp;r&nbsp;i&nbsp;t&nbsp;e&nbsp;r&nbsp;&nbsp;l&nbsp;o&nbsp;g&nbsp;i&nbsp;n
      </span>
      <h1 className="mt-4 font-serif-display text-4xl">글쓰기 로그인</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        로그인한 사용자만 글을 작성할 수 있어요.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <label className="label-tracked-sm text-muted-foreground">
            사용자명
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            placeholder="사용자명"
            className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="label-tracked-sm text-muted-foreground">
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground/40"
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground text-background transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          로그인
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          취소
        </button>
      </form>


      <a
        href={WP_ROUTES.login}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        워드프레스 로그인 페이지
        <ExternalLink className="h-3 w-3" />
      </a>
    </motion.div>
  )
}

/* ===================== My Posts View ===================== */

function MyPostsView({
  user,
  posts,
  onLoad,
  onEdit,
  onTrash,
  onWrite,
}: {
  user: User | null
  posts: Post[]
  onLoad: () => void
  onEdit: (p: Post) => void
  onTrash: (slug: string) => void
  onWrite: () => void
}) {
  React.useEffect(() => {
    onLoad()
  }, [onLoad])

  if (!user) return null

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="label-tracked text-muted-foreground">
            I&nbsp;&nbsp;m&nbsp;a&nbsp;n&nbsp;a&nbsp;g&nbsp;e
          </span>
          <h1 className="mt-2 font-serif-display text-3xl md:text-4xl">
            내 글 관리
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.displayName}님이 쓴 글을 수정하거나 휴지통으로 보낼 수 있어요.
          </p>
        </div>
        <button
          onClick={onWrite}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background transition-transform hover:scale-[1.02]"
        >
          <PenLine className="h-4 w-4" />
          <span className="hidden sm:inline">새 글</span>
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-20 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-serif-display text-2xl">아직 쓴 글이 없어요.</p>
          <button
            onClick={onWrite}
            className="mt-4 inline-flex items-center gap-2 text-sm text-clay hover:underline"
          >
            첫 글 작성하기 <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs label-tracked-sm text-muted-foreground md:grid">
            <span>제목</span>
            <span>상태</span>
            <span>조회</span>
            <span>관리</span>
          </div>
          <div className="divide-y divide-border">
            {posts.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-muted/30 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/writing/${p.slug}`}
                    className="block text-left"
                  >
                    <span className="font-serif-display text-lg leading-snug hover:text-clay">
                      {p.title}
                    </span>
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span className="label-tracked-sm">{p.category}</span>
                    <span>·</span>
                    <span>{formatDate(p.publishedAt)}</span>
                  </div>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                      p.status === "published"
                        ? "bg-clay/15 text-clay"
                        : p.status === "draft"
                          ? "bg-muted text-muted-foreground"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {p.status === "published"
                      ? "발행됨"
                      : p.status === "draft"
                        ? "임시"
                        : "휴지통"}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  {p.views}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(p)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
                    aria-label="수정"
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onTrash(p.slug)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="휴지통"
                    title="휴지통으로"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
