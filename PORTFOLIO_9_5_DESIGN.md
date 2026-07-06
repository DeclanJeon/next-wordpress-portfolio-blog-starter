# Portfolio 9.5 Design Contract

- Status: Active local design contract
- Updated: 2026-07-06
- Related: `PORTFOLIO_9_5_WORK_ORDER.md`, `WRITING_PROJECTS_REDESIGN_PLAN.md`, `.omx/ultragoal/brief.md`

## 1. Positioning target

The portfolio should read as:

> A browser-service/product engineer who turns broken connection, transfer, and document workflows into operated product systems.

Korean public copy should keep the existing editorial voice but make the role explicit:

> 마찰을 흐름으로 바꾸는 개발자.
> WebRTC, 브라우저 파일 전송, 문서 자동화처럼 사용자가 막히는 지점을 운영 가능한 제품 흐름으로 설계하고 구현합니다.

## 2. 9.5 attractiveness definition

A 9.5 portfolio is not merely pretty. It lets a reviewer answer these in under 30 seconds:

1. Who is this person?
2. What kind of engineering problem should I trust them with?
3. What are the 2-3 strongest projects?
4. Can I inspect live work, code, or evidence immediately?
5. Can I contact or validate the person immediately?
6. Do the writing and notes strengthen the portfolio instead of burying it?

## 3. Benchmark synthesis

### Lee Robinson pattern

Use:
- concise role;
- current authority;
- writing/code/contact links.

Do not copy:
- overly minimal structure without proof, because this portfolio does not have the same external fame baseline.

### Brittany Chiang pattern

Use:
- explicit role and specialization;
- top-level social/proof links;
- projects with concrete outcomes;
- clear resume/contact path.

Do not copy:
- purely frontend/design-system positioning, because this portfolio’s stronger lane is browser-service/product systems.

### Josh Comeau pattern

Use:
- content authority through structured categories;
- article titles that promise specific learning value.

Do not copy:
- course/educator-first hierarchy unless the site shifts away from portfolio.

### Maggie Appleton pattern

Use:
- memorable category architecture;
- digital garden as secondary identity proof;
- current context and exploratory domain clarity.

Do not copy:
- garden-first navigation on hiring surfaces.

## 4. Information architecture

### Home `/`

Role:
- First impression and routing surface.

Required first-screen order:
1. Small identity label.
2. H1 with corrected spacing.
3. Role-specific value paragraph.
4. Primary CTA: Work.
5. Secondary CTA: Writing.
6. Trust links: GitHub, Contact, Resume if available.
7. No visitor-visible writer/admin/login affordance.

### Work `/work`

Role:
- Hiring/proof surface.

Required order:
1. H1 with corrected spacing.
2. Short proof-oriented intro.
3. Trust/action strip.
4. PonsLink/PonsWarp main line.
5. Project cards with evidence capped.
6. Supporting projects.

### Writing `/writing`

Role:
- Selected proof through writing.

Required order:
1. H1 with corrected spacing.
2. Explain that selected writing is the guided start.
3. Selected Writing groups.
4. Archive filters/list.

### Projects archive `/writing/projects`

Role:
- Secondary archive, not hiring landing.

Required order:
1. H1 with corrected spacing.
2. Explicit archive disclaimer.
3. Return CTAs to Work and Selected Writing.
4. Collection cards with proof-oriented descriptions.

## 5. Copy rules

### Keep

- Warm editorial tone.
- Korean first, English labels as interface accents.
- PonsLink/PonsWarp as the main line.
- Problem/Decision/Proof language.

### Avoid

- Raw 글 수 as the dominant proof.
- Admin/login words in visitor chrome.
- Abstract-only positioning.
- Fake impact metrics.
- More than 3 evidence article links on project cards.

### Label patterns

Use:
- `근거 기록 68편`
- `운영 회고 23편`
- `검증 노트 22편`
- `Live service`
- `Code / Repo`
- `Architecture note`
- `Contact`

Avoid:
- `전체 68편` without explanation.
- `Study` as a top-level hiring signal.
- `Writer login` in visitor-visible surfaces.

## 6. Component strategy

Prefer a small shared static component/data shape over duplicating links.

Candidate:
- `src/components/site/trust-links.tsx`

Potential API:

```ts
export function TrustLinks({ compact = false }: { readonly compact?: boolean })
```

Allowed links:
- GitHub: `https://github.com/DeclanJeon`
- Contact: `mailto:` or local contact route if one exists
- Resume: only if a real URL/file exists

If no resume is available, do not show `Resume`.

## 7. Accessibility/text extraction rules

Split visual headings must preserve text spaces.

Good:

```tsx
<h1>
  마찰을 흐름으로 <span>바꾸는 개발자.</span>
</h1>
```

Bad:

```tsx
<h1>
  마찰을 흐름으로<span>바꾸는 개발자.</span>
</h1>
```

Browser QA must inspect `textContent`, not only screenshots.

## 8. Visitor/admin boundary

Admin affordances are not portfolio proof.

Rules:
- Anonymous visitors should not see writer/login controls above the fold.
- If a login path is required, keep it in a non-prominent footer or hidden route.
- Mobile first screen must not include `WRITERLOGIN`.

## 9. Verification contract

Browser QA assertions:

- `/` H1 text: `마찰을 흐름으로 바꾸는 개발자.`
- `/work` H1 text: `Systems I designed, built, and keep operating.`
- `/writing` H1 text: `연결과 전송을 계속 고친 기록.`
- `/writing/projects` H1 text: `대표 글 뒤에 남겨 둔 기술 노트와 운영 기록.`
- `/` visible top text includes GitHub and Contact.
- `/work` visible/reachable text includes GitHub and Contact.
- `/writing` visible/reachable text includes GitHub and Contact.
- Mobile `/` viewport text does not include `WRITERLOGIN`.
- PonsLink/PonsWarp card article links remain capped at 3 each.
- Archive routes still exist.

Command gates:

```bash
bun test
bunx tsc --noEmit
bun run build
```

## 10. Remaining 9.5 roadmap after this pass

This pass removes deployment blockers and raises appeal. To honestly claim 9.5 later, add:

1. Real resume/contact route.
2. PonsLink/PonsWarp flagship case-study pages.
3. Verifiable outcome metrics.
4. Architecture notes and debugging artifacts.
5. Long-post summary boxes and H2 restructuring.
6. Independent visual/design review after deployment preview.
