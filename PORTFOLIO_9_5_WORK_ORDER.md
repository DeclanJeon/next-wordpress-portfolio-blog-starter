# Portfolio 9.5 Work Order

- Status: Active local work order
- Updated: 2026-07-06
- Scope: local source only, no production deployment
- Source brief: `.omx/ultragoal/brief.md`
- Target: move the portfolio from the QA-estimated 6.8/10 toward a 9.5/10 attractiveness target by improving trust, clarity, proof, and scan speed.

## 1. Score gap summary

| Area | Current | 9.5 target | Gap |
|---|---|---|---|
| First-screen positioning | Memorable but abstract: “마찰을 흐름으로 바꾸는 개발자” | Memorable + role-specific + project domain visible in 5 seconds | Add browser-service/product-engineering context immediately |
| Trust links | Project live/repo links exist, but personal GitHub/contact/resume are not top-level | GitHub/contact/resume visible from every hiring surface | Add shared trust link strip/header links |
| Text polish | Extracted text joins words: `흐름으로바꾸는`, `designed,built`, `전송을계속`, `둔기술` | Visual line breaks with correct text extraction/accessibility | Add explicit whitespace or restructure split headings |
| Admin affordance | `WRITERLOGIN` appears on mobile first screen | Visitor surface has no admin smell | Hide login from public chrome or move to non-prominent location |
| Proof | Strong problem/decision/proof cards; outcome language still weak | Every flagship card states proof type and reviewer next action | Add proof labels and reduce raw 글 수 dominance |
| Archive | Better than before, but large counts still dominate | Archive is clearly secondary and guided | Keep selected writing first; use archive counts as secondary metadata |
| External credibility | Live services and repo exist, but no personal social/resume/contact | Reviewer can validate person and work in one click | Add top-level external identity links |
| Hiring action | “read work/writing” exists | “inspect work/contact me” is obvious | Add CTA hierarchy: Work, GitHub, Contact/Resume |

## 2. Immediate P0 tasks before deployment

### P0.1 Add top-level trust signals

Files likely involved:
- `src/components/site/home-chrome.tsx`
- `src/app/work/page.tsx`
- `src/app/writing/page.tsx`
- `src/app/writing/projects/page.tsx`
- possibly `src/lib/portfolio.ts` or a new small static data helper if reuse is cleaner

Required result:
- `/` header/hero exposes GitHub and Contact, plus Resume if a local/remote target exists.
- `/work`, `/writing`, `/writing/projects` expose a compact trust/action strip.
- Do not invent LinkedIn/resume if no URL exists; use available GitHub and email/contact route.

Acceptance:
- Browser QA can find a visible or reachable `GitHub` link on `/`, `/work`, `/writing`.
- Browser QA can find a visible or reachable `Contact` link on `/`, `/work`, `/writing`.

### P0.2 Fix text extraction/accessibility spacing

Files likely involved:
- `src/app/page.tsx`
- `src/app/work/page.tsx`
- `src/app/writing/page.tsx`
- `src/app/writing/projects/page.tsx`

Required result:
- Extracted H1 text contains correct spaces:
  - `마찰을 흐름으로 바꾸는 개발자.`
  - `Systems I designed, built, and keep operating.`
  - `연결과 전송을 계속 고친 기록.`
  - `대표 글 뒤에 남겨 둔 기술 노트와 운영 기록.`

Acceptance:
- Browser QA `document.querySelector('h1').textContent` returns the corrected strings.

### P0.3 Remove visitor-visible admin/login smell

Files likely involved:
- `src/components/site/home-chrome.tsx`
- auth/login related chrome if linked there

Required result:
- `WRITERLOGIN` does not appear in first-screen visible text for anonymous mobile visitors.
- Login can remain accessible through a non-prominent route if required.

Acceptance:
- Mobile browser QA on `/` does not include `WRITERLOGIN` in viewport-visible text.

## 3. P1 tasks for 8+ score

### P1.1 Strengthen hero copy with role-specific value

Required result:
- The first screen keeps the existing poetic headline, but immediately explains the role:
  - browser-based product engineering;
  - WebRTC/file transfer/document workflow;
  - operating and debugging real services.

Candidate copy:
> WebRTC, 브라우저 파일 전송, 문서 자동화처럼 사용자가 막히는 지점을 운영 가능한 제품 흐름으로 설계하고 구현합니다.

### P1.2 Reframe raw writing counts as proof trails

Required result:
- Replace or supplement labels such as `전체 68편` with proof-oriented labels:
  - `근거 기록 68편`
  - `운영 회고 23편`
  - `검증 노트 22편`

Acceptance:
- The raw count still exists where useful, but the label explains why the count matters.

### P1.3 Improve project proof language

Required result:
- Flagship cards make the reviewer’s job easier:
  - problem;
  - decision;
  - proof type;
  - live/repo/architecture note path.

Acceptance:
- PonsLink/PonsWarp cards show why the live/repo/writing evidence is useful, not just that it exists.

## 4. P2 tasks for 9.5 target after deployment blocker removal

### P2.1 Create flagship case-study routes or sections

Target:
- PonsLink case study
- PonsWarp case study
- DocuFlow or Ruminate as supporting case

Each case study should include:
- user/workflow problem;
- constraints;
- architecture diagram or short architecture note;
- trade-offs rejected;
- failure path/debugging evidence;
- live/repo/demo links;
- known limits.

### P2.2 Add real outcome metrics only when verifiable

Allowed:
- uptime/operating period if measured;
- test count/build proof;
- file-size test results if actually run;
- performance numbers if measured;
- GitHub stars/install counts only if true.

Forbidden:
- fake users;
- fake company logos;
- fake endorsements;
- fake performance or adoption numbers.

### P2.3 Restructure long posts

Target:
- 5,000+ character posts: at least 4 H2 anchors.
- 7,000+ character posts: top summary box.
- First 30 seconds of each flagship post: problem, judgment, why it matters.

## 5. Implementation order

1. Add small shared trust-link data/component if existing patterns allow it.
2. Wire trust links into home/work/writing/project archive surfaces.
3. Fix heading spacing in all affected pages.
4. Hide or move writer login.
5. Update copy labels from raw counts to proof-oriented labels.
6. Browser QA desktop/mobile.
7. `bun test`.
8. `bunx tsc --noEmit`.
9. `bun run build`.
10. Final diff review and deployment recommendation.

## 6. Non-goals for this pass

- No production deployment.
- No DB content rewrite.
- No new dependencies.
- No fake metrics.
- No broad visual redesign beyond existing design system.

## 7. Completion report requirements

Final report must include:
- changed files;
- local design artifact paths;
- ultragoal artifact paths;
- browser QA evidence;
- test/typecheck/build evidence;
- remaining work to actually claim a 9.5 score.
