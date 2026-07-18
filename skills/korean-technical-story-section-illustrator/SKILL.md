---
name: korean-technical-story-section-illustrator
description: >-
  Build and optionally generate hand-drawn 16:9 illustrations for Korean technical
  storytelling blog posts. Use when a blog section needs a founder field-note style
  image based on one technical moment, not a whole-story storyboard.
---

# Korean Technical Story Section Illustrator

Use this skill when writing or editing a Korean technical storytelling blog post and the user needs an image prompt or generated image for the body of the article.

The core rule:

```text
This image must show only ONE section of the story, not the whole story.
Depict a single focused vignette, not multiple panels.
Do not split the canvas into 3 or 4 sections.
```
No SVG source art is allowed. The final blog image must come from Codex Imagen raster generation, not from SVG/canvas/HTML/Python/code-rendered fallback later converted to WebP. The old generator/card workflow is forbidden as both an intermediate source and a final asset path.

## Goal

Create a finished image-generation prompt, and when requested/available generate the image with the latest Codex `imagegen` / gpt5.5 Imagen path.

The image should feel like:

- a technical diary page
- a founder's field note
- a hand-drawn product failure explanation
- a Korean engineering storytelling illustration

It must not feel like:

- a complete infographic for the whole article
- a 3-4 panel storyboard
- a clean SaaS vector graphic
- a UI screenshot
- a marketing logo asset

## Inputs

Infer these from the article, section, title, or user brief. Ask only when the section cannot be identified.

| Variable | Meaning |
| --- | --- |
| `SECTION_ROLE` | The role this image plays in the post. |
| `SECTION_IDEA` | One sentence explaining the section's technical idea. |
| `VISUAL_METAPHOR` | One physical scene that represents the idea. |
| `REQUIRED_SYMBOLS` | 3-6 visual objects that must appear. |
| `SPECIFIC_MOMENT` | The exact moment the image should show. |
| `TECHNICAL_NOTE` | One sentence stating the technical lesson. |

Recommended `SECTION_ROLE` values:

- `Problem moment` / `문제의 시작`
- `Failed naive idea` / `순진한 가정`
- `Broken edge case` / `실패가 드러난 순간`
- `Corrected product boundary` / `제품 경계가 바뀐 순간`
- `Technical principle` / `기술 원칙`
- `Failure recovery` / `실패 복구`
- `Calmer operating flow` / `안정된 운영 흐름`
- `User-facing anxiety` / `사용자 불안`
- `Design criterion change` / `기준이 바뀐 순간`
- `Product separation moment` / `별도 제품으로 분리된 순간`

## Process

1. Select one section or moment from the post. Do not visualize the whole article.
2. Reduce that section to one short technical idea.
3. Translate the technical idea into one physical metaphor.
4. Choose 3-6 required symbols. More than 6 usually turns the image into clutter.
5. Write one exact `SPECIFIC_MOMENT` using: `the moment [subject] [action] because [constraint]`.
6. Write one `TECHNICAL_NOTE` that explains the lesson without adding a new scene.
7. Insert the variables into the standard prompt template.
8. Check the quality gates before generating.
9. If generating, save under `tmp/` first and verify dimensions/non-uniformity before proposing insertion into blog content.
10. Before publication or handoff to blog QA, ensure the final body-image directory contains `.imagegen-provenance.json` beside the WebP asset. Missing provenance is a blocker, not a note.

## Technical Concept Visual Dictionary

| Technical concept | Prefer these visual metaphors | Avoid |
| --- | --- | --- |
| WebRTC direct transfer | dotted bridge between browsers, file crate bypassing server, direct arrow from browser A to browser B | server carrying file, cloud storage box holding file, database receiving file |
| Signaling | matchmaker desk, invitation cards, offer/answer/ice note cards, stamped entry ticket | delivery truck, file warehouse |
| Chunking | paper slices, numbered cards, folded paper pieces, conveyor belt of chunks | one huge indivisible block when flow control matters |
| Backpressure | valve, pressure gauge, narrow pipe, capacity bucket, slow steady arrows | speedometer as hero object |
| ACK | rhythm marks, check stamps, returning arrows, metronome ticks, brake signal | decorative checkmarks only |
| Retry / Resume | loop arrow, checkpoint flag, last safe chunk, repair patch, resumed progress line | restarting from zero unless criticizing that failure mode |
| Browser memory limit | small water bucket, capacity line, overflow splash, cramped notebook margin | infinite storage warehouse |
| Server does not own file | server hands away from file, entry-ticket booth, guidepost, file bypassing server | server holding or transporting file |

## Role Strategies

### Problem moment

Show the first user-visible problem. Good metaphors: a large file box shaking a meeting-room table; a heavy load on a small bridge. Do not show the solution yet.

### Failed naive idea

Show the first assumption breaking. Good metaphors: a MAX speed lever, paper chunks moving too fast, overflowing memory bucket, scratched progress bar. Do not also show the stable final flow.

### Corrected product boundary

Show a responsibility boundary changing. Good metaphors: server stamps a ticket but does not touch the file; matchmaker introduces browsers while the crate bypasses the desk. Never make the server look like it stores or carries the file.

### Technical principle

Show one principle as a physical device. Good metaphors: backpressure valve, ACK metronome, chunk queue conveyor, memory bucket capacity line. Do not add too many system components.

### Failure recovery

Show where the system stopped and how it can resume. Good metaphors: 98% scratched progress bar, retry loop to last checkpoint, checked chunk stepping stones, resume flag. Do not make the flow look failure-free.

### Calmer operating flow

Show the cleaned-up operation. Good metaphors: slow regular arrows, chunks passing through a gate, ACK marks landing in rhythm. Do not redraw the earlier failure as the main scene.

## Standard Prompt Template

```text
Create one finished 16:9 horizontal blog illustration for a Korean technical storytelling article.

This image must show only ONE section of the story, not the whole story.
Section role: {SECTION_ROLE}
Section idea: {SECTION_IDEA}

Visual metaphor:
{VISUAL_METAPHOR}

Required visual symbols:
{REQUIRED_SYMBOLS}

Scene direction:
Depict a single focused vignette, not multiple panels.
Use one central metaphor and one main action.
Do not show the full product journey.
Do not include problem → failure → solution → stable flow all together.
Only show this specific moment: {SPECIFIC_MOMENT}

Technical storytelling note:
{TECHNICAL_NOTE}

Style:
16:9 horizontal blog body illustration, 1600x900 composition.
Warm off-white notebook paper background.
Black fountain-pen line art with visible pen pressure.
Imperfect hand lettering, blue-pencil planning marks, sepia sticky notes.
Sparse muted watercolor wash.
Thin black ink outlines, uneven cross-hatching, small arrows, taped scraps, notebook ruling, margin notes, smudges.
Founder’s field-note feeling, like a product engineer explaining one hard lesson from a failed implementation.

Composition:
One clear central object or interaction.
Enough whitespace around the edges for blog cropping.
High contrast readable silhouettes.
Use small Korean handwritten marks as texture only.
Do not rely on legible long text.
Use at most 2–4 short technical labels if needed.

Avoid:
photorealistic people, glossy 3D render, clean SaaS vector illustration, real brand logos, UI screenshots, dense readable paragraphs, meme style, overly cute mascot.
Do not put the full article title in the image.
Do not create multiple storyboard panels.
Do not split the canvas into 3 or 4 sections.
Do not output SVG, vector source art, HTML/canvas screenshot style, Python-drawn card style, or code-rendered infographic style.
```
Backend rule: do not ask for or accept SVG, vector source files, HTML/canvas screenshots, Python-drawn cards, or code-rendered infographics. The source image must be Codex Imagen raster output.

## Short Prompt Template

Use only when speed matters and the section is already clear.

```text
Create one finished 16:9 horizontal blog illustration for a Korean technical storytelling article.

Show only one focused section, not the whole story.
Section: {SECTION_ROLE}
Main idea: {SECTION_IDEA}

Draw a single hand-drawn notebook vignette showing:
{VISUAL_METAPHOR}

Must include:
{REQUIRED_SYMBOLS}

Do not create multiple panels.
Do not show the full journey.
Do not include the article title.
Use only a few short handwritten technical labels; use abstract Korean handwriting as texture.

Style:
warm off-white notebook paper, black fountain-pen line art, visible pen pressure, blue-pencil planning marks, sepia sticky notes, sparse muted watercolor wash, uneven cross-hatching, taped scraps, smudges, founder’s field-note tone.

Avoid:
photorealism, glossy 3D, clean SaaS vector style, real logos, UI screenshots, dense readable text, cute mascot style.
Do not output SVG, vector source art, HTML/canvas screenshot style, Python-drawn card style, or code-rendered infographic style.
```

## Quality Gates

Before sending the prompt or generating an image, verify:

- The image represents one section only.
- It does not request problem → failure → solution → stable flow all in one canvas.
- It has one central metaphor and one main action.
- `REQUIRED_SYMBOLS` has 3-6 items.
- The prompt says not to include the full article title.
- The prompt says Korean handwriting is texture only.
- The prompt limits labels to 2-4 short technical labels.
- The style block includes notebook paper, fountain-pen line art, blue-pencil marks, sepia sticky notes, sparse watercolor, and field-note tone.
- The prompt forbids multiple storyboard panels and 3-4 section canvas splits.

## Codex Imagegen Generation Workflow

Use Codex `imagegen` for final raster image generation when the user asks to generate, not just draft the prompt.

When this skill is invoked as the companion of `korean-technical-story-blog-writer`, it MUST use the latest Codex `imagegen` skill/version available in the current Codex skill runtime. As of 2026-07-02 KST, treat the required image model/runtime as **gpt5.5 / latest Codex Imagen path**.

Rules:

- Use the latest Codex `imagegen` / gpt5.5 Imagen path for final raster generation.
- Do not use `agbrowse web-ai`, chat-provider image paths, provider-cache-only assets, synthetic screenshots, or older image-generation workflows as final or intermediate generation sources.
- Do not silently downgrade to older image-generation workflows.
- Do not create or accept SVG, HTML/canvas screenshots, Python-drawn cards, code-rendered vector infographics, or rasterized versions of those sources, even as an intermediate source later converted to WebP.
- If Codex `imagegen` is unavailable, stop and report the unavailable required backend.
- Generate into a preview/local path first, then copy or move selected project-bound assets into the workspace.
- Never reference an image in blog content while it only exists in a provider/default generated-images location.
- Write `.imagegen-provenance.json` next to final project-bound WebP assets with `backend`, `model`, `sourceType`, prompt/generation id when available, source asset paths, and selected final WebP paths.
- `sourceType` must identify Codex imagegen/gpt5.5 raster generation. Values that imply `svg`, `canvas`, `html`, `python`, `code-rendered`, `card`, `screenshot`, `provider-cache-only`, or unknown origin fail the contract.

Generation flow:

```text
1. Build the final single-section prompt.
2. Invoke Codex imagegen latest path for the prompt.
3. Inspect the generated image.
4. Verify dimensions, non-uniformity, prompt adherence, text density, and single-vignette scope.
5. Save the accepted image into `tmp/` or the intended project asset path.
6. Convert accepted assets to WebP for blog use when needed.
7. Write `.imagegen-provenance.json` into the final body-image directory before publication QA.
```

Verify output before using it:

- file exists
- dimensions are close to 16:9
- image is non-uniform, not blank
- content follows single-vignette rule
- no accidental full article title or dense text dominates the image
- if used with the blog writer skill, generation used the required latest Codex `imagegen` / gpt5.5 path
- source asset is not SVG/canvas/HTML/code-rendered output masquerading as an image

Convert to WebP for blog use when needed:

```python
from PIL import Image
Image.open('tmp/<slug>-section-illustration.png').save('tmp/<slug>-section-illustration.webp', 'WEBP', quality=92, method=6)
```

Do not insert into the production database or post body until the user asks for insertion or the workflow explicitly includes content mutation.

## Recommended Response Format

````markdown
## 이미지 프롬프트

```text
[완성 프롬프트]
```

## 사용한 변수

| 변수 | 값 |
| --- | --- |
| SECTION_ROLE | ... |
| SECTION_IDEA | ... |
| VISUAL_METAPHOR | ... |
| REQUIRED_SYMBOLS | ... |
| SPECIFIC_MOMENT | ... |
| TECHNICAL_NOTE | ... |

## 확인 포인트

- 한 섹션만 표현함
- 다중 패널 금지
- 긴 텍스트 금지
- 필수 상징 포함
````

If image generation ran, also include local artifact paths and verification results.

## Failure Modes

### Model creates multiple panels

Cause: prompt included too much article summary or mentioned problem/failure/solution/stable flow together.

Fix:

- Move `This image must show only ONE section` to the top.
- Repeat `Do not create multiple storyboard panels` near the end.
- Make `SPECIFIC_MOMENT` more concrete.

### Text inside image is broken

Cause: prompt demanded long Korean text or full title.

Fix:

- Require handwritten marks as texture only.
- Limit labels to 2-4 short labels.
- Do not rely on legible long text.

### Image becomes too cute

Cause: words like browser character/server character were interpreted as mascot.

Fix:

- Add `restrained field-note tone`.
- Add `readable silhouettes, not cartoon mascots`.
- Keep `not overly cute mascot` in Avoid.

### Image becomes SaaS vector style

Cause: prompt used words like clean diagram, product architecture illustration.

Fix:

- Emphasize fountain-pen line art, visible pen pressure, imperfect hand lettering, uneven cross-hatching, notebook ruling, taped scraps.

### Server appears to carry the file

Cause: server, transfer, and file were placed too close together.

Fix:

- Add `server hands away from file`.
- Add `file bypassing the server`.
- Add `server only stamps entry ticket`.

## WebP Publish And Original Purge

For blog.ponslink.com production assets:

1. Generate raster originals via Codex imagegen into `tmp/imagegen/<slug>/`.
2. Convert accepted files to WebP (`quality=92`, `method=6`).
3. Install only WebP into `public/tistory/body-images/<slug>/` using canonical names:
   - `cover.webp`
   - `01-problem-moment.webp`
   - `02-failure-signal.webp`
   - `03-boundary-change.webp` (and later slots if needed)
4. Write `.imagegen-provenance.json` beside the WebP files.
5. **Delete publish-path originals** (PNG/JPEG) after WebP verification succeeds.
6. Reject the batch if any two body WebP files share the same MD5.
7. Prefer reusing an existing unique extra WebP in the slug directory over regenerating, only when the extra image still matches the intended section role.

Canonical companion orchestration skill:

```text
v2/skills/pons-blog-production/SKILL.md
```
