"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowUpRight, Eye } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { formatReadingTime } from "@/lib/reading-time"
import type { Post } from "@/lib/types"

interface PostReaderProps {
  post: Post | null
  onClose: () => void
}

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d))
}

export function PostReader({ post, onClose }: PostReaderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (!post) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [post, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {post && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-stretch justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            aria-label="Close reader"
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
          />
          <motion.div
            className="relative z-10 mx-auto w-full max-w-3xl bg-background shadow-2xl overflow-y-auto"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="h-2 w-full"
              style={{ backgroundColor: post.coverColor }}
            />
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-6 py-3 backdrop-blur-md md:px-10">
              <span className="label-tracked-sm text-muted-foreground">
                {post.category}
              </span>
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {post.featuredImage ? (
              <div className="aspect-[16/8] w-full overflow-hidden bg-muted">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <article className="px-6 py-12 md:px-10 md:py-16">
              <h1 className="font-serif-display text-4xl leading-[1.05] md:text-5xl">
                {post.title}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
                {post.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>By {post.authorName}</span>
                <span className="text-border">·</span>
                <span>{formatDate(post.publishedAt)}</span>
                <span className="text-border">·</span>
                <span>{formatReadingTime(post.readingTime, "meta")}</span>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {post.views}
                </span>
              </div>

              {post.tags && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
                      >
                        #{t}
                      </span>
                    ))}
                </div>
              )}

              <div className="mt-10 h-px w-full bg-border" />

              <div className="prose-editorial mt-10">
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>

              <div className="mt-16 flex items-center justify-between border-t border-border pt-6">
                <span className="label-tracked-sm text-muted-foreground">
                  PonsLink
                </span>
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back to index
                  <ArrowUpRight className="h-3.5 w-3.5 rotate-90" />
                </button>
              </div>
            </article>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
