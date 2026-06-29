import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, Eye, FileText, PenLine, Pencil, Trash2 } from "lucide-react"
import type { Post, User } from "@/lib/types"

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d))
}

export function MyPostsView({
  user,
  posts,
  onLoad,
  onEdit,
  onTrash,
  onWrite,
}: {
  user: User | null
  posts: readonly Post[]
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
          <span className="label-tracked text-muted-foreground">I&nbsp;&nbsp;m&nbsp;a&nbsp;n&nbsp;a&nbsp;g&nbsp;e</span>
          <h1 className="mt-2 font-serif-display text-3xl md:text-4xl">내 글 관리</h1>
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
          <button onClick={onWrite} className="mt-4 inline-flex items-center gap-2 text-sm text-clay hover:underline">
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
              <PostManagementRow key={p.id} post={p} onEdit={onEdit} onTrash={onTrash} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PostManagementRow({
  post,
  onEdit,
  onTrash,
}: {
  post: Post
  onEdit: (p: Post) => void
  onTrash: (slug: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-muted/30 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-4">
      <div className="min-w-0">
        <Link href={`/writing/${post.slug}`} className="block text-left">
          <span className="font-serif-display text-lg leading-snug hover:text-clay">{post.title}</span>
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="label-tracked-sm">{post.category}</span>
          <span>·</span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>
      </div>
      <StatusPill status={post.status} />
      <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        {post.views}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(post)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
          aria-label="수정"
          title="수정"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onTrash(post.slug)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
          aria-label="휴지통"
          title="휴지통으로"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: Post["status"] }) {
  const label = status === "published" ? "발행됨" : status === "draft" ? "임시" : "휴지통"
  const tone = status === "published" ? "bg-clay/15 text-clay" : status === "draft" ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${tone}`}>{label}</span>
}
