import { z } from "zod"

export const retrospectiveProjectSchema = z.enum([
  "ponslink",
  "ponswarp",
  "document-automation-suite",
  "ruminate-fatemirror",
  "bible-companion",
  "youtube-to-md",
  "creator-local-tools",
  "agent-work-systems",
])

export const retrospectiveQuerySchema = z.object({
  project: retrospectiveProjectSchema.default("ponslink"),
  limit: z.coerce.number().int().min(1).max(24).default(8),
})

export const retrospectiveItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  href: z.string().min(1),
  excerpt: z.string(),
  featuredImage: z.string(),
  readingTime: z.number().int().min(0),
  publishedAt: z.string(),
  updatedAt: z.string(),
})

const retrospectiveSeriesSchema = z.object({
  title: z.string().min(1),
  href: z.string().min(1),
  label: z.string().min(1),
})

export const retrospectiveResponseSchema = z.object({
  project: retrospectiveProjectSchema,
  total: z.number().int().min(0),
  items: z.array(retrospectiveItemSchema),
  updatedAt: z.string().nullable(),
  source: z.literal("db"),
  series: retrospectiveSeriesSchema.nullable().default(null),
})

export type RetrospectiveProject = z.infer<typeof retrospectiveProjectSchema>
export type RetrospectiveItem = z.infer<typeof retrospectiveItemSchema>
export type RetrospectiveResponse = z.infer<typeof retrospectiveResponseSchema>
