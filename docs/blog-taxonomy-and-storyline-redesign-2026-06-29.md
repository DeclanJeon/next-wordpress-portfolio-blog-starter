# 블로그 카테고리/스토리라인 재설계

- 작성일: 2026-06-29
- 대상: `blog.ponslink.com`, 로컬 앱 `v2`
- 기준 코드:
  - `src/app/writing/page.tsx`
  - `src/components/site/writing-archive-utils.ts`
  - `src/lib/retrospectives.ts`
  - `db/custom.db`
- 문제 제기: 현재 `Post.category`가 `PonsLink`, `PonsWarp`, `개발 회고`처럼 섞여 있어서 “개발 회고 안에 PonsLink/PonsWarp가 있다”는 정보 구조가 표현되지 않는다.

## 결론

카테고리는 다시 설계해야 한다.

현재 구조는 글의 성격, 프로젝트 이름, 기술 태그가 한 필드와 tags 안에 뒤섞여 있다. 그래서 독자는 다음 차이를 구분하기 어렵다.

- 이 글이 개발 회고인지
- PonsLink 글인지 PonsWarp 글인지
- 제품 운영 글인지 기술 딥다이브인지
- 어떤 순서로 읽어야 하는지
- 어떤 글이 대표 서사인지

새 구조는 이렇게 잡는다.

```text
대 카테고리: 개발 회고
  중 카테고리: PonsLink
    소 카테고리: Origin / Product Decisions / Architecture / Algorithms / Operations / Metrics
  중 카테고리: PonsWarp
    소 카테고리: Origin / Transfer Engine / Browser Storage / Native & WASM / Operations / Metrics
  중 카테고리: Document Automation
  중 카테고리: Domain AI
  중 카테고리: Local Tools

대 카테고리: 에세이
대 카테고리: 운영 노트
대 카테고리: 릴리즈 노트
```

그리고 카테고리와 별개로 **시리즈**를 둔다.

- 카테고리: 글이 어느 책장에 꽂히는지
- 시리즈: 어떤 순서로 읽어야 스토리가 되는지
- 태그: WebRTC, OPFS, Rust/WASM 같은 검색 키워드

## 현재 문제

### 1. `category`가 계층이 아니라 평면 문자열이다

현재 DB에는 이런 category가 섞여 있다.

| category | 의미 |
|---|---|
| `PonsLink` | 프로젝트명 |
| `PonsWarp` | 프로젝트명 |
| `개발 회고` | 글 성격 |
| `Document Automation` | 프로젝트군 |
| `Essays` | 글 성격 |
| `Notes` | 글 성격 |

`PonsLink`와 `개발 회고`는 같은 레벨이 아니다. 그런데 현재 UI에서는 둘이 같은 category chip으로 보인다.

### 2. tags가 너무 많은 책임을 맡고 있다

예를 들어 `PonsWarp,PonsLink,Product Retrospective,File Transfer` 같은 tags는 다음 의미를 동시에 갖는다.

- 프로젝트: PonsWarp
- 관련 프로젝트: PonsLink
- 글 타입: Product Retrospective
- 주제: File Transfer

이러면 `tag=PonsLink` 같은 필터가 PonsWarp 글까지 끌어온다. 실제로 이전에 PonsLink Product에 PonsWarp 글이 섞이는 문제가 생겼다.

### 3. 최신순이 스토리를 깨뜨린다

PonsLink와 PonsWarp는 시간순/서사순으로 읽어야 한다.

하지만 현재 product card와 archive는 대부분 최신순이다. 그래서 독자는 결론이나 후반 운영 글을 먼저 보고, 왜 만들었는지는 나중에 찾아야 한다.

## 새 정보 구조

### 대 카테고리

대 카테고리는 독자가 “무슨 종류의 글을 읽는지”를 알게 하는 상위 책장이다.

| slug | 이름 | 역할 |
|---|---|---|
| `dev-retrospective` | 개발 회고 | 제품을 만들며 남긴 기술/제품/운영 판단 |
| `operation-note` | 운영 노트 | 배포, SEO, 블로그 운영, 서버 운영 |
| `essay` | 에세이 | 제품과 직접 연결되지 않는 생각 글 |
| `release-note` | 릴리즈 노트 | 배포 변화, 기능 출시 기록 |

우선 핵심은 `개발 회고`다.

### 중 카테고리

중 카테고리는 프로젝트 또는 제품군이다.

| parent | slug | 이름 | 설명 |
|---|---|---|---|
| 개발 회고 | `ponslink` | PonsLink | 링크 기반 room, request-first 세션 데스크, PonsCast |
| 개발 회고 | `ponswarp` | PonsWarp | PonsLink에서 분리된 대용량 파일 전송 실험 |
| 개발 회고 | `document-automation` | Document Automation | PDF/HWP/OCR/문서 자동화 |
| 개발 회고 | `domain-ai` | Domain AI | Ruminate/FateMirror 같은 도메인 AI 실험 |
| 개발 회고 | `local-tools` | Local Tools | ClickCap, Flucto, CaptureBrain 등 로컬 도구 |
| 운영 노트 | `blog-ops` | Blog Ops | Next.js/WordPress형 블로그 운영 기록 |

### 소 카테고리

소 카테고리는 한 프로젝트 안에서 글의 역할을 나눈다.

#### PonsLink 소 카테고리

| slug | 이름 | 들어갈 글 |
|---|---|---|
| `origin` | Origin | 왜 만들었는지, room-first, 링크 기반 연결 |
| `product-decision` | Product Decisions | request-first, Public Desk, pricing, 직접 판매 |
| `architecture` | Architecture | room, signaling, BFF, Mesh, state sync |
| `algorithm` | Algorithms | negotiation, queue, replay, PonsCast protocol |
| `operation` | Operations | 결제, 세션 권한, 관리자 OTP, 운영 게이트 |
| `metrics` | Metrics | 정량/정성 지표, before/after, 회고 요약 |

#### PonsWarp 소 카테고리

| slug | 이름 | 들어갈 글 |
|---|---|---|
| `origin` | Origin | PonsLink 파일 전송에서 분리된 이유 |
| `transfer-engine` | Transfer Engine | WebRTC, DataChannel, signaling, ACK, backpressure |
| `browser-storage` | Browser Storage | 2GB, OPFS, IndexedDB, StreamSaver, File System Access |
| `native-wasm` | Native & WASM | Rust/WASM, ZIP64, zero-copy, desktop/Tauri |
| `operation` | Operations | Cloud Drop, 권한, 결제, 링크 만료 |
| `metrics` | Metrics | 파일 크기, 메모리, 실패/복구, before/after |

## 시리즈 구조

카테고리는 책장이고, 시리즈는 읽는 순서다. 스토리텔링은 시리즈에서 만든다.

### PonsLink 대표 시리즈

#### `ponslink-origin-story`

목적: “왜 PonsLink를 만들었는가?”를 처음 독자에게 설명한다.

권장 순서:

1. 계정 없이 링크 하나로 만나는 방을 만들고 싶었다
2. 한 번 놓친 연결에서 PonsLink가 시작된 이유
3. 나는 먼저 방을 만들었다, 제품 설명은 그다음이었다
4. 링크는 단순했지만, 뒤에서는 신호가 계속 엉켰다
5. 말로 부족한 순간마다 방에 기능이 하나씩 붙었다
6. PonsCast는 같은 시간을 공유하고 싶어서 만든 기능이었다
7. 좋은 방만으로는 실제 약속이 굴러가지 않았다
8. 파일 전송은 결국 방 밖으로 독립해야 했다
9. 커밋을 다시 보니, 내가 만든 건 회의 앱보다 연결 방식에 가까웠다

#### `ponslink-technical-architecture`

목적: “무슨 기술을 왜 썼는가?”를 설명한다.

권장 묶음:

- WebRTC offer 충돌을 피하는 상태 머신 설계
- WebRTC 전에 신호 경계가 먼저 막아야 하는 것
- Mesh 연결은 단순해 보여도 순서가 제품 품질을 만든다
- DataChannel 하나에 모든 메시지를 태우면 왜 위험할까
- 서버가 미디어를 나르지 않을 때 남는 책임
- 놓친 이벤트와 중복 요청을 동시에 줄이는 법

#### `ponslink-product-operations`

목적: “PonsLink가 왜 request-first 세션 데스크가 되었나?”를 설명한다.

권장 묶음:

- DM 상담 요청을 바로 예약으로 보내지 않기로 한 이유
- Public Desk는 문의 폼이 아니라 첫 번째 운영 게이트다
- Request Status는 요청 제출 뒤의 침묵을 줄이기 위한 화면이었다
- 승인과 입장을 같은 순간으로 만들지 않기로 했다
- Meeting Records는 회의록이 아니라 요청 맥락의 연장이다
- Free 10건과 Pro 구조를 이렇게 나눈 이유
- Product Hunt보다 먼저 직접 판매를 봐야 한다고 판단했다

### PonsWarp 대표 시리즈

#### `ponswarp-origin-story`

목적: “왜 PonsWarp가 PonsLink에서 분리됐는가?”를 설명한다.

권장 순서:

1. 파일 전송은 PonsLink 안에서 먼저 고장났다
2. 서버가 파일을 갖지 않는 전송을 만들고 싶었다
3. 브라우저끼리 대용량 파일을 직접 보내고 싶었다
4. TB급 전송을 꿈꾸자 데이터 그리드가 필요해졌다
5. 데스크탑 앱까지 갔지만, 테스트할 기기가 없었다
6. WebRTC는 파일을 보내주지 않는다, 길만 열어준다
7. ACK 하나 때문에 전송이 멈추고 살아났다
8. 2GB를 넘기자 브라우저 메모리가 먼저 무너졌다
9. OPFS는 만능키가 아니라 마지막 안전망이었다
10. Rust와 WASM은 속도 욕심보다 메모리 생존을 위한 선택이었다
11. 결국 내가 만든 건 파일 전송 버튼이 아니라 실패를 견디는 흐름이었다

#### `ponswarp-transfer-engine`

목적: 파일 전송 엔진의 기술 선택을 설명한다.

권장 묶음:

- Signaling 서버는 파일 운반자가 아니라 소개자였다
- WebRTC는 파일을 보내주지 않는다, 길만 열어준다
- 백프래셔는 기다림이 아니라 보호 장치였다
- ACK 하나 때문에 전송이 멈추고 살아났다
- 속도를 올리기 전에 파이프라인의 한계를 먼저 정했다
- Zero-Copy Pool은 빠른 전송보다 GC를 피하기 위한 선택이었다

#### `ponswarp-storage-and-native`

목적: 브라우저 저장소와 Rust/WASM 선택을 설명한다.

권장 묶음:

- 2GB를 넘기자 브라우저 메모리가 먼저 무너졌다
- ZIP64가 필요해진 순간
- OPFS는 만능키가 아니라 마지막 안전망이었다
- Rust와 WASM은 속도 욕심보다 메모리 생존을 위한 선택이었다
- 데스크탑 앱까지 갔지만, 테스트할 기기가 없었다

## DB 설계안

### 권장안: Taxonomy + Series 테이블 추가

현재 `Post.category` 하나로는 계층을 표현하기 어렵다. 새 테이블을 추가하는 게 맞다.

```prisma
model TaxonomyNode {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  kind        String   // category | project | topic
  parentId    String?
  description String   @default("")
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      TaxonomyNode?  @relation("TaxonomyTree", fields: [parentId], references: [id])
  children    TaxonomyNode[] @relation("TaxonomyTree")
  posts       PostTaxonomy[]
}

model PostTaxonomy {
  id        String @id @default(cuid())
  postId    String
  nodeId    String
  role      String @default("primary") // primary | secondary | topic
  sortOrder Int    @default(0)

  post      Post         @relation(fields: [postId], references: [id], onDelete: Cascade)
  node      TaxonomyNode @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@unique([postId, nodeId, role])
  @@index([nodeId])
  @@index([postId])
}

model Series {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String   @default("")
  projectSlug String   @default("")
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  posts       PostSeries[]
}

model PostSeries {
  id        String @id @default(cuid())
  postId    String
  seriesId  String
  sortOrder Int
  isPinned  Boolean @default(false)

  post      Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  series    Series @relation(fields: [seriesId], references: [id], onDelete: Cascade)

  @@unique([postId, seriesId])
  @@index([seriesId, sortOrder])
}
```

### 왜 이 방식이 맞나

- `Post.category`를 억지로 `개발 회고/PonsLink/Origin` 같은 문자열로 만들면 필터/표시/정렬이 불안정해진다.
- 한 글이 여러 맥락에 속할 수 있다. 예: PonsLink 파일 전송 분리 글은 `개발 회고 > PonsLink > Origin`이면서 `PonsWarp origin`에도 보조로 걸릴 수 있다.
- 시리즈 순서와 카테고리 계층은 다르다. DB에서도 분리해야 한다.

### 호환 필드

기존 `Post.category`와 `Post.tags`는 당장 제거하지 않는다.

- `Post.category`: 레거시 호환/검색용으로 유지
- `Post.tags`: 기술 키워드 검색용으로 유지
- 새 UI/API는 `TaxonomyNode`, `PostTaxonomy`, `Series`, `PostSeries`를 우선 사용

## URL 설계

### 카테고리 URL

```text
/writing/category/dev-retrospective
/writing/category/dev-retrospective/ponslink
/writing/category/dev-retrospective/ponslink/origin
/writing/category/dev-retrospective/ponswarp/browser-storage
```

### 시리즈 URL

```text
/writing/series/ponslink-origin-story
/writing/series/ponslink-technical-architecture
/writing/series/ponslink-product-operations
/writing/series/ponswarp-origin-story
/writing/series/ponswarp-transfer-engine
/writing/series/ponswarp-storage-and-native
```

### 기존 URL 호환

기존 query 기반 URL은 유지한다.

```text
/writing?category=PonsLink
/writing?category=PonsWarp
/writing?tag=WebRTC
```

다만 제품 카드와 주요 내비게이션은 새 URL로 바꾼다.

## UI 설계

### `/writing` 상단

현재 category chip을 평면으로 보여주는 대신 트리형 필터로 바꾼다.

```text
All
개발 회고
  PonsLink
    Origin
    Product Decisions
    Architecture
    Algorithms
    Operations
    Metrics
  PonsWarp
    Origin
    Transfer Engine
    Browser Storage
    Native & WASM
    Operations
    Metrics
운영 노트
에세이
릴리즈 노트
```

모바일에서는 accordion으로 접는다.

### 프로젝트 카드 Retrospective 영역

PonsLink 카드:

```text
Retrospective
Start here · 왜 PonsLink를 만들었나
1. 계정 없이 링크 하나로 만나는 방을 만들고 싶었다
2. 한 번 놓친 연결에서 PonsLink가 시작된 이유
3. 나는 먼저 방을 만들었다...

전체 65편 · 시리즈 보기
```

PonsWarp 카드:

```text
Retrospective
Start here · 왜 PonsWarp를 분리했나
1. 파일 전송은 PonsLink 안에서 먼저 고장났다
2. 서버가 파일을 갖지 않는 전송을 만들고 싶었다
3. 브라우저끼리 대용량 파일을 직접 보내고 싶었다

전체 23편 · 시리즈 보기
```

핵심은 최신순 대신 대표 시리즈 순서를 먼저 보여주는 것이다.

### 글 상세 페이지

글 하단에 다음 블록을 넣는다.

```text
이 글은 다음 시리즈에 포함되어 있다
PonsWarp Origin Story · 7 / 11
이전: WebRTC는 파일을 보내주지 않는다
다음: 2GB를 넘기자 브라우저 메모리가 먼저 무너졌다
```

또한 breadcrumbs를 넣는다.

```text
개발 회고 > PonsWarp > Transfer Engine
```

## 마이그레이션 설계

### 1단계: seed taxonomy

먼저 TaxonomyNode와 Series를 만든다.

필수 노드:

- `dev-retrospective`
- `dev-retrospective/ponslink`
- `dev-retrospective/ponswarp`
- `dev-retrospective/ponslink/origin`
- `dev-retrospective/ponslink/product-decision`
- `dev-retrospective/ponslink/architecture`
- `dev-retrospective/ponslink/algorithm`
- `dev-retrospective/ponslink/operation`
- `dev-retrospective/ponslink/metrics`
- `dev-retrospective/ponswarp/origin`
- `dev-retrospective/ponswarp/transfer-engine`
- `dev-retrospective/ponswarp/browser-storage`
- `dev-retrospective/ponswarp/native-wasm`
- `dev-retrospective/ponswarp/operation`
- `dev-retrospective/ponswarp/metrics`

### 2단계: 기존 글 매핑

#### PonsLink 매핑 규칙

| 조건 | primary taxonomy |
|---|---|
| slug contains `ponslink-product` | 개발 회고 > PonsLink > Product Decisions |
| slug contains `deep-dive` | 개발 회고 > PonsLink > Architecture |
| slug contains `algorithm` | 개발 회고 > PonsLink > Algorithms |
| tags contains `PonsCast` | 개발 회고 > PonsLink > Architecture 또는 Algorithms |
| tags contains `Payment`, `Polar`, `Admin`, `OTP`, `Operations` | 개발 회고 > PonsLink > Operations |
| slug contains `00`, `01`, `01b`, `02b`, `04c`, `12b` | 개발 회고 > PonsLink > Origin |

#### PonsWarp 매핑 규칙

| 조건 | primary taxonomy |
|---|---|
| slug contains `00`, `01`, `01b`, `02b`, `12b` | 개발 회고 > PonsWarp > Origin |
| tags contains `WebRTC`, `Signaling`, `ACK`, `Backpressure` | 개발 회고 > PonsWarp > Transfer Engine |
| tags contains `OPFS`, `IndexedDB`, `StreamSaver`, `File System Access`, `Browser Memory` | 개발 회고 > PonsWarp > Browser Storage |
| tags contains `Rust`, `WASM`, `ZIP64`, `Zero Copy`, `Desktop`, `Tauri` | 개발 회고 > PonsWarp > Native & WASM |
| tags contains `Cloud Drop`, `Entitlement`, `Payment`, `Operations` | 개발 회고 > PonsWarp > Operations |

### 3단계: 시리즈 매핑

대표 시리즈부터 만든다.

- `ponslink-origin-story`
- `ponslink-technical-architecture`
- `ponslink-product-operations`
- `ponswarp-origin-story`
- `ponswarp-transfer-engine`
- `ponswarp-storage-and-native`

각 시리즈는 manual order를 가진다. 최신순을 쓰지 않는다.

### 4단계: UI/API 전환

신규 API:

```text
GET /api/taxonomies/tree
GET /api/writing?taxonomy=dev-retrospective/ponslink/origin
GET /api/series/:slug
GET /api/retrospectives?project=ponslink&mode=story
```

기존 API는 유지하되, 제품 카드에서는 `mode=story`를 사용한다.

## 적용 순서

1. Prisma schema에 taxonomy/series 테이블 추가
2. migration 생성 및 로컬 DB 적용
3. seed script 작성
4. 기존 글 taxonomy 자동 매핑 script 작성
5. 대표 시리즈 manual mapping script 작성
6. `/writing` archive UI를 tree category + tag 검색 구조로 변경
7. `/writing/series/[slug]` 페이지 추가
8. `ProductRetrospectiveLive`를 최신순이 아니라 대표 시리즈 우선으로 변경
9. 글 상세 페이지 breadcrumbs + series nav 추가
10. 운영 DB 백업 후 migration/seed/app deploy

## QA 기준

### 데이터 QA

- 모든 published 글은 최소 1개 primary taxonomy를 가진다.
- PonsLink 글은 `개발 회고 > PonsLink` 아래에 있어야 한다.
- PonsWarp 글은 `개발 회고 > PonsWarp` 아래에 있어야 한다.
- PonsWarp 글이 PonsLink Product/Retrospective에 섞이면 실패다.
- 한 글이 series에 들어가면 sortOrder가 중복되면 안 된다.

### UI QA

- `/writing`에서 대/중/소 카테고리 트리가 보인다.
- `/writing/category/dev-retrospective/ponslink`는 PonsLink 글만 보여준다.
- `/writing/category/dev-retrospective/ponswarp`는 PonsWarp 글만 보여준다.
- `/writing/series/ponslink-origin-story`는 왜 만들었는지부터 읽힌다.
- `/writing/series/ponswarp-origin-story`는 PonsLink 파일 전송 분리부터 읽힌다.
- 제품 카드의 Retrospective는 최신순이 아니라 Start here/대표 시리즈 순서로 보여준다.

### 콘텐츠 QA

- 각 대표 시리즈 첫 글에는 `왜 만들었는가`가 있어야 한다.
- 각 대표 시리즈에는 `기술을 왜 선택했는가`가 최소 1회 이상 명확히 보여야 한다.
- 핵심 전환 글에는 `Before / After / 남은 한계` 블록이 있어야 한다.
- 정량 지표가 없는 글은 `숫자로 보면` 보강 후보로 표시한다.

## 최종 판단

사용자 말이 맞다.

`PonsLink`와 `PonsWarp`는 독립 대 카테고리가 아니라, **개발 회고라는 대 카테고리 안의 중 카테고리**가 되어야 한다.

그리고 `Product Retrospective`, `Architecture`, `Algorithm`, `Operations`, `Metrics`는 프로젝트 아래의 소 카테고리 또는 시리즈 축으로 들어가야 한다.

가장 중요한 건 최신순 아카이브가 아니라 **서사순 시리즈**다. PonsLink와 PonsWarp는 “왜 만들었는가 → 어떤 문제가 있었나 → 어떤 기술을 골랐나 → 무엇을 해결했나 → 어떤 지표로 봐야 하나” 순서로 읽히게 해야 한다.

---

## 2026-06-29 현재 글 구성 재점검 후 보완

상세 보고서는 `docs/blog-current-post-composition-audit-2026-06-29.md`에 저장했다.

### 보완 1: 프로젝트 판정은 title prefix를 최우선으로 한다

기존 설계의 자동 매핑 규칙은 `slug contains ponswarp` 같은 느슨한 조건을 포함하고 있었다. 실제 DB를 점검해보니 `2026-06-16-ponslink-11-ponswarp-split`처럼 PonsLink 회고 글이지만 slug에 `ponswarp`가 들어간 글이 있다.

따라서 자동 분류 우선순위는 다음으로 고정한다.

```text
1. title prefix `[PonsLink]` 또는 `[PonsWarp]`
2. slug prefix `YYYY-MM-DD-ponslink-` 또는 `YYYY-MM-DD-ponswarp-`
3. legacy category
4. tags
5. manual override
```

`slug contains ponswarp`, `tags contains PonsLink` 같은 조건만으로 primary taxonomy를 정하면 안 된다.

### 보완 2: PonsLink/PonsWarp 교차 글은 primary와 secondary를 분리한다

PonsWarp는 PonsLink의 파일 전송 시스템에서 분리된 프로젝트다. 그래서 양쪽 맥락이 동시에 필요한 글이 있다. 하지만 이런 글을 태그 필터로 섞어버리면 PonsWarp 글이 PonsLink Product에 들어가는 문제가 다시 생긴다.

교차 글은 다음처럼 처리한다.

| 글 | primary taxonomy | secondary taxonomy |
|---|---|---|
| `ponslink-09b-file-transfer-left-room` | 개발 회고 > PonsLink > Origin | 개발 회고 > PonsWarp > Origin |
| `ponslink-11-ponswarp-split` | 개발 회고 > PonsLink > Product Decisions | 개발 회고 > PonsWarp > Origin |
| `ponswarp-00-file-transfer-broke-in-ponslink` | 개발 회고 > PonsWarp > Origin | 개발 회고 > PonsLink > Architecture |

제품 카드, category page, series page는 primary taxonomy를 기준으로 보여준다. secondary taxonomy는 글 상세의 “관련 맥락”이나 추천 글에서만 사용한다.

### 보완 3: 글 구성 QA 축을 명시한다

각 대표 글은 다음 다섯 축 중 어디에 해당하는지 분명해야 한다.

```text
Why: 왜 만들었나
Problem: 무엇이 고장났나
Choice: 어떤 기술/제품 선택을 했나
Resolution: 무엇을 해결했나
Metric: 어떤 정량/정성 지표로 볼 수 있나
```

모든 글이 다섯 축을 전부 가져야 하는 것은 아니다. 하지만 각 대표 시리즈 안에서는 다섯 축이 모두 등장해야 한다.

### 보완 4: 지표는 억지 숫자가 아니라 Before/After/미측정으로 쓴다

현재 PonsLink 일부 글은 정량/정성 지표 블록이 약하다. 숫자를 만들면 안 된다. 대신 다음 블록을 쓴다.

```text
숫자로 보면
Before: 사용자가 회의 전에 직접 정리해야 했던 단계
After: 제품 안으로 들어온 단계
아직 못 잰 것: 요청 전환율, 승인율, 첫 응답 시간
```

또는 다음처럼 정성 지표를 명시한다.

```text
정성적으로 바뀐 것
- 사용자가 덜 고민하게 된 지점
- 운영자가 먼저 판단할 수 있게 된 지점
- 실패가 숨겨지지 않고 드러나게 된 지점
```

### 보완 5: 다음 작업 우선순위

글을 더 쓰기 전에 먼저 읽히는 구조를 만들어야 한다.

1. taxonomy/series 테이블 추가
2. 기존 글 primary/secondary taxonomy 매핑
3. 대표 시리즈 수동 순서 고정
4. PonsLink/PonsWarp 제품 카드에서 Start here 시리즈 우선 노출
5. 지표 블록이 약한 글 보강
6. 추가 글 작성

이 순서가 맞다. 지금은 글 수보다 읽는 경로가 더 큰 문제다.
