# PonsLink/PonsWarp 전체 글 스토리텔링 QA

- QA 일시: 2026-06-29
- 대상: blog.ponslink.com PonsLink/PonsWarp 관련 글
- 기준: 로컬 DB `db/custom.db`, 라이브 API `/api/retrospectives?project=ponslink|ponswarp`
- 질문: “왜 만들었는지, 무슨 기술을 왜 썼는지, 어떤 고민을 했고 뭘 해결했는지, 정량/정성 지표가 보이는가?”

## 최종 판정

**부분 통과. 하지만 지금 상태로는 ‘첫 독자가 자연스럽게 따라가는 대표 서사’는 부족하다.**

QA 중 운영 DB에 로컬에는 있던 PonsWarp 핵심 3편(`server-does-not-own-file`, `signaling-is-matchmaker`, `backpressure-before-speed`)이 누락된 것을 발견했고, 운영 DB에 동기화했다. 동기화 후 라이브 PonsWarp retrospective API는 23편을 반환한다.

PonsLink와 PonsWarp의 조각은 있다. 만든 이유, 실패, 기술 선택, 운영 고민, 해결 방향은 글들 곳곳에 들어가 있다. 그런데 전체 아카이브를 처음 보는 독자는 “그래서 이 사람은 왜 이걸 만들었고, 어떤 순서로 여기까지 왔지?”를 한 번에 잡기 어렵다.

특히 PonsLink는 글 수가 많고 제품 운영 글이 강해져서, 초기 동기와 room-first 서사가 뒤로 밀린다. PonsWarp는 기술적 고난은 잘 보이지만, PonsLink에서 분리된 이유와 Rust/WASM/OPFS로 이어지는 필연성이 시리즈 첫 화면에서 바로 보이진 않는다.

## 데이터 기준 요약

로컬 DB 기준으로 `[PonsLink]`/`[PonsWarp]` 제목 또는 해당 category 글을 분석했다.

| 항목 | PonsLink | PonsWarp | 판정 |
|---|---:|---:|---|
| 분석 글 수 | 68편 | 23편 | 충분히 많음 |
| 라이브 retrospective API 노출 | 65편 | 23편 | 운영 DB 누락 3편 동기화 후 일치 |
| 왜 만들었는지 신호 | 68/68 | 23/23 | 있음 |
| 기술 키워드 신호 | 29/68 | 17/23 | PonsLink는 제품 글에서 약함 |
| 기술 선택 이유 신호 | 68/68 | 23/23 | 문장 단위로는 있음 |
| 고민/실패 신호 | 63/68 | 21/23 | 강함 |
| 해결/설계 선택 신호 | 67/68 | 23/23 | 강함 |
| 정량 숫자 신호 | 68/68 | 12/23 | PonsLink는 파일명/시리즈 번호 잡음이 많고, 실제 지표는 약함 |
| 정성 지표 신호 | 68/68 | 23/23 | 강함 |


## QA 중 조치한 운영 누락

운영 DB에는 PonsWarp 핵심 3편이 빠져 있었다. 이 3편은 스토리상 중요한 글이라 QA 중 운영 DB에 동기화했다.

- `[PonsWarp] 서버가 파일을 갖지 않는 전송을 만들고 싶었다`
- `[PonsWarp] Signaling 서버는 파일 운반자가 아니라 소개자였다`
- `[PonsWarp] 대용량 전송에서는 속도보다 흐름 제어가 먼저였다`

운영 DB 백업:

- `/opt/ponslink-blog-next/shared/db/custom.db.before-ponswarp-main-sync-20260629160808`

검증:

- `/api/retrospectives?project=ponswarp&limit=24` → total 23
- `/writing/2026-06-29-main-ponswarp-01-server-does-not-own-file` → HTTP 200
- 대표 다이어그램/이미지 asset → HTTP 200 `image/svg+xml`

## 항목별 QA

### 1. 내가 왜 PonsLink를 만들었는가?

**판정: 있다. 하지만 초입에서 바로 보이지 않는다.**

현재 글에는 다음 동기가 들어 있다.

- 계정 없이 링크 하나로 만나고 싶었다.
- 개인정보를 먼저 요구하지 않는 연결을 만들고 싶었다.
- 하나의 room에서 통화, 채팅, 화이트보드, 통역, 회의록, PonsCast까지 이어지면 좋겠다고 봤다.
- PonsCast는 언어가 다른 사람과 같은 파일을 보며 같은 시간을 공유하고 싶었던 개인적 동기에서 출발했다.
- 이후 좋은 방만으로는 실제 약속이 굴러가지 않아서 request-first, Public Desk, 결제, 요청 상태, 회의록으로 확장됐다.

문제는 이 동기가 “한 편의 입구 글”로 고정되어 있지 않다는 점이다. 홈/제품 카드에서 PonsLink를 누르면 최신 product 글부터 보이기 때문에, 첫 독자는 Product Hunt, 직접 판매, DM 워크플로 같은 운영 후반부를 먼저 본다. 그러면 PonsLink의 원래 감정선인 “부담 없는 연결”과 “같은 방에서 맥락을 잃지 않기”가 늦게 온다.

**보강 필요:** PonsLink 카테고리 상단에 `Start here: 왜 PonsLink를 만들었나` 성격의 고정/대표 글이 필요하다.

### 2. 내가 왜 PonsWarp를 만들었는가?

**판정: 비교적 잘 보인다. 다만 분리 서사는 더 앞에 와야 한다.**

현재 글에는 다음 흐름이 있다.

- PonsWarp는 갑자기 나온 파일 전송 서비스가 아니라 PonsLink 안의 파일 전송이 무거워지면서 분리됐다.
- PonsLink의 room은 사람과 맥락을 다루고, PonsWarp는 파일 흐름을 따로 다뤄야 했다.
- TB급 전송을 상상하자 데이터 그리드, 파티션, 저장 경계, 전송 제어가 필요해졌다.
- 데스크탑 앱/Rust/WASM까지 갔지만, 테스트 기기와 앱 개발 피로 때문에 먼저 웹 P2P를 안정화하기로 했다.
- ACK, 백프래셔, 2GB 메모리 문제, IndexedDB 검토, OPFS 선택으로 이어진다.

이건 좋은 서사다. 다만 라이브 API 기준 PonsWarp 첫 노출은 최신순이라 `실패를 견디는 흐름`, `권한 증명`, `Zero-Copy Pool` 같은 후반 주제가 먼저 온다. 처음 보는 독자에게는 “왜 이게 PonsLink에서 떨어져 나왔는지”보다 “대용량 파일 기술 글 모음”으로 보일 가능성이 있다.

**보강 필요:** PonsWarp에도 `0편: PonsLink 파일 전송에서 PonsWarp가 분리된 이유`를 대표/고정 글처럼 노출해야 한다.

### 3. 무슨 기술을 썼고 왜 그 기술을 썼는가?

**판정: 기술 이름은 충분히 있다. ‘왜 그 기술이어야 했는지’는 글마다 편차가 있다.**

PonsLink 쪽 기술 신호:

- WebRTC
- Mesh
- DataChannel
- signaling broker
- TURN/ICE/SDP 계열 신호 경계
- 상태 머신
- 우선순위 큐
- replay/idempotency
- request state
- PonsCast 프로토콜
- jitter buffer/backpressure
- audio routing

PonsWarp 쪽 기술 신호:

- WebRTC DataChannel
- Signaling
- P2P direct transfer
- Cloud Drop
- ACK/backpressure
- ZIP64
- Rust/WASM
- OPFS
- StreamSaver
- File System Access API
- IndexedDB 검토
- QUIC/Tauri/desktop 실험
- Data Grid/TB급 전송 구상

좋은 점은 기술이 단순 나열로만 있지는 않다는 것이다. 예를 들어 WebRTC는 “서버가 파일을 갖지 않기 위해”, DataChannel은 “화면 공유 대신 제어권을 얻기 위해”, OPFS는 “브라우저 메모리에 파일이 쌓이는 문제를 피하기 위해”, Rust/WASM은 “속도 욕심보다 메모리 생존과 ZIP64/버퍼 경계를 다루기 위해”로 설명된다.

하지만 문제도 있다.

- PonsLink product series 24편은 기술 선택보다 운영 판단 중심이라, 전체 PonsLink를 기술 제품으로 이해하려면 deep-dive/algorithm 글까지 따로 찾아야 한다.
- PonsWarp 일부 글은 기술 제목은 좋은데 본문에서 측정값, 실패 로그, 대안 비교가 약하다.
- 기술 선택의 대안, 포기한 선택, 최종 선택을 한눈에 비교하는 표가 부족하다.

**보강 필요:** 각 프로젝트에 `기술 선택 지도` 글이 필요하다. 예: “왜 WebRTC였나”, “왜 DataChannel이었나”, “왜 OPFS였나”, “왜 Rust/WASM이었나”, “왜 Desktop보다 Web first였나”.

### 4. 어떤 고민을 했는가?

**판정: 가장 강하다.**

현재 글에서 고민은 잘 보인다.

PonsLink:

- 개인정보를 요구하지 않고 연결할 수 있을까
- 방을 먼저 만들지, 요청을 먼저 받을지
- 회의 앱인지 협업 방인지
- 파일 전송을 방 안에 둘지 밖으로 뺄지
- 결제 성공과 입장 권한을 어떻게 분리할지
- DM 상담을 바로 예약으로 보내도 되는지
- Free 10건과 Pro 제한을 어떻게 설계할지
- Product Hunt보다 직접 판매를 먼저 봐야 하는지

PonsWarp:

- 서버가 파일을 갖지 않게 할 수 있을까
- 브라우저끼리 큰 파일을 안정적으로 보낼 수 있을까
- 2GB 이상에서 메모리가 무너질 때 어떻게 저장할까
- ACK와 백프래셔를 어떻게 설계할까
- IndexedDB/OPFS/StreamSaver/File System Access API 중 무엇을 언제 쓸까
- Rust/WASM을 언제 도입해야 할까
- 데스크탑 앱을 계속 밀지, 웹 P2P를 먼저 안정화할지

이 부분은 충분하다.

### 5. 뭘 해결했는가?

**판정: 해결 방향은 보인다. 해결 결과는 덜 보인다.**

해결한 문제의 방향은 잘 보인다.

- PonsLink는 “연결”을 “요청 → 수락/보류/거절 → 세션 → 기록”으로 바꿨다.
- room-first에서 request-first로 제품 중심을 옮겼다.
- PonsCast는 화면 공유가 아니라 파일/재생/자막/오디오를 같은 세션 안에서 다루려 했다.
- PonsWarp는 파일 전송을 PonsLink에서 분리했다.
- PonsWarp는 브라우저 메모리, 저장 방식, ACK, 백프래셔, 직접 전송/Cloud Drop 경계를 나눴다.

하지만 독자가 “그래서 실제로 어느 정도 좋아졌지?”를 물으면 답이 약하다.

예를 들어 아래가 부족하다.

- 전송 가능 파일 크기 변화: before/after
- 메모리 사용량 변화: before/after
- 실패율 변화: before/after
- 재시도/복구 성공 기준
- 요청 플로우 전환 후 단계 수 감소
- DM 상담에서 Public Desk로 바꿨을 때 줄어든 운영 마찰
- room-first에서 request-first로 바꾸면서 사용자가 덜 헷갈리게 된 구체 장면

**보강 필요:** 각 큰 전환마다 “Before / After / 남은 한계” 박스를 넣어야 한다.

### 6. 정성적 지표가 보이는가?

**판정: 잘 보인다.**

정성 지표는 계속 나온다.

- 부담을 낮춘다.
- 개인정보를 먼저 요구하지 않는다.
- 맥락을 끊지 않는다.
- 같은 시간을 공유한다.
- 서버가 파일을 갖지 않는다.
- 사용자가 안심해야 한다.
- 결제보다 입장 권한이 먼저다.
- 속도보다 흐름 보호가 먼저다.
- 기능보다 운영 가능한 제품이 먼저다.

이건 PonsLink/PonsWarp의 철학으로 잘 잡혀 있다.

### 7. 정량적 지표가 보이는가?

**판정: 약하다. 현재 가장 큰 결함이다.**

숫자는 보인다. 하지만 지표로는 약하다.

현재 확인되는 숫자 예시:

- PonsLink: 33편 아카이브, Free 10건, 두 달, 24편 product series 등
- PonsWarp: 1GB, 10GB, 2GB, 4GB, 100GB, TB급, ZIP64 경계 등

하지만 이 숫자들은 대부분 “상황 설명” 또는 “기술 한계값”이다. 제품/기술 성과를 보여주는 정량 지표는 아니다.

독자에게 필요한 정량 지표는 이런 형태다.

- `기존 방식: 2GB 이상 Blob 저장에서 메모리 위험 → 변경 후: StreamSaver/OPFS 경로로 저장 전략 분리`
- `파일 전송 단위: 전체 파일 → chunk/partition/window/ACK 단위`
- `메시지 처리: 단일 DataChannel 흐름 → 제어/파일/재생 신호 분리`
- `운영 흐름: DM 왕복 n단계 → Public Desk 요청/상태/세션 링크 흐름 n단계`
- `Free 플랜: 10건 기준을 둔 이유와 실제 운영상 의미`
- `기술 시리즈: 관련 글 33편/20편이 어떤 문제군으로 나뉘는지`

**결론:** 정성적 설계 철학은 강한데, 정량적 증거는 아직 부족하다.

## Reddit 독자 관점 QA

Reddit 독자가 읽으면 이렇게 반응할 가능성이 높다.

### 좋은 반응

- “혼자 제품 만들면서 어떤 결정을 했는지는 잘 보인다.”
- “PonsWarp가 단순 파일 전송 앱이 아니라 브라우저 저장/전송 제어 문제였다는 건 흥미롭다.”
- “PonsLink가 회의 앱이 아니라 요청과 세션의 흐름이라는 점은 납득된다.”

### 공격받을 수 있는 지점

- “그래서 실제 유저가 썼나?”
- “성능 수치가 어디 있지?”
- “2GB/4GB 이야기는 있는데 실제 테스트 결과가 있나?”
- “WebRTC, OPFS, WASM을 썼다는 건 알겠는데 왜 다른 선택보다 나았는지 비교가 부족하다.”
- “글이 많아서 어디서부터 읽어야 할지 모르겠다.”

## 개선 우선순위

### 1순위: 대표 스토리라인 글 2개를 상단에 고정

- `[PonsLink] 왜 나는 계정 없는 연결 방을 만들기 시작했나`
- `[PonsWarp] 왜 PonsLink 파일 전송을 별도 제품으로 떼어냈나`

이 두 글은 최신순에 묻히면 안 된다. 제품 카드에서 첫 번째로 보여야 한다.

### 2순위: 정량 지표 박스 추가

각 핵심 글에 다음 박스를 넣는다.

```md
## 숫자로 보면
- 문제 크기: ...
- 기존 한계: ...
- 바꾼 기준: ...
- 아직 남은 한계: ...
```

PonsLink 예:

- Free 10건
- 요청 상태 수
- DM → 요청 → 승인 → 세션 단계 수
- 33편 기술 회고가 다루는 문제군 수

PonsWarp 예:

- 2GB Blob 한계
- 4GB ZIP64 경계
- 100GB 데스크탑 실험 목표
- TB급 데이터 그리드 구상
- chunk/window/ACK 단위

### 3순위: 기술 선택 비교표 추가

PonsWarp에는 특히 필요하다.

| 문제 | 검토한 선택 | 선택 | 이유 | 포기한 것 |
|---|---|---|---|---|
| 브라우저 대용량 저장 | Blob/IndexedDB/OPFS/StreamSaver | 상황별 fallback | 메모리 보호 | 단일 저장 경로 |
| 네이티브 성능 | Desktop/Rust/WASM/Web P2P | Web first + WASM core | 테스트 피로와 접근성 | 데스크탑 우선 출시 |
| 파일 경로 | 서버 업로드/P2P/Cloud Drop | Direct + Cloud Drop | 서버 보관 최소화와 실패 대응 | 하나의 전송 모드 |

### 4순위: 읽는 순서 페이지 만들기

현재는 최신순이라 스토리가 깨진다. `/writing?category=PonsLink`와 `/writing?category=PonsWarp`는 아카이브로는 맞지만, 스토리로는 부적합하다.

필요한 건 다음이다.

- `/writing/series/ponslink-origin`
- `/writing/series/ponswarp-origin`

여기서는 시간순/서사순으로 보여야 한다.

## 결론

지금 글들은 “재료”는 충분하다. 왜 만들었는지, 어떤 고민을 했는지, 어떤 기술을 썼는지는 들어 있다.

하지만 **스토리텔링 표면은 아직 약하다.** 이유는 글이 너무 많고 최신순으로 흩어져 있어서, 독자가 대표 서사를 스스로 조립해야 하기 때문이다.

가장 큰 결함은 **정량적 지표 부족**이다. 숫자는 있지만 성과 지표로 정리되어 있지 않다. 그래서 지금 상태는 “고민의 흔적”과 “정성적 판단”은 잘 보이지만, “얼마나 나아졌는지”는 설득력이 약하다.

다음 작업은 글을 더 많이 쓰는 게 아니라, 기존 글 중 핵심 글에 `Start here`, `숫자로 보면`, `기술 선택 비교표`, `Before/After`를 추가하는 쪽이 맞다.
