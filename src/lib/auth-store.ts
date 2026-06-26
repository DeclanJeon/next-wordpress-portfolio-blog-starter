"use client"

import { create } from "zustand"
import type { User } from "@/lib/types"

interface AuthState {
  user: User | null
  loading: boolean
  hydrated: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  hydrate: () => Promise<void>
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  hydrated: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  hydrate: async () => {
    if (get().hydrated) return
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" })
      const data = await res.json()
      set({ user: data.user ?? null, hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },
  login: async (username, password) => {
    set({ loading: true })
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { ok: false, error: data.error || "Login failed" }
      }
      set({ user: data.user })
      return { ok: true }
    } catch {
      return { ok: false, error: "Network error" }
    } finally {
      set({ loading: false })
    }
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    set({ user: null })
  },
}))
