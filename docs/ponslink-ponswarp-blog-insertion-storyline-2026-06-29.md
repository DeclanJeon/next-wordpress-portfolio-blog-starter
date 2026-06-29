# PonsLink · PonsWarp GitHub 발자취 기반 블로그 삽입 설계
> 확장 설계: `docs/ponslink-ponswarp-expanded-story-insertion-and-reddit-qa-2026-06-29.md`에서 PonsWarp 분리 배경, Desktop 실험, ACK/backpressure, OPFS, PonsCast 개인 서사를 16편 삽입안으로 재설계했다.


작성일: 2026-06-29
목적: 기존 PonsLink/PonsWarp 블로그 글 사이에 초기 레포 발자취와 커밋 기반 정량·정성 지표를 자연스럽게 끼워 넣기

## 1. 결론

새 글을 맨 뒤에 몰아넣으면 안 된다. 이번 내용은 “요약 보고서”가 아니라 두 제품이 어떤 시행착오를 거쳐 지금 구조가 됐는지 보여주는 **중간 다리 글**이어야 한다.

그래서 신규 삽입 글은 10편으로 제한한다.

- PonsLink: 6편
- PonsWarp: 4편

기존 글 75편을 다시 전부 뒤집지 않고, 핵심 구간 사이에만 끼워 넣는다. 기존 글에는 “앞/뒤 글로 이어지는 1~2문장”만 보강한다.

공개 글에는 커밋 번호와 함수 이름을 넣지 않는다. 대신 “초기 레포”, “시그널링 서버”, “백엔드 분리”, “WASM core”, “Rust signaling”, “커밋 비중”처럼 독자가 이해할 수 있는 말로 바꾼다.

## 2. GitHub와 로컬에서 확인한 발자취

### PonsLink 계열

GitHub/로컬에서 확인한 흐름은 다음 순서다.

| 단계 | 저장소 | 기간 | 커밋 수 | 읽어야 하는 의미 |
|---|---|---:|---:|---|
| 0 | `Pons-Link` | 2025-09-14 ~ 2026-05-10 | 314 | 처음에는 “실시간 P2P 화상회의 및 파일 공유 플랫폼”이었다. 요청 데스크보다 방, 기능, 연결 실험이 먼저였다. |
| 0 | `ponslink_signal` | 2025-09-22 ~ 2026-05-02 | 46 | WebRTC는 브라우저만의 문제가 아니었다. 방 입장, replay, TURN, migration을 서버가 정리해야 했다. |
| 0 | `pons-link-backend` | 2026-04-21 ~ 2026-05-05 | 18 | 요청, 이메일, ICS, Google Calendar가 붙으면서 “방 밖의 운영”이 제품 중심으로 올라왔다. |
| 1 | `ponslink-room-frontend` | 2026-05-11 ~ 2026-06-25 | 210 | GitHub launch 이후 방 UI, request-first marketing, public desk, mesh room delivery로 정리됐다. |
| 1 | `ponslink-api-infra` | 2026-05-11 ~ 2026-06-17 | 44 | BFF, session authority, request status, stale participant/token 정리 같은 운영 경계가 강화됐다. |

주의할 점:

- `ponslink-mesh-room`은 GitHub에서 별도 레포로 보이지만, `ponslink-room-frontend`의 `mesh-origin`과 연결되어 있고 첫 커밋도 같다. 합산 지표에 단순 더하면 중복될 수 있다.
- 따라서 공개 글에서는 `Pons-Link → ponslink_signal/pons-link-backend → ponslink-room-frontend/ponslink-api-infra`의 흐름으로 설명한다.

### PonsWarp 계열

PonsWarp는 PonsLink보다 더 오래된 “파일 전송 습관”이 있다.

| 단계 | 저장소 | 기간 | 커밋 수 | 읽어야 하는 의미 |
|---|---|---:|---:|---|
| -1 | `filetransfer` | 2022-05-31 ~ 2023-02-05 | 10 | 아주 초기의 파일 전송 UI/흐름 실험. PonsWarp의 직접 전송 문제의식보다 훨씬 앞선 흔적이다. |
| -1 | `wormhole-file-gate` | 2025-04-30 | 2 | WebTorrent 기반 파일 전송 실험. “파일을 서버 없이 넘기고 싶다”는 전조로 볼 수 있다. |
| -1 | `Mash-P2P-Chat-App` | 2025-10-25 ~ 2025-10-26 | 2 | libp2p와 mesh relay 실험. P2P 연결 감각을 따로 익힌 흔적이다. |
| 0 | `PonsWarp` | 2025-11-20 ~ 2026-06-24 | 147 | 브라우저 기반 직접 파일 전송 제품 본체. |
| 0 | `ponswarp-signal` | 2025-11-20 ~ 2025-12-06 | 9 | Node/Socket.IO signaling. P2P 전송의 “소개자”가 처음 분리됐다. |
| 1 | `pons-core-wasm` | 2025-12-04 ~ 2026-05-14 | 15 | ZIP64, Zero-Copy, 메모리 경계, 스트리밍 core를 브라우저 앱에서 분리했다. |
| 1 | `ponswarp-signaling-rs` | 2025-12-10 ~ 2026-05-17 | 21 | Rust/Tokio/Axum 기반 signaling과 Cloud Drop 권한/공유 서버로 발전했다. |
| 보류 | `ponswarp-desktop` | 2025-12-17 ~ 2026-02-18 | 80 | 웹에서 분리해 desktop으로 간 실험. 본편에는 크게 넣지 않고, 선택지로만 짧게 다룬다. |

## 3. 신규 삽입 글 10편

### PonsLink 삽입 글 6편

#### PL-00. 첫 Pons-Link 레포는 회의 앱보다 약속이 컸다

- 삽입 위치: 기존 `2026-06-16-ponslink-01-why-i-came-back-to-connection` 바로 앞
- 권장 publishedAt: `1781535630000`
- 권장 slug: `2026-06-16-ponslink-00-before-ponslink-room`
- 제목: `[PonsLink] 첫 Pons-Link 레포는 회의 앱보다 약속이 컸다`
- 근거 저장소: `Pons-Link`
- 핵심 근거:
  - README가 “실시간 P2P 화상회의 및 파일 공유 플랫폼”으로 설명한다.
  - 2025-09-14부터 2026-05-10까지 314개 커밋이 있다.
  - 파일/전송 관련 키워드가 52회, 품질/안정화 키워드가 85회였다.
- 글 역할:
  - 현재 PonsLink가 갑자기 request-first 제품으로 나온 게 아니라, 처음엔 방과 연결과 파일 공유 욕심이 컸다는 배경을 준다.
- 도입 예시:
  - “PonsLink가 처음부터 개인 세션 데스크였던 건 아니다. 첫 레포의 문장을 보면 오히려 더 큰 꿈을 꾸고 있었다. 실시간 P2P 화상회의, 파일 공유, 자유로운 연결. 문제는 그 말들이 너무 넓었다는 점이다.”
- 다이어그램:
  - `Pons-Link legacy room → 기능 확장 → 운영 부담 → request-first PonsLink`

#### PL-02. 중앙 시그널링 서버를 만들고서야 방의 책임이 보였다

- 삽입 위치: 기존 02 `webrtc-first-hell`과 03 `beyond-calls` 사이
- 권장 publishedAt: `1781535750000`
- 권장 slug: `2026-06-16-ponslink-02b-signaling-server-responsibility`
- 제목: `[PonsLink] 중앙 시그널링 서버를 만들고서야 방의 책임이 보였다`
- 근거 저장소: `ponslink_signal`
- 핵심 근거:
  - 첫 커밋이 `WebRTC 중앙 시그널링 서버`였다.
  - README에 room, heartbeat, TURN credential, replay/recovery, audio → video migration이 명시되어 있다.
  - signaling 관련 키워드 14회, 안정성/복구 키워드 15회.
- 글 역할:
  - “방 하나” 다음에 바로 “사용자 신뢰”로 넘어가기 전에, 서버가 어떤 책임을 떠안기 시작했는지 설명한다.
- 도입 예시:
  - “WebRTC를 붙이면 브라우저끼리 알아서 만날 것 같았다. 그런데 방에 사람이 들어오고, 나가고, 다시 들어오는 순간부터 서버는 단순 전달자가 아니게 됐다.”
- 다이어그램:
  - `Browser A/B → signaling server → TURN/replay/room migration`

#### PL-04. 기능이 늘어날수록 방은 더 무거워졌다

- 삽입 위치: 기존 04 `feature-sprawl`과 05 `winter-rebuild` 사이
- 권장 publishedAt: `1781535870000`
- 권장 slug: `2026-06-16-ponslink-04b-room-became-heavy`
- 제목: `[PonsLink] 기능이 늘어날수록 방은 더 무거워졌다`
- 근거 저장소: `Pons-Link`
- 핵심 근거:
  - README에 채팅, 화이트보드, CoWatch, PonsCast, 파일 공유 화면이 함께 정리되어 있다.
  - legacy repo에서 file/transfer 관련 키워드가 52회로 높다.
- 글 역할:
  - “방은 협업 공간이 됐다” 다음에 “그래서 제품 문장이 필요했다”로 넘어가는 다리.
- 도입 예시:
  - “채팅을 넣고, 화이트보드를 넣고, 파일 공유를 넣으면 제품이 좋아질 줄 알았다. 하지만 어느 순간 방은 더 유용해진 만큼 더 설명하기 어려워졌다.”
- 다이어그램:
  - `Room shell` 가운데 두고 `chat / whiteboard / file / cowatch / PonsCast`가 붙으며 복잡도가 증가하는 구조.

#### PL-06. 오디오방에서 화상방으로 올리는 순간 서버가 권위자가 됐다

- 삽입 위치: 기존 06 `audio-pivot`과 07 `requests-payments-ops` 사이
- 권장 publishedAt: `1781535990000`
- 권장 slug: `2026-06-16-ponslink-06b-audio-video-migration`
- 제목: `[PonsLink] 오디오방에서 화상방으로 올리는 순간 서버가 권위자가 됐다`
- 근거 저장소: `ponslink_signal`
- 핵심 근거:
  - README에 audio room → video room upgrade flow가 있다.
  - 참여자 전원 동의, 서버 authoritative commit, room-migration-issued 이벤트가 명시되어 있다.
- 글 역할:
  - 오디오 피벗이 단순 UI 변경이 아니라 합의와 권한 문제였음을 보여준다.
- 도입 예시:
  - “오디오방에 카메라 버튼 하나를 더하면 화상방이 될 것 같았다. 실제로는 그렇지 않았다. 누가 전환에 동의했고, 언제 전환됐고, 어떤 방 이름으로 이어지는지를 서버가 확정해야 했다.”
- 다이어그램:
  - `audio room → upgrade proposal → all agree → server commit → video room`

#### PL-07. 백엔드가 생기자 세션은 이메일과 캘린더가 됐다

- 삽입 위치: 기존 07 `requests-payments-ops`와 08 `the-big-pivot` 사이
- 권장 publishedAt: `1781536050000`
- 권장 slug: `2026-06-16-ponslink-07b-backend-calendar-email`
- 제목: `[PonsLink] 백엔드가 생기자 세션은 이메일과 캘린더가 됐다`
- 근거 저장소: `pons-link-backend`
- 핵심 근거:
  - 첫 커밋이 Express+TS server with email, ICS, Google Calendar services였다.
  - 2026-05-05에 미팅 요청 이메일, 캘린더 초대, 공개 데스크 요청 게이트가 집중적으로 등장한다.
  - request/session/desk/booking 키워드가 11회로 가장 높다.
- 글 역할:
  - 요청·결제·운영 글을 실제 백엔드 흔적으로 보강한다.
- 도입 예시:
  - “방 안에서 할 수 있는 일이 늘어날수록, 방 밖에서 해야 하는 일이 더 크게 보였다. 요청을 받으면 이메일이 가야 했고, 시간이 정해지면 캘린더가 움직여야 했다.”
- 다이어그램:
  - `request accepted → email → ICS/calendar → session token → room entry`

#### PL-12. 레포를 갈라낸 뒤 숫자가 말해준 방향

- 삽입 위치: 기존 12 `reading-the-commit-log`와 2026-06-18 기술 회고 묶음 사이
- 권장 publishedAt: `1781536350000`
- 권장 slug: `2026-06-16-ponslink-12b-what-the-repos-said`
- 제목: `[PonsLink] 레포를 갈라낸 뒤 숫자가 말해준 방향`
- 근거 저장소:
  - `Pons-Link`
  - `ponslink_signal`
  - `pons-link-backend`
  - `ponslink-room-frontend`
  - `ponslink-api-infra`
- 핵심 근거:
  - legacy 3개 저장소: 314 + 46 + 18 commits.
  - current main 2개 저장소: 210 + 44 commits.
  - current PonsLink에서 request/session/room 흐름 키워드가 113회, ops/release/deploy가 74회였다.
- 글 역할:
  - 앞선 12편을 숫자로 닫고, 기술 deep-dive 33편으로 넘어가는 게이트.
- 도입 예시:
  - “커밋 숫자는 제품의 성공을 증명하지는 못한다. 하지만 어디에서 오래 망설였는지는 보여준다. PonsLink의 숫자는 방 안보다 방 앞뒤에서 더 많이 흔들렸다.”
- 다이어그램:
  - timeline: `Pons-Link → signaling → backend → room frontend/api infra`

### PonsWarp 삽입 글 4편

#### PW-00. 파일을 직접 보내고 싶다는 습관은 PonsWarp보다 오래됐다

- 삽입 위치: 기존 `2026-06-29-ponswarp-01-browser-direct-transfer` 바로 앞
- 권장 publishedAt: `1782711270000`
- 권장 slug: `2026-06-29-ponswarp-00-before-ponswarp`
- 제목: `[PonsWarp] 파일을 직접 보내고 싶다는 습관은 PonsWarp보다 오래됐다`
- 근거 저장소:
  - `filetransfer`
  - `wormhole-file-gate`
  - `Mash-P2P-Chat-App`
- 핵심 근거:
  - `filetransfer`: 2022년부터 파일 전송 UI/흐름 실험.
  - `wormhole-file-gate`: WebTorrent file transfer system.
  - `Mash-P2P-Chat-App`: libp2p chat app, mesh relay.
- 글 역할:
  - PonsWarp가 갑자기 나온 게 아니라, 파일 전송과 P2P 연결에 대한 오래된 반복에서 나왔다는 전사.
- 도입 예시:
  - “PonsWarp를 만들기 전에도 비슷한 문제를 몇 번 건드렸다. 이름은 달랐고 완성도도 낮았지만, 반복해서 같은 질문으로 돌아갔다. 파일을 꼭 서버에 맡겨야 하나.”
- 다이어그램:
  - `filetransfer → wormhole-file-gate → mesh chat → PonsWarp`

#### PW-03. Node signaling에서 Rust signaling까지, 소개자를 다시 만든 이유

- 삽입 위치: 기존 03 `webrtc-opens-the-road`와 04 `backpressure-protects-transfer` 사이
- 권장 publishedAt: `1782711450000`
- 권장 slug: `2026-06-29-ponswarp-03b-signaling-rewrite`
- 제목: `[PonsWarp] Node signaling에서 Rust signaling까지, 소개자를 다시 만든 이유`
- 근거 저장소:
  - `ponswarp-signal`
  - `ponswarp-signaling-rs`
- 핵심 근거:
  - `ponswarp-signal`: 2025-11-20부터 2025-12-06까지 9 commits. TURN, Multi-Receiver Swarm, 방 ID 정리.
  - `ponswarp-signaling-rs`: Rust/Tokio/Axum signaling, TURN credential, Cloud Drop API, deadlock cleanup.
- 글 역할:
  - “WebRTC는 길만 열어준다” 다음에 그 길을 누가 어떻게 열어주는지 설명한다.
- 도입 예시:
  - “처음 signaling 서버는 가볍게 시작했다. 두 브라우저가 같은 방에서 서로를 찾으면 됐다. 그런데 파일 전송 제품에서는 그 소개자가 생각보다 많은 상태를 들고 있어야 했다.”
- 다이어그램:
  - `Node signaling: room handshake` → `Rust signaling: TURN + Cloud Drop + cleanup + auth`

#### PW-05. WASM core를 따로 뺀 이유는 ZIP64 하나 때문만은 아니었다

- 삽입 위치: 기존 05 `zip64-streaming`과 06 `cloud-drop-complement` 사이
- 권장 publishedAt: `1782711570000`
- 권장 slug: `2026-06-29-ponswarp-05b-wasm-core-boundary`
- 제목: `[PonsWarp] WASM core를 따로 뺀 이유는 ZIP64 하나 때문만은 아니었다`
- 근거 저장소: `pons-core-wasm`
- 핵심 근거:
  - ZIP64 streaming, WASM memory boundary fix, Reordering Buffer, Zero-Copy Pool, Merkle Tree, file signing 흔적.
  - file/transfer/large/zip/wasm 키워드 10회, quality/reliability/perf 키워드 5회.
- 글 역할:
  - ZIP64 글이 기능 설명으로 보이지 않게, core 분리의 설계 판단을 설명한다.
- 도입 예시:
  - “ZIP64가 필요해졌다는 말만 보면 큰 ZIP 파일을 만들기 위한 기능 추가처럼 보인다. 하지만 PonsWarp에서 core를 따로 뺀 이유는 파일 형식 하나보다 넓었다. 브라우저 앱이 계속 흔들리던 메모리와 스트리밍 경계를 따로 붙잡아야 했다.”
- 다이어그램:
  - `React UI → transfer worker → WASM core → stream writer`

#### PW-12. PonsWarp의 숫자는 속도보다 완주 가능성을 가리켰다

- 삽입 위치: 기존 12 `entitlement-before-payment` 뒤, main-service PonsWarp 3편 앞
- 권장 publishedAt: `1782711990000`
- 권장 slug: `2026-06-29-ponswarp-12b-what-the-commits-said`
- 제목: `[PonsWarp] PonsWarp의 숫자는 속도보다 완주 가능성을 가리켰다`
- 근거 저장소:
  - `PonsWarp`
  - `ponswarp-signal`
  - `pons-core-wasm`
  - `ponswarp-signaling-rs`
- 핵심 근거:
  - 본체/Node signal/WASM/Rust signaling 합산 192 commits.
  - file/transfer/large/zip/wasm 계열이 가장 높고, quality/reliability/perf 계열이 그 다음이다.
  - current metric 기준 PonsWarp는 파일 전송/대용량/OPFS/WASM/ZIP64 56회, 안정성/성능 26회.
- 글 역할:
  - PonsWarp 12편을 숫자로 닫고, main-service 3편으로 이어지는 연결 글.
- 도입 예시:
  - “PonsWarp의 커밋을 훑으면 ‘더 빠르게’보다 ‘끝까지’라는 단어가 먼저 떠오른다. 직접 전송, signaling, WASM core, Rust 서버가 전부 같은 질문으로 모인다. 이 파일은 실패해도 사용자가 믿을 수 있는 상태로 남는가.”
- 다이어그램:
  - bar chart style: `direct transfer / signaling / WASM core / cloud drop / recovery`

## 4. 기존 글 보강 위치

신규 글만 넣으면 독자가 “왜 갑자기 과거 레포 이야기가 나오지?”라고 느낄 수 있다. 그래서 아래 기존 글에는 1~2문장짜리 연결 문장을 추가한다.

| 기존 글 | 보강 방향 |
|---|---|
| PonsLink 01 | 첫 Pons-Link 레포가 이미 넓은 연결/회의/파일 공유를 꿈꿨다는 문장 추가. PL-00으로 연결. |
| PonsLink 02 | 방 하나를 만들기 전에 signaling 서버가 먼저 생겼다는 문장 추가. PL-02로 연결. |
| PonsLink 04 | 협업 기능이 늘어날수록 제품 문장이 흐려졌다는 다리 문장 추가. PL-04로 연결. |
| PonsLink 06 | 오디오 피벗이 UI가 아니라 합의/권위 문제였다는 문장 추가. PL-06으로 연결. |
| PonsLink 07 | 백엔드, 이메일, 캘린더가 방 밖 운영을 드러냈다는 문장 추가. PL-07로 연결. |
| PonsLink 12 | “커밋 로그” 글 뒤에 숫자 기반 정리 글이 이어진다는 문장 추가. PL-12로 연결. |
| PonsWarp 01 | PonsWarp 이전에도 파일 직접 전송 실험이 반복됐다는 문장 추가. PW-00으로 연결. |
| PonsWarp 03 | signaling은 보조 서버가 아니라 제품 첫 확신이라는 문장 추가. PW-03으로 연결. |
| PonsWarp 05 | ZIP64는 core 분리의 한 장면이라는 문장 추가. PW-05로 연결. |
| PonsWarp 12 | 권한/결제 글 뒤에 전체 커밋 방향을 정리한다는 문장 추가. PW-12로 연결. |

## 5. 공개 글 작성 규칙

### 반드시 지킬 것

- 반말/구어체 유지.
- 커밋 번호, 함수 이름, 내부 경로는 본문에 노출하지 않는다.
- 숫자는 “작업 비중을 보여주는 힌트”로만 쓴다.
- 실제 속도, 사용자 수, 전환율은 말하지 않는다. 운영 로그나 벤치마크가 없기 때문이다.
- 각 글은 대표 이미지 1개만 둔다.
- 다이어그램은 본문 이해에 필요한 글에만 넣는다.

### 숫자 표현 방식

좋은 표현:

- “초기 레포는 300개 넘는 커밋 동안 방과 파일 공유를 계속 붙잡고 있었다.”
- “PonsLink의 현재 레포에서는 요청, 세션, 룸 흐름을 다룬 커밋 비중이 가장 컸다.”
- “PonsWarp는 속도보다 파일 전송, 복구, WASM core, signaling 쪽에 흔적이 더 많이 남아 있었다.”

피해야 할 표현:

- “속도가 N배 빨라졌다.”
- “전환율이 올랐다.”
- “사용자가 늘었다.”
- “장애가 사라졌다.”

## 6. 시리즈 전체 권장 순서

### PonsLink 권장 순서

1. PL-00 첫 Pons-Link 레포는 회의 앱보다 약속이 컸다
2. 기존 01 한 번 놓친 연결에서 PonsLink가 시작된 이유
3. 기존 02 두 달 동안 방 하나에 매달리며 배운 제품의 첫 얼굴
4. PL-02 중앙 시그널링 서버를 만들고서야 방의 책임이 보였다
5. 기존 03 연결은 붙었지만 신뢰는 쉽게 깨졌다
6. 기존 04 말만으로 부족한 순간, 방은 협업 공간이 됐다
7. PL-04 기능이 늘어날수록 방은 더 무거워졌다
8. 기존 05 방은 있었지만 제품을 설명할 문장은 없었다
9. 기존 06 더 큰 방을 꿈꾸자 PonsLink의 무게가 달라졌다
10. PL-06 오디오방에서 화상방으로 올리는 순간 서버가 권위자가 됐다
11. 기존 07 멋진 분산 구조보다 먼저 감당할 수 있는 제품이 필요했다
12. PL-07 백엔드가 생기자 세션은 이메일과 캘린더가 됐다
13. 기존 08 다시 P2P로 돌아오며 PonsLink의 중심이 선명해졌다
14. 기존 09 파일 전송은 부가 기능이 아니라 제품의 균형 문제였다
15. 기존 10 보여 줄 것만 보여 주고 덜 부담스럽게 들어오게 하기
16. 기존 11 회의방보다 먼저 요청과 운영의 혼란을 정리해야 했다
17. 기존 12 PonsLink가 아직 진행형인 이유는 기능 부족만이 아니었다
18. PL-12 레포를 갈라낸 뒤 숫자가 말해준 방향
19. 이후 2026-06-18 기술 deep-dive / algorithm 글 묶음
20. 이후 2026-06-28 product 글 묶음

### PonsWarp 권장 순서

1. PW-00 파일을 직접 보내고 싶다는 습관은 PonsWarp보다 오래됐다
2. 기존 01 브라우저끼리 대용량 파일을 직접 보내고 싶었다
3. 기존 02 Direct와 Cloud Drop을 나눈 이유
4. 기존 03 WebRTC는 파일을 보내주지 않는다, 길만 열어준다
5. PW-03 Node signaling에서 Rust signaling까지, 소개자를 다시 만든 이유
6. 기존 04 백프레셔는 기다림이 아니라 보호 장치였다
7. 기존 05 ZIP64가 필요해진 순간
8. PW-05 WASM core를 따로 뺀 이유는 ZIP64 하나 때문만은 아니었다
9. 기존 06 Cloud Drop은 P2P의 대체재가 아니라 보완재다
10. 기존 07 끊긴 전송에서 partial file을 남기지 않기로 했다
11. 기존 08 모바일 브라우저가 잠들면 전송은 어떻게 이어져야 하나
12. 기존 09 브라우저마다 파일 저장 방식이 다르게 깨졌다
13. 기존 10 속도를 올리기 전에 파이프라인의 한계를 먼저 정했다
14. 기존 11 Zero-Copy Pool은 빠른 전송보다 GC를 피하기 위한 선택이었다
15. 기존 12 결제 성공보다 권한 증명이 먼저였다
16. PW-12 PonsWarp의 숫자는 속도보다 완주 가능성을 가리켰다
17. 이후 main-service PonsWarp 3편

## 7. 실제 반영 작업 순서

1. 신규 글 10편 초안 생성.
2. 각 글 대표 이미지 생성.
   - PL-00: 오래된 노트/회의방/파일 조각이 하나의 desk로 모이는 장면.
   - PL-02: 두 브라우저 사이에 signaling 서버가 신호만 중계하는 다이어그램형 이미지.
   - PL-04: 방 중앙에 기능 카드가 붙으면서 무거워지는 구조.
   - PL-06: audio room에서 video room으로 승격되는 합의 흐름.
   - PL-07: request → email → calendar → session token 흐름.
   - PL-12: 레포 timeline과 commit 비중을 추상적으로 보여주는 editorial chart.
   - PW-00: filetransfer/wormhole/mesh chat/PonsWarp로 이어지는 파일 이동 지도.
   - PW-03: Node signaling에서 Rust signaling으로 바뀌는 bridge/matchmaker 이미지.
   - PW-05: UI, worker, WASM core, stream writer로 나뉜 파이프라인.
   - PW-12: speedometer가 아니라 completion checklist를 강조한 파일 전송 이미지.
3. 필요한 글에만 SVG 다이어그램 추가.
4. 기존 10개 글에는 연결 문장만 삽입.
5. `publishedAt`을 위 권장값으로 넣어 기존 글 사이에 정렬되게 한다.
6. 로컬 DB 반영 후 태그별 `/writing?tag=PonsLink`, `/writing?tag=PonsWarp` 순서 확인.
7. 본문 중복 이미지, 대표 이미지와 본문 이미지 중복 여부 점검.
8. QA 후 운영 DB 반영.

## 8. 검증 기준

- PonsLink 태그에서 신규 6편이 기존 12편 사이에 들어가야 한다.
- PonsWarp 태그에서 신규 4편이 기존 12편 사이에 들어가야 한다.
- Product card의 전체 글 수는 API 기준 자동 증가해야 한다.
- `PonsLink`는 과거 레포 → signaling → backend → 현재 split repo 흐름이 보여야 한다.
- `PonsWarp`는 오래된 파일 전송 실험 → PonsWarp 본체 → signaling/core 분리 → 완주 가능성 흐름이 보여야 한다.
- 커밋 숫자는 과장 없이 “어디에 시간을 썼는지”만 설명해야 한다.

## 9. 근거 명령

```bash
gh repo list DeclanJeon --limit 200 --json name,description,isPrivate,isArchived,pushedAt,createdAt,url,primaryLanguage

git -C /home/declan/Documents/Develop/Project/아카이브/pons/Pons-Link log --reverse --date=short --pretty=format:'%h %ad %s'
git -C /home/declan/Documents/Develop/Project/아카이브/pons/ponslink_signal log --reverse --date=short --pretty=format:'%h %ad %s'
git -C /home/declan/Documents/Develop/Project/아카이브/pons/pons-link-backend log --reverse --date=short --pretty=format:'%h %ad %s'
git -C /home/declan/Documents/Develop/Project/pons_p2p/ponslink-room-frontend log --date=short --pretty=format:'%h %ad %s'
git -C /home/declan/Documents/Develop/Project/pons_p2p/ponslink-api-infra log --date=short --pretty=format:'%h %ad %s'

git -C /home/declan/Documents/Develop/Project/ponswarp/PonsWarp log --date=short --pretty=format:'%h %ad %s'
git -C /home/declan/Documents/Develop/Project/ponswarp/pons-core-wasm log --date=short --pretty=format:'%h %ad %s'
git -C /home/declan/Documents/Develop/Project/ponswarp/ponswarp-signaling-rs log --date=short --pretty=format:'%h %ad %s'
```
