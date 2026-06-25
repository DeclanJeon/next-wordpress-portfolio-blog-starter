export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string
  coverColor: string
  readingTime: number
  publishedAt: string
  content?: string
}

export interface Project {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  year: string
  role: string
  category: string
  client: string
  url: string
  accent: string
  featured: boolean
  order: number
}
