# 현재 블로그 글 구성 재점검 보고서

- 작성일: 2026-06-29
- 기준 문서: `docs/blog-taxonomy-and-storyline-redesign-2026-06-29.md`
- 기준 DB: `db/custom.db`
- 점검 범위: published 글 중 `PonsLink`, `PonsWarp`, `개발 회고` 관련 글

## 결론

현재 글의 재료는 충분하다. 하지만 지금 구조 그대로는 독자가 스토리를 따라 읽기 어렵다.

이유는 세 가지다.

1. `PonsLink`, `PonsWarp`, `개발 회고`가 같은 레벨의 flat category로 섞여 있다.
2. `tags`에 프로젝트명, 관련 프로젝트, 글 성격, 기술 키워드가 동시에 들어가 있어 필터가 쉽게 오염된다.
3. 최신순 노출이 “왜 만들었는가 → 무엇이 고장났는가 → 어떤 기술을 선택했는가 → 무엇을 해결했는가 → 어떤 지표로 봐야 하는가” 흐름을 깨뜨린다.

따라서 설계문서의 방향은 맞다. 다만 실제 글 목록을 대조해보니 보완해야 할 규칙이 있다.

## 현재 데이터 상태

published 글의 기존 category 분포는 다음과 같다.

| 기존 category | 글 수 | 문제 |
|---|---:|---|
| `PonsLink` | 35 | 프로젝트명이 최상위 category처럼 쓰임 |
| `개발 회고` | 33 | 글 성격이 프로젝트명과 같은 레벨에 섞임 |
| `PonsWarp` | 23 | 프로젝트명이 최상위 category처럼 쓰임 |
| `Document Automation` | 3 | 프로젝트군이 최상위 category처럼 쓰임 |
| `Essays` | 3 | 글 성격 |
| `Ruminate` | 2 | 프로젝트/실험명 |
| `FateMirror` | 1 | 프로젝트/실험명 |
| `Field Notes` | 1 | 글 성격 |
| `Notes` | 1 | 글 성격 |

PonsLink/PonsWarp 관련으로 추출되는 글은 91개다.

- PonsLink 중심 글: 대략 67개
- PonsWarp 중심 글: 대략 24개
- 이 중 3개는 양쪽 프로젝트 태그가 같이 들어가 있어 자동 분류 시 주의가 필요하다.

## 현재 글 흐름 QA

### PonsLink

PonsLink는 스토리 재료가 가장 많다. 이미 다음 흐름은 존재한다.

1. 링크 기반 연결을 만들고 싶었다.
2. Room Page를 먼저 만들었다.
3. 링크는 단순하지만 signaling/권한/상태는 복잡했다.
4. 대화 맥락 때문에 화이트보드, 파일, 통역, 회의록, PonsCast가 붙었다.
5. 방이 무거워지면서 파일 전송은 분리되어야 했다.
6. 제품은 request-first session desk로 좁혀졌다.
7. Public Desk, Request Status, 결제, 권한, 관리자 운영, 직접 판매 판단으로 이어졌다.

그래서 PonsLink는 “왜 만들었는가”와 “어떤 제품 판단을 했는가”는 충분히 보인다.

부족한 부분은 두 가지다.

#### 1. 기술 딥다이브와 제품 회고가 중간에 끊겨 보인다

`2026-06-18-ponslink-deep-dive-*`, `2026-06-18-ponslink-algorithm-*` 글은 기술적으로 좋지만, origin/product story 사이에 그대로 섞이면 독자가 길을 잃는다.

이 글들은 archive 최신순이 아니라 다음 시리즈로 분리해야 한다.

- `PonsLink Origin Story`
- `PonsLink Technical Architecture`
- `PonsLink Product Operations`

#### 2. 정량/정성 지표 블록이 부족한 글이 있다

간단한 키워드 점검 기준으로 PonsLink 쪽에는 지표 보강 후보가 남아 있다.

대표 후보:

- `2026-06-16-ponslink-00-link-only-room`
- `2026-06-16-ponslink-01b-room-before-product`
- `2026-06-16-ponslink-02b-signal-behind-link`
- `2026-06-16-ponslink-04b-room-grew-with-context`
- `2026-06-16-ponslink-04c-ponscast-same-time`
- `2026-06-16-ponslink-07b-good-room-not-enough`
- `2026-06-28-ponslink-product-03-public-request-link-setup`
- `2026-06-28-ponslink-product-05-request-status`
- `2026-06-28-ponslink-product-07-meeting-records`
- `2026-06-28-ponslink-product-15-polar-paid-launch`
- `2026-06-29-main-ponslink-01-room-not-call`

이 글들은 숫자를 억지로 만들어 넣으면 안 된다. 대신 다음 블록을 추가하는 방식이 맞다.

```text
숫자로 보면
- 줄어든 것: 사용자가 회의 전에 해야 하는 입력/단계/확인
- 늘어난 것: 호스트가 사전에 판단할 수 있는 정보
- 아직 못 잰 것: 실제 요청 전환율, 승인율, 첫 응답 시간
```

정량 지표가 실제로 없는 경우에도 “아직 못 잰 것”을 명시하면 오히려 회고의 신뢰도가 올라간다.

### PonsWarp

PonsWarp는 스토리 방향이 좋다.

현재 글은 다음 흐름을 이미 갖고 있다.

1. 파일 전송은 PonsLink 안에서 먼저 고장났다.
2. 서버가 파일을 갖지 않는 전송을 만들고 싶었다.
3. 브라우저끼리 직접 보내려 했다.
4. TB급 전송을 꿈꾸며 데이터 그리드/Rust/WASM/desktop까지 고민했다.
5. 하지만 테스트 기기와 개발 피로도 때문에 웹 우선으로 돌아왔다.
6. WebRTC는 파일을 보내는 기술이 아니라 길을 여는 기술이라는 판단으로 정리됐다.
7. ACK/backpressure/파이프라인/zero-copy/OPFS로 실패를 견디는 흐름을 만들었다.

PonsWarp의 강점은 “왜 PonsLink에서 분리됐는가”가 명확하다는 점이다.

부족한 부분은 세 가지다.

#### 1. `PonsLink` 태그를 primary 분류에 쓰면 안 된다

PonsWarp 첫 글은 당연히 PonsLink와 연결되어야 한다.

예:

- `2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink`
- `2026-06-16-ponslink-09b-file-transfer-left-room`

하지만 이 연결은 primary category가 아니라 secondary relation이다.

정리:

```text
PonsWarp 글의 primary taxonomy:
개발 회고 > PonsWarp > Origin

관련 맥락:
개발 회고 > PonsLink > Origin 또는 Architecture
```

즉, `tag=PonsLink`로 PonsWarp 글이 PonsLink Product에 섞이면 실패다.

#### 2. 일부 글은 제목상 PonsWarp가 아니어도 slug에 ponswarp가 들어간다

`2026-06-16-ponslink-11-ponswarp-split`처럼 PonsLink 회고 글인데 slug에 `ponswarp`가 들어간 경우가 있다.

그래서 자동 매핑은 단순히 `slug contains ponswarp`로 하면 안 된다.

우선순위는 이렇게 잡아야 한다.

1. 제목 prefix `[PonsLink]`, `[PonsWarp]`
2. slug prefix `2026-...-ponslink-`, `2026-...-ponswarp-`
3. 기존 category
4. tags
5. secondary relation

#### 3. PonsWarp도 일부 글은 `왜/기술선택/지표` 블록이 약하다

대표 보강 후보:

- `2026-06-29-ponswarp-02-direct-cloud-drop-modes`
- `2026-06-29-ponswarp-04-backpressure-protects-transfer`
- `2026-06-29-ponswarp-08-mobile-background-resume`
- `2026-06-29-ponswarp-12b-flow-that-survives-failure`
- `2026-06-29-main-ponswarp-01-server-does-not-own-file`

특히 PonsWarp는 기술 선택의 이유가 중요하다. 각 글에는 다음 중 최소 하나가 들어가야 한다.

- 왜 WebRTC인가
- 왜 ACK/backpressure가 필요한가
- 왜 IndexedDB가 아니라 OPFS인가
- 왜 Rust/WASM인가
- 왜 desktop-first에서 web-first로 돌아왔는가
- 왜 Cloud Drop은 대체재가 아니라 보완재인가

## 재구성 권장안

### 대 카테고리

```text
개발 회고
운영 노트
에세이
릴리즈 노트
```

### 개발 회고 하위 중 카테고리

```text
개발 회고
  PonsLink
  PonsWarp
  Document Automation
  Domain AI
  Local Tools
```

### PonsLink 글 배치

```text
개발 회고 > PonsLink > Origin
  - 계정 없이 링크 하나로 만나는 방을 만들고 싶었다
  - 한 번 놓친 연결에서 PonsLink가 시작된 이유
  - 나는 먼저 방을 만들었다, 제품 설명은 그다음이었다
  - 링크는 단순했지만, 뒤에서는 신호가 계속 엉켰다
  - 말로 부족한 순간마다 방에 기능이 하나씩 붙었다
  - PonsCast는 같은 시간을 공유하고 싶어서 만든 기능이었다
  - 파일 전송은 결국 방 밖으로 독립해야 했다
  - 커밋을 다시 보니, 내가 만든 건 회의 앱보다 연결 방식에 가까웠다

개발 회고 > PonsLink > Architecture
  - 처음 열린 저장소에서 제품의 경계를 읽는 법
  - 입장 버튼 뒤에는 어떤 조건들이 숨어 있을까
  - 전역 상태처럼 보였던 런타임 버스
  - 서버가 미디어를 나르지 않을 때 남는 책임
  - WebRTC 전에 신호 경계가 먼저 막아야 하는 것
  - Mesh 연결은 단순해 보여도 순서가 제품 품질을 만든다
  - DataChannel 하나에 모든 메시지를 태우면 왜 위험할까

개발 회고 > PonsLink > Algorithms
  - WebRTC offer 충돌을 피하는 상태 머신 설계
  - 실시간 메시지는 모두 같은 줄에 서면 안 된다
  - P2P 파일 전송에 작은 TCP가 필요했던 이유
  - 놓친 이벤트와 중복 요청을 동시에 줄이는 법
  - 여러 내부 상태를 하나의 사용자 문장으로 접기
  - DataChannel 위에 PonsCast 프로토콜을 올린 이유
  - DataChannel 재생을 버티게 하는 백프레셔와 지터 버퍼
  - PonsCast 파일 감지와 캐시 전략의 기준
  - 마이크와 PonsCast 오디오를 함께 살리는 라우팅
  - PonsCast가 화면 공유 대신 DataChannel을 택한 이유

개발 회고 > PonsLink > Product Decisions
  - DM 상담 요청을 바로 예약으로 보내지 않기로 한 이유
  - Public Desk는 문의 폼이 아니라 첫 번째 운영 게이트다
  - Request Status는 요청 제출 뒤의 침묵을 줄이기 위한 화면이었다
  - 승인과 입장을 같은 순간으로 만들지 않기로 했다
  - Free 10건과 Pro 구조를 이렇게 나눈 이유
  - Product Hunt보다 먼저 직접 판매를 봐야 한다고 판단했다
```

### PonsWarp 글 배치

```text
개발 회고 > PonsWarp > Origin
  - 파일 전송은 PonsLink 안에서 먼저 고장났다
  - 서버가 파일을 갖지 않는 전송을 만들고 싶었다
  - 브라우저끼리 대용량 파일을 직접 보내고 싶었다
  - TB급 전송을 꿈꾸자 데이터 그리드가 필요해졌다
  - 데스크탑 앱까지 갔지만, 테스트할 기기가 없었다

개발 회고 > PonsWarp > Transfer Engine
  - Signaling 서버는 파일 운반자가 아니라 소개자였다
  - WebRTC는 파일을 보내주지 않는다, 길만 열어준다
  - 백프래셔는 기다림이 아니라 보호 장치였다
  - ACK 하나 때문에 전송이 멈추고 살아났다
  - 속도를 올리기 전에 파이프라인의 한계를 먼저 정했다
  - Zero-Copy Pool은 빠른 전송보다 GC를 피하기 위한 선택이었다

개발 회고 > PonsWarp > Browser Storage
  - 2GB를 넘기자 브라우저 메모리가 먼저 무너졌다
  - OPFS는 만능키가 아니라 마지막 안전망이었다
  - 브라우저마다 파일 저장 방식이 다르게 깨졌다

개발 회고 > PonsWarp > Native & WASM
  - ZIP64가 필요해진 순간
  - Rust와 WASM은 속도 욕심보다 메모리 생존을 위한 선택이었다
  - 데스크탑 앱까지 갔지만, 테스트할 기기가 없었다

개발 회고 > PonsWarp > Operations
  - Direct와 Cloud Drop을 나눈 이유
  - Cloud Drop은 P2P의 대체재가 아니라 보완재다
  - 결제 성공보다 권한 증명이 먼저였다
```

## 보완된 설계 규칙

### 1. 프로젝트 판정 규칙

자동 분류는 다음 우선순위를 따른다.

```text
1. title prefix `[PonsLink]` or `[PonsWarp]`
2. slug prefix `YYYY-MM-DD-ponslink-` or `YYYY-MM-DD-ponswarp-`
3. legacy category
4. tags
5. manual override
```

`slug contains ponswarp` 같은 느슨한 조건은 쓰면 안 된다.

### 2. cross-project relation 규칙

PonsLink와 PonsWarp가 모두 등장하는 글은 primary/secondary를 분리한다.

| 글 | primary | secondary |
|---|---|---|
| `ponslink-09b-file-transfer-left-room` | 개발 회고 > PonsLink > Origin | 개발 회고 > PonsWarp > Origin |
| `ponslink-11-ponswarp-split` | 개발 회고 > PonsLink > Product Decisions | 개발 회고 > PonsWarp > Origin |
| `ponswarp-00-file-transfer-broke-in-ponslink` | 개발 회고 > PonsWarp > Origin | 개발 회고 > PonsLink > Architecture |

### 3. 지표 블록 규칙

모든 글에 숫자를 억지로 넣지는 않는다. 대신 핵심 전환 글에는 다음 블록 중 하나를 넣는다.

```text
숫자로 보면
Before: ...
After: ...
아직 못 잰 것: ...
```

또는

```text
정성적으로 바뀐 것
- 사용자가 덜 고민하게 된 지점
- 운영자가 먼저 판단할 수 있게 된 지점
- 실패가 숨겨지지 않고 드러나게 된 지점
```

### 4. 시리즈 첫 화면 규칙

PonsLink와 PonsWarp 대표 페이지는 최신순을 보여주면 안 된다.

반드시 다음 순서로 보여준다.

```text
Start here
왜 만들었는가
무엇이 고장났는가
기술/제품 선택
해결 방식
지표/회고
전체 글 보기
```

## 최종 판단

현재 글들은 스토리텔링 재료는 충분하지만, 노출 구조가 스토리를 망치고 있다.

따라서 다음 작업의 우선순위는 글을 더 쓰는 것이 아니라 다음 순서가 맞다.

1. taxonomy/series 테이블 추가
2. 기존 글 primary/secondary taxonomy 매핑
3. 대표 시리즈 수동 순서 고정
4. PonsLink/PonsWarp 제품 카드에서 Start here 시리즈 우선 노출
5. 지표 블록이 약한 글 보강
6. 그 다음에 추가 글 작성

이 순서로 가야 PonsLink와 PonsWarp가 “많은 글 묶음”이 아니라 “읽히는 개발 회고”가 된다.
