---
name: pons-blog-production
description: >-
  blog.ponslink.com production pipeline: full post audit, structure/title repair,
  Codex imagegen raster generation, WebP conversion, original purge, DB/public
  apply, live verify, and Google Drive backup via rclone gdrive. Use for batch
  rewrite, missing/duplicate image repair, and publish readiness on PonsLink blog.
---

# Pons Blog Production

blog.ponslink.com 운영 글 전수 감사·수리·이미지 재생성·배포·백업을 한 계약으로 묶는다.

Companion skills (must read when relevant):

```text
v2/skills/korean-technical-story-blog-writer/SKILL.md
v2/skills/korean-technical-story-section-illustrator/SKILL.md
v2/skills/korean-technical-story-blog-qa/SKILL.md
```

## Non-negotiables

1. **Source of truth for live content**
   - Local DB: `v2/db/custom.db`
   - Remote DB: `/opt/ponslink-blog-next/shared/db/custom.db`
   - Remote static: `/opt/ponslink-blog-next/current/public/tistory/`
   - Shared image backup on server: `/opt/ponslink-blog-next/shared/public-assets/tistory/`
2. **Images are not Google Drive at runtime.** Drive is offline backup only. Live pages serve local WebP under `/tistory/...`.
3. **Raster only via latest Codex `imagegen` / gpt5.5.** No SVG/canvas/HTML/Python card fallback, even if converted to WebP.
4. **Final public assets are WebP only.** Original PNG/JPEG sources are converted then deleted from publish paths.
5. **Every slot is a distinct scene.** Byte-identical body images are a blocker.
6. **Title must match body tension.** Bracket series tags are allowed; the bare title must appear as the actual problem the body solves.
7. **Do not deploy broken public trees.** After every release, `cover.webp` + body refs must HTTP 200 as `image/webp`.

## Canonical image layout

Per slug directory:

```text
public/tistory/body-images/<slug>/
  cover.webp
  01-problem-moment.webp
  02-failure-signal.webp
  03-boundary-change.webp          # optional 4th/5th slots as needed
  04-technical-principle.webp      # optional
  .imagegen-provenance.json
```

DB:

- `Post.featuredImage` = `/tistory/body-images/<slug>/cover.webp`
- Body markdown embeds only the body slots, never re-embeds cover unless the article intentionally discusses the cover art.

Legacy aliases still accepted during repair:

- `image-01-problem-moment.webp` → normalize to `01-problem-moment.webp`
- `/tistory/core-story/imagegen-covers/<slug>-cover-imagegen.webp` → migrate into body-images layout when touching the post

## Pipeline

```text
1. AUDIT
2. PLAN (priority queue)
3. REPAIR BODY (structure / title / length)
4. REPAIR IMAGES (dedupe / regenerate / webp / purge originals)
5. APPLY (local DB + public paths)
6. QA (skill QA + file/http checks)
7. DEPLOY (rsync public + remote DB + service restart if needed)
8. BACKUP (rclone gdrive)
9. LEDGER (write audit receipt)
```

### 1. AUDIT

For every `status='published'` post compute:

| Signal | Blocker if |
| --- | --- |
| `slop` template padding | P0 헤딩/필드블록/제목메아리 루프 1회라도 |
| `exact_dup` | 동일 비트리비얼 문장 3회+ |
| `title_echo` | 제목 전체 `「…」` 본문 3회 초과 |
| `h2` count | blocker only when the chosen archetype is incomplete or sections were added as padding |
| markdown image count | fewer than 2 body images only when the article genuinely needs visual support |
| missing files | any featured/body path 404 on disk |
| body hash dups | any two body images same MD5 |
| cover==body hash | cover equals a body image |
| title weak | <30% of title hangul tokens appear in body |
| meta open | body starts with `이 글은` / `이번 글에서는` / `오늘은` |
| `kc` Korean chars | advisory only; never a length floor and never a reason to pad |

Write JSON receipt to:

```text
v2/tmp/blog-audit-<YYYY-MM-DD>.json
```

### 2. PLAN

Sort by score:

```text
missing(+5) + slop(+5) + exact_dup(+4) + body_dup(+4) + few_img(+3) + title_echo(+3) + title_weak(+2) + few_h2(+2) + meta_open(+2)
```

Process in batches of 5–15. Never claim “all posts fixed” until audit residual is zero or explicitly deferred with reasons.
**Never pad length with repeated principles, boundary tables, or title-echo loops.**


### 3. REPAIR BODY

#### Editorial article contract

Use `2026-06-16-ponslink-01-why-i-came-back-to-connection` as a prose benchmark, not a rigid template:

1. Opening scene or observation before solution when the chosen genre needs one
2. The smallest complete set of topic-specific sections
3. Final `## 마치며` for retrospective posts unless the user explicitly chooses another form
4. Continuous retrospective prose; no poem one-liners, generated bridge paragraphs, or repeated recap blocks
5. Prefer 1,200–3,500 hangul when the source supports it; no character floor and no padding
6. Preserve existing WebP paths; use only as many distinct body slots as the story earns

Structure audit signals (publish blockers when residual >0 on full retrospectives):
`no_closing`, `template_h2`, `poem`, `thin_open`, `shared_h2_signature`.

Repair script: `scripts/reshape-to-ref-structure.py` (plus series beat rewrites when substance is hollow).


Use `korean-technical-story-blog-writer` contracts:

- **No Korean-character floor.** Prefer 1,200–3,500 chars of real substance when the source supports it; shorter is fine if the judgment is complete.
- concrete problem opening when the genre calls for a retrospective, short paragraphs, one claim said once
- smallest complete set of descriptive `##` sections for the chosen archetype
- judgment-change ending without template recap blocks
- strip P0 slop first (`scripts/strip-blog-slop-padding.py`), then rewrite thin cores only when the judgment is incomplete, then optional `im-not-ai` / humanize pass for diction only

Banned body patterns (instant fail):

- `이 판단이 제품 문장으로 남는 방식`
- `경계 표` / `운영 체크리스트` / `현장 기준으로 다시 고정하는 원칙` / `다음에 다시 만질 때` as filler sections
- `이 원칙을 「제목」에 대입하면…` loops
- GENERIC_BEATS / FIELD_BLOCKS length padding

Title repair rules:

- Keep series tag `[PonsLink]` / `[PonsWarp]` when present.
- Bare title must name the actual tension in the body.
- If title is generic (`개발기`, `정리`, `회고`) rewrite to decision-shaped title.


### 4. REPAIR IMAGES

Order of operations per post:

1. **Dedupe without regen when possible**
   - If directory has extra unique WebP not referenced, reassign body slots to unique hashes.
2. **Regenerate missing/duplicate/weak slots** via companion illustrator + Codex imagegen.
3. Save originals under `tmp/imagegen/<slug>/` first.
4. Convert accepted assets:

```python
from PIL import Image
Image.open(src_png).save(dst_webp, "WEBP", quality=92, method=6)
```

5. Install only WebP into `public/tistory/body-images/<slug>/`.
6. **Purge originals from publish paths** (PNG/JPEG next to final WebP). Keep only:
   - final WebP slots
   - `.imagegen-provenance.json`
7. Update markdown image paths and `featuredImage`.
8. Refuse publish if any two body WebP share MD5.

Provenance minimum:

```json
{
  "backend": "codex imagegen",
  "model": "gpt5.5",
  "sourceType": "codex-imagen-raster",
  "slug": "<slug>",
  "assets": {
    "cover": "cover.webp",
    "body": ["01-problem-moment.webp", "02-failure-signal.webp"]
  }
}
```

### 5. APPLY

- Mutate local `v2/db/custom.db` first.
- Keep readingTime in sync when body changes.
- Do not leave `tmp/` paths in published content.

### 6. QA

Run `korean-technical-story-blog-qa` gates plus:

```text
- all referenced paths exist
- all referenced paths are .webp
- no body hash collisions
- sample HTTP 200 image/webp on live after deploy
```

### 7. DEPLOY

Minimum safe apply:

```bash
# assets
rsync -a v2/public/tistory/ ponslink:/opt/ponslink-blog-next/current/public/tistory/
rsync -a v2/public/tistory/ ponslink:/opt/ponslink-blog-next/shared/public-assets/tistory/

# db (backup first)
ssh ponslink 'cp -a /opt/ponslink-blog-next/shared/db/custom.db /opt/ponslink-blog-next/shared/db/custom.db.bak-$(date +%Y%m%d%H%M%S)'
scp v2/db/custom.db ponslink:/opt/ponslink-blog-next/shared/db/custom.db
ssh ponslink 'sudo systemctl restart ponslink-blog-next.service'
```

After every deploy that touches `public/`, verify at least one cover and one body image over HTTP.

If a release ships without the shared body-image set, restore from:

```text
/opt/ponslink-blog-next/shared/public-assets/tistory/
```

before calling the release healthy.

### 8. BACKUP (Google Drive)

Use local rclone remote `gdrive:`.

Default destination:

```text
gdrive:07_Backups/blog.ponslink.com/<YYYY-MM-DD>/
  db/custom.db
  tistory/          # webp + provenance
  audit/blog-audit.json
  posts/<slug>.md   # optional export
```

Commands:

```bash
STAMP=$(date +%Y%m%d)
DEST="gdrive:07_Backups/blog.ponslink.com/${STAMP}"
rclone copy v2/db/custom.db "$DEST/db/" --checksum
rclone copy v2/public/tistory "$DEST/tistory/" --checksum
rclone copy v2/tmp/blog-audit-*.json "$DEST/audit/" --checksum
```

If token refresh fails, stop and report; do not skip backup silently when the user asked for Drive backup.

### 9. LEDGER

Append a short receipt under:

```text
v2/tmp/blog-production-ledger.jsonl
```

Fields: `timestamp`, `batch`, `slugs`, `actions`, `audit_before`, `audit_after`, `deployed`, `backed_up`.

## Batch policy for readability repair

Current direction (2026-07-19):

- Length is not a quality proxy. 5,000-char padding is **forbidden**.
- Strip template slop first, then tier cores (T0 keep / T1 humanize / T2 partial rewrite / T3 full rewrite).
- Image uniqueness and WebP paths remain blockers.

Recommended order:

1. Deterministic slop strip (`scripts/strip-blog-slop-padding.py`)
2. Image dedupe / regenerate when needed
3. Thin-core / unreadable cores rewritten by series
4. im-not-ai diction pass after structure is clean
5. Drive backup snapshot after each major batch

Do not expand all 147 with identical `##` sequences. Repeated identical sections across siblings are a QA failure.


## Scripts

Prefer repo scripts when present:

```text
v2/scripts/audit-blog-production.py
v2/scripts/strip-blog-slop-padding.py
v2/scripts/repair-body-image-dedupe.py
```

If scripts are missing, implement the same checks inline rather than skipping the audit.

## Done definition

A batch is done only when:

1. Touched slugs pass QA blockers.
2. Local and remote DB content match for those slugs.
3. Referenced images are WebP, unique, and HTTP 200 on live.
4. Originals purged from publish paths for touched assets.
5. Drive backup attempted (or explicit failure reported).
6. Audit JSON/ledger updated.
