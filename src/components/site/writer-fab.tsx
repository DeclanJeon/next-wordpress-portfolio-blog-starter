"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PenLine, FileText, X, LogOut } from "lucide-react"
import type { User } from "@/lib/types"

interface WriterFabProps {
  user: User | null
  onWrite: () => void
  onMyPosts: () => void
  onLogout: () => void
}

export function WriterFab({
  user,
  onWrite,
  onMyPosts,
  onLogout,
}: WriterFabProps) {
  const [open, setOpen] = React.useState(false)

  if (!user) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 md:bottom-7 md:right-7">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            <button
              onClick={() => {
                setOpen(false)
                onWrite()
              }}
              className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-background/95 px-4 py-2.5 text-sm shadow-lg backdrop-blur transition-colors hover:bg-foreground hover:text-background"
            >
              <PenLine className="h-4 w-4 text-clay group-hover:text-background" />
              글쓰기
            </button>
            <button
              onClick={() => {
                setOpen(false)
                onMyPosts()
              }}
              className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-background/95 px-4 py-2.5 text-sm shadow-lg backdrop-blur transition-colors hover:bg-foreground hover:text-background"
            >
              <FileText className="h-4 w-4 text-clay group-hover:text-background" />
              내 글
            </button>
            <button
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              className="inline-flex items-center gap-2.5 rounded-full border border-border bg-background/95 px-4 py-2.5 text-sm text-muted-foreground shadow-lg backdrop-blur transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Writer menu"
        className="group inline-flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="pen"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <PenLine className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}
