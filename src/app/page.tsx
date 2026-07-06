"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-store"
import { useToast } from "@/hooks/use-toast"
import { useConfirm } from "@/components/site/confirm-dialog"
import { HomeBlogView } from "@/components/site/home-blog-view"
import { HomeFooter, HomeHeader, type HomeView } from "@/components/site/home-chrome"
import { LoginView } from "@/components/site/home-login-view"
import { MyPostsView } from "@/components/site/home-my-posts-view"
import { PostEditor, type PostFormData } from "@/components/site/post-editor"
import { WriterFab } from "@/components/site/writer-fab"
import { WP_ROUTES } from "@/components/site/wp-routes"
import type { Post } from "@/lib/types"

type TaxCategory = {
  readonly name: string
  readonly count: number
}

type TaxTag = {
  readonly name: string
  readonly count: number
}

export default function Home() {
  const { user, hydrate, login, logout, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const confirm = useConfirm()

  const [view, setView] = React.useState<HomeView>("blog")
  const [myPosts, setMyPosts] = React.useState<Post[]>([])
  const [categories, setCategories] = React.useState<TaxCategory[]>([])
  const [tags, setTags] = React.useState<TaxTag[]>([])
  const [editPost, setEditPost] = React.useState<Post | null>(null)

  React.useEffect(() => {
    hydrate()
  }, [hydrate])

  const loadTaxonomies = React.useCallback(async () => {
    try {
      const res = await fetch("/api/taxonomies")
      const data = await res.json()
      setCategories(data.categories ?? [])
      setTags(data.tags ?? [])
    } catch (error) {
      if (error instanceof Error) console.warn(error.message)
      setCategories([])
      setTags([])
    }
  }, [])

  React.useEffect(() => {
    loadTaxonomies()
  }, [loadTaxonomies])

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const postSlug = params.get("post")
    if (postSlug) {
      window.location.replace(`/writing/${encodeURIComponent(postSlug)}`)
      return
    }
    if (params.get("tag") || params.get("category") || params.get("q")) {
      window.location.replace(`/writing?${params.toString()}`)
    }
  }, [])

  const loadMyPosts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/posts?mine=1", { credentials: "include" })
      const data = await res.json()
      setMyPosts(data.posts ?? [])
    } catch (error) {
      if (error instanceof Error) console.warn(error.message)
      setMyPosts([])
    }
  }, [])

  const handleLogin = async (username: string, password: string) => {
    const result = await login(username, password)
    if (result.ok) {
      toast({ title: "로그인 되었습니다", description: "글을 작성할 수 있어요." })
      setView("blog")
    } else {
      toast({ title: "로그인 실패", description: result.error, variant: "destructive" })
    }
    return result
  }

  const handleLogout = async () => {
    await logout()
    setView("blog")
    toast({ title: "로그아웃 되었습니다" })
  }

  const handlePublish = async (data: PostFormData) => {
    try {
      const payload = {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        tags: data.tags,
        coverColor: data.coverColor,
        featuredImage: data.featuredImage,
      }
      const isEdit = view === "edit" && editPost
      const res = await fetch(isEdit ? `/api/posts/${editPost.slug}` : "/api/posts", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(isEdit ? "수정 실패" : "발행 실패")
      toast({ title: isEdit ? "글이 수정되었습니다" : "글이 발행되었습니다", description: isEdit ? undefined : data.title })
      setEditPost(null)
      setView("blog")
      loadTaxonomies()
    } catch (err) {
      toast({ title: "오류", description: err instanceof Error ? err.message : "알 수 없는 오류", variant: "destructive" })
    }
  }

  const handleTrash = async (slug: string) => {
    const ok = await confirm({ title: "휴지통으로 보낼까요?", description: "글이 휴지통 상태로 변경됩니다. 나중에 복구할 수 있어요.", confirmText: "휴지통으로", cancelText: "취소", destructive: true })
    if (!ok) return
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE", credentials: "include" })
      if (!res.ok) throw new Error("삭제 실패")
      toast({ title: "휴지통으로 이동했습니다" })
      setMyPosts((prev) => prev.filter((p) => p.slug !== slug))
    } catch (err) {
      toast({ title: "오류", description: err instanceof Error ? err.message : "오류", variant: "destructive" })
    }
  }

  const editorCategories = React.useMemo(() => [{ name: "General" }, ...categories.filter((c) => c.name !== "General").map((c) => ({ name: c.name }))], [categories])
  const editorTags = React.useMemo(() => tags.map((t) => ({ name: t.name })), [tags])

  return (
    <div className="relative flex min-h-screen flex-col bg-background paper-grain">
      <HomeHeader view={view} user={user} onBlog={() => setView("blog")} onMyPosts={() => setView("my-posts")} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === "blog" ? <HomeBlogView key="blog" /> : null}
          {view === "login" ? <LoginView key="login" onLogin={handleLogin} onCancel={() => setView("blog")} loading={authLoading} /> : null}
          {view === "write" || view === "edit" ? (
            <EditorView
              key={view}
              view={view}
              editPost={editPost}
              categories={editorCategories}
              tags={editorTags}
              onSubmit={handlePublish}
              onCancel={() => {
                setEditPost(null)
                setView("blog")
              }}
            />
          ) : null}
          {view === "my-posts" ? <MyPostsView key="my-posts" user={user} posts={myPosts} onLoad={loadMyPosts} onEdit={(post) => { setEditPost(post); setView("edit") }} onTrash={handleTrash} onWrite={() => setView("write")} /> : null}
        </AnimatePresence>
      </main>
      <HomeFooter />
      <WriterFab user={user} onWrite={() => setView("write")} onMyPosts={() => { loadMyPosts(); setView("my-posts") }} onLogout={handleLogout} />
    </div>
  )
}

function EditorView({
  view,
  editPost,
  categories,
  tags,
  onSubmit,
  onCancel,
}: {
  view: "write" | "edit"
  editPost: Post | null
  categories: { name: string }[]
  tags: { name: string }[]
  onSubmit: (data: PostFormData) => Promise<void>
  onCancel: () => void
}) {
  return (
    <motion.div key={view} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mx-auto max-w-4xl px-5 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="label-tracked text-muted-foreground">{view === "edit" ? "I&nbsp;&nbsp;e&nbsp;d&nbsp;i&nbsp;t" : "I&nbsp;&nbsp;w&nbsp;r&nbsp;i&nbsp;t&nbsp;e"}</span>
          <h1 className="mt-2 font-serif-display text-3xl md:text-4xl">{view === "edit" ? "글 수정" : "새 글 작성"}</h1>
        </div>
        <a href={WP_ROUTES.write} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
          워드프레스 에디터
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <PostEditor
        initial={editPost ? { title: editPost.title, excerpt: editPost.excerpt, content: editPost.content, category: editPost.category, tags: editPost.tags, coverColor: editPost.coverColor, featuredImage: editPost.featuredImage } : undefined}
        categories={categories}
        tags={tags}
        onSubmit={onSubmit}
        onCancel={onCancel}
        submitLabel={view === "edit" ? "수정 저장" : "발행하기"}
      />
    </motion.div>
  )
}
