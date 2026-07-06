# Writing Projects Readability and Portfolio Redesign Plan

- Status: Draft design contract
- Last updated: 2026-07-06
- Scope: `blog.ponslink.com`의 `/`, `/work`, `/writing`, `/writing/projects`, `/writing/projects/*`, `/writing/*` 정보 구조와 글 편집 기준
- Storage rule: 이 문서는 로컬 저장소에만 둔다. 운영 서버 `/opt/ponslink-blog-next`에는 복사하지 않는다.
- Local source repo: `/home/declan/Documents/Develop/Project/portfolio/v2`
- Related visual system: `DESIGN.md`

## 1. 문제 정의

현재 블로그는 실제 운영 서비스와 긴 기술 기록을 모두 갖고 있다. 문제는 증거가 부족한 것이 아니라, 처음 온 사람이 증거를 빠르게 판단할 수 있는 구조가 부족하다는 점이다.

핵심 문제는 세 가지다.

1. 포트폴리오 판단보다 아카이브 탐색이 먼저 보인다.
2. 긴 글이 많은데 소제목, 요약 박스, 대표 판단이 부족한 글이 있다.
3. PonsLink/PonsWarp 중심의 서비스 개발자 가치가 공부 노트의 양에 묻힌다.

이번 개편은 글을 무조건 삭제하는 작업이 아니다. 전체 글은 보존하되, 처음 보는 사람이 2분 안에 개발자 가치와 대표 증거를 이해하도록 입구를 다시 설계한다.

## 2. 검토한 현재 근거

### 2.1 라이브/DB 측정 근거

운영 DB `/opt/ponslink-blog-next/shared/db/custom.db`를 읽기 전용으로 측정한 결과다.

| 범위 | 값 |
|---|---:|
| `/writing/projects` 공개 글 수 | 50개 |
| 총 본문 길이 | 296,801자 |
| 평균 본문 길이 | 5,936자 |
| 중앙값 | 7,333자 |
| 최소/최대 | 956자 / 8,279자 |

컬렉션별 핵심 구간:

| 컬렉션 | 글 수 | 평균 길이 | 평균 읽기 시간 | 판단 |
|---|---:|---:|---:|---|
| 실시간 네트워크 딥다이브 | 22 | 7,902자 | 9.2분 | 너무 균일하게 길다 |
| 분산 P2P 프로토콜 | 9 | 7,294자 | 9.0분 | 기술 깊이는 있으나 입구가 무겁다 |
| P2P Foundations | 7 | 5,418자 | 6.9분 | 회고/학습 경계가 섞인다 |
| Document Automation | 3 | 1,050자 | 2.0분 | 읽기 부담은 낮다 |
| Domain AI | 4 | 2,138자 | 3.2분 | 한 글만 길고 나머지는 짧다 |
| Blog Ops | 2 | 1,542자 | 2.0분 | 보조 기록으로 적절하다 |
| 에세이 | 3 | 1,535자 | 2.0분 | archive 후순위가 적절하다 |

추가 구조 측정:

- 5,000자 이상인데 소제목이 없는 긴 글: 13개.
- 특히 `실시간 네트워크 딥다이브`에 집중되어 있다.
- 긴 글의 문제는 길이 자체가 아니라, 독자가 현재 위치와 결론을 확인할 앵커가 부족하다는 점이다.

### 2.2 현재 소스 근거

검토한 주요 로컬 파일:

- `DESIGN.md`: 현재 시각 언어는 warm paper, serif headline, mono overline, clay accent, border-first card를 사용한다.
- `src/components/site/home-chrome.tsx`: 상단 네비게이션은 `Work`, `Writing`, `Study`를 직접 노출한다.
- `src/app/work/page.tsx`: `/work`의 H1은 `Systems I designed, built, and keep operating.`이며, 운영 서비스 포트폴리오 방향과 맞다.
- `src/components/site/project-card.tsx`: 프로젝트 카드는 `Problem`, `Decision`, `stack`, `proofNotes`, `ProductRetrospectiveLive`를 보여준다.
- `src/app/writing/projects/page.tsx`: `/writing/projects`는 컬렉션 카드와 전체 글 수를 보여주는 archive index다.
- `src/app/writing/projects/[...slug]/page.tsx`: 개별 컬렉션은 전체 글을 board view로 바로 보여준다.
- `src/components/site/writing-archive-list.tsx`: board/grid/timeline/compact archive view가 이미 있다.
- `src/lib/portfolio.ts`: PonsLink/PonsWarp/DocuFlow/Ruminate 등 대표 프로젝트의 problem/decision/proof 구조가 이미 데이터로 존재한다.

### 2.3 외부 벤치마크 판단

참고한 외부 기준:

- 요즘IT 참고 글: 긴 글이어도 장면, 문제, 구조, 체크리스트가 있어 읽힌다.
- Lee Robinson: 첫 화면에서 `Developer and writer`, 현재 역할, writing/code 링크가 즉시 보인다.
- Brittany Chiang: `accessible, inclusive products and digital experiences for the web`처럼 개발자 가치가 짧게 고정된다.
- 개발자 포트폴리오 가이드류: 많은 글보다 대표 프로젝트, 실제 문제, live link, repo, case study, impact가 먼저 와야 한다.

이 기준으로 보면 현재 블로그는 재료는 강하지만 편집 순서가 약하다.

## 3. 개편 목표

### 3.1 제품 목표

1. 첫 방문자가 2분 안에 다음을 이해한다.
   - 이 사람은 어떤 개발자인가.
   - 어떤 문제를 맡기면 강한가.
   - 실제로 만든 서비스는 무엇인가.
   - 더 깊게 보려면 어떤 글을 읽어야 하는가.
2. PonsLink/PonsWarp를 중심축으로 세운다.
3. 공부 노트는 삭제하지 않고, 대표 글과 보조 노트로 계층화한다.
4. 긴 글은 포트폴리오 증거로 스캔 가능하게 만든다.
5. `DESIGN.md`의 warm editorial archive 분위기는 유지한다.

### 3.2 비목표

- 모든 글을 같은 길이로 줄이지 않는다.
- archive를 없애지 않는다.
- PonsLink/PonsWarp 외 프로젝트를 숨기지 않는다.
- 요즘IT 문체를 그대로 복제하지 않는다.
- 운영 서버 DB를 이 설계 단계에서 수정하지 않는다.

### 3.3 성공 신호

정성 기준:

- 처음 보는 사람이 홈과 `/work`만 보고 개발자 가치 문장을 말할 수 있다.
- 긴 글을 열었을 때 30초 안에 글의 결론과 제품 관련성을 알 수 있다.
- `/writing/projects`가 “읽어야 할 글 50개”가 아니라 “목적별 추천 경로”로 보인다.

정량 기준:

- `/writing/projects`의 첫 화면에서 전체 글 수보다 추천 경로가 먼저 보인다.
- collection detail 첫 화면에서 전체 board list보다 대표 3개가 먼저 보인다.
- 5,000자 이상 글은 최소 H2 4개 이상을 가진다.
- 7,000자 이상 글은 포트폴리오 요약 박스를 가진다.
- `ProjectCard`의 기본 retrospective 노출은 3개 이하로 제한한다. 전체 글 수는 archive 링크 뒤로 둔다.

## 4. 핵심 포지셔닝

### 4.1 최종 가치 문장

기본 문장:

> 마찰을 제품 흐름으로 바꾸는 브라우저 서비스 개발자.

설명형 문장:

> WebRTC/P2P, 문서 자동화, AI UX처럼 신뢰와 경계가 중요한 문제를 사용자가 이해할 수 있는 운영 가능한 서비스로 설계하고 구현하는 풀스택 개발자.

영문 보조 문장:

> Product-minded full-stack developer for browser-native services, realtime workflows, and trust-sensitive tools.

### 4.2 가치 축

1. 제품 경계 설계
   - 기능을 바로 만들지 않고, 요청/수락/일정/세션, 저장/전송/복구, 로컬/서버 처리처럼 책임을 나눈다.
2. 브라우저 네이티브 구현
   - WebRTC, DataChannel, OPFS, backpressure, 로컬 처리처럼 브라우저가 직접 맡는 어려운 흐름을 다룬다.
3. 운영 가능한 작은 시스템
   - live URL, 배포, SEO, DB, 글, 회고가 있는 서비스로 만든다.
4. 신뢰와 경계 감각
   - 민감 파일, 문서, AI 해석, P2P 연결에서 사용자가 무엇을 맡기는지 보이게 한다.
5. 판단을 기록하는 개발자
   - 단순 기능 목록보다 실패, 경계, 선택 기준을 글로 남긴다.

### 4.3 금지할 자기소개 방향

- “공부를 많이 한 개발자” 중심으로 보이면 안 된다.
- “P2P 전문 블로거”로만 보이면 안 된다.
- “여러 서비스를 이것저것 만든 사람”으로 흩어지면 안 된다.
- “AI가 만든 듯한 요약 문장”을 쓰면 안 된다.

## 5. 전체 정보 구조

### 5.1 현재 구조

```text
Home
 ├─ Work
 ├─ Writing
 └─ Study
      ├─ 실시간 네트워크 딥다이브 22
      ├─ 분산 P2P 프로토콜 9
      ├─ P2P Foundations 7
      └─ 기타 컬렉션
```

현재 구조는 archive 탐색에는 좋지만, 처음 보는 채용자/협업자에게는 부담이 크다.

### 5.2 목표 구조

```text
Home
 ├─ 2분 안에 보는 나
 │   ├─ 가치 문장
 │   ├─ 내가 잘 맡는 문제 3개
 │   ├─ 대표 서비스 3개
 │   └─ 바로 확인할 증거
 │
 ├─ Work
 │   ├─ PonsLink case study
 │   ├─ PonsWarp case study
 │   ├─ DocuFlow case study
 │   └─ Ruminate case study
 │
 ├─ Selected Writing
 │   ├─ 제품 판단 4개
 │   ├─ 기술 깊이 4개
 │   └─ 운영 기록 3개
 │
 └─ Archive
     ├─ PonsLink / PonsWarp archive
     ├─ Technical Notes
     ├─ Operations
     └─ Essays
```

### 5.3 네비게이션 개편

현재:

```text
Work | Writing | Study
```

개편안:

```text
Work | Selected Writing | Archive
```

또는 모바일/간결형:

```text
Work | Writing | Archive
```

`Study`는 상단 네비게이션에서 내리고 archive 내부 컬렉션명으로 유지한다. 이유는 `Study`라는 단어가 포트폴리오 첫인상에서 학습자 느낌을 줄 수 있기 때문이다.

## 6. 페이지별 설계

## 6.1 Home

### 역할

홈은 블로그 피드가 아니라 개발자 포지셔닝의 입구다. 글 목록보다 “이 사람을 왜 더 봐야 하는가”가 먼저 와야 한다.

### 첫 화면 구조

```text
[overline] Portfolio Blog
[H1] 마찰을 제품 흐름으로 바꾸는 브라우저 서비스 개발자.
[lead] WebRTC/P2P, 문서 자동화, AI UX처럼 신뢰와 경계가 중요한 문제를 운영 가능한 서비스로 설계하고 구현한다.
[CTA] Work 보기
[CTA] 대표 글 6개 보기
[secondary] 전체 archive
```

### 두 번째 섹션: 내가 잘 맡는 문제

카드 3개:

1. 연결이 끊기는 문제를 세션 흐름으로 바꾸기
   - 증거: PonsLink
2. 큰 파일과 민감한 데이터를 서버 의존 없이 다루기
   - 증거: PonsWarp, DocuFlow
3. 단정하기 어려운 도메인 언어를 안전한 AI UX로 바꾸기
   - 증거: Ruminate/FateMirror

각 카드에는 다음 필드를 둔다.

- Problem
- Built
- Evidence link

### 세 번째 섹션: 대표 서비스

PonsLink, PonsWarp, DocuFlow를 우선 노출한다.

각 카드의 노출 우선순위:

1. 서비스명
2. 한 문장 가치
3. 내가 설계한 흐름
4. 운영 URL / repo / 대표 글
5. 상태

전체 회고 글 수는 노출하지 않는다.

### 네 번째 섹션: Selected writing

목적별 대표 글만 노출한다.

- 제품 판단
- 기술 깊이
- 운영 기록

각 그룹 3개 이하.

## 6.2 Work

### 역할

`/work`는 “서비스 개발자 평가 페이지”다. 여기는 archive가 아니라 case study index여야 한다.

### 상단 문장

현재 H1 `Systems I designed, built, and keep operating.`는 유지해도 좋다.

다만 보조 문장을 다음처럼 바꾼다.

현재:

> 운영 URL, GitHub proof, screenshot, 현재 상태를 함께 보여주는 서비스 아카이브다.

개편:

> 문제를 기능 목록으로 옮기기보다, 사용자가 통과하는 요청·전송·처리·복구 흐름으로 다시 설계한 서비스들을 모았다.

### ProjectCard 정보 구조

현재 `ProjectCard`는 이미 `Problem`, `Decision`, `stack`, `proofNotes`, retrospective를 갖는다. 구조는 좋다. 문제는 retrospective가 너무 많이 보이는 것이다.

개편 카드 구조:

```text
[status] [category] [year]
Title
One-line value

Problem
Decision
Hard part
Evidence

Stack chips
Links: Live / Repo / Read case study
```

새 필드 제안:

- `hardPart`: 가장 어려웠던 설계/운영 경계
- `selectedReadLinks`: 대표 글 3개
- `archiveHref`: 전체 회고 archive 링크
- `evidenceLinks`: live, repo, screenshot, design note 등

기존 `retrospectiveLinks`는 fallback으로 유지하되, 기본 노출 수는 3개로 제한한다.

### PonsLink 카드 예시

```text
PonsLink
명함 교환 뒤 끊기는 연락을 요청, 수락, 일정, 세션으로 이어지는 웹 기반 흐름으로 바꾼 서비스.

Problem
오프라인 네트워킹 이후 연락은 부담스럽고, 맥락 없는 DM은 서로의 시간을 낭비한다.

Decision
QR/link 진입, 요청 내용 수집, 수락/거절, 일정 조율, 세션룸을 하나의 흐름으로 묶었다.

Hard part
사용자가 방을 만들기 전에 먼저 용건을 남길 수 있게 하면서도, 수락 이후 자연스럽게 세션으로 넘어가게 하는 흐름.

Evidence
운영 URL, 활동 문서, 대표 회고 3개.
```

### PonsWarp 카드 예시

```text
PonsWarp
큰 파일을 서버에 오래 보관하지 않고 브라우저 간 직접 전송하기 위한 WebRTC 파일 전송 서비스.

Problem
대용량 파일 전송은 업로드, 공유 권한, 삭제 확인, 보관 책임을 만든다.

Decision
WebRTC, OPFS, chunking, backpressure를 기준으로 서버 저장 의존도를 낮추는 구조를 실험했다.

Hard part
직접 연결 실패, TURN fallback 비용, 브라우저 메모리, 중단 복구를 한 흐름 안에서 다루는 것.

Evidence
운영 URL, GitHub repo, WebRTC/DataChannel 대표 글 3개.
```

## 6.3 Writing

### 역할

`/writing`은 전체 피드가 아니라 “대표 글 입구”가 되어야 한다. 전체 archive는 접근 가능하되, 첫 화면은 목적별 선별을 보여준다.

### 추천 구조

```text
[H1] Selected writing for product and engineering judgment.
[lead] 모든 글을 시간순으로 보여주기보다, 서비스를 만들며 남긴 제품 판단·기술 경계·운영 기록을 먼저 묶었다.

[Section] 처음 보는 사람에게 추천
- PonsLink origin
- PonsWarp origin
- DocuFlow security boundary
- Ruminate AI answer risk

[Section] 기술 깊이를 보고 싶다면
- WebRTC 연결은 왜 어려운가
- DataChannel은 파일 전송 API가 아니다
- SFU는 왜 Mesh보다 큰 방에 강한가
- TURN 비용은 왜 생기는가

[Section] 운영 감각을 보고 싶다면
- 블로그 구조 변경 기록
- SEO/sitemap 운영 기록
- 배포/캐시 문제 기록

[CTA] 전체 archive 보기
```

### 전체 목록 처리

- 기본은 selected mode.
- 전체 목록은 `Archive` 버튼을 눌렀을 때 보여준다.
- 검색/필터는 유지한다.

## 6.4 Writing Projects

### 역할

`/writing/projects`는 전체 컬렉션 목록이 아니라 “주제별 학습/운영 기록의 지도”여야 한다.

### 상단 개편

현재 문장:

> 핵심 블로그에서 분리한 주제별 글 모음.

개편 문장:

> 대표 글 뒤에 남겨 둔 기술 노트와 운영 기록.

보조 문장:

> 처음 보는 사람은 Selected writing에서 시작하고, 특정 기술이나 프로젝트의 배경을 더 보고 싶을 때 이 archive를 사용한다.

### 상단에 추가할 블록

```text
처음이라면 여기서 시작하지 않아도 됩니다.
대표 서비스와 추천 글은 Work / Selected Writing에 정리되어 있습니다.
이 페이지는 특정 주제를 깊게 따라가고 싶을 때 쓰는 archive입니다.

[Work 보기] [Selected Writing 보기]
```

### 컬렉션 카드 개선

현재 카드 필드:

- kind
- name
- count posts
- description
- 글 보기

개편 필드:

- kind
- name
- 추천 용도
- 대표 글 3개
- 전체 글 수
- archive CTA

예시:

```text
실시간 네트워크 딥다이브
추천 용도: WebRTC/P2P 서비스의 연결 실패, 비용, 품질 경계를 보고 싶을 때.
대표 글:
1. P2P는 서버가 없다는 뜻이 아니다
2. WebRTC 연결은 왜 그냥 열리지 않을까
3. SFU는 왜 Mesh보다 큰 방에 강할까
전체 22편 보기
```

## 6.5 Collection Detail

### 현재 문제

`/writing/projects/study-note/realtime-network`에 들어가면 H1과 설명 뒤에 22개 board list가 바로 나온다. 최신순 목록이라 처음 읽을 글을 고르기 어렵다.

### 개편 구조

```text
[breadcrumbs]
[H1] 실시간 네트워크 딥다이브
[lead] P2P, Mesh, SFU, MCU, WebRTC, DataChannel을 제품 설계 질문으로 다시 읽는 노트.

[Start here]
1. P2P는 서버가 없다는 뜻이 아니다
2. WebRTC 연결은 왜 그냥 열리지 않을까
3. SFU는 왜 Mesh보다 큰 방에 강할까

[Reading paths]
- 연결 경로 이해하기
- 미디어 구조 선택하기
- DataChannel로 파일 다루기
- 운영 비용과 fallback 보기

[All notes]
board/grid/list
```

### Collection별 추천 경로

#### 실시간 네트워크 딥다이브

Reading paths:

1. P2P 기본 오해 깨기
   - P2P는 서버가 없다는 뜻이 아니다
   - 클라이언트끼리 직접 연결한다는 말의 의미
   - P2P가 강한 경우와 약한 경우
2. WebRTC 연결 실패 보기
   - signaling server가 필요한 이유
   - WebRTC 연결은 왜 그냥 열리지 않을까
   - STUN/TURN/ICE
   - NAT traversal 실패
3. 방 구조 선택하기
   - Mesh는 왜 무거워지는가
   - SFU는 왜 큰 방에 강한가
   - MCU는 왜 비싸지만 필요한가
   - SFU와 MCU 선택지
4. DataChannel 파일 전송 보기
   - DataChannel은 파일 전송 API가 아니다
   - ordered/unordered
   - reliable/partially reliable
   - bufferedAmount/backpressure

#### 분산 P2P 프로토콜

Reading paths:

1. discovery와 transport
2. trust boundary와 검증
3. 브라우저 제품에서 쓸 수 있는 것과 없는 것

#### P2P Foundations

Reading paths:

1. 초기 문제의식
2. 그리드 컴퓨팅 상상
3. 지금 기준으로 남은 판단

#### Document Automation

Reading paths:

1. 한국 문서 업무 맥락
2. 보안 경계
3. 도구군 통합 판단

#### Domain AI

Reading paths:

1. 빠른 답변의 위험
2. 도메인 문장과 해석 UX
3. 실패한 프로젝트가 남긴 기준

## 6.6 Article Page

### 역할

개별 글은 블로그 글이면서 동시에 포트폴리오 증거다. 글을 끝까지 읽지 않아도 이 글이 보여주는 개발자 역량이 보여야 한다.

### 긴 글 공통 구조

5,000자 이상 글은 다음 구조를 따른다.

```text
[title]
[excerpt]
[metadata]
[portfolio proof box]
[body]
[related reading]
```

### Portfolio proof box

7,000자 이상 글 또는 대표 글에는 상단에 요약 박스를 둔다.

```md
> 이 글이 보여주는 역량
> - 연결 실패를 주소 발견, 릴레이, 후보 선택 문제로 나눠 본다.
> - TURN 사용률이 비용과 품질 지표에 미치는 영향을 제품 관점에서 본다.
> - WebRTC 기능을 붙일 때 어떤 로그를 남겨야 하는지 판단한다.
```

이 박스는 `한 줄 요약` 같은 AI 패턴으로 쓰면 안 된다. 문장은 짧지만 판단 중심이어야 한다.

### 긴 글 소제목 규칙

5,000자 이상:

- H2 최소 4개.
- 첫 H2는 문제/오해/출발점.
- 마지막 H2는 지금 돌아보는 판단.
- 표나 bullet이 있으면 한 화면에 하나 이상 독해 앵커가 생기도록 배치한다.

7,000자 이상:

- 상단 proof box 필수.
- H2 최소 5개.
- 중간에 표, 비교 리스트, 체크리스트 중 하나 이상.
- 관련 프로젝트 연결 필수.

### 글 템플릿

기술 설명 글:

```md
도입: 처음 헷갈린 지점 또는 실패 로그

> 이 글이 보여주는 역량
> - ...

## 먼저 결론

## 왜 헷갈리는가

## 각 책임을 나누면

## 제품에서는 어디서 문제가 되는가

## 내가 선택한 기준

## 지금 다시 보면

## 같이 읽을 글
```

제품 회고 글:

```md
도입: 당시 사용자/운영 장면

> 이 글이 보여주는 역량
> - ...

## 그때 문제는 무엇이었나

## 처음 선택이 왜 부족했나

## 경계를 어떻게 다시 나눴나

## 실제 구현/운영에서 확인한 것

## 지금 다시 보면

## 같이 읽을 글
```

운영 노트:

```md
도입: 장애/배포/운영 장면

## 무엇이 깨졌나

## 원인은 어디였나

## 어떤 복구 경로를 택했나

## 다시 막으려면 무엇을 남겨야 하나

## 지금 운영 기준
```

## 7. 글 길이 정책

### 7.1 유형별 목표 길이

| 유형 | 목적 | 목표 길이 |
|---|---|---:|
| 대표 케이스 스터디 | 채용자/협업자 설득 | 3,500~5,500자 |
| 기술 딥다이브 | 개발자 독자/검색 유입 | 3,000~4,500자 |
| 보조 노트/용어 정리 | archive/내부 연결 | 1,200~2,000자 |
| 운영 노트 | 문제와 복구 기준 기록 | 1,500~3,000자 |
| 에세이 | 관점 보조 | 1,000~2,000자 |

### 7.2 줄이지 않아도 되는 글

다음 조건을 만족하면 6,000자 이상도 허용한다.

- 대표 case study다.
- 소제목 구조가 명확하다.
- 표/체크리스트/이미지 등 독해 앵커가 있다.
- 상단 proof box가 있다.
- 관련 프로젝트와 연결된다.

### 7.3 줄여야 하는 글

다음 조건이면 우선 리라이트 대상이다.

- 7,000자 이상인데 H2가 3개 미만이다.
- 정의와 비유가 반복된다.
- 제품 판단 없이 개념 설명이 길어진다.
- 같은 시리즈의 다른 글과 도입/결론이 유사하다.
- 제목이 접두어에 의존한다.

## 8. 제목 정책

### 8.1 문제

현재 제목은 접두어가 많다.

- `[WebRTC 딥다이브]`
- `[P2P 딥다이브]`
- `[DataChannel 딥다이브]`
- `[P2P 프로토콜]`

카테고리로는 좋지만 제목에 반복되면 피로하다.

### 8.2 원칙

- 접두어는 badge/taxonomy로 보낸다.
- 제목은 질문, 판단, 선택 기준으로 쓴다.
- 검색 유입 키워드는 제목 뒷부분에 자연스럽게 남긴다.

### 8.3 예시

| 현재 | 개선 |
|---|---|
| `[WebRTC 딥다이브] STUN, TURN, ICE를 헷갈리지 않게 정리하기` | `STUN, TURN, ICE는 각각 무엇을 책임지는가` |
| `[P2P 딥다이브] P2P는 서버가 없다는 뜻이 아니다` | `P2P 제품에도 서버가 필요한 이유` |
| `[DataChannel 딥다이브] WebRTC DataChannel은 파일 전송 API가 아니다` | `DataChannel을 파일 전송에 쓰려면 직접 만들어야 하는 것들` |
| `[SFU vs MCU] SFU와 MCU는 경쟁 관계가 아니라 선택지다` | `SFU와 MCU는 언제 서로 다른 선택지가 되는가` |

## 9. 대표 글 선별안

### 9.1 처음 보는 사람에게 추천

1. PonsLink Origin Story
2. PonsWarp Origin Story
3. DocuFlow 보안 경계
4. Ruminate의 빠른 답변 위험
5. P2P 제품에도 서버가 필요한 이유
6. DataChannel을 파일 전송에 쓰려면 직접 만들어야 하는 것들

### 9.2 서비스 개발자 증거

1. PonsLink: 요청에서 세션까지 이어지는 흐름
2. PonsWarp: 서버 저장을 줄이는 파일 전송
3. DocuFlow: 민감 문서의 처리 경계
4. Ruminate/FateMirror: 도메인 AI의 단정 위험

### 9.3 기술 깊이 증거

1. WebRTC 연결은 왜 그냥 열리지 않을까
2. STUN, TURN, ICE는 각각 무엇을 책임지는가
3. SFU는 왜 Mesh보다 큰 방에 강한가
4. DataChannel은 파일 전송 API가 아니다
5. bufferedAmount와 backpressure가 파일 전송을 지킨다

### 9.4 운영 감각 증거

1. 블로그 구조를 바꾼 이유
2. SEO/sitemap 운영 기록
3. 배포/캐시/DB sync 관련 운영 노트

## 10. 컴포넌트 설계

### 10.1 `SelectedWritingSection`

목적별 대표 글 그룹을 보여주는 컴포넌트.

Props 초안:

```ts
type SelectedWritingGroup = {
  title: string
  description: string
  posts: Array<{
    slug: string
    title: string
    excerpt: string
    readingTime: number
    reason: string
  }>
}
```

표시 규칙:

- 그룹당 3~4개 이하.
- `reason`은 이 글이 왜 대표 증거인지 설명한다.
- 전체 archive CTA는 섹션 하단에 둔다.

### 10.2 `StartHerePanel`

collection detail 상단에 대표 글 3개를 보여준다.

필드:

- title
- description
- recommended posts
- reading path chips

표시 규칙:

- 전체 글 수보다 먼저 나온다.
- 최신순이 아니라 읽기 순서 기준이다.

### 10.3 `ReadingPathList`

긴 collection을 주제 경로로 나눈다.

예:

```text
연결 경로 이해하기
- P2P 제품에도 서버가 필요한 이유
- signaling server가 필요한 이유
- STUN/TURN/ICE는 각각 무엇을 책임지는가
```

### 10.4 `PortfolioProofBox`

글 상단에 “이 글이 보여주는 역량”을 표시한다.

데이터 주입 방식 후보:

1. Markdown 본문에 blockquote로 직접 작성한다.
2. DB에 `proofBullets` 같은 필드를 추가한다.
3. 태그/시리즈 메타데이터에서 자동 매핑한다.

1차 개편에서는 1번이 가장 안전하다. DB schema 변경 없이 글별 리라이트로 처리할 수 있다.

### 10.5 `ProjectCard` 개선

현재 `ProductRetrospectiveLive`가 `limit={compact ? 3 : 8}`로 표시된다. 기본 work mode에서는 8개가 많다.

개편 규칙:

- `compact` 여부와 무관하게 기본 노출은 3개.
- `전체 회고 보기` CTA를 별도로 둔다.
- 카드 안에서 `전체 68편` 같은 큰 수는 보조 정보로 낮춘다.
- `Hard part` 필드를 추가하면 제품형 개발자 신호가 강화된다.

## 11. 데이터 설계

### 11.1 코드 기반 curated list

초기 개편은 DB schema 변경 없이 코드 상수로 관리한다.

추천 파일:

```text
src/lib/selected-writing.ts
src/lib/reading-paths.ts
```

`selected-writing.ts`:

```ts
export const selectedWritingGroups = [
  {
    title: "처음 보는 사람에게 추천",
    description: "서비스 개발자로서의 판단을 가장 빨리 보여주는 글.",
    posts: [
      { slug: "...", reason: "PonsLink의 문제 정의와 흐름 설계를 보여준다." },
    ],
  },
]
```

`reading-paths.ts`:

```ts
export const collectionReadingPaths = {
  "study-note/realtime-network": [
    {
      title: "WebRTC 연결 실패 보기",
      posts: ["...", "..."],
    },
  ],
}
```

### 11.2 DB 확장은 후순위

필요하면 나중에 다음 필드를 검토한다.

- `Post.editorialTier`: `case-study | deep-dive | note | archive`
- `Post.proofSummary`: 대표 증거 요약
- `Post.recommendedOrder`: 컬렉션 내 추천 순서
- `TaxonomyNode.startHerePostIds`: 컬렉션 대표 글

하지만 초기 구현에서는 DB migration을 피한다. 이유는 현재 데이터 정리와 UI 재배치만으로 핵심 문제가 풀리기 때문이다.

## 12. 리라이트 우선순위

### 12.1 1차 대상: 긴데 소제목 없는 글

우선 대상 조건:

- 5,000자 이상
- H2/H3가 거의 없음
- `실시간 네트워크 딥다이브`에 속함

대표 우선순위:

1. STUN, TURN, ICE 글
2. P2P는 서버가 없다는 뜻이 아니다
3. signaling server 글
4. WebRTC 연결은 왜 그냥 열리지 않을까
5. DataChannel은 파일 전송 API가 아니다
6. TURN 비용 글
7. NAT traversal 실패 글

### 12.2 2차 대상: 중복 도입/결론 정리

대상:

- P2P 딥다이브 3개
- SFU/MCU 계열
- DataChannel 계열

작업:

- 반복되는 도입 문장 제거
- 각 글의 질문을 좁힘
- 겹치는 설명은 대표 가이드 하나에 모으고 나머지는 링크로 넘김

### 12.3 3차 대상: 프로젝트 case study 강화

대상:

- PonsLink
- PonsWarp
- DocuFlow
- Ruminate/FateMirror

작업:

- 프로젝트별 대표 case study 1개씩 만든다.
- 현재 회고 글은 보조 evidence로 연결한다.
- `/work` 카드에서 case study로 연결한다.

## 13. 예시 리라이트 설계

### 13.1 STUN/TURN/ICE 글

현재 상태:

- 약 8,250자
- 읽기 시간 9분
- 소제목 없음
- 설명 밀도는 있지만 스캔이 어렵다.

목표:

- 3,500~4,200자
- H2 5개
- 표 1개
- proof box 1개
- PonsWarp/PonsLink와 연결

구조:

```md
# STUN, TURN, ICE는 각각 무엇을 책임지는가

WebRTC 연결에서 세 단어가 같이 나오면 모두 “연결을 도와주는 서버”처럼 보인다. 하지만 셋은 같은 층위가 아니다.

> 이 글이 보여주는 역량
> - 연결 실패를 주소 발견, 릴레이, 후보 선택 문제로 나눠 본다.
> - TURN 사용률이 비용과 품질 지표에 미치는 영향을 제품 관점에서 본다.
> - WebRTC 기능을 붙일 때 어떤 로그를 남겨야 하는지 판단한다.

## 먼저 결론

| 이름 | 책임 | 제품에서 중요한 이유 |
| --- | --- | --- |
| STUN | 바깥에서 보이는 주소 발견 | 직접 연결 가능성을 확인한다 |
| TURN | 직접 연결 실패 시 릴레이 | 성공률은 올리지만 비용이 생긴다 |
| ICE | 후보 수집과 선택 | 어떤 경로로 붙었는지 결정한다 |

## STUN은 길을 열지 않는다

## TURN은 안전망이지만 공짜가 아니다

## ICE는 서버가 아니라 선택 절차다

## 제품에서는 연결 성공보다 후보 타입을 남겨야 한다

## 지금 다시 보면
```

### 13.2 P2P serverless 오해 글

목표:

- 제목: `P2P 제품에도 서버가 필요한 이유`
- 길이: 3,500~4,000자
- 핵심 판단: 서버 제거가 아니라 서버 책임 축소/이동이다.

구조:

```md
## 먼저 결론
## 서버가 없어지는 부분과 남는 부분
## signaling은 왜 남는가
## relay와 관측은 왜 운영 책임인가
## PonsWarp에서 이 기준이 어떻게 쓰였나
## 지금 다시 보면
```

### 13.3 DataChannel 글

목표:

- 제목: `DataChannel을 파일 전송에 쓰려면 직접 만들어야 하는 것들`
- 길이: 4,000~4,500자
- 핵심 판단: DataChannel은 전송 재료이지 파일 전송 제품이 아니다.

구조:

```md
## 먼저 결론
## DataChannel이 해주는 것
## 해주지 않는 것
## 파일 전송 제품이 직접 만들어야 하는 것
## 실패 복구와 backpressure
## PonsWarp에서 남은 기준
```

## 14. 구현 순서

### Phase 1: 문서와 선별 데이터

1. 이 설계 문서를 확정한다.
2. 대표 글 목록을 확정한다.
3. `selected-writing.ts`, `reading-paths.ts` 초안을 만든다.
4. `/work` 카드 retrospective 노출 정책을 3개로 줄인다.

검증:

- 로컬 빌드.
- `/`, `/work`, `/writing`, `/writing/projects`, 대표 collection 페이지 smoke check.

### Phase 2: UI 입구 개편

1. Home hero 문장을 포지셔닝 중심으로 정리한다.
2. Home에 `내가 잘 맡는 문제` 섹션을 추가한다.
3. `/writing`에 selected writing 섹션을 추가한다.
4. `/writing/projects` 상단에 archive 안내와 CTA를 추가한다.
5. collection detail 상단에 `Start here`와 `Reading paths`를 추가한다.

검증:

- 브라우저에서 첫 화면 스크린샷 확인.
- 모바일 폭에서 네비게이션과 카드 줄바꿈 확인.
- 링크 404 없음 확인.

### Phase 3: 긴 글 구조화

1. 5,000자 이상 소제목 부족 글 목록을 뽑는다.
2. STUN/TURN/ICE 글부터 리라이트한다.
3. 각 글에 proof box와 H2 구조를 추가한다.
4. reading time 재계산.
5. quality check 실행.

검증:

- 마크다운 렌더링 확인.
- 이미지/캡션 손상 없음.
- 관련 글 링크 정상.
- 본문 첫 화면에서 proof box 노출 확인.

### Phase 4: case study 강화

1. PonsLink 대표 case study 작성.
2. PonsWarp 대표 case study 작성.
3. DocuFlow 대표 case study 작성.
4. Ruminate/FateMirror 대표 case study 작성.
5. `/work`에서 각 case study를 1순위 링크로 연결.

검증:

- 채용자용 2분 경로가 `/` -> `/work` -> 대표 case study로 이어지는지 확인.

## 15. 검증 기준

### 15.1 로컬 검증

명령 후보:

```bash
bun test
bun run build
bun run blog-quality:check
bun run seo:check
```

구현 변경 시에는 최소 다음을 확인한다.

- `/`
- `/work`
- `/writing`
- `/writing/projects`
- `/writing/projects/study-note/realtime-network`
- 리라이트한 대표 글 1개

### 15.2 브라우저 검증 체크리스트

- 홈 첫 화면에서 개발자 가치가 한 문장으로 보이는가.
- `/work`에서 프로젝트 3개가 과도한 글 목록 없이 이해되는가.
- `/writing/projects`가 archive임을 명확히 말하는가.
- collection detail에서 대표 글 3개가 전체 목록보다 먼저 보이는가.
- 긴 글 첫 화면에 proof box 또는 명확한 도입이 보이는가.
- 모바일에서 카드/표/네비게이션이 깨지지 않는가.

### 15.3 콘텐츠 검증 체크리스트

- `한 줄 요약`, `먼저 핵심만 보자`, `바로 본론으로` 같은 금지 패턴이 없는가.
- 근거 없이 성능/성과를 과장하지 않는가.
- 글마다 제품 판단 또는 운영 경계가 하나 이상 선명한가.
- 5,000자 이상 글에 H2 4개 이상이 있는가.
- 7,000자 이상 글에 proof box가 있는가.
- 기존 이미지 경로와 캡션이 손상되지 않았는가.

## 16. 리스크와 대응

### 리스크 1: 글을 줄이다가 기술 깊이가 약해질 수 있다

대응:

- 대표 deep dive는 유지한다.
- 보조 설명은 별도 노트로 빼고 내부 링크로 연결한다.
- 삭제보다 계층화를 우선한다.

### 리스크 2: 포트폴리오가 너무 채용자 친화적으로 바뀌어 기존 블로그 정체성이 약해질 수 있다

대응:

- `DESIGN.md`의 editorial archive 분위기를 유지한다.
- 전체 archive 접근은 유지한다.
- selected writing은 입구일 뿐, 전체 기록은 남긴다.

### 리스크 3: DB schema 변경으로 배포 위험이 커질 수 있다

대응:

- 1차는 코드 상수와 기존 필드로 처리한다.
- schema 변경은 후순위로 둔다.

### 리스크 4: 운영 서버와 로컬 DB가 어긋날 수 있다

대응:

- 설계 단계에서는 운영 서버에 반영하지 않는다.
- 구현 단계에서 로컬 DB 수정, 빌드, 검증, 백업, 원격 sync 순서로 진행한다.

## 17. 최종 개편 원칙

1. 전체 글을 줄이는 것이 아니라, 처음 읽을 길을 만든다.
2. 글 수는 신뢰 근거가 아니라 archive 정보다. 전면에 두지 않는다.
3. 대표 서비스는 `Problem -> Decision -> Hard part -> Evidence`로 보인다.
4. 긴 기술 글은 `개념 설명`이 아니라 `제품 판단 증거`로 구조화한다.
5. `Study`는 상단 네비게이션의 주인공이 아니라 archive 내부 경로다.
6. PonsLink/PonsWarp가 중심이고, 다른 글은 그 중심을 보강해야 한다.
7. 첫 방문자는 2분 안에 개발자 가치를 이해해야 한다.

## 18. 다음 실행 단위

다음 단계는 구현이 아니라 선별 확정이다.

1. 대표 글 12개를 최종 확정한다.
2. `selected-writing.ts`에 넣을 그룹명과 reason 문구를 확정한다.
3. `study-note/realtime-network`의 reading path 4개를 확정한다.
4. STUN/TURN/ICE 글을 파일럿 리라이트 대상으로 삼는다.
5. 파일럿 리라이트 후 `/writing/*` 렌더링과 독해 리듬을 검증한다.

이 문서는 운영 반영 전까지 로컬 설계 기준으로 사용한다.
