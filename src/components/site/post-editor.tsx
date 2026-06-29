"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Link2,
  ImagePlus,
  Quote,
  List,
  X,
  Loader2,
  Check,
  Plus,
} from "lucide-react"

import { compressImage } from "@/lib/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface EditorCategory {
  name: string
}
export interface EditorTag {
  name: string
}

export interface PostFormData {
  title: string
  excerpt: string
  content: string
  category: string
  tags: string // comma-separated
  coverColor: string
  featuredImage: string // data url or ""
}

interface PostEditorProps {
  initial?: Partial<PostFormData> // for edit mode
  categories: EditorCategory[]
  tags: EditorTag[]
  onSubmit: (data: PostFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string // "Publish" or "Update"
  heading?: string
}

const COVER_COLORS = [
  "#1c1917",
  "#b45309",
  "#3f6212",
  "#0f766e",
  "#7c2d12",
  "#a16207",
]

const MAX_BODY_IMAGES = 10
const MAX_FILE_BYTES = 5 * 1024 * 1024

// Convert a data URL string back into a File for multipart upload.
async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], name, { type: blob.type })
}

// Compress client-side, then POST to /api/upload and return the resulting data URL.
async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `File too large. Max 5MB. (got ${(file.size / 1024 / 1024).toFixed(2)}MB)`
    )
  }
  const { dataUrl } = await compressImage(file)
  const fd = new FormData()
  fd.append("file", await dataUrlToFile(dataUrl, file.name))
  const res = await fetch("/api/upload", {
    method: "POST",
    body: fd,
    credentials: "include",
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error((e as { error?: string }).error || "Upload failed")
  }
  const data = (await res.json()) as { url: string }
  return data.url
}

export function PostEditor(props: PostEditorProps) {
  const {
    initial,
    categories,
    tags,
    onSubmit,
    onCancel,
    submitLabel = "Publish",
    heading = "New Post",
  } = props

  const [title, setTitle] = React.useState(initial?.title ?? "")
  const [excerpt, setExcerpt] = React.useState(initial?.excerpt ?? "")
  const [content, setContent] = React.useState(initial?.content ?? "")
  const [coverColor, setCoverColor] = React.useState(
    initial?.coverColor ?? COVER_COLORS[0]
  )
  const [featuredImage, setFeaturedImage] = React.useState(
    initial?.featuredImage ?? ""
  )
  const [category, setCategory] = React.useState(initial?.category ?? "General")
  const [newCategoryMode, setNewCategoryMode] = React.useState(false)
  const [newCategory, setNewCategory] = React.useState("")
  const [activeTags, setActiveTags] = React.useState<string[]>(() => {
    const raw = initial?.tags
    if (!raw) return []
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  })
  const [newTag, setNewTag] = React.useState("")
  const [bodyImageCount, setBodyImageCount] = React.useState(0)
  const [featuredUploading, setFeaturedUploading] = React.useState(false)
  const [bodyUploading, setBodyUploading] = React.useState(false)
  const [featuredError, setFeaturedError] = React.useState("")
  const [bodyError, setBodyError] = React.useState("")
  const [titleError, setTitleError] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const taRef = React.useRef<HTMLTextAreaElement>(null)
  const featuredInputRef = React.useRef<HTMLInputElement>(null)
  const bodyInputRef = React.useRef<HTMLInputElement>(null)

  // -------- markdown toolbar helpers --------
  const syncContent = () => {
    if (taRef.current) setContent(taRef.current.value)
  }

  const applyInline = (
    prefix: string,
    suffix: string,
    placeholder: string
  ) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const value = ta.value
    const selected = value.slice(start, end)
    const text = selected || placeholder
    const replacement = prefix + text + suffix
    ta.focus()
    ta.setRangeText(replacement, start, end, "select")
    if (!selected) {
      ta.selectionStart = start + prefix.length
      ta.selectionEnd = start + prefix.length + placeholder.length
    }
    syncContent()
  }

  const applyLinePrefix = (prefix: string, placeholder: string) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const value = ta.value
    const lineStart = value.lastIndexOf("\n", start - 1) + 1
    let lineEnd = value.indexOf("\n", end)
    if (lineEnd === -1) lineEnd = value.length
    const block = value.slice(lineStart, lineEnd)
    const hasSelection = end > start
    const work = hasSelection ? block : block || placeholder
    const lines = work.split("\n").map((l) => prefix + l)
    const replacement = lines.join("\n")
    ta.focus()
    ta.setRangeText(replacement, lineStart, lineEnd, "select")
    if (!hasSelection) {
      ta.selectionStart = lineStart + prefix.length
      ta.selectionEnd = lineStart + prefix.length + work.length
    }
    syncContent()
  }

  const applyLink = () => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const value = ta.value
    const selected = value.slice(start, end) || "link text"
    const replacement = `[${selected}](https://)`
    ta.focus()
    ta.setRangeText(replacement, start, end, "select")
    const urlPos = start + selected.length + 3 // after `](`
    ta.selectionStart = urlPos
    ta.selectionEnd = urlPos + "https://".length
    syncContent()
  }

  const insertText = (text: string) => {
    const ta = taRef.current
    if (!ta) {
      setContent((prev) => prev + text)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    ta.focus()
    ta.setRangeText(text, start, end, "end")
    syncContent()
  }

  // -------- image upload handlers --------
  const handleFeaturedFile = async (file: File | undefined) => {
    if (!file) return
    setFeaturedError("")
    if (!file.type.startsWith("image/")) {
      setFeaturedError("Please select an image file.")
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setFeaturedError(
        `File too large. Max 5MB. (got ${(file.size / 1024 / 1024).toFixed(2)}MB)`
      )
      return
    }
    setFeaturedUploading(true)
    try {
      const url = await uploadImage(file)
      setFeaturedImage(url)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed"
      setFeaturedError(msg)
    } finally {
      setFeaturedUploading(false)
      if (featuredInputRef.current) featuredInputRef.current.value = ""
    }
  }

  const handleBodyFile = async (file: File | undefined) => {
    if (!file) return
    setBodyError("")
    if (bodyImageCount >= MAX_BODY_IMAGES) {
      setBodyError(`Maximum ${MAX_BODY_IMAGES} body images reached.`)
      return
    }
    if (!file.type.startsWith("image/")) {
      setBodyError("Please select an image file.")
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setBodyError(
        `File too large. Max 5MB. (got ${(file.size / 1024 / 1024).toFixed(2)}MB)`
      )
      return
    }
    setBodyUploading(true)
    try {
      const url = await uploadImage(file)
      const alt =
        file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim() || "image"
      insertText(`\n\n![${alt}](${url})\n\n`)
      setBodyImageCount((c) => c + 1)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed"
      setBodyError(msg)
    } finally {
      setBodyUploading(false)
      if (bodyInputRef.current) bodyInputRef.current.value = ""
    }
  }

  // -------- tags --------
  const toggleTag = (name: string) => {
    setActiveTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    )
  }
  const addNewTag = () => {
    const t = newTag.trim()
    if (!t) return
    setActiveTags((prev) => (prev.includes(t) ? prev : [...prev, t]))
    setNewTag("")
  }

  // -------- category (new) --------
  const confirmNewCategory = () => {
    const v = newCategory.trim()
    if (v) {
      setCategory(v)
      setNewCategoryMode(false)
      setNewCategory("")
    }
  }

  // -------- submit --------
  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError(true)
      return
    }
    setTitleError(false)
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        category: category.trim() || "General",
        tags: activeTags.join(","),
        coverColor,
        featuredImage,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Available tag pool = prop tags + any active custom tags
  const availableTags = React.useMemo(() => {
    const set = new Set<string>(tags.map((t) => t.name))
    const all = [...tags.map((t) => t.name)]
    for (const t of activeTags) {
      if (!set.has(t)) all.push(t)
    }
    return all
  }, [tags, activeTags])

  const bodyImageButtonDisabled =
    bodyImageCount >= MAX_BODY_IMAGES || bodyUploading
  const isUpdating = submitLabel.toLowerCase().includes("update")

  return (
    <div className="space-y-8 px-1 pb-2">
      {/* Heading */}
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
        <h2 className="font-serif-display text-2xl text-foreground">
          {heading}
        </h2>
        <span className="label-tracked-sm text-muted-foreground">EDITOR</span>
      </div>

      {/* TITLE */}
      <section className="space-y-2">
        <div className="label-tracked-sm text-muted-foreground">TITLE</div>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (titleError) setTitleError(false)
          }}
          placeholder="A compelling headline"
          aria-invalid={titleError}
          aria-label="Post title"
          className={cn(
            "w-full bg-transparent px-0 font-serif-display text-3xl outline-none placeholder:text-muted-foreground/40 md:text-4xl",
            titleError && "rounded ring-2 ring-destructive/40"
          )}
        />
        {titleError && (
          <p className="text-xs text-destructive">
            Title is required to publish.
          </p>
        )}
      </section>

      {/* SUMMARY */}
      <section className="space-y-2">
        <div className="label-tracked-sm text-muted-foreground">SUMMARY</div>
        <Textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="One-line summary (optional)"
          rows={1}
          className="resize-none border-0 px-0 text-base italic text-muted-foreground shadow-none [field-sizing:none] focus-visible:ring-0"
          aria-label="Post summary"
        />
      </section>

      {/* BODY */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="label-tracked-sm text-muted-foreground">BODY</div>
          <span className="label-tracked-sm text-muted-foreground/70">
            MARKDOWN · LIVE PREVIEW
          </span>
        </div>

        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-card p-1"
          role="toolbar"
          aria-label="Formatting"
        >
          <ToolbarButton
            title="Heading 1"
            onClick={() => applyLinePrefix("# ", "Heading 1")}
          >
            <Heading1 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            onClick={() => applyLinePrefix("## ", "Heading 2")}
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title="Bold"
            onClick={() => applyInline("**", "**", "bold")}
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            onClick={() => applyInline("*", "*", "italic")}
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton title="Link" onClick={applyLink}>
            <Link2 className="size-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title="Quote"
            onClick={() => applyLinePrefix("> ", "Quote")}
          >
            <Quote className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Bullet list"
            onClick={() => applyLinePrefix("- ", "List item")}
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            title="Insert image"
            disabled={bodyImageButtonDisabled}
            onClick={() => bodyInputRef.current?.click()}
          >
            {bodyUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
          </ToolbarButton>
        </div>

        {/* Editor + Preview */}
        <div className="grid overflow-hidden rounded-md border border-border md:grid-cols-2">
          <div className="relative border-b border-border md:border-b-0 md:border-r">
            <div className="label-tracked-sm pointer-events-none absolute left-3 top-2 text-muted-foreground/70">
              WRITE
            </div>
            <textarea
              ref={taRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing in markdown…"
              spellCheck={false}
              aria-label="Markdown body"
              className="h-[480px] w-full resize-none bg-transparent px-4 pb-4 pt-8 font-mono text-sm leading-relaxed outline-none"
            />
          </div>
          <div className="relative bg-card/40">
            <div className="label-tracked-sm pointer-events-none absolute left-3 top-2 text-muted-foreground/70">
              PREVIEW
            </div>
            <div className="h-[480px] overflow-y-auto px-5 pb-5 pt-8">
              {content.trim() ? (
                <div className="prose-editorial">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground/60">
                  Preview appears here…
                </p>
              )}
            </div>
          </div>
        </div>
        {bodyError && <p className="text-xs text-destructive">{bodyError}</p>}
      </section>

      {/* FEATURED IMAGE */}
      <section className="space-y-2">
        <div className="label-tracked-sm text-muted-foreground">
          FEATURED IMAGE
        </div>
        <div className="flex flex-wrap items-start gap-4">
          {featuredImage ? (
            <div className="group relative size-28 overflow-hidden rounded-md border border-border">
              <img
                src={featuredImage}
                alt="Featured preview"
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => setFeaturedImage("")}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 text-foreground opacity-0 shadow transition group-hover:opacity-100"
                aria-label="Remove featured image"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => featuredInputRef.current?.click()}
              disabled={featuredUploading}
              className="grid size-28 place-items-center rounded-md border border-dashed border-border text-muted-foreground transition hover:bg-accent/50 disabled:opacity-50"
              aria-label="Upload featured image"
            >
              {featuredUploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ImagePlus className="size-5" />
              )}
            </button>
          )}

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => featuredInputRef.current?.click()}
              disabled={featuredUploading}
            >
              {featuredUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : featuredImage ? (
                <Check className="size-4" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {featuredImage ? "Replace" : "Upload"}
            </Button>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP · max 5MB
            </p>
            {featuredError && (
              <p className="text-xs text-destructive">{featuredError}</p>
            )}
          </div>

          <input
            ref={featuredInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFeaturedFile(e.target.files?.[0])}
          />
        </div>
      </section>

      {/* BODY IMAGES */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="label-tracked-sm text-muted-foreground">
            BODY IMAGES ({bodyImageCount} / {MAX_BODY_IMAGES})
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => bodyInputRef.current?.click()}
            disabled={bodyImageButtonDisabled}
          >
            {bodyUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Insert image
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Inserted into the body as markdown. Max {MAX_BODY_IMAGES} images, 5MB
          each.
        </p>
        <input
          ref={bodyInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleBodyFile(e.target.files?.[0])}
        />
      </section>

      {/* CATEGORY & TAGS */}
      <section className="space-y-5">
        <div className="label-tracked-sm text-muted-foreground">
          CATEGORY &amp; TAGS
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="post-category"
            className="text-xs text-muted-foreground"
          >
            Category
          </Label>
          {!newCategoryMode ? (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="post-category"
                  className="w-full sm:w-64"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.length
                    ? categories
                    : [{ name: "General" }]
                  ).map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewCategoryMode(true)
                  setNewCategory(category !== "General" ? category : "")
                }}
              >
                <Plus className="size-4" />
                New
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Type a new category…"
                className="w-full sm:w-64"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    confirmNewCategory()
                  }
                }}
              />
              <Button type="button" size="sm" onClick={confirmNewCategory}>
                <Check className="size-4" />
                Use
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewCategoryMode(false)
                  setNewCategory("")
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((t) => {
              const active = activeTags.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    active
                      ? "border-transparent bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              )
            })}
            {availableTags.length === 0 && (
              <span className="text-xs italic text-muted-foreground">
                No tags yet — add one below.
              </span>
            )}
          </div>

          {activeTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="label-tracked-sm text-muted-foreground/70">
                ACTIVE
              </span>
              {activeTags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="gap-1 rounded-full pr-1"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => toggleTag(t)}
                    className="grid size-4 place-items-center rounded-full hover:bg-background"
                    aria-label={`Remove ${t}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a new tag + press Enter"
              className="w-full sm:w-64"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addNewTag()
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" onClick={addNewTag}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>
      </section>

      {/* ACCENT */}
      <section className="space-y-2">
        <div className="label-tracked-sm text-muted-foreground">ACCENT</div>
        <div className="flex flex-wrap items-center gap-3">
          {COVER_COLORS.map((c) => {
            const active = c === coverColor
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCoverColor(c)}
                className={cn(
                  "size-9 rounded-full border transition",
                  active
                    ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    : "border-border hover:scale-110"
                )}
                style={{ backgroundColor: c }}
                aria-label={`Cover color ${c}`}
                aria-pressed={active}
              />
            )
          })}
          <span className="ml-2 text-xs text-muted-foreground">
            Used as the post accent.
          </span>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {isUpdating ? "Saving…" : "Publishing…"}
            </>
          ) : (
            <>
              <Check className="size-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
}

export default PostEditor
