"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowUpRight } from "lucide-react"
import type { Project } from "@/lib/types"

interface ProjectReaderProps {
  project: Project | null
  onClose: () => void
}

export function ProjectReader({ project, onClose }: ProjectReaderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (!project) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [project, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-stretch justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            aria-label="자세히 본 기록 닫기"
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
              style={{ backgroundColor: project.accent }}
            />
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-6 py-3 backdrop-blur-md md:px-10">
              <span className="label-tracked-sm text-muted-foreground">
                {project.category}
              </span>
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <article className="px-6 py-12 md:px-10 md:py-16">
              <div className="flex items-baseline gap-3 text-sm text-muted-foreground">
                <span>{project.year}</span>
                <span className="text-border">·</span>
                <span>{project.role}</span>
              </div>
              <h1 className="mt-3 font-serif-display text-4xl leading-[1.05] md:text-5xl">
                {project.title}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
                {project.summary}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-5 text-sm">
                <div>
                  <div className="label-tracked-sm text-muted-foreground">
                    Client
                  </div>
                  <div className="mt-1.5 text-foreground">
                    {project.client || "—"}
                  </div>
                </div>
                <div>
                  <div className="label-tracked-sm text-muted-foreground">
                    Discipline
                  </div>
                  <div className="mt-1.5 text-foreground">
                    {project.category}
                  </div>
                </div>
              </div>

              {/* Visual block */}
              <div
                className="mt-10 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-md"
                style={{ backgroundColor: project.accent }}
              >
                <span className="font-serif-display text-5xl text-white/90 md:text-7xl">
                  {project.title}
                </span>
              </div>

              <div className="prose-editorial mt-10">
                <p>{project.description}</p>
              </div>

              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-10 inline-flex items-center gap-1.5 text-sm text-clay hover:underline"
                >
                  작업 열기
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}

              <div className="mt-16 flex items-center justify-between border-t border-border pt-6">
                <span className="label-tracked-sm text-muted-foreground">
                  자세히 본 기록
                </span>
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  목록으로
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
