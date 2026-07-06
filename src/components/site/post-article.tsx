import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Eye } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { formatReadingTime } from "@/lib/reading-time"
import { ArticleBottomNavigation, LeftArticleRail, RightArticleRail } from "@/components/site/article-navigation"
import type { ArticleNavigation, Post } from "@/lib/types"

interface PostArticleProps {
  post: Post
  navigation?: ArticleNavigation
  backHref?: string
  backLabel?: string
}

function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d))
}

function tagList(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
}



export function PostArticle({
  post,
  navigation,
  backHref = "/writing",
  backLabel = "Writing archive",
}: PostArticleProps) {
  const tags = tagList(post.tags)
  const headings = [...post.content.matchAll(/^##\s+(.+)$/gm)]
    .map((match) => match[1]?.replace(/[#*_`]/g, "").trim())
    .filter((heading): heading is string => Boolean(heading))
    .slice(0, 6)
  const showReadingGuide = post.content.length >= 5000 || post.readingTime >= 7


  return (
    <div className="mx-auto grid w-full max-w-[88rem] grid-cols-1 px-5 py-12 md:px-8 md:py-16 xl:grid-cols-[12rem_minmax(0,48rem)_16rem] xl:items-start xl:gap-12">
      <LeftArticleRail
        navigation={navigation}
        category={post.category}
        backHref={backHref}
        backLabel={backLabel}
      />

      <article className="mx-auto w-full max-w-3xl xl:max-w-none">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <header className="mt-10">
          {navigation?.breadcrumbs?.length ? (
            <nav aria-label="글 카테고리 경로" className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {navigation.breadcrumbs.map((item, index) => (
                <span key={item.slug} className="inline-flex items-center gap-2">
                  {index > 0 ? <span className="text-border">/</span> : null}
                  <Link href={item.href} className="hover:text-foreground hover:underline">
                    {item.name}
                  </Link>
                </span>
              ))}
            </nav>
          ) : (
            <span className="label-tracked-sm text-muted-foreground">
              {post.category}
            </span>
          )}
          <h1 className="mt-5 font-serif-display text-5xl leading-[1.02] tracking-tight md:text-6xl">
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

          {navigation?.secondary?.length ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="label-tracked-sm">관련 맥락</span>
              {navigation.secondary.map((item) => (
                <Link key={item.slug} href={item.href} className="rounded-full border border-border px-2.5 py-0.5 hover:border-foreground/40 hover:text-foreground">
                  {item.name}
                </Link>
              ))}
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

          {showReadingGuide ? (
            <aside className="mt-8 rounded-2xl border border-border bg-muted/30 p-5">
              <p className="label-tracked-sm text-clay">첫 30초 읽기 안내</p>
              <div className="mt-4 grid gap-4 text-sm leading-relaxed text-muted-foreground md:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="font-medium text-foreground">이 글의 질문</p>
                  <p className="mt-2">{post.excerpt}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">읽는 법</p>
                  {headings.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {headings.map((heading) => (
                        <li key={heading}>• {heading}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2">문제 제기, 구조 설명, 실패 경계, 돌아보는 판단을 차례로 확인한다.</p>
                  )}
                </div>
              </div>
            </aside>
          ) : null}

        {post.featuredImage ? (
          <figure className="mt-10 overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="aspect-[16/8] h-full w-full object-cover"
            />
          </figure>
        ) : null}

        <div className="mt-10 h-px w-full bg-border" />

        <div className="prose-editorial mt-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        <ArticleBottomNavigation navigation={navigation} />

        <footer className="mt-16 flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Link href={backHref} className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <a href="https://github.com/DeclanJeon" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
              GitHub
            </a>
            <a href="https://ponslink.com/public-desk/declan" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
              연락
            </a>
            <Link href="/work" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
              작업 보기
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </footer>
      </article>

      <RightArticleRail navigation={navigation} />
    </div>
  )
}
