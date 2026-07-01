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

export interface ArticleNavigationItem {
  slug: string
  title: string
  excerpt: string
  category: string
  publishedAt: string
  readingTime: number
  reason?: string
}

export interface ArticleTaxonomyBreadcrumb {
  slug: string
  name: string
  href: string
}

export interface ArticleSeriesNavigation {
  slug: string
  title: string
  position: number
  total: number
  href: string
  previous: ArticleNavigationItem | null
  next: ArticleNavigationItem | null
}

export interface ArticleNavigationSummary {
  totalPublished: number
  categoryPublished: number
}

export interface ArticleNavigation {
  breadcrumbs: ArticleTaxonomyBreadcrumb[]
  secondary: ArticleTaxonomyBreadcrumb[]
  series: ArticleSeriesNavigation | null
  previous: ArticleNavigationItem | null
  next: ArticleNavigationItem | null
  archivePrevious: ArticleNavigationItem | null
  archiveNext: ArticleNavigationItem | null
  related: ArticleNavigationItem[]
  more: ArticleNavigationItem[]
  summary: ArticleNavigationSummary
}

export type PostStatus = "published" | "draft" | "trash"

export interface Project {
  title: string
  summary: string
  description: string
  category: string
  year: string
  role: string
  accent: string
  client?: string
  url?: string
}
