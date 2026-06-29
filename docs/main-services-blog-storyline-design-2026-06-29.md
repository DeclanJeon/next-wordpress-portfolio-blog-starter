# Main Services Blog Storyline Design

Date: 2026-06-29
Target: `blog.ponslink.com`
Source scope: `/home/declan/Documents/Develop/Project` + DeclanJeon GitHub repositories
Tone: 구어체, 반말체, 개발자의 고민과 발자취 중심
Primary reader: 제품을 쓰기 전, 이 서비스가 왜 만들어졌고 어떤 문제를 풀려는지 알고 싶은 사용자/개발자

## 0. 설계 목표

메인 페이지에 노출된 서비스들을 전부 블로그 글로 확장한다.
단순 기능 소개글이 아니라, 다음 흐름이 보이는 글을 만든다.

1. 처음에는 어떤 불편함에서 시작했는지
2. 만들다 보니 실제 문제는 무엇이었는지
3. 그 문제를 해결하려고 어떤 구조를 선택했는지
4. 로컬 프로젝트와 GitHub 저장소에 어떤 구현 흔적이 남아 있는지
5. 지금 돌아보면 어떤 판단이 유효했고, 어떤 부분은 다시 설계하고 싶은지

큰 시리즈의 중심 문장은 다음과 같다.

> 혼자 여러 제품을 만들면서 반복해서 부딪힌 문제와, 그 문제를 제품 구조로 풀어낸 기록.

이 문장을 전체 블로그 시리즈의 기준으로 둔다.

## 1. 전체 편성 원칙

### 1.1 글의 기본 구조

각 글은 다음 구조를 따른다.

1. **처음 문제**
   - “처음엔 그냥 X를 만들려고 했다.”
   - 독자가 바로 공감할 수 있는 실제 상황에서 시작한다.

2. **실제로 막힌 지점**
   - “근데 만들다 보니 진짜 문제는 Y였다.”
   - 기능 구현보다 제품 경계, 운영, UX, 데이터 흐름, 비용, 보안 문제가 컸다는 식으로 전환한다.

3. **설계 선택**
   - 왜 이 구조를 선택했는지 설명한다.
   - 기술 선택은 자랑이 아니라 문제 해결의 결과로 쓴다.

4. **구현 흔적**
   - 관련 프로젝트 디렉토리, repo 성격, 모듈 분리, 문서 흔적을 근거로 사용한다.
   - 커밋 번호나 함수명은 글에 직접 넣지 않는다.

5. **지금 돌아보는 판단**
   - 잘한 점, 아쉬운 점, 다음에 다시 만든다면 바꿀 점을 쓴다.
   - 제품 회고형 글의 마무리로 사용한다.

### 1.2 문체

- 경어체를 쓰지 않는다.
- “했다”, “보였다”, “막혔다”, “고쳤다”, “다시 봤다” 같은 구어체를 사용한다.
- 독자에게 설명하되 강의처럼 쓰지 않는다.
- “한 줄 요약”, “바로 본론으로”, “먼저 핵심만 보자” 같은 AI식 문구는 금지한다.

### 1.3 이미지 원칙

이미지는 장식이 아니라 이해 보조 장치로 사용한다.

- 대표 이미지는 글의 문제 상황을 직관적으로 보여준다.
- 본문 이미지는 맥락상 필요할 때만 넣는다.
- 모든 글에 억지로 다이어그램을 넣지 않는다.
- 구조 설명이 필요한 글에는 다이어그램을 넣는다.
- 같은 콘셉트, 같은 구도, 같은 색감의 이미지를 반복하지 않는다.
- 이미지 생성 시 각 글마다 시각 언어를 다르게 둔다.

예시:

- PonsLink: 실시간 협업 방, 연결선, 세션 중심
- PonsWarp: 두 브라우저 사이를 흐르는 대용량 파일
- DocuFlow: 흩어진 문서 작업이 하나의 파이프라인으로 정리되는 장면
- Ruminate: 고민이 거울과 고전 문장 사이에서 정리되는 장면
- Bible Companion: 한 구절에서 관련 문맥이 가지처럼 펼쳐지는 장면
- MediaScribe: 영상 하나가 Markdown, 블로그, 쇼츠로 분기되는 장면
- Creator Tools: 캡처, 녹화, 다운로드가 작업대 위에 놓인 장면
- Agent Tools: 여러 에이전트가 흔적과 결정을 남기는 작업 보드

## 2. 전체 시리즈 구조

### 2.1 1부: 실시간 연결 제품

대상:

- PonsLink
- PonsWarp

핵심 질문:

- 브라우저끼리 직접 연결하면 어떤 문제가 생기나?
- 실시간 제품에서 서버는 무엇을 해야 하고, 무엇을 하지 말아야 하나?
- 연결 자체보다 어려운 것은 세션, 상태, 실패 복구 아닌가?

### 2.2 2부: 문서와 지식 자동화

대상:

- DocuFlow / PDF마스터
- YouTube-to-MD / MediaScribe / Tube

핵심 질문:

- 반복 문서 작업을 어떻게 흐름으로 묶을 수 있나?
- 영상과 문서를 다시 쓸 수 있는 지식 단위로 바꾸려면 무엇이 필요한가?
- 로컬 처리와 서버 처리의 경계는 어디에 둬야 하나?

### 2.3 3부: 해석과 Companion

대상:

- Ruminate / 명경
- Bible Companion

핵심 질문:

- AI가 정답을 주는 대신 사용자가 자기 상황을 다시 보게 만들 수 있나?
- 해석형 제품은 어디까지 말하고 어디서 멈춰야 하나?
- 콘텐츠보다 문맥을 먼저 보여주는 인터페이스는 어떻게 설계하나?

### 2.4 4부: 크리에이터와 에이전트 도구

대상:

- Flucto / ClickCap / CaptureBrain
- page-production-skills / AgentDock / TraceForge

핵심 질문:

- 크리에이터가 반복하는 귀찮은 작업은 무엇인가?
- AI 에이전트에게 일을 시키려면 프롬프트보다 작업 구조가 먼저 아닌가?
- AI 시대에 결과만이 아니라 과정과 증거를 어떻게 남길 것인가?

---

# 3. 서비스별 글 설계

## 3.1 PonsLink

### 관련 소스

Local:

- `/home/declan/Documents/Develop/Project/pons_p2p/ponslink-room-frontend`
- `/home/declan/Documents/Develop/Project/pons_p2p/ponslink-api-infra`

GitHub:

- `DeclanJeon/ponslink-room-frontend`
- `DeclanJeon/ponslink-api-infra`
- `DeclanJeon/ponslink-mesh-room`
- `DeclanJeon/ponslink_signal`

### 중심 스토리

PonsLink는 화상회의 앱을 만들려던 프로젝트가 아니라, 실시간으로 함께 일하는 “방”을 만들려던 시도다.
처음에는 WebRTC 연결이 핵심처럼 보였지만, 실제로 어려웠던 건 방 안에서 일어나는 여러 상태를 한 경험으로 묶는 일이었다.
영상, 채팅, 화이트보드, 파일 공유, CoWatch, PonsCast가 각각 따로 움직이면 제품이 아니라 기능 모음이 된다.
그래서 PonsLink 글은 “연결”이 아니라 “세션 경험”을 중심으로 써야 한다.

### 추천 글 목록

#### 1. 화상회의 앱을 만들려다 협업 방을 만들게 된 이유

- 도입 문제: 영상 통화만으로는 같이 일한다는 느낌이 부족했다.
- 전환점: 채팅, 파일, 화이트보드, 같이 보기 기능이 방의 일부가 되어야 했다.
- 설계 포인트: room session을 중심에 두고 기능을 붙인다.
- 구현 근거: frontend room app, API infra, signaling repo 분리.
- 회고: 기능을 많이 넣는 것보다 같은 세션 안에서 자연스럽게 이어지는 게 더 중요했다.

이미지:

- 대표 이미지: 하나의 방 안에 영상, 채팅, 화이트보드, 파일 공유가 둥글게 배치된 장면.
- 본문 다이어그램: 사용자들이 하나의 `Room Session`에 연결되고, 아래에 media/data/chat/state가 분기되는 구조.

#### 2. WebRTC Mesh 구조를 선택하면서 생긴 문제들

- 도입 문제: 서버 비용을 줄이고 브라우저끼리 직접 연결하고 싶었다.
- 실패 지점: 참여자가 늘수록 연결 수와 품질 관리가 어려워진다.
- 설계 포인트: mesh는 단순하지만, room 규모와 품질 적응이 중요하다.
- 구현 근거: mesh room frontend, TURN/signaling 관련 repo.
- 회고: 단순한 구조일수록 운영 한계가 빨리 드러난다.

이미지:

- 대표 이미지: 여러 브라우저가 서로 직접 연결된 네트워크 지도.
- 본문 다이어그램: `N users -> N*(N-1)/2 peer links`를 시각화.

#### 3. 실시간 방에서 상태 동기화가 깨지는 순간들

- 도입 문제: 영상은 연결되어 있는데 채팅이나 화이트보드 상태가 어긋날 수 있다.
- 실패 지점: 사용자가 입장/퇴장하거나 네트워크가 흔들릴 때 상태가 불안정해진다.
- 설계 포인트: signaling, room state, UI state의 책임을 분리한다.
- 구현 근거: BFF/API infra와 frontend의 역할 분리.
- 회고: 실시간 제품은 정상 흐름보다 끊겼다가 돌아오는 흐름이 더 중요하다.

이미지:

- 대표 이미지: 같은 방을 보고 있지만 각 화면 상태가 조금씩 어긋난 장면.
- 본문 다이어그램: `join -> sync snapshot -> realtime updates -> reconnect -> resync`.

#### 4. 채팅, 화이트보드, 파일 공유를 한 세션 안에 묶는 법

- 도입 문제: 협업 기능을 각각 붙이면 사용자는 계속 맥락을 잃는다.
- 실패 지점: 파일은 파일대로, 대화는 대화대로, 화면 공유는 화면 공유대로 흩어진다.
- 설계 포인트: 모든 이벤트를 방의 시간선 안에 놓는다.
- 구현 근거: frontend 기능 구성과 API infra.
- 회고: 협업 제품은 기능 수보다 맥락 유지가 더 중요하다.

#### 5. TURN, signaling, BFF를 운영하면서 배운 것

- 도입 문제: 데모에서는 잘 되던 WebRTC가 실제 네트워크에서는 자주 막힌다.
- 실패 지점: NAT, 방화벽, 모바일 네트워크, 브라우저 차이.
- 설계 포인트: signaling과 TURN, BFF를 운영 경계로 나눈다.
- 구현 근거: `ponslink-api-infra`, signaling 관련 repo.
- 회고: P2P 제품도 운영 서버가 필요하다. 단, 서버가 무엇을 책임질지 명확해야 한다.

---

## 3.2 PonsWarp

### 관련 소스

Local:

- `/home/declan/Documents/Develop/Project/ponswarp/PonsWarp`
- `/home/declan/Documents/Develop/Project/ponswarp/pons-core-wasm`
- `/home/declan/Documents/Develop/Project/ponswarp/ponswarp-signaling-rs`

GitHub:

- `DeclanJeon/PonsWarp`
- `DeclanJeon/pons-core-wasm`
- `DeclanJeon/ponswarp-signaling-rs`
- `DeclanJeon/ponswarp-desktop`
- `DeclanJeon/ponswarp-signal`

### 중심 스토리

PonsWarp는 “파일을 서버에 올리지 않고도 큰 파일을 보낼 수 있을까?”에서 출발한다.
처음에는 WebRTC DataChannel만 열리면 해결될 것처럼 보인다.
하지만 대용량 파일 전송에서는 연결보다 흐름 제어, 저장소, 복구, 메모리 사용량이 더 중요해진다.
그래서 PonsWarp 글은 서버 없는 전송의 낭만보다, 브라우저 위에서 대용량 데이터를 안정적으로 흘려보내는 과정에 초점을 맞춘다.

### 추천 글 목록

#### 1. 서버가 파일을 갖지 않는 전송 서비스를 만들고 싶었다

- 도입 문제: 큰 파일을 보내려고 하면 업로드 제한, 서버 비용, 개인정보 문제가 동시에 생긴다.
- 전환점: 서버가 파일을 들고 있지 않아도 연결만 도와줄 수 있다.
- 설계 포인트: signaling 서버는 연결만 돕고, 파일 데이터는 브라우저끼리 직접 이동한다.
- 구현 근거: PonsWarp app, signaling repo 분리.
- 회고: “서버리스 파일 전송”이 아니라 “서버가 파일을 모르는 전송”에 가깝다.

이미지:

- 대표 이미지: 두 브라우저 사이로 큰 파일 블록이 직접 이동하고, 서버는 위에서 연결선만 잡아주는 장면.
- 본문 다이어그램: `Sender Browser -> WebRTC DataChannel -> Receiver Browser`, `Signaling Server: SDP/ICE only`.

#### 2. P2P 파일 전송에서 signaling 서버가 하는 일

- 도입 문제: P2P라고 해도 처음 만나는 두 브라우저는 서로를 모른다.
- 실패 지점: SDP, ICE, room matching, reconnect 흐름이 엉키면 전송은 시작도 못 한다.
- 설계 포인트: signaling은 데이터 경유지가 아니라 소개자 역할만 한다.
- 구현 근거: Rust signaling, Node signaling 이력.
- 회고: signaling은 작아 보이지만 UX 전체를 좌우한다.

#### 3. 대용량 파일 전송에서 backpressure가 중요한 이유

- 도입 문제: 빠르게 보내는 것만 생각하면 브라우저 메모리나 receiver가 먼저 터진다.
- 실패 지점: sender가 receiver 처리 속도를 무시하면 전송이 불안정해진다.
- 설계 포인트: chunk, queue, buffered amount, pause/resume 흐름.
- 구현 근거: PonsWarp app과 WASM core 분리.
- 회고: 대용량 전송은 속도보다 흐름을 무너뜨리지 않는 게 먼저다.

이미지:

- 본문 다이어그램: `read chunk -> queue -> data channel buffer -> receiver write -> ack/pressure signal`.

#### 4. OPFS와 브라우저 저장소를 쓰면서 생긴 판단들

- 도입 문제: 파일을 전부 메모리에 올릴 수 없다.
- 실패 지점: 브라우저 저장소 제약, 권한, 용량, 사용자 기대치.
- 설계 포인트: OPFS/streaming 기반으로 큰 파일을 처리한다.
- 회고: 브라우저는 점점 로컬 앱처럼 쓸 수 있지만, UX로 제약을 숨기면 안 된다.

#### 5. WASM core를 분리한 이유

- 도입 문제: 전송 UI와 핵심 데이터 처리 로직이 섞이면 실험이 어려워진다.
- 설계 포인트: core를 WASM/Rust 계층으로 분리해 성능과 재사용성을 확보한다.
- 구현 근거: `pons-core-wasm`.
- 회고: 처음부터 분리하기보다 병목이 보인 뒤 분리한 판단으로 서술한다.

#### 6. PonsWarp Desktop까지 생각하게 된 흐름

- 도입 문제: 브라우저만으로는 OS 통합, 큰 파일 UX, 백그라운드 동작에 한계가 있다.
- 설계 포인트: web product와 desktop wrapper의 경계.
- 구현 근거: `ponswarp-desktop`.
- 회고: 웹에서 시작했지만 사용 맥락이 데스크톱에 더 가까운 순간이 있었다.

---

## 3.3 DocuFlow / PDF마스터

### 관련 소스

Local:

- `/home/declan/Documents/Develop/Project/pdf-master`
- `/home/declan/Documents/Develop/Project/docuflow/reference/DocuFlow`
- `/home/declan/Documents/Develop/Project/docuflow/reference/pdf-master`
- `/home/declan/Documents/Develop/Project/docuflow/reference/Private-PDF`
- `/home/declan/Documents/Develop/Project/docuflow/reference/privacy-shield-pdf`
- `/home/declan/Documents/Develop/Project/docuflow/reference/pdftomd`

GitHub:

- `DeclanJeon/DocuFlow`
- `DeclanJeon/pdf-master`
- `DeclanJeon/pdftomd`
- `DeclanJeon/Private-PDF`
- `DeclanJeon/privacy-shield-pdf`
- `DeclanJeon/HwpForge`

### 중심 스토리

DocuFlow와 PDF마스터는 문서 도구 모음이 아니라 반복 문서 작업을 하나의 흐름으로 묶으려는 시도다.
PDF 병합, 분할, OCR, 마스킹, HWP 변환은 각각 보면 작은 기능이다.
하지만 실제 사용자는 문서 하나를 처리하려고 여러 사이트를 돌아다닌다.
이 시리즈는 “기능별 도구”에서 “문서 처리 흐름”으로 관점이 바뀌는 과정을 다룬다.

### 추천 글 목록

#### 1. PDF 도구를 만들다가 문서 자동화 제품으로 방향을 바꾼 이유

- 도입 문제: PDF 합치기나 분할 같은 기능은 많지만 사용자는 여전히 번거롭다.
- 전환점: 문제는 개별 기능 부재가 아니라 작업 흐름의 단절이었다.
- 설계 포인트: 입력, 분석, 변환, 보호, 출력의 pipeline.
- 구현 근거: PDF마스터, DocuFlow, pdftomd, Private-PDF.
- 회고: 도구를 많이 만드는 것보다 흐름을 줄이는 게 제품에 가깝다.

이미지:

- 대표 이미지: 흩어진 PDF, HWP, 이미지 문서가 하나의 처리 레일로 들어가는 장면.
- 본문 다이어그램: `문서 입력 -> 분석 -> OCR/변환/마스킹 -> 검토 -> 출력`.

#### 2. 한국 사용자에게 PDF만으로는 부족했던 이유

- 도입 문제: 한국 문서 업무에는 HWP, 도장, 인감, 주민번호 같은 맥락이 따라온다.
- 실패 지점: 글로벌 PDF 도구만으로는 실제 업무 흐름을 덮기 어렵다.
- 설계 포인트: HWPX, 마스킹, 인감/도장, OCR을 함께 본다.
- 구현 근거: `HwpForge`, `pdf-master` 문서/기능.
- 회고: 로컬 문제를 정확히 보면 제품의 방향이 선명해진다.

#### 3. 브라우저 로컬 처리와 서버 처리의 경계

- 도입 문제: 문서는 민감하다. 아무 서버에 올리고 싶지 않다.
- 실패 지점: 모든 것을 로컬에서 하려면 성능과 브라우저 제약이 걸린다.
- 설계 포인트: 민감 정보 처리는 로컬 우선, 무거운 작업은 선택적 서버 처리.
- 구현 근거: Private-PDF, privacy-shield-pdf.
- 회고: 보안 제품은 “안전하다”보다 “어디서 처리되는지 보인다”가 중요하다.

#### 4. OCR, Markdown 변환, 마스킹을 하나의 흐름으로 묶기

- 도입 문제: 문서에서 텍스트를 뽑는 것과 안전하게 공개하는 것은 연결된 문제다.
- 설계 포인트: OCR/pdftomd -> 구조화 -> 민감정보 탐지/마스킹 -> 결과물.
- 구현 근거: `pdftomd`, PDF마스터 계열.
- 회고: 변환 결과의 품질은 후속 자동화의 품질을 결정한다.

#### 5. HWPX 자동화를 제품으로 만들 수 있을까

- 도입 문제: HWPX는 한국 업무에서 중요하지만 개발 도구화가 쉽지 않다.
- 설계 포인트: Markdown -> HWPX, JSON round-trip, agent/MCP 연동 가능성.
- 구현 근거: `HwpForge`.
- 회고: 문서 자동화의 다음 단계는 PDF가 아니라 편집 가능한 업무 문서일 수 있다.

---

## 3.4 Ruminate / 명경

### 관련 소스

Local:

- `/home/declan/Documents/Develop/Project/ruminate`
- `/home/declan/Documents/Develop/Project/saju-engine-web`
- `/home/declan/Documents/Develop/Project/saju`
- `/home/declan/Documents/Develop/Project/discode_saju`

GitHub:

- `DeclanJeon/ruminate`
- `DeclanJeon/saju-engine-web`
- `DeclanJeon/saju-api`
- `DeclanJeon/discord-saju-bot`
- `DeclanJeon/discord-saju-engine`
- `DeclanJeon/saju-compass`
- `DeclanJeon/InnerCompass`

### 중심 스토리

Ruminate와 명경은 AI가 답을 주는 서비스라기보다, 사용자가 자기 상황을 다시 보게 만드는 해석 도구다.
Ruminate는 고전 문장을 통해 고민을 되새기게 만들고, 명경은 사주를 운세 소비물이 아니라 자기 이해의 인터페이스로 다룬다.
이 시리즈는 AI가 어디까지 말하고 어디서 멈춰야 하는지를 중심으로 쓴다.

### 추천 글 목록

#### 1. AI 상담 서비스를 만들면서 가장 먼저 경계한 것

- 도입 문제: AI 상담은 쉽게 단정적 조언으로 흐른다.
- 실패 지점: 사용자의 삶을 너무 쉽게 해석하거나 해결책을 말해버릴 위험이 있다.
- 설계 포인트: 답변보다 질문, 처방보다 반추.
- 구현 근거: Ruminate의 고전 기반 상담 구조.
- 회고: 사람의 고민을 다루는 제품은 똑똑함보다 조심성이 먼저다.

이미지:

- 대표 이미지: 어두운 책상 위 고민 메모와 고전 문장이 거울처럼 놓인 장면.
- 본문 다이어그램: `사용자 고민 -> 맥락 분해 -> 고전 문장 연결 -> 질문 생성 -> 자기 회고`.

#### 2. 고전 문장을 답변이 아니라 질문으로 쓰기

- 도입 문제: 고전 문장을 인용하면 그럴듯하지만, 사용자의 상황과 동떨어질 수 있다.
- 설계 포인트: 고전은 권위가 아니라 생각을 여는 장치로 사용한다.
- 구현 근거: `ruminate`의 고전 wisdom 자료 구조.
- 회고: 좋은 문장은 답을 닫지 않고 생각을 열어야 한다.

#### 3. 명경은 왜 운세 서비스가 아니라 자기 해석 도구여야 했나

- 도입 문제: 사주 서비스는 쉽게 “맞춘다/틀린다” 게임이 된다.
- 실패 지점: 사용자가 자기 삶을 수동적으로 받아들이게 만들 수 있다.
- 설계 포인트: 해석 결과를 단정이 아니라 관찰 프레임으로 제공한다.
- 구현 근거: saju engine, API, web, FateMirror 관련 문서.
- 회고: 명경은 미래 예측보다 자기 패턴을 보는 거울에 가깝다.

#### 4. 사주 엔진과 웹 인터페이스를 분리한 이유

- 도입 문제: 계산 로직과 사용자 경험이 섞이면 검증도 어렵고 확장도 어렵다.
- 설계 포인트: engine, API, web, Discord bot adapter 분리.
- 구현 근거: `discord-saju-engine`, `saju-api`, `saju-engine-web`, `discord-saju-bot`.
- 회고: 해석형 제품일수록 계산과 표현의 경계를 분리해야 한다.

#### 5. AI가 사람의 고민을 다룰 때 지켜야 할 선

- 도입 문제: AI는 유창하게 말하지만, 그 말이 항상 안전한 것은 아니다.
- 설계 포인트: 단정 금지, 의료/법률/인생 결정 경계, 사용자의 선택권 유지.
- 회고: 기술적으로 가능한 답변과 제품적으로 해야 하는 답변은 다르다.

---

## 3.5 Bible Companion

### 관련 소스

Local:

- `/home/declan/Documents/Develop/Project/bible`

GitHub:

- `DeclanJeon/bible`

### 중심 스토리

Bible Companion은 성경 앱을 하나 더 만드는 프로젝트가 아니라, 본문을 따라가며 읽는 방식을 다시 설계하려는 시도다.
검색, 북마크, 읽기 기능보다 중요한 것은 한 구절이 어떤 문맥과 연결되는지 보여주는 일이다.
이 시리즈는 성경을 소비하는 앱이 아니라 passage-first companion으로 설계한 이유를 중심으로 쓴다.

### 추천 글 목록

#### 1. 성경 앱을 만들면서 검색보다 문맥을 먼저 본 이유

- 도입 문제: 검색은 빠르지만 문맥을 쉽게 잘라낸다.
- 전환점: 사용자가 구절을 찾은 뒤, 그 앞뒤 문맥과 연결 본문을 자연스럽게 따라가야 한다.
- 설계 포인트: passage-first reader.
- 구현 근거: Bible Companion repo.
- 회고: 신앙 콘텐츠는 빠른 답보다 오래 읽을 수 있는 구조가 중요하다.

이미지:

- 대표 이미지: 한 구절에서 주변 문맥과 연결 구절이 가지처럼 펼쳐지는 장면.
- 본문 다이어그램: `본문 -> 구절 -> 문맥 -> 연결 구절 -> 개인 노트`.

#### 2. 한국어와 영어 성경을 함께 읽는 인터페이스

- 도입 문제: 번역이 다르면 같은 구절도 다르게 읽힌다.
- 설계 포인트: 한국어/영어 병렬 읽기, 구절 단위 비교.
- 회고: 병렬 표시는 기능이 아니라 해석을 돕는 장치다.

#### 3. Bible Companion이 주석보다 연결을 중시하는 이유

- 도입 문제: 주석은 도움이 되지만 사용자가 본문보다 해설을 먼저 읽게 만들 수 있다.
- 설계 포인트: 해설을 밀어붙이기보다 본문 간 연결을 먼저 보여준다.
- 회고: Companion은 대신 읽어주는 도구가 아니라 옆에서 따라가게 해주는 도구다.

---

## 3.6 YouTube-to-MD / MediaScribe / Tube

### 관련 소스

Local:

- `/home/declan/Documents/Develop/Project/youtube_to_md`
- `/home/declan/Documents/Develop/Project/tube`
- `/home/declan/Documents/Develop/Project/youtube_search`
- `/home/declan/Documents/Develop/Project/youtube_short_generate`
- `/home/declan/Documents/Develop/Project/n8n`

GitHub:

- `DeclanJeon/youtube-to-md`
- `DeclanJeon/pons-tube-markdown-video-factory`
- `DeclanJeon/MediaScribe`
- `DeclanJeon/TrendLens`
- `DeclanJeon/Linea`

### 중심 스토리

YouTube-to-MD와 MediaScribe 계열은 영상을 짧게 요약하려는 도구가 아니다.
영상 안에 들어 있는 지식을 다시 쓰기 좋은 형태로 바꾸려는 시도다.
Markdown은 이 과정의 중간 포맷이 된다.
영상 하나가 블로그, 쇼츠, 카드뉴스, 스크립트로 분기될 수 있도록 만드는 것이 이 시리즈의 중심이다.

### 추천 글 목록

#### 1. YouTube 영상을 Markdown으로 바꾸고 싶었던 이유

- 도입 문제: 좋은 영상은 많지만 다시 찾고 재사용하기 어렵다.
- 전환점: 영상 내용을 글로 바꾸면 검색, 편집, 재가공이 가능해진다.
- 설계 포인트: URL -> transcript/audio -> Markdown.
- 구현 근거: `youtube_to_md`, `youtube-to-md`.
- 회고: 요약보다 중요한 건 다시 쓸 수 있는 구조로 바꾸는 것이다.

이미지:

- 대표 이미지: YouTube 영상 프레임이 Markdown 문서로 변환되는 장면.
- 본문 다이어그램: `YouTube URL -> 자막/음성 -> transcript -> Markdown -> editor`.

#### 2. 영상 요약과 transcript 정리의 차이

- 도입 문제: 요약은 빠르지만 원문 맥락을 잃기 쉽다.
- 설계 포인트: transcript를 보존하고, 그 위에 요약/섹션/태그를 얹는다.
- 회고: 좋은 자동화는 원본을 없애지 않고 재가공 층을 추가한다.

#### 3. Markdown을 중간 포맷으로 선택한 이유

- 도입 문제: 최종 결과물이 블로그인지, 스크립트인지, 쇼츠인지 처음부터 고정하기 어렵다.
- 설계 포인트: Markdown을 중간 산출물로 두면 여러 포맷으로 확장하기 쉽다.
- 구현 근거: Tube Markdown Video Factory.
- 회고: 중간 포맷을 잘 잡으면 제품 방향을 바꾸기 쉬워진다.

#### 4. Tube를 영상 제작 공장처럼 설계한 과정

- 도입 문제: 콘텐츠 제작은 한 번의 생성이 아니라 여러 단계의 공정이다.
- 설계 포인트: 기획, 스크립트, 렌더링, 게시 준비를 pipeline으로 본다.
- 구현 근거: `tube`, `n8n` design docs.
- 회고: 자동화는 버튼 하나보다 공정 전체를 줄이는 쪽이 더 강하다.

#### 5. TrendLens와 콘텐츠 기획 자동화

- 도입 문제: 무엇을 만들지 정하는 시간이 제작 시간만큼 오래 걸린다.
- 설계 포인트: YouTube trend 분석을 기획 입력으로 사용한다.
- 구현 근거: `TrendLens`, `youtube_search`.
- 회고: 생성 자동화보다 앞단의 선택 자동화가 더 큰 시간을 줄일 수 있다.

---

## 3.7 Flucto / ClickCap / CaptureBrain

### 관련 소스

Local:

- `/home/declan/Documents/Develop/Project/flucto`
- `/home/declan/Documents/Develop/Project/ClickCap`

GitHub:

- `DeclanJeon/flucto`
- `DeclanJeon/ClickCap`
- `DeclanJeon/CaptureBrain`
- `DeclanJeon/octo-captures`
- `DeclanJeon/HLS-Stream-Capturer-Chrome`

### 중심 스토리

이 계열은 크리에이터를 위한 작은 생산성 도구들이다.
화려한 편집기를 만드는 것보다 먼저, 다운로드하고, 녹화하고, 캡처하고, 분류하는 반복 작업을 줄이는 데 집중한다.
Flucto는 미디어 수집, ClickCap은 튜토리얼 녹화, CaptureBrain은 스크린샷 분류 문제를 다룬다.

### 추천 글 목록

#### 1. 크리에이터 도구를 만들 때 편집보다 먼저 봐야 하는 것

- 도입 문제: 콘텐츠 제작에서 진짜 귀찮은 건 편집 전 단계일 때가 많다.
- 전환점: 링크 수집, 다운로드, 화면 녹화, 캡처 정리가 계속 반복된다.
- 설계 포인트: 수집 -> 기록 -> 분류 -> 재사용 흐름.
- 구현 근거: Flucto, ClickCap, CaptureBrain.
- 회고: 작은 도구라도 반복을 줄이면 제품 가치가 생긴다.

이미지:

- 대표 이미지: 크리에이터 작업대 위에 다운로드, 녹화, 캡처 카드가 놓여 있고 하나의 흐름으로 이어지는 장면.
- 본문 다이어그램: `수집 -> 녹화/캡처 -> 자동 강조/분류 -> 저장 -> 재사용`.

#### 2. Flucto: 링크 여러 개를 처리하는 다운로드 흐름

- 도입 문제: 미디어 링크를 하나씩 처리하는 건 생각보다 번거롭다.
- 설계 포인트: multi-link, parallel download, 진행 상태 관리.
- 구현 근거: `flucto`.
- 회고: 다운로드 도구의 UX는 속도보다 예측 가능성이 중요하다.

#### 3. ClickCap: 클릭을 자동으로 확대하면 튜토리얼 제작이 쉬워진다

- 도입 문제: 화면 녹화는 됐는데, 사용자가 어디를 클릭했는지 잘 안 보인다.
- 설계 포인트: 클릭 감지, 자동 zoom, GIF/WebM export.
- 구현 근거: `ClickCap` README와 package.
- 회고: 튜토리얼 도구는 설명을 줄여주는 방향으로 가야 한다.

#### 4. CaptureBrain: 스크린샷은 저장보다 분류가 문제다

- 도입 문제: 스크린샷은 많이 찍지만 나중에 찾지 못한다.
- 설계 포인트: 자동 분류, Google Drive 저장, 재검색 가능성.
- 구현 근거: GitHub `CaptureBrain`.
- 회고: 캡처 도구의 핵심은 찍는 순간보다 다시 찾는 순간에 있다.

#### 5. 녹화, 캡처, 다운로드 도구를 하나의 작업 흐름으로 보는 법

- 도입 문제: 각각은 작은 유틸리티지만, creator workflow 안에서는 연결된다.
- 설계 포인트: input capture layer, asset library, publishing pipeline.
- 회고: 도구를 묶는 기준은 기술이 아니라 사용자의 하루 흐름이다.

---

## 3.8 page-production-skills / AgentDock / TraceForge

### 관련 소스

Local:

- `/home/declan/Documents/Develop/Project/agentdock`
- `/home/declan/Documents/Develop/Project/TraceForge`
- `/home/declan/Documents/Develop/Project/PageCraft`
- `/home/declan/Documents/Develop/Project/0a_code_weaver`
- `/home/declan/Documents/Develop/Project/SeedForge`

GitHub:

- `DeclanJeon/page-production-skills`
- `DeclanJeon/agentdock`
- `DeclanJeon/TraceForge`
- `DeclanJeon/agent-team-orchestrator`
- `DeclanJeon/CodeWeaver`

### 중심 스토리

이 계열은 AI 에이전트에게 일을 맡기면서 생긴 고민에서 출발한다.
처음에는 좋은 프롬프트가 핵심처럼 보이지만, 실제로는 작업 구조, 역할 분리, 증거 수집, 리뷰 게이트가 더 중요하다.
page-production-skills는 페이지 제작을 판단 단계로 쪼개고, AgentDock은 로컬 multi-agent 작업실을 만들고, TraceForge는 AI 작업의 과정과 증거를 남기려 한다.

### 추천 글 목록

#### 1. AI 에이전트 작업에서 프롬프트보다 중요한 것

- 도입 문제: 프롬프트를 잘 써도 결과가 매번 달라진다.
- 전환점: 결과 품질은 프롬프트보다 작업 구조와 검증 루프에 더 많이 좌우된다.
- 설계 포인트: role, evidence, handoff, review gate.
- 구현 근거: page-production-skills, agent-team-orchestrator, AgentDock.
- 회고: AI 작업은 말 잘 시키는 문제가 아니라 일의 형태를 설계하는 문제다.

이미지:

- 대표 이미지: 여러 AI 에이전트가 작업 보드 위에서 증거, 판단, 산출물을 나눠 맡는 장면.
- 본문 다이어그램: `요구사항 -> 증거 수집 -> 역할 분배 -> 작업 -> 리뷰 -> 기록`.

#### 2. page-production-skills: 페이지 제작을 단계별 판단으로 쪼개기

- 도입 문제: 랜딩페이지를 만들 때 감으로 쓰면 메시지가 흐려진다.
- 설계 포인트: audience, positioning, proof, objection, CTA, final brief로 나눈다.
- 구현 근거: GitHub `page-production-skills`.
- 회고: 좋은 페이지는 디자인보다 먼저 판단 구조가 필요하다.

#### 3. AgentDock: tmux 기반 작업실을 만든 이유

- 도입 문제: 여러 에이전트를 한꺼번에 돌리면 누가 무엇을 했는지 흐려진다.
- 설계 포인트: tmux workroom, role boundary, handoff contract.
- 구현 근거: `agentdock`.
- 회고: 멀티 에이전트는 병렬 실행보다 조율 구조가 먼저다.

#### 4. TraceForge: AI 작업의 결과보다 과정이 중요해진 순간

- 도입 문제: 결과물만 있으면 어떻게 만들어졌는지 증명하기 어렵다.
- 설계 포인트: local-first evidence recorder, 작업 흔적, privacy.
- 구현 근거: `TraceForge`.
- 회고: AI 시대에는 산출물보다 과정의 신뢰가 중요해진다.

#### 5. CodeWeaver와 AI-ready documentation

- 도입 문제: AI에게 큰 코드베이스를 설명하려면 파일을 그냥 던지는 것으로는 부족하다.
- 설계 포인트: source aggregation, dependency analysis, compression, Markdown export.
- 구현 근거: `CodeWeaver`, local `0a_code_weaver`.
- 회고: AI가 잘 일하게 하려면 코드도 읽히기 좋은 형태로 포장해야 한다.

---

# 4. 발행 우선순위

## 4.1 1차 발행 묶음

기존 블로그 메인에서 이미 중요한 위치를 가진 서비스부터 발행한다.

1. PonsLink 5편
2. PonsWarp 6편
3. DocuFlow / PDF마스터 5편
4. Ruminate / 명경 5편

목표:

- 메인 페이지에서 이미 LIVE 또는 핵심 product로 보이는 항목을 먼저 채운다.
- 독자가 “이 블로그는 제품 제작 회고를 계속 쌓는 곳”이라고 인식하게 만든다.

## 4.2 2차 발행 묶음

1. Bible Companion 3편
2. YouTube-to-MD / MediaScribe / Tube 5편
3. Flucto / ClickCap / CaptureBrain 5편
4. Agent Tools 5편

목표:

- 제품군을 넓히되, 각 제품이 같은 제작 철학에서 나왔다는 연결성을 만든다.

## 4.3 권장 총량

초기에는 총 39편을 모두 한 번에 쓰지 않는다.
다음처럼 나누는 것이 좋다.

- 1차: 12편
  - PonsLink 3
  - PonsWarp 3
  - DocuFlow 3
  - Ruminate/명경 3

- 2차: 12편
  - PonsLink 2
  - PonsWarp 3
  - Bible 2
  - MediaScribe 3
  - Creator Tools 2

- 3차: 15편
  - 남은 Creator Tools
  - Agent Tools
  - DocuFlow 확장
  - 해석/Companion 확장

---

# 5. 글별 QA 기준

각 글은 발행 전 아래 기준으로 검토한다.

## 5.1 내용 QA

- 기능 나열로 끝나지 않는가?
- 처음 문제와 실제 문제가 분리되어 있는가?
- 설계 선택의 이유가 들어 있는가?
- 관련 repo의 구현 흔적이 반영되어 있는가?
- 과장된 성능 주장이나 확인되지 않은 운영 수치가 없는가?
- 마지막에 회고나 다음 판단이 있는가?

## 5.2 문체 QA

- 경어체가 남아 있지 않은가?
- AI식 문구가 들어가지 않았는가?
- 모든 글이 같은 문단 리듬으로 반복되지 않는가?
- 너무 개발자 내부용으로만 쓰이지 않았는가?
- 사용자가 읽었을 때 “왜 만든 제품인지” 먼저 이해되는가?

## 5.3 이미지 QA

- 대표 이미지가 글의 주제를 바로 보여주는가?
- 본문 다이어그램이 필요한 글에만 들어갔는가?
- 이미지가 서로 중복 콘셉트로 보이지 않는가?
- 단순한 추상 배경이나 AI스러운 네온 일러스트로 도배되지 않았는가?
- 다이어그램은 글의 흐름을 실제로 이해시키는가?

## 5.4 메인 페이지 연결 QA

- 각 글에 `project` 또는 동등한 분류 값이 정확히 들어가야 한다.
- product 카드의 글 수 집계에 반영되어야 한다.
- PonsLink 다음 PonsWarp, 그 다음 DocuFlow 흐름이 깨지지 않아야 한다.
- 새 product 글이 생기면 메인 product 하단에서 자동으로 보일 수 있어야 한다.

---

# 6. 이미지 생성 프롬프트 설계 원칙

이미지는 `$imagegen` 또는 운영 서버의 Codex imagen 경로를 사용한다.
단, 무조건 생성하지 않는다.
본문 맥락상 이미지가 이해를 돕는 경우에만 생성한다.

## 6.1 대표 이미지 프롬프트 구성

각 대표 이미지는 아래 요소를 포함한다.

- 제품 문제 상황
- 핵심 객체
- 흐름 또는 긴장감
- 글마다 다른 시각 스타일

예시 형식:

```text
A clear editorial product illustration showing [problem situation], with [main objects], emphasizing [core concept]. Use [visual style], avoid generic AI neon, avoid text, avoid logos, no duplicated composition.
```

## 6.2 다이어그램 프롬프트 구성

다이어그램은 예쁜 그림보다 정보 구조가 먼저다.

```text
Clean technical diagram, white or muted background, showing [nodes] connected by [flow]. Minimal labels, readable layout, no fake code, no decorative clutter.
```

## 6.3 서비스별 시각 차별화

- PonsLink: collaboration room, soft realtime UI, multiple participants
- PonsWarp: file blocks, peer-to-peer path, large transfer stream
- DocuFlow: document pipeline, paper/PDF/HWP/OCR nodes
- Ruminate: reflective desk, mirror, notes, classical text atmosphere
- Bible Companion: passage graph, warm study table, connected verses
- MediaScribe: video frame to Markdown document transformation
- Creator Tools: creator workstation, capture/download/recording tools
- Agent Tools: evidence board, agent lanes, review checkpoints

---

# 7. 다음 실행 단계

1. 이 문서를 기준으로 1차 발행 12편의 상세 아웃라인을 만든다.
2. 각 글마다 실제 repo 커밋 흐름과 README, docs를 확인한다.
3. 글별 대표 이미지 필요 여부를 결정한다.
4. 필요한 경우에만 본문 다이어그램을 설계한다.
5. 로컬 DB에 draft로 먼저 넣고 QA한다.
6. 라이브 반영 전 글 수 집계와 product 카드 연결을 검증한다.
