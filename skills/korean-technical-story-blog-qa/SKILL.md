---
name: korean-technical-story-blog-qa
description: >-
  QA and repair Korean technical storytelling blog drafts against the blog-writer,
  section-illustrator, architecture-diagram, and Codex imagegen/gpt5.5 contracts.
  Use when a draft, image plan, diagram plan, or generated asset may not follow the
  required blog production workflow.
---

# Korean Technical Story Blog QA

Use this skill after `korean-technical-story-blog-writer` creates or edits a blog post, or whenever the user asks whether a draft follows the blog/image/diagram workflow.

This is not a passive review-only skill by default. If the user asks for QA plus correction, the agent must repair the draft, prompts, diagram briefs, or asset plan in the same workflow and then run QA again.

Related skills that define the contract:

```text
v2/skills/korean-technical-story-blog-writer/SKILL.md
v2/skills/korean-technical-story-section-illustrator/SKILL.md
```

## Goal

Ensure the article package is publishable under the house workflow:

- Korean technical storytelling article body is 5,000+ Korean characters.
- Structure follows a TechBlogPosts / IT요즘-like readable flow.
- Opening starts with a concrete problem scene, not a textbook definition.
- Article uses one clear archetype, especially As-Is / Pain / To-Be for architecture or pipeline stories.
- Sections contain real product/technical substance.
- Image slots and diagram slots are present where the article needs them.
- Every image slot maps to one section moment.
- Every architecture/data-flow diagram slot has a diagram brief and one main message.
- Generated raster images use latest Codex `imagegen` / gpt5.5 path; override, downgrade, or substitute backends are not acceptable for publication assets.
- Generated images never originate from SVG, canvas, HTML screenshot, Python drawing, or code-rendered vector/card fallback, even if converted to WebP.
- Drafts pass an `im-not-ai` / `humanize-korean` naturalness check before publication readiness.
- Naturalness checks should follow `https://github.com/epoko77-ai/im-not-ai` (`humanize-korean`) quick-rules when the installed skill is unavailable.
- No fake metrics, fake incidents, fake dates, or unverifiable claims are introduced.
- Meta openings (`이 글은`, `이번 글에서는`, `오늘은`, definition-first starts, series-index announcements) are removed before readiness.
- Padding loops, repeated recap sections, generic benefit lists, and filler paragraphs that add no scene/constraint/trade-off/failure/consequence are rejected.
- Series posts do not reuse the same `##` sequence; repeated H2 signatures across sibling posts are a QA failure unless the user explicitly required a fixed template.
- Publication assets include `.imagegen-provenance.json` beside final WebP files proving Codex imagegen/gpt5.5 origin; missing or ambiguous provenance blocks publication.

## QA Inputs

Accept any of the following:

- article title and body
- Markdown draft with image/diagram slots
- image plan table
- diagram brief appendix
- generated image paths
- WebP conversion paths
- generation report/evidence
- existing DB post content or exported draft

If the article body is in a database, extract the draft first and run QA on the extracted Markdown. Do not mutate DB content until the repair plan is ready and the user/task explicitly includes mutation.

## Severity Levels

### BLOCKER

Must be fixed before the draft can be considered publishable.

Examples:

- article body is under 5,000 Korean characters
- topic/claim is generic SEO content, not technical storytelling
- opening starts with a definition instead of a concrete problem scene
- missing image/diagram slots when the post clearly needs them
- diagram slot has no `diagram_brief`
- generated images were produced with an older or wrong backend despite the Codex `imagegen` / gpt5.5 requirement
- generated images originated from SVG/canvas/HTML screenshots, Python drawing, code-rendered card/vector output, or rasterized versions of those sources, even if converted to PNG/WebP
- project-bound images exist only in provider/default generated image storage, not workspace paths
- fake metrics, fake incidents, fake architecture, or fake dates appear
- final content references missing image files
- DB/content insertion happened before draft/assets were ready
- article keeps AI-template/meta opening text such as `이 글은`, `이번 글에서는`, `오늘은`, a definition-first opener, or a series-index announcement
- generated image provenance is missing, not beside final WebP assets, or cannot prove Codex imagegen/gpt5.5 raster origin

### MAJOR

Should be fixed in the same QA repair pass.

Examples:

- article has fewer than 5 clear `##` sections or more than 7 without reason
- sections are summaries without concrete failure, trade-off, or consequence
- image prompt tries to summarize the whole article
- diagram prompt has 10+ major visual nodes or too many labels
- diagram lacks one main data/responsibility flow
- As-Is / Pain / To-Be article does not align current structure, pain points, and to-be changes
- heading names are too generic (`개요`, `구현`, `문제점`, `결론`)
- image prompts include long Korean text or full article title
- article repeats the same `##` heading sequence as sibling series posts without a user-required fixed template
- sections or paragraphs loop through recaps/generic benefits to inflate length
- 8,000+ character draft was only humanized globally, not section-by-section

### MINOR

Fix when editing the file anyway; otherwise report as polish.

Examples:

- paragraphs are too long for mobile readability
- image slot names are inconsistent
- title can be sharper
- final takeaway is slightly generic
- one prompt's avoid list is missing a minor style constraint

## QA Pipeline

Run these passes in order.

### 1. Package Boundary Check

Identify what is being checked:

```text
article only | article + prompts | article + prompts + generated assets | DB-ready package
```

Record available evidence:

- draft path or source
- article body
- image slots
- diagram slots
- image prompt appendix
- diagram brief appendix
- generated asset paths
- generation backend evidence

### 2. Article Contract Check

Verify:

- body is Korean unless requested otherwise
- body character count is 5,000+
- title is concrete, not vague
- opening shows a problem scene within the first 2-4 paragraphs
- article uses one primary archetype
- 5-7 `##` sections unless justified
- headings are descriptive
- ending states a changed judgment
- no fake metrics, fake dates, or ungrounded claims
- the draft passed an `im-not-ai` / `humanize-korean` pass or equivalent quick-rules check without factual drift
- if body is 8,000+ Korean characters, evidence shows the naturalness pass was done section-by-section and followed by a whole-article consistency read
- opening does not contain `이 글은`, `이번 글에서는`, `오늘은`, definition-first exposition, or a series-index announcement
- no padding loops: repeated recaps, generic benefit lists, mirrored paragraph templates, or filler sections that add no new evidence/scene/consequence

Body character count excludes:

- frontmatter
- `## 글 메타`
- image plan tables
- diagram brief appendix
- image/diagram prompt appendix
- QA notes

### 3. Structure and Readability Check

Verify the draft reads like a human technical story:

- context appears before solution
- first assumption is named
- failure signal is visible
- design/architecture change is explicit
- technical core answers what changed and why it mattered
- operational consequence is explained
- paragraphs are mostly 2-4 Korean sentences
- lists/tables clarify trade-offs rather than filling space
- when checking a series, compare the exact ordered `##` list with sibling drafts/posts and flag repeated H2 signatures

### 4. Architecture Diagram Check

Run this pass for any `DIAGRAM_SLOT` or architecture/pipeline article.

Required checks:

- article has an As-Is / Pain / To-Be spine when appropriate
- `DIAGRAM_SLOT` exists for architecture/data-flow sections that need a diagram
- each diagram has a `diagram_brief`
- `diagram_brief` includes scope, main question, main message, zones, bottleneck or design decision, flows, callouts, omit list, and text budget
- selected diagram type is justified by the article:
  - `before_after_architecture`
  - `data_pipeline_flow`
  - `bottleneck_and_decoupling`
  - `timeline_swimlane`
  - `parallelization_diagram`
  - `sequence_diagram`
  - `metaphorical_system_diagram`
- diagram prompt has one main message
- diagram prompt avoids full-article summary maps
- diagram has fewer than 10 major visual nodes
- diagram labels are short, usually 2-6 labels
- exact metrics appear only when present in source material
- no vendor logos unless explicitly requested

### 5. Image Slot and Prompt Check

For every `IMAGE_SLOT`, verify companion illustrator compliance:

- slot maps to one section moment, not the whole article
- `SECTION_ROLE` is present
- `SECTION_IDEA` is one sentence
- `VISUAL_METAPHOR` is one physical vignette
- `REQUIRED_SYMBOLS` has 3-6 symbols
- `SPECIFIC_MOMENT` is narrow and concrete
- `TECHNICAL_NOTE` is one sentence
- prompt forbids multi-panel storyboard composition
- prompt forbids the full article title
- prompt says Korean handwriting is texture only
- prompt limits labels to short labels

### 6. Generated Asset Check

Run this pass when image files exist or are expected.

Required checks:

- generation backend is latest Codex `imagegen` / gpt5.5; no override, downgrade, or substitute backend is acceptable for publication assets
- no silent fallback to `agbrowse web-ai`, chat-provider image generation, provider-cache-only assets, or older image-generation workflows
- no SVG, canvas, HTML screenshot, Python drawing, code-rendered vector/card source, or rasterized version of those sources exists anywhere in the generated image chain
- `.imagegen-provenance.json` exists beside final body images when publication/readiness is requested
- provenance file sits beside each final WebP asset and records `backend`, `model`, `sourceType`, source asset paths, and final WebP paths
- provenance `backend`/`model` proves latest Codex `imagegen` / gpt5.5; `sourceType` does not indicate SVG, canvas, HTML, Python, code-rendered, card, screenshot, provider-cache-only, or unknown origin
- generated file exists in the workspace for project-bound assets
- final article reference points to workspace asset path, not provider cache
- dimensions are approximately 16:9
- image is non-uniform / not blank
- accepted blog image has WebP version when needed
- illustration follows single-vignette scope
- diagram follows single-diagram-scope and is not overcrowded
- image does not rely on dense readable Korean text
- image does not contain full article title as dominant text
- naturalness check evidence exists for final text when the workflow includes publishing or readiness

Suggested verification script for local files:

```python
from pathlib import Path
from PIL import Image, ImageStat

for path in image_paths:
    p = Path(path)
    assert p.exists(), f"missing image: {p}"
    im = Image.open(p).convert("RGB")
    width, height = im.size
    ratio = width / height
    assert 1.65 <= ratio <= 1.9, f"not close to 16:9: {p} {im.size}"
    stat = ImageStat.Stat(im.resize((64, 64)))
    assert all(v > 5 for v in stat.stddev), f"blank or near-uniform image: {p}"
```

### 7. Blog Insertion Readiness Check

Only for DB/content insertion tasks.

Verify:

- image paths are final WebP paths under an allowed public path
- no `tmp/` path remains in final published body unless the task is preview-only
- body image Markdown uses final paths
- title/excerpt/category/tags are coherent
- no duplicate Markdown H1 repeats the page title
- no local-only generation report is inserted into article body
- strict blog validator can run if the repository provides one

## Repair Workflow

When QA finds failures and the user asked for correction, repair in this order.

### Repair 1. Body length and structure

If under 5,000 characters:

- expand with concrete scenes, trade-offs, failure modes, and operational consequences
- do not pad with generic definitions
- preserve the chosen archetype
- target 5,500-6,800 characters after repair
If body length was achieved through padding:
- delete repeated recap loops and generic benefit lists
- replace filler with concrete scenes, constraints, trade-offs, failure modes, or operational consequences
- do not add a new section unless it has distinct evidence or a distinct decision

If structure is weak:

- choose the right archetype
- rename generic headings
- move context before solution
- make the failure signal explicit
- make the design change explicit
- rewrite ending around changed judgment
If the opening is meta/template-like:
- remove `이 글은`, `이번 글에서는`, `오늘은`, definition-first exposition, and series-index announcements
- rewrite the first 2-4 paragraphs around a concrete scene, pressure, or failure signal
- keep the actual topic and claims intact

If the post is part of a series:
- extract the ordered `##` sequence from sibling posts or drafts when available
- reject repeated H2 signatures
- rename/resequence sections around the specific technical tension of this post

### Repair 2. Claims and evidence

If a claim is unsupported:

- remove it, soften it, or tie it to source evidence
- keep exact metrics only when present in source material
- never invent numbers to make the article more impressive

### Repair 3. Image slots

If image slots are missing or wrong:

- add 3-5 slots at section boundaries
- split whole-story image prompts into section-specific prompts
- produce companion illustrator variables for each slot
- regenerate prompt text with the companion template

### Repair 4. Diagram slots

If the article has architecture/data-flow content but no diagram workflow:

- add `DIAGRAM_SLOT`
- run diagram analysis
- choose one diagram type
- create `diagram_brief`
- create final diagram prompt
- remove excess nodes and labels

If diagram prompt is overcrowded:

- reduce to one main message
- keep fewer than 10 major nodes
- use one central flow or three-zone before/decision/after structure
- move extra details back into prose

### Repair 5. Generated assets

If images were generated with the wrong backend:

- mark as BLOCKER
- discard SVG/canvas/HTML/Python/code-rendered/card assets instead of rasterizing them as a workaround
- rebuild accepted prompts if needed
- regenerate through latest Codex `imagegen` / gpt5.5 path; do not use an override or substitute backend for publication assets
- verify and save selected outputs into the workspace
- write or verify `.imagegen-provenance.json` beside final WebP assets before publication QA, including `backend`, `model`, `sourceType`, source asset paths, and final WebP paths

If image files are missing or invalid:

- regenerate or relink
- convert accepted assets to WebP
- update references only after files exist

### Repair 6. Final package

After fixes:

- rerun QA from the top
- produce a clean QA report
- list repaired sections and remaining risks
- only then suggest DB/content insertion or final publication steps

## QA Report Format

Return this structure.

````markdown
## QA 판정

Status: PASS | PASS_WITH_NOTES | FAIL

## 핵심 결과

| 항목 | 결과 | 메모 |
| --- | --- | --- |
| 본문 5,000자 이상 | PASS/FAIL | ... |
| 글 구조 | PASS/FAIL | ... |
| 이미지 슬롯 | PASS/FAIL | ... |
| 다이어그램 슬롯 | PASS/FAIL | ... |
| Codex imagegen/gpt5.5 | PASS/FAIL/N/A | ... |
| `im-not-ai` / `humanize-korean` | PASS/FAIL/N/A | ... |
| 게시 준비 | PASS/FAIL/N/A | ... |

## 발견한 문제

| 심각도 | 위치 | 문제 | 수정 방식 |
| --- | --- | --- | --- |
| BLOCKER/MAJOR/MINOR | ... | ... | ... |

## 수정 작업

- ...

## 최종 확인

- [ ] 본문 5,000자 이상
- [ ] 5-7개 섹션
- [ ] 이미지/다이어그램 슬롯 정상
- [ ] 프롬프트 부록 정상
- [ ] 생성 이미지 백엔드/파일 검증 정상
- [ ] `im-not-ai` / `humanize-korean` 자연스러움 검증 정상
- [ ] fake metric 없음
````

If repairs were applied, include the final repaired article or file path. If no repairs were needed, state that no mutation was performed.

## Pass Criteria

`PASS` requires:

- no BLOCKER or MAJOR issues
- article body 5,000+ characters
- image/diagram plan complete for the article type
- all provided/generated assets valid
- Codex `imagegen` / gpt5.5 requirement satisfied when generation occurred
- generated image directories include valid `.imagegen-provenance.json` when image-bearing posts are publication-ready
- `im-not-ai` / `humanize-korean` naturalness requirement satisfied for publication/readiness workflows

`PASS_WITH_NOTES` allows only MINOR polish items.

`FAIL` means at least one BLOCKER or MAJOR remains. Do not present a failed package as ready to publish.

## Production Audit Blockers

In addition to draft QA, published posts on blog.ponslink.com fail QA when:

- Korean body character count `< 5000`
- fewer than 2 body markdown images (cover is separate)
- any referenced image path missing on disk
- any two body images are byte-identical
- final public references are non-WebP when a WebP path is expected
- title hangul-token overlap with body is `< 0.3` without an explicit series-index exception
- deploy left `/tistory/...` returning HTML 404

Use `v2/skills/pons-blog-production/SKILL.md` for the full audit → repair → deploy → Drive backup loop.
