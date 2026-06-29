# Pons Portfolio Design System

## 1. Atmosphere & Identity

Pons feels like a quiet field notebook for technical product work: warm paper, sparse metadata, and editorial writing blocks that let implementation evidence breathe. The signature is a warm editorial archive: serif headlines, mono overlines, clay accents, and border-first cards on a paper-grain surface.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | `--background` | `oklch(0.985 0.004 85)` | `oklch(0.16 0.005 75)` | Page background |
| Surface/card | `--card` | `oklch(0.995 0.002 85)` | `oklch(0.2 0.006 75)` | Cards and elevated surfaces |
| Surface/muted | `--muted` | `oklch(0.955 0.006 85)` | `oklch(0.26 0.006 75)` | Soft panels and thumbnail backplates |
| Text/primary | `--foreground` | `oklch(0.21 0.008 75)` | `oklch(0.95 0.004 85)` | Headlines and body |
| Text/secondary | `--muted-foreground` | `oklch(0.5 0.008 75)` | `oklch(0.68 0.008 75)` | Metadata and captions |
| Border/default | `--border` | `oklch(0.9 0.006 85)` | `oklch(1 0 0 / 10%)` | Cards, dividers, outlines |
| Accent/clay | `--clay` | `oklch(0.62 0.13 52)` | `oklch(0.7 0.14 55)` | Links, selected chips, hover emphasis |
| Focus/ring | `--ring` | `oklch(0.5 0.008 75)` | `oklch(0.6 0.008 75)` | Focus outlines |

### Rules

- Use Tailwind semantic tokens (`bg-background`, `text-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`) instead of raw colors.
- Use clay only for selected states, text links, and small hover emphasis.
- Prefer muted surfaces and borders over heavy shadows.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | `text-5xl` to `text-7xl` | 400 serif | 0.95-1.05 | -0.02em | Page heroes |
| H1 | `text-4xl` to `text-5xl` | 400 serif | 1.05 | -0.02em | Article titles |
| H2/Card title | `text-xl` to `text-3xl` | 400 serif or 500 sans | tight | -0.02em for serif | Archive cards |
| Body/lg | `text-lg` to `text-xl` | 400 | relaxed | normal | Leads and excerpts |
| Body | `text-base` | 400 | relaxed | normal | Article copy |
| Body/sm | `text-sm` | 400 | relaxed | normal | Card summaries |
| Caption | `text-xs` | 400-500 | normal | normal | Metadata |
| Overline | `.label-tracked`, `.label-tracked-sm` | 500 mono | normal | wide | Section labels and categories |

### Font Stack

- Primary: `var(--font-geist-sans)`
- Mono: `var(--font-geist-mono)`
- Serif display: `var(--font-serif)`

### Rules

- Use serif for editorial hierarchy and sans for dense metadata.
- Body text never drops below `text-sm`.
- Use mono only for labels, indices, and compact archive metadata.

## 4. Spacing & Layout

### Base Unit

All spacing follows Tailwind's 4px-based scale.

| Token | Value | Usage |
|-------|-------|-------|
| `1` | 4px | Inline icon gaps |
| `2` | 8px | Compact metadata groups |
| `3` | 12px | Small card internals |
| `4` | 16px | Row padding and form rhythm |
| `5` | 20px | Archive row/card padding |
| `6` | 24px | Section controls |
| `8` | 32px | Page gutters on desktop |
| `10` | 40px | Article media separation |
| `16` | 64px | Page header rhythm |
| `24` | 96px | Wide hero rhythm |

### Grid

- Max content width: `max-w-6xl`
- Breakpoints: Tailwind defaults (`md`, `lg`, `xl`)
- Archive views use the existing board, grid, timeline, and compact modes.

### Rules

- Use existing rounded card radii (`rounded-2xl`, `rounded-3xl`) for archive surfaces.
- Keep image thumbnails inside fixed aspect-ratio containers to prevent CLS.

## 5. Components

### Archive Card

- **Structure**: clickable `Link` card with category/date/read metadata, title, excerpt, tags, and optional thumbnail.
- **Variants**: board row, grid card, timeline card, compact row.
- **Spacing**: `p-5`/`p-7`/`p-8`, `gap-2` to `gap-5`.
- **States**: hover uses muted background and clay title emphasis; focus remains native/semantic through link focus.
- **Accessibility**: thumbnail `alt` repeats the post title only when image is meaningful.
- **Motion**: hover transitions use color and small icon transform only.

### Article Hero Image

- **Structure**: `figure` wrapping one `img` sourced from `featuredImage`.
- **Variants**: full article and in-panel reader.
- **Spacing**: `mt-10`, border, rounded container.
- **Accessibility**: `alt` uses the article title.
- **Rule**: if an article has a featured image, the same image should not be repeated in the Markdown body.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 150ms | ease-out | Color and small icon transitions |
| Standard | 300-500ms | ease-in-out | Card underline expansion |

### Rules

- Animate `transform`, `opacity`, and color only.
- Every clickable archive card needs hover/focus affordance.
- Respect current reduced-motion behavior; do not add JS animation for archive thumbnails.

## 7. Depth & Surface

### Strategy

Mixed, but border-first: use borders and muted tonal shifts as the default; reserve `shadow-sm` for small summary panels already present in the codebase.

| Type | Token/Class | Usage |
|------|-------------|-------|
| Default border | `border border-border` | Cards, article media, archive panels |
| Soft panel | `bg-muted/40`, `bg-background/75` | Headers, filters, hover rows |
| Paper texture | `.paper-grain` | Page background atmosphere |

