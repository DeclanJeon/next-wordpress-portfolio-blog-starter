import * as React from "react"
import { motion } from "framer-motion"
import { ExternalLink, Loader2, LogIn } from "lucide-react"
import { WP_ROUTES } from "@/components/site/wp-routes"

export function LoginView({
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
      <p className="mt-3 text-sm text-muted-foreground">로그인한 사용자만 글을 작성할 수 있어요.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <label className="label-tracked-sm text-muted-foreground">사용자명</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            placeholder="사용자명"
            className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="label-tracked-sm text-muted-foreground">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 w-full rounded-md border border-border bg-background px-3.5 text-sm outline-none transition-colors focus:border-foreground/40"
          />
        </div>

        {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground text-background transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
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
