export interface User {
  id: string
  username: string
  displayName: string
  role: string
  bio: string
}

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string
  coverColor: string
  featuredImage: string
  status: string
  readingTime: number
  views: number
  authorId: string
  authorName: string
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export type PostStatus = "published" | "draft" | "trash"
