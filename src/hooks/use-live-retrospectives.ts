"use client"

import * as React from "react"
import {
  retrospectiveResponseSchema,
  type RetrospectiveProject,
  type RetrospectiveResponse,
} from "@/lib/retrospective-contract"

type LiveRetrospectivesStatus = "idle" | "loading" | "success" | "error"

export type UseLiveRetrospectivesOptions = {
  readonly project: RetrospectiveProject
  readonly limit: number
  readonly pollIntervalMs?: number
}

export type UseLiveRetrospectivesResult = {
  readonly data: RetrospectiveResponse | null
  readonly status: LiveRetrospectivesStatus
  readonly errorMessage: string | null
  readonly refreshedAt: Date | null
  readonly refresh: () => Promise<void>
}

type LiveRetrospectivesState = {
  readonly data: RetrospectiveResponse | null
  readonly status: LiveRetrospectivesStatus
  readonly errorMessage: string | null
  readonly refreshedAt: Date | null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unknown retrospective refresh failure"
}

async function fetchRetrospectives(endpoint: string, signal: AbortSignal): Promise<RetrospectiveResponse> {
  const response = await fetch(endpoint, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Retrospective request failed with ${response.status}`)
  }

  const payload: unknown = await response.json()
  return retrospectiveResponseSchema.parse(payload)
}

export function useLiveRetrospectives({
  project,
  limit,
  pollIntervalMs = 45_000,
}: UseLiveRetrospectivesOptions): UseLiveRetrospectivesResult {
  const abortRef = React.useRef<AbortController | null>(null)
  const [state, setState] = React.useState<LiveRetrospectivesState>({
    data: null,
    status: "idle",
    errorMessage: null,
    refreshedAt: null,
  })

  const endpoint = React.useMemo(() => {
    const params = new URLSearchParams({ project, limit: String(limit) })
    return `/api/retrospectives?${params.toString()}`
  }, [project, limit])

  const refresh = React.useCallback(async () => {
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    setState((current) => ({
      ...current,
      status: current.data ? "success" : "loading",
      errorMessage: null,
    }))

    try {
      const data = await fetchRetrospectives(endpoint, controller.signal)

      if (controller.signal.aborted) {
        return
      }

      setState({
        data,
        status: "success",
        errorMessage: null,
        refreshedAt: new Date(),
      })
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }

      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: getErrorMessage(error),
      }))
    }
  }, [endpoint])

  React.useEffect(() => {
    void refresh()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh()
      }
    }, pollIntervalMs)

    const handleFocus = () => {
      void refresh()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh()
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      abortRef.current?.abort()
    }
  }, [pollIntervalMs, refresh])

  return {
    ...state,
    refresh,
  }
}
