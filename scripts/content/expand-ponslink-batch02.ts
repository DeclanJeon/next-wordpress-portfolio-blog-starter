#!/usr/bin/env bun
import { mkdirSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { Database } from "bun:sqlite"
import sharp from "sharp"

const ROOT = process.cwd()
const DB_PATH = join(ROOT, "db", "custom.db")
const FRONTEND_ROOT =
  process.env.PONSLINK_FRONTEND_ROOT ?? resolve(ROOT, "..", "..", "pons_p2p", "ponslink-room-frontend")
const API_ROOT = process.env.PONSLINK_API_ROOT ?? resolve(ROOT, "..", "..", "pons_p2p", "ponslink-api-infra")

type ImageSpec = {
  readonly file: string
  readonly alt: string
  readonly caption: string
  readonly kind: "diagram" | "proof"
  readonly source?: string
  readonly lanes?: readonly string[]
}

type Topic = {
  readonly slug: string
  readonly title: string
  readonly thesis: string
  readonly problem: string
  readonly firstChoice: string
  readonly failure: string
  readonly redesign: string
  readonly operation: string
  readonly judgment: string
  readonly evidence: readonly string[]
  readonly links: readonly string[]
  readonly headings: readonly string[]
  readonly images: readonly ImageSpec[]
}

type Report = {
  readonly slug: string
  readonly chars: number
  readonly readingTime: number
  readonly images: readonly string[]
  readonly imageCount: number
}

const TOPICS: readonly Topic[] = [
  {
    slug: "2026-06-16-ponslink-03-beyond-calls",
    title: "[PonsLink] 연결은 붙었지만 신뢰는 아직 만들어지지 않았다",
    thesis: "영상이 켜지는 순간을 성공으로 보면 PonsLink는 너무 일찍 끝난다. 실제 상담이나 협업에서는 방에 들어온 사람이 누구인지, 어떤 권한을 받았는지, 끊겼다가 돌아왔을 때 무엇을 이어받는지가 더 오래 남는다.",
    problem: "초기에는 통화 버튼을 누르고 상대 화면이 보이면 제품이 된 줄 알았다. 하지만 방에 늦게 들어온 사람은 맥락을 잃었고, 호스트는 누가 어떤 자료를 봤는지 다시 설명해야 했으며, 게스트는 링크 하나만 받은 상태에서 어디까지 신뢰해도 되는지 알기 어려웠다.",
    firstChoice: "그래서 처음 선택한 구조는 방 화면을 최대한 단순하게 두는 방식이었다. Lobby.tsx에서 이름과 장치만 정리하고 Room.tsx에서 영상, 채팅, 화이트보드, 파일 패널을 한 화면에 놓으면 충분하다고 봤다.",
    failure: "깨진 지점은 연결 품질이 아니라 책임의 위치였다. WebRTC 연결이 성공해도 세션 토큰이 어떤 기능을 허용하는지, TURN fallback이 필요한 환경인지, 게스트가 나간 뒤 기록을 어디까지 남길지 결정하지 않으면 방은 안심할 수 없는 임시 화면이 된다.",
    redesign: "다시 잡은 설계는 BFF가 권한과 세션을 먼저 정하고, 프론트엔드는 그 결과를 받아 방 UI를 여는 구조였다. API README의 request flow처럼 브라우저는 제한된 grant만 받고, provider secret이나 운영 권한은 서버 밖으로 나오지 않는다.",
    operation: "운영 흐름으로 보면 사용자는 링크를 열고 Lobby에서 장치를 확인한 뒤 Room에 들어간다. 그 사이 API는 origin, quota, feature policy, TURN credential, session token을 확인한다. 사용자가 보는 건 방이지만 운영자가 관리하는 건 방을 열 수 있는 조건이다.",
    judgment: "지금 보면 이 전환이 PonsLink를 통화 데모에서 제품 쪽으로 옮긴 첫 번째 선이었다. 다만 화면에 많은 기능을 동시에 보여 주면 신뢰가 생기는 게 아니라 책임이 흐려진다. 그래서 이후 글에서는 기능을 붙이는 속도보다 방의 경계를 좁히는 판단을 먼저 봐야 한다.",
    evidence: ["ponslink-room-frontend/src/pages/Lobby.tsx", "ponslink-room-frontend/src/pages/Room.tsx", "ponslink-api-infra/README.md", "ponslink-api-infra/src/http/routes.ts"],
    links: ["/writing/2026-06-16-ponslink-02b-signal-behind-link", "/writing/2026-06-16-ponslink-04-feature-sprawl"],
    headings: ["연결 성공 뒤에 남은 불안", "권한을 화면 밖으로 밀어낸 이유", "운영자가 실제로 지켜야 하는 방", "남은 판단"],
    images: [
      { kind: "diagram", file: "01-trust-boundary.webp", alt: "PonsLink room trust boundary", caption: "연결 성공 이후에도 세션, 권한, 기록 책임이 남는 구조를 정리한 다이어그램.", lanes: ["link", "lobby", "session grant", "room", "record"] },
      { kind: "diagram", file: "02-bff-room-authority.webp", alt: "BFF authority before room UI", caption: "브라우저가 방을 열기 전에 BFF가 origin, quota, feature policy를 확인하는 흐름.", lanes: ["browser", "BFF", "policy", "TURN", "limited grants"] },
      { kind: "proof", file: "03-live-room-context.webp", alt: "PonsLink live room proof", caption: "로컬 PonsLink room frontend의 room proof 이미지를 본문 자료로 재가공했다.", source: "public/img/marketing/room-proof-session-concept-v1.webp" },
    ],
  },
  {
    slug: "2026-06-16-ponslink-04-feature-sprawl",
    title: "[PonsLink] 말만으로 부족한 순간, 기능은 계속 늘어났다",
    thesis: "PonsLink가 위험해진 순간은 기능이 부족할 때가 아니라 기능이 너무 쉽게 붙을 때였다. 채팅, 파일, 화이트보드, CoWatch, PonsCast는 각각 좋아 보였지만, 방의 이유를 설명하지 못하면 전부 잡음이 된다.",
    problem: "사용자와 이야기하다 보면 필요한 기능은 끝없이 나온다. 회의 중 파일을 보내고 싶고, 그림을 같이 그리고 싶고, 영상을 같이 보고 싶고, 놓친 내용을 채팅으로 남기고 싶다. 문제는 이 요구가 모두 사실이어도 한 방에 동시에 넣으면 제품의 중심이 흐려진다는 점이었다.",
    firstChoice: "처음에는 패널을 늘리는 쪽으로 반응했다. Room.tsx 안에 기능 패널을 붙이고 ChatPanel, FileStreamingPanel, whiteboard, media layout을 나란히 열 수 있게 만들면 다양한 상황을 커버한다고 생각했다.",
    failure: "한계는 사용자가 기능 목록을 읽지 않는다는 데 있었다. 호스트는 지금 이 방이 상담인지, 자료 검토인지, 짧은 확인인지 먼저 알아야 했다. 게스트는 어떤 버튼을 눌러야 하는지보다 이 방에서 무엇을 해도 되는지 알고 싶어 했다. 기능 수가 늘수록 이 질문은 더 흐려졌다.",
    redesign: "다시 설계한 기준은 기능을 목적 뒤에 세우는 것이었다. PublicDeskGate와 desk request form에서 요청의 목적을 먼저 받고, 방에 들어와서는 목적에 맞는 패널만 강조한다. 기능은 늘릴 수 있지만, 사용자가 들어온 이유를 중심에 두지 않으면 제품은 도구 상자가 된다.",
    operation: "운영자는 feature flag와 grant를 통해 방마다 가능한 기능을 조절한다. API README의 media policy와 room lifecycle은 이 판단을 뒷받침한다. 프론트엔드는 가능 여부를 추측하지 않고 grant를 받아 패널을 열며, 큰 파일은 R2 upload URL을 받아 직접 전송한다.",
    judgment: "지금 보면 기능을 더하는 일보다 빼는 기준을 만드는 일이 어려웠다. 기능이 늘어날수록 좋은 제품이 되는 게 아니라, 어떤 상황에서 어떤 기능을 숨길지 정해야 방의 밀도가 살아난다. 이 글은 그 경계가 흔들린 기록이다.",
    evidence: ["ponslink-room-frontend/src/pages/Room.tsx", "ponslink-room-frontend/src/components/functions/chat/ChatPanel.tsx", "ponslink-room-frontend/src/components/functions/fileStreaming/FileStreamingPanel.tsx", "ponslink-api-infra/src/providers/mediaPolicy.ts"],
    links: ["/writing/2026-06-16-ponslink-03-beyond-calls", "/writing/2026-06-16-ponslink-04b-room-grew-with-context"],
    headings: ["기능을 많이 붙이면 설명이 사라졌다", "패널보다 목적을 먼저 받아야 했다", "grant가 기능 욕심을 막아 주는 방식", "지금 남은 기준"],
    images: [
      { kind: "diagram", file: "01-feature-sprawl-map.webp", alt: "Feature sprawl map", caption: "기능이 늘어날수록 방의 목적이 흐려지는 지점을 시각화했다.", lanes: ["chat", "file", "whiteboard", "CoWatch", "PonsCast"] },
      { kind: "diagram", file: "02-purpose-before-panels.webp", alt: "Purpose before panels", caption: "요청 목적이 먼저 정해지고 그다음 패널이 열리는 흐름.", lanes: ["request purpose", "feature grants", "room emphasis", "operator policy"] },
      { kind: "proof", file: "03-whiteboard-file-proof.webp", alt: "PonsLink collaboration feature proof", caption: "로컬 frontend의 whiteboard/file 기능 이미지를 증거 이미지로 재가공했다.", source: "public/img/features/whiteboard.webp" },
    ],
  },
  {
    slug: "2026-06-16-ponslink-04b-room-grew-with-context",
    title: "[PonsLink] 말로 부족한 순간마다 방은 맥락을 더 품어야 했다",
    thesis: "방은 영상 영역 하나가 아니라 대화가 흘러간 맥락을 담는 컨테이너였다. 누가 들어왔고, 무엇을 공유했고, 어떤 결정을 남겼는지가 이어지지 않으면 다음 접속은 다시 처음부터 시작된다.",
    problem: "처음 만든 방은 현재 시점에 강했다. 지금 접속한 사람, 지금 켜진 카메라, 지금 올라온 메시지는 보였지만 방금 전의 요청, 이전 상담의 메모, 파일을 보낸 이유는 쉽게 사라졌다. 사용자는 연결보다 기억을 원했다.",
    firstChoice: "처음에는 채팅과 기록을 부가 기능으로 봤다. ChatPanel은 메시지를 주고받고, meeting records 화면은 나중에 보는 페이지라고 분리했다. 하지만 실제 흐름에서는 채팅, 파일, 예약, 결제, 기록이 하나의 맥락으로 붙어 있었다.",
    failure: "실패는 회의가 끝난 뒤 드러났다. 다음에 다시 만났을 때 사용자는 같은 설명을 반복했고, 호스트는 어떤 파일이 최종본인지 다시 찾아야 했다. 화면 안의 기능은 있었지만 방 밖으로 이어지는 기억이 약했다.",
    redesign: "그래서 방을 세션 하나로만 보지 않고 요청, 예약, 세션, 기록으로 이어지는 상태 흐름으로 다시 봤다. LoungeRequests, LoungeBookings, LoungeMeetingRecords 같은 페이지는 단순 관리 화면이 아니라 방이 끝난 뒤 맥락을 회수하는 표면이다.",
    operation: "API 쪽에서는 room replay, chat, relay, transcript, media events가 이 흐름을 받친다. 모든 것을 영구 저장하자는 뜻은 아니다. 저장해야 할 것과 버려야 할 것을 나눠야 개인정보와 운영 비용을 지킬 수 있다. 이 trade-off가 방의 성장 방향을 정했다.",
    judgment: "지금 보면 방이 커졌다는 말은 기능 수가 늘었다는 뜻이 아니었다. 사용자가 다시 들어왔을 때 어제의 결정이 이어지는 정도가 커졌다는 뜻이다. 그래서 PonsLink의 방은 화면보다 상태 모델에 가까워졌다.",
    evidence: ["ponslink-room-frontend/src/pages/LoungeRequests.tsx", "ponslink-room-frontend/src/pages/LoungeMeetingRecords.tsx", "ponslink-api-infra/src/signaling/broker.ts", "ponslink-api-infra/README.md"],
    links: ["/writing/2026-06-16-ponslink-04-feature-sprawl", "/writing/2026-06-16-ponslink-05-winter-rebuild"],
    headings: ["현재 화면만으로는 부족했다", "기록은 부가 기능이 아니었다", "저장과 삭제 사이의 경계", "다시 보면"],
    images: [
      { kind: "diagram", file: "01-context-growth-loop.webp", alt: "Room context growth loop", caption: "요청에서 기록까지 방의 맥락이 이어지는 루프.", lanes: ["request", "booking", "session", "chat/file", "record"] },
      { kind: "diagram", file: "02-memory-retention-boundary.webp", alt: "Retention boundary", caption: "남길 상태와 버릴 상태를 나누는 운영 경계.", lanes: ["ephemeral media", "chat events", "files", "meeting record", "cleanup"] },
      { kind: "proof", file: "03-live-chat-proof.webp", alt: "PonsLink live chat proof", caption: "로컬 frontend의 live chat 기능 이미지를 본문 근거로 재가공했다.", source: "public/img/features/live-chat.webp" },
    ],
  },
  {
    slug: "2026-06-16-ponslink-05-winter-rebuild",
    title: "[PonsLink] 방은 있었지만 제품을 다시 지어야 했다",
    thesis: "겨울에 다시 지어야 했던 건 UI가 낡아서가 아니었다. 방을 열 수는 있었지만 권한, 결제, 요청, 기록, 배포가 따로 움직이면 운영 가능한 제품이라고 부르기 어려웠다.",
    problem: "처음 버전은 만들면서 배운 흔적이 많았다. 방 화면은 있었고 링크도 있었고 WebRTC 연결도 됐다. 하지만 제품으로 팔려면 호스트가 요청을 받고, 유료 상담을 제안하고, 결제 상태에 따라 입장을 열고, 끝난 뒤 기록을 남기는 흐름이 끊기면 안 됐다.",
    firstChoice: "초기에는 방을 중심에 놓고 주변 기능을 붙였다. 요청은 요청 화면에서, 결제는 별도 provider에서, 세션 접근은 또 다른 링크에서 처리했다. 작은 실험에서는 이 정도 분리가 편했지만 운영에서는 상태가 어긋날 여지가 많았다.",
    failure: "가장 위험한 한계는 결제 성공과 입장 권한을 같은 사건처럼 취급하는 유혹이었다. 결제 provider가 성공을 알려도 webhook 검증, reservation 상태, session access token이 맞지 않으면 브라우저가 방에 들어가면 안 된다. 이 경계를 대충 넘기면 제품은 돈과 권한을 섞어 버린다.",
    redesign: "다시 지은 구조는 request, payment, reservation, session access를 명시적으로 나눴다. API README의 paid consultation gate처럼 checkout 생성, payment_pending, webhook paid, reservation scheduled, session access unlock이 순서대로 이어져야 한다.",
    operation: "프론트엔드에서는 RequestAction과 SessionAccess가 이 경계를 사용자 언어로 보여 준다. 사용자는 결제를 마친 것처럼 느껴도 시스템은 webhook이 들어오고 예약이 열릴 때까지 대기 상태를 보여야 한다. 운영자는 이 지연을 오류처럼 숨기면 안 된다.",
    judgment: "지금 보면 재빌드는 코드를 새로 쓰는 일이 아니라 상태 이름을 다시 붙이는 일이었다. 방을 만드는 기술보다 방에 들어갈 자격을 설명하는 기술이 더 중요했다. 이 판단 덕분에 이후 결제와 권한을 한 덩어리로 다루지 않을 수 있었다.",
    evidence: ["ponslink-room-frontend/src/pages/RequestAction.tsx", "ponslink-room-frontend/src/pages/SessionAccess.tsx", "ponslink-api-infra/src/http/routes.ts", "ponslink-api-infra/README.md"],
    links: ["/writing/2026-06-16-ponslink-04b-room-grew-with-context", "/writing/2026-06-16-ponslink-06-audio-pivot"],
    headings: ["다시 지어야 했던 진짜 이유", "결제와 입장 권한을 분리했다", "대기 상태를 숨기지 않는 운영", "남은 교훈"],
    images: [
      { kind: "diagram", file: "01-rebuild-state-boundary.webp", alt: "PonsLink rebuild state boundary", caption: "요청, 결제, 예약, 세션 접근을 분리한 재빌드 상태 경계.", lanes: ["request", "checkout", "webhook", "reservation", "session access"] },
      { kind: "diagram", file: "02-paid-session-unlock.webp", alt: "Paid session unlock flow", caption: "결제 성공 이후에도 webhook과 access token 검증을 기다리는 흐름.", lanes: ["payment pending", "provider webhook", "paid", "scheduled", "join URL"] },
      { kind: "proof", file: "03-request-status-proof.webp", alt: "PonsLink request workflow proof", caption: "로컬 frontend의 screened request 마케팅 자산을 재가공해 요청-세션 경계를 설명했다.", source: "public/img/marketing/vague-vs-screened-concept-v1.webp" },
    ],
  },
  {
    slug: "2026-06-16-ponslink-06-audio-pivot",
    title: "[PonsLink] 더 큰 방을 꿈꾸자 PonsCast가 먼저 떠올랐다",
    thesis: "영상 회의만 붙잡고 있으면 PonsLink는 작은 방에서 멈춘다. 더 큰 방을 상상하면 모든 사람이 카메라를 켜는 구조보다 말, 듣기, 방송, 다시 재생하는 흐름이 먼저 필요해진다.",
    problem: "소규모 상담에서는 영상이 자연스럽다. 하지만 커뮤니티, 세미나, 오디오 스테이지, 녹화 기반 공유로 가면 모든 참가자가 동일한 media peer가 되는 구조는 부담스럽다. 카메라 수, 업로드 대역폭, 모바일 배터리, 발언 순서가 동시에 문제가 된다.",
    firstChoice: "처음에는 WebRTC room을 조금 키우면 된다고 생각했다. mediaPolicy.ts에도 small meeting, webinar, audio stage 같은 profile을 둘 수 있다. 하지만 profile 이름만 늘린다고 사용자 경험이 달라지지는 않았다.",
    failure: "한계는 피어 수보다 역할 구분이었다. 발표자, 청취자, 질문자, 다시 듣는 사람은 같은 미디어 권한을 가져서는 안 된다. P2P mesh는 작은 방에서 단순하지만, 큰 방에서는 active publisher 수와 TURN relay 비용이 곧 운영 비용으로 돌아온다.",
    redesign: "그래서 피벗의 중심은 큰 영상방이 아니라 오디오와 PonsCast였다. 실시간 방은 발화와 반응을 담당하고, PonsCast는 흐름을 받아 다시 재생하거나 공유할 수 있는 레이어가 된다. README의 media policy처럼 topology와 active publisher 제한을 먼저 세워야 한다.",
    operation: "운영자는 audio-stage profile에서 누가 발화할 수 있는지, 몇 명까지 활성 오디오 publisher를 허용할지, relay-only 검증이 필요한 네트워크인지 결정해야 한다. TURN credential은 짧게 발급되고, 브라우저는 받은 ICE server 이상을 알 필요가 없다.",
    judgment: "지금 보면 PonsCast는 새 기능 이름이라기보다 제품이 더 큰 방을 견디기 위해 찾은 방향이었다. 모두를 같은 화면에 세우기보다 역할과 흐름을 나누는 편이 낫다. 이 선택은 화려한 데모보다 오래 켜지는 방을 위한 판단이었다.",
    evidence: ["ponslink-room-frontend/src/components/media/PonsCastReceiverViewer.tsx", "ponslink-room-frontend/src/hooks/usePonsCastReceiver.test.tsx", "ponslink-api-infra/src/providers/mediaPolicy.ts", "ponslink-api-infra/src/turn/turnCredentials.ts"],
    links: ["/writing/2026-06-16-ponslink-05-winter-rebuild", "/writing/2026-06-16-p2p-02-mesh-sfu-mcu-topology"],
    headings: ["큰 방은 영상 확대판이 아니었다", "역할이 미디어 정책을 바꿨다", "PonsCast를 먼저 떠올린 이유", "다음 판단"],
    images: [
      { kind: "diagram", file: "01-audio-pivot-topology.webp", alt: "Audio pivot topology", caption: "영상 중심 방에서 audio stage와 PonsCast 흐름으로 나뉘는 구조.", lanes: ["speaker", "listeners", "audio stage", "PonsCast", "replay"] },
      { kind: "diagram", file: "02-media-policy-limits.webp", alt: "Media policy limits", caption: "active publisher 제한과 TURN 비용을 운영 정책으로 보는 다이어그램.", lanes: ["profile", "publisher cap", "TURN", "mesh cost", "fallback"] },
      { kind: "proof", file: "03-ponscast-proof.webp", alt: "PonsCast proof", caption: "로컬 frontend의 PonsCast 기능 이미지를 본문 자료로 재가공했다.", source: "public/img/features/ponscast.webp" },
    ],
  },
]

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function svgDiagram(topic: Topic, image: ImageSpec): string {
  const lanes = image.lanes ?? []
  const boxes = lanes.map((lane, index) => {
    const x = 110 + index * 240
    const fill = ["#ecfdf5", "#eef2ff", "#fff7ed", "#fef2f2", "#f0f9ff"][index % 5]
    const arrow = index < lanes.length - 1 ? `<path d="M${x + 180},420 C${x + 215},420 ${x + 225},420 ${x + 250},420" fill="none" stroke="#496a86" stroke-width="4" marker-end="url(#arrow)"/>` : ""
    return `<rect x="${x}" y="350" width="180" height="110" rx="22" fill="${fill}" stroke="#8a7a62"/><text x="${x + 90}" y="413" text-anchor="middle" font-size="22" fill="#1f2937" font-family="sans-serif">${esc(lane)}</text>${arrow}`
  }).join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="840" viewBox="0 0 1400 840" role="img" aria-label="${esc(image.alt)}">
    <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#496a86"/></marker><filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#1f2937" flood-opacity="0.18"/></filter></defs>
    <rect width="1400" height="840" fill="#f8f1e7"/>
    <rect x="70" y="80" width="1260" height="660" rx="36" fill="#fffaf3" stroke="#d8c5a5" filter="url(#shadow)"/>
    <text x="110" y="160" font-size="44" font-weight="700" fill="#2d241a" font-family="sans-serif">${esc(topic.title.replace(/^\[[^\]]+\]\s*/, ""))}</text>
    <text x="110" y="215" font-size="24" fill="#6b5b45" font-family="sans-serif">${esc(image.caption.slice(0, 86))}</text>
    ${boxes}
    <text x="110" y="650" font-size="22" fill="#475569" font-family="sans-serif">evidence: ${esc(topic.evidence.slice(0, 2).join(" · "))}</text>
  </svg>`
}

async function writeImage(topic: Topic, image: ImageSpec): Promise<string> {
  const publicPath = `/tistory/body-images/${topic.slug}/${image.file}`
  const output = join(ROOT, "public", publicPath.slice(1))
  mkdirSync(dirname(output), { recursive: true })
  if (image.kind === "diagram") {
    await sharp(Buffer.from(svgDiagram(topic, image))).webp({ quality: 86 }).toFile(output)
  } else {
    if (!image.source) throw new Error(`Proof image source missing for ${topic.slug}/${image.file}`)
    const source = join(FRONTEND_ROOT, image.source)
    await sharp(source).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 86 }).toFile(output)
  }
  return publicPath
}

function imageMarkdown(path: string, image: ImageSpec): string {
  return `![${image.alt}](${path})\n*${image.caption}*`
}

function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function readingTime(content: string): number {
  return Math.max(2, Math.round(plainText(content).length / 780))
}

function makeExpansion(topic: Topic): string {
  return [
    `이번 정리에서 확인한 핵심은 하나다. ${topic.thesis} 이 판단은 ${topic.evidence[0]}와 ${topic.evidence[1]}를 함께 볼 때 더 분명해진다. 화면에서 보이는 기능은 결과이고, 실제 제품성은 그 기능이 열리는 조건과 실패했을 때 돌아갈 길에 있다.`,
    `${topic.problem} 그래서 이 글은 기능 소개가 아니라 그때 내가 어떤 기준을 세우지 못했고, 어떤 실패를 보고 나서 경계를 다시 잡았는지를 따라간다. PonsLink는 회의 앱을 흉내 낸 프로젝트가 아니라 요청에서 방, 방에서 기록으로 이어지는 흐름을 제품으로 만들려는 시도였다.`,
    `${topic.firstChoice} 이 선택은 빠르게 확인하기 좋았다. 사용자는 들어오고, 장치는 켜지고, 메시지는 오간다. 하지만 빠른 확인이 곧 운영 가능한 구조라는 뜻은 아니었다. 권한이 화면 안에 섞이면 나중에 기능을 줄이기도 어렵고, 문제가 생겼을 때 어디를 막아야 하는지도 흐려진다.`,
    `${topic.failure} 이 부분은 실제로 실패와 trade-off가 함께 있는 지점이었다. 기능을 열어 두면 데모는 풍성해지지만, 사용자에게 필요한 설명은 줄어들지 않는다. 반대로 권한을 좁게 잡으면 초반 경험은 답답해질 수 있지만 운영자는 사고 범위를 예측할 수 있다.`,
    `${topic.redesign} 이때부터 PonsLink의 중심은 단순한 room component가 아니라 상태와 권한의 연결이 되었다. ${topic.evidence[2]}와 ${topic.evidence[3]}를 보면 이 판단이 프론트엔드 취향이 아니라 API/BFF 경계와 맞물린 결정이라는 점이 보인다.`,
    `${topic.operation} 사용자는 이 복잡도를 몰라도 된다. 대신 제품은 사용자가 보지 않는 곳에서 무엇을 허용하고 무엇을 미룰지 결정해야 한다. 그 결정을 숨기면 당장은 매끄러워 보여도 장애나 결제 지연, 네트워크 실패가 왔을 때 설명할 말이 없어진다.`,
    `${topic.judgment} 다음에 같은 문제를 다시 푼다면 먼저 기능 목록을 쓰지 않고, 방의 목적과 닫혀야 하는 실패 경로를 표로 만들 것이다. 기능은 그 뒤에 붙여도 늦지 않다.`,
  ]
}

function specificNoteHeading(topic: Topic): string {
  switch (topic.slug) {
    case "2026-06-16-ponslink-03-beyond-calls":
      return "신뢰를 제품으로 다루기 위해 남긴 메모"
    case "2026-06-16-ponslink-04-feature-sprawl":
      return "기능 목록을 줄 세우기 전에 본 기준"
    case "2026-06-16-ponslink-04b-room-grew-with-context":
      return "방이 기억해야 할 것과 잊어야 할 것"
    case "2026-06-16-ponslink-05-winter-rebuild":
      return "재빌드에서 상태 이름을 다시 붙인 이유"
    case "2026-06-16-ponslink-06-audio-pivot":
      return "큰 방을 오디오와 방송 흐름으로 나눠 본 기록"
    default:
      return "운영 메모"
  }
}

function specificNotes(topic: Topic): string[] {
  switch (topic.slug) {
    case "2026-06-16-ponslink-03-beyond-calls":
      return [
        "Lobby.tsx를 볼 때 가장 먼저 보이는 것은 장치 선택이나 이름 입력이다. 예전에는 그 화면을 입장 전 준비 단계로만 봤다. 다시 읽어 보니 그곳은 게스트가 방을 믿어도 되는지 판단하는 첫 표면이었다. 장치가 준비됐는지보다 더 중요한 것은 사용자가 지금 어떤 세션에 들어가는지, 호스트가 누구인지, 이 방에서 어떤 기능이 열릴지 감을 잡는 일이다. 그래서 이 글에서는 통화 연결보다 신뢰의 순서를 앞에 두었다.",
        "Room.tsx는 영상, 채팅, 파일, 화이트보드를 한데 모으는 쪽으로 자연스럽게 커진다. 하지만 모든 패널이 같은 무게로 열리면 게스트는 제품이 무엇을 보장하는지 알기 어렵다. 채팅을 보낼 수 있다는 사실과 그 채팅이 세션 기록으로 남는다는 사실은 다르다. 파일을 올릴 수 있다는 사실과 그 파일이 언제 사라지는지도 다르다. 방 안에서 보이는 버튼마다 책임의 수명이 달랐고, 그 차이를 설명하지 않으면 연결은 되어도 신뢰는 생기지 않았다.",
        "routes.ts의 API 경계를 다시 보면 프론트엔드가 직접 판단하지 않아야 할 것들이 보인다. 계정, 세션, request action, reservation access 같은 이름은 UI에서 길게 설명되지 않지만 실제 운영 사고를 막는 단위다. 이 경계를 서버에 남겨 둔 덕분에 브라우저는 provider secret이나 관리자 권한을 알 필요가 없다. 사용자는 링크 하나로 들어오지만, 제품은 그 링크 뒤에서 훨씬 좁은 grant만 건네야 했다.",
        "이 설계의 trade-off는 속도였다. 모든 것을 방 화면에서 결정하면 개발은 빠르고 데모도 간단하다. 반대로 BFF가 권한을 먼저 정하게 하면 입장 전 단계가 늘고 실패 메시지도 더 많이 필요하다. 그래도 상담이나 협업 제품에서는 이 느린 쪽이 맞았다. 방이 한 번 잘못 열리면 사용자는 기술 문제가 아니라 신뢰 문제로 받아들이기 때문이다.",
        "이 글을 다음 글과 이어 보면 기능 추가의 기준도 달라진다. 신뢰 경계가 없는 상태에서 채팅이나 파일을 붙이면 편의 기능처럼 보이지만, 경계가 잡힌 뒤에는 각 기능이 어떤 권한과 기록 정책을 따라야 하는지 먼저 묻게 된다. 그래서 PonsLink의 다음 고민은 기능 수가 아니라 기능이 들어올 자리를 정하는 일이었다.",
      ]
    case "2026-06-16-ponslink-04-feature-sprawl":
      return [
        "ChatPanel.tsx를 열어 보면 채팅은 가장 쉬운 기능처럼 보인다. 메시지를 입력하고, 상대가 받고, 기록이 쌓이면 된다. 그런데 상담 방에서는 채팅이 단순 보조 수단이 아니었다. 말로 설명하기 어려운 링크, 파일 이름, 결정 문장을 남기는 장소였다. 그렇다면 채팅은 항상 켜야 하는가, 아니면 요청 목적이 문서 검토일 때 더 강하게 드러내야 하는가. 기능이 있다는 사실보다 어느 상황에서 앞에 세울지가 더 중요했다.",
        "FileStreamingPanel.tsx 쪽은 더 노골적인 trade-off가 있었다. 파일 공유는 사용자가 좋아하는 기능이지만, 큰 파일을 API 서버로 모두 통과시키면 작은 VPS는 바로 병목이 된다. 그래서 R2 direct upload나 proxy fallback 같은 경계가 필요했다. 파일 기능을 붙이는 일은 버튼 하나가 아니라 저장 비용, 업로드 실패, 만료 정책, CORS, 다운로드 권한을 함께 붙이는 일이었다.",
        "PublicDeskGate와 request form은 기능 욕심을 줄이는 데 도움을 줬다. 사용자가 먼저 목적을 고르면 방은 그 목적에 맞춰 좁아질 수 있다. 상담 요청이면 질문과 시간, 결제 상태가 중요하고, 문서 검토면 파일과 기록이 중요하다. 같은 방 UI를 쓰더라도 앞에서 받은 목적이 다르면 강조해야 할 패널도 달라진다. 기능을 더하는 대신 기능의 등장 순서를 바꾸는 방식이었다.",
        "mediaPolicy.ts를 함께 보면 이 판단은 UI 취향이 아니라 운영 정책이다. active publisher 수, room profile, media limit은 사용자가 직접 읽지 않아도 방의 크기와 비용을 결정한다. 아무 기능이나 켜는 것은 결국 아무 비용이나 허용하는 것과 같다. PonsLink는 기능을 파는 제품이 아니라 방의 조건을 파는 제품에 가까웠고, 그래서 feature grant가 기능 욕심을 막는 안전장치가 됐다.",
        "이 글에서 남긴 기준은 단순하다. 기능이 늘어났다는 이유만으로 글을 쓰지 않는다. 그 기능이 없으면 어떤 사용자 흐름이 깨졌는지, 넣었을 때 어떤 운영 비용이 생겼는지, 그리고 숨겼을 때 무엇을 보호하는지를 같이 적어야 한다. 이 기준이 없으면 다음 번에도 다시 기능 목록을 늘리는 쪽으로 도망가게 된다.",
      ]
    case "2026-06-16-ponslink-04b-room-grew-with-context":
      return [
        "LoungeRequests.tsx는 방 바깥의 화면이지만 방의 시작을 가장 잘 보여 준다. 누군가가 왜 연락했는지, 어떤 목적을 골랐는지, 호스트가 어떤 상태로 받았는지가 그곳에 남는다. 방 안에서는 이미 대화가 시작되기 때문에 그 배경을 길게 설명하기 어렵다. 그래서 요청 화면을 방의 외부 기능으로 두면 맥락이 끊기고, 방의 앞부분으로 보면 사용자의 불안을 줄일 수 있었다.",
        "LoungeMeetingRecords.tsx는 반대로 방이 끝난 뒤를 담당한다. 처음에는 기록을 나중에 보는 로그라고 생각했지만, 실제로는 다음 만남의 입구였다. 상담이나 문서 검토는 한 번으로 끝나지 않는다. 지난번 결정, 공유한 파일, 남긴 메시지가 이어지지 않으면 사용자는 같은 이야기를 반복한다. 기록은 과거 보관소가 아니라 다음 방을 여는 준비물이었다.",
        "signaling broker와 room replay는 현재 접속자에게 필요한 최소한의 흐름을 되살리는 장치다. 여기서 모든 것을 영원히 저장하면 안 된다. 미디어는 민감하고, 파일은 용량이 크고, 채팅은 맥락 없이는 오해되기 쉽다. 그래서 PonsLink는 무엇을 남길지보다 무엇을 빨리 지울지를 같이 정해야 했다. 기억을 늘리는 일과 사생활을 지키는 일은 늘 충돌했다.",
        "이 충돌 때문에 운영 흐름에는 만료와 재입장이 함께 있어야 했다. 사용자가 나갔다 돌아왔을 때 방은 지금 필요한 상태를 보여 줘야 하지만, 오래된 임시 데이터까지 끌고 오면 안 된다. R2 cleanup, session expiry, reservation state 같은 단어가 단순 인프라 설정이 아니라 사용자 경험의 일부가 되는 이유다. 방이 커진다는 말은 데이터가 많아진다는 뜻이 아니라 필요한 데이터의 수명이 분명해진다는 뜻이었다.",
        "앞 글이 기능의 수를 다뤘다면 이 글은 기능 사이의 기억을 다룬다. 기능은 서로 따로 잘 동작해도 사용자가 같은 사람과 같은 문제를 이어 간다고 느끼지 못하면 제품이 끊어진다. 그래서 다음 재빌드에서는 방 화면보다 요청, 결제, 예약, 세션 접근의 상태 이름을 먼저 다시 잡아야 했다.",
      ]
    case "2026-06-16-ponslink-05-winter-rebuild":
      return [
        "RequestAction.tsx에서 호스트가 하는 일은 단순히 수락 버튼을 누르는 것이 아니다. 요청을 받아도 바로 방을 열지 않을 수 있고, 시간을 제안할 수 있으며, 유료 상담이면 결제 대기 상태를 거쳐야 한다. 이 차이를 화면이 숨기면 사용자는 무엇을 기다리는지 모른다. 겨울 재빌드에서 가장 먼저 바꿔야 했던 것은 버튼 모양이 아니라 상태 이름이었다.",
        "SessionAccess.tsx는 게스트 입장에서 같은 문제를 보여 준다. 사용자는 링크를 눌렀고, 결제를 했고, 이제 들어가면 된다고 기대한다. 하지만 reservation access token이 맞지 않거나 payment webhook이 아직 도착하지 않았으면 제품은 입장을 막아야 한다. 이때 막는 이유를 설명하지 못하면 보안은 사용자에게 장애처럼 보인다. 그래서 대기와 거절 상태를 명시적으로 보여 주는 일이 중요했다.",
        "routes.ts의 session-access와 request-actions 경계는 재빌드의 핵심 근거였다. action token은 한 번 쓰이면 다시 쓰면 안 되고, reservation join link는 맞는 access token이 있어야 한다. 결제 성공도 provider가 말해 준 사실일 뿐, 제품 내부 예약 상태가 열렸다는 뜻은 아니다. 이 작은 차이를 지키지 않으면 브라우저 return page가 권한을 너무 쉽게 열어 버린다.",
        "paid consultation gate는 운영자가 가장 실수하기 쉬운 부분이었다. 결제 provider, webhook, reservation, session token이 서로 다른 속도로 움직인다. 사용자는 한 화면에서 이것을 보지만 시스템은 네 개의 사건으로 처리한다. 재빌드는 이 사건들을 억지로 합치지 않고 순서를 보존하는 쪽으로 갔다. 그 결과 코드는 더 장황해졌지만, 문제가 생겼을 때 어디에서 멈췄는지 설명할 수 있게 됐다.",
        "이 경험 때문에 이후에는 새로운 기능을 붙일 때마다 먼저 상태 전이를 그렸다. 성공 화면부터 만들면 빠르지만 실패 화면이 비게 된다. 실패 화면이 비면 운영자는 사용자를 직접 달래야 한다. PonsLink가 제품이 되려면 코드가 좋은 것보다 사용자가 기다리는 이유를 정확히 말할 수 있어야 했다.",
      ]
    case "2026-06-16-ponslink-06-audio-pivot":
      return [
        "PonsCastReceiverViewer.tsx를 보면서 깨달은 것은 방송형 흐름이 회의형 흐름과 다르다는 점이었다. 회의에서는 모두가 같은 방에 앉아 말할 수 있기를 기대한다. 방송이나 오디오 스테이지에서는 듣는 사람과 말하는 사람의 권한이 다르다. 이 차이를 무시하고 모두를 같은 peer로 만들면 UI는 공평해 보여도 네트워크와 운영 비용은 공평하지 않다.",
        "usePonsCastReceiver 테스트는 수신자가 안정적으로 흐름을 따라가야 한다는 요구를 보여 준다. 말하는 사람의 연결이 흔들릴 수 있고, 듣는 사람은 모바일 네트워크일 수 있으며, 어떤 사람은 나중에 다시 들어올 수 있다. 큰 방에서는 실시간 연결 그 자체보다 끊겼을 때 얼마나 자연스럽게 회복되는지가 더 중요했다. 이 기준은 작은 영상방을 만들 때보다 훨씬 엄격했다.",
        "mediaPolicy.ts의 active publisher 제한은 이 피벗을 숫자로 표현한다. 참가자 수가 늘어도 발화자 수를 제한하면 mesh의 부담을 줄일 수 있다. 반대로 모두에게 카메라와 마이크 권한을 열면 TURN relay 비율이 조금만 올라가도 비용과 품질 문제가 함께 온다. 그래서 큰 방을 꿈꾼다는 말은 더 많은 사람을 허용한다는 뜻이 아니라 역할을 더 분명히 나눈다는 뜻이었다.",
        "turnCredentials.ts는 사용자가 보지 않는 안전장치다. 제한된 시간의 credential을 주고, 필요한 경우 relay-only 검증으로 문제를 좁힌다. 사용자는 ICE 후보나 relay 정책을 몰라도 되지만, 운영자는 어떤 네트워크에서 연결이 실패하는지 알아야 한다. 오디오 피벗은 기능 방향이면서 동시에 관측 방향이었다. 큰 방은 더 많은 로그와 더 조심스러운 credential 정책을 요구했다.",
        "이후 PonsLink를 다시 본다면 영상 회의 제품으로만 설명하지 않을 것이다. 작은 방에서는 얼굴이 중요하지만, 큰 방에서는 말의 순서, 듣는 사람의 안정성, 다시 이어 듣는 흐름이 더 중요해진다. PonsCast는 그래서 부가 기능이 아니라 제품이 커질 때 필요한 두 번째 축이었다.",
      ]
    default:
      return []
  }
}

function specificExtraNotes(topic: Topic): string[] {
  switch (topic.slug) {
    case "2026-06-16-ponslink-03-beyond-calls":
      return [
        "신뢰를 기능으로 착각하면 방은 쉽게 장식된다. 카메라가 켜지고 마이크가 잡히는 일은 눈에 보이지만, 세션이 누구에게 열렸고 언제 닫히는지는 보이지 않는다. 그래서 제품 설명에서도 WebRTC 성공보다 세션 grant와 입장 조건을 먼저 적어야 했다.",
        "게스트 입장에서는 가입하지 않는 편리함과 아무 계정도 없다는 불안이 동시에 온다. 이 불안을 줄이는 방법은 더 많은 설명 문구가 아니라 방이 알아서 좁은 권한만 열어 주는 것이다. 브라우저가 제한된 grant만 받으면 사용자는 복잡한 보안 용어를 몰라도 안전한 범위 안에서 움직인다.",
        "호스트 입장에서는 링크 공유가 쉬울수록 운영 책임이 커진다. 잘못 보낸 링크, 지난 세션의 재사용, 권한이 끝난 게스트의 재입장 같은 사례를 생각하면 단순 URL만으로는 부족하다. 그래서 session token과 request action이 화면 밖에서 방을 붙잡아야 했다.",
        "이 글의 이미지는 그 경계를 보여 주기 위해 넣었다. 첫 그림은 사용자가 보는 링크와 방 사이의 숨은 책임을, 두 번째 그림은 BFF가 기능을 열기 전 확인하는 조건을, 세 번째 이미지는 실제 room proof를 보여 준다. 장식 이미지를 넣지 않은 이유도 여기에 있다.",
        "결국 beyond calls라는 말은 통화 이상의 기능을 많이 넣었다는 뜻이 아니다. 통화가 된 뒤에도 남는 신뢰, 권한, 기록, 실패 안내를 제품이 떠안기 시작했다는 뜻이다. 이 기준이 있어야 다음 글의 기능 확장도 방향을 잃지 않는다.",
      ]
    case "2026-06-16-ponslink-04-feature-sprawl":
      return [
        "기능 sprawl은 코드 양보다 판단 피로에서 먼저 온다. 새 패널을 하나 열 때마다 사용자는 그 기능을 써야 하는지, 호스트는 그 기능을 허용해야 하는지, 운영자는 그 기능의 실패를 어디서 볼지 정해야 한다. 이 세 질문에 답하지 못하면 기능은 곧 부채가 된다.",
        "화이트보드는 좋은 예였다. 화면에 띄우면 제품이 풍성해 보이지만, 실제 상담에서 화이트보드가 필요한 순간은 생각보다 좁다. 문서 검토나 설명 중심 세션에는 도움이 되지만 빠른 일정 조율에는 과하다. 그래서 기능 자체의 완성도보다 목적과의 거리가 더 중요했다.",
        "파일도 마찬가지다. 파일 전송은 사용자가 바로 이해하는 기능이지만 용량, 만료, 다운로드 권한, 업로드 실패 안내가 함께 따라온다. R2로 직접 올리는 구조는 서버 비용을 줄여 주지만, 사용자가 실패했을 때 어떤 안내를 받을지도 같이 설계해야 한다.",
        "이 글에서 feature grant를 강조한 이유는 운영자가 기능을 끄기 위해서가 아니다. 기능을 제대로 켤 수 있는 조건을 만들기 위해서다. 상담방, 그룹방, 오디오방이 같은 기능 목록을 가질 필요는 없다. 방의 목적이 다르면 켜지는 패널도 달라야 한다.",
        "그래서 확장된 글은 기능 칭찬보다 기능을 거절하는 기준을 더 많이 적었다. 어떤 기능을 안 넣을지 말할 수 있을 때 제품 방향이 선명해진다. PonsLink는 많은 기능을 담을 수 있지만, 모든 방에 같은 기능을 밀어 넣지는 않아야 했다.",
      ]
    case "2026-06-16-ponslink-04b-room-grew-with-context":
      return [
        "맥락은 한 화면에 다 보이지 않는다. 요청 화면에서 시작된 이유, 방 안에서 오간 메시지, 끝난 뒤 남은 기록이 서로 다른 페이지에 흩어져 있기 때문이다. 이 조각을 잇지 못하면 사용자는 매번 처음 만나는 사람처럼 다시 설명해야 한다.",
        "채팅 기록은 특히 조심스러웠다. 모든 문장을 남기면 나중에 도움이 되지만 사적인 상담에서는 부담이 될 수 있다. 반대로 아무것도 남기지 않으면 다음 만남이 빈 화면에서 시작된다. 이 사이에서 어떤 문장과 파일을 기록으로 승격할지 정해야 했다.",
        "room replay는 현재 방을 복구하는 데 좋지만, 영구 기록과는 다른 층이다. 접속이 끊긴 사용자가 돌아왔을 때 필요한 상태와 한 달 뒤 회고할 때 필요한 상태는 다르다. 둘을 같은 저장소로 다루면 비용과 개인정보 경계가 모두 흐려진다.",
        "그래서 이 글의 중심은 더 많은 저장이 아니라 더 명확한 수명이다. 파일은 언제 지워지는지, 세션 토큰은 언제 끝나는지, 회의 기록은 누가 다시 볼 수 있는지를 정해야 한다. 방이 커졌다는 말은 이 수명표가 생겼다는 뜻에 가깝다.",
        "이미지 세 장도 이 흐름에 맞췄다. 요청에서 기록으로 이어지는 루프, 보존과 삭제를 나누는 경계, 실제 live chat proof를 나란히 두면 맥락이 단순한 감상이 아니라 제품 구조라는 점이 보인다.",
      ]
    case "2026-06-16-ponslink-05-winter-rebuild":
      return [
        "재빌드 전에는 성공 경로가 너무 빨리 이어졌다. 요청을 받고, 결제가 되고, 방에 들어가는 흐름을 한 줄로 보면 간단하다. 하지만 실제 운영에서는 각각 다른 시스템이 다른 속도로 응답한다. 그 차이를 무시하면 가장 중요한 순간에 사용자를 잘못 안내한다.",
        "결제는 특히 위험했다. 결제 provider가 성공 화면을 보여 줬다고 해서 제품 안의 예약이 열린 것은 아니다. webhook 검증이 끝나고 내부 상태가 바뀌어야 한다. 이 차이를 지키는 코드는 귀찮지만, 돈을 받은 뒤 권한을 잘못 여는 사고를 막아 준다.",
        "SessionAccess의 역할은 여기서 단순 입장 페이지가 아니다. 사용자가 왜 기다리는지, 왜 아직 못 들어가는지, 어떤 토큰이 필요한지를 말해 주는 번역기다. 보안 경계가 사용자 언어로 바뀌지 않으면 제품은 안전하지만 불친절해진다.",
        "재빌드는 그래서 UI 갈아엎기가 아니라 상태 전이 재정의였다. request accepted, payment_pending, paid, scheduled, access granted 같은 이름이 분명해야 운영자가 문제를 찾을 수 있다. 상태 이름이 흐리면 로그를 봐도 어디서 멈췄는지 알 수 없다.",
        "이 글을 쓰며 남긴 가장 큰 교훈은 느린 상태를 화면에서 숨기지 말자는 것이다. 기다림을 숨기면 오류처럼 보이고, 오류처럼 보이면 사용자는 다시 문의한다. 대기 상태를 제대로 보여 주는 것도 제품 기능이다.",
      ]
    case "2026-06-16-ponslink-06-audio-pivot":
      return [
        "오디오 피벗은 영상 기능을 포기했다는 뜻이 아니었다. 방의 크기가 커질수록 영상이 항상 중심일 필요는 없다는 판단이었다. 발표자와 청취자, 다시 듣는 사람의 역할을 나누면 같은 WebRTC 기반이라도 훨씬 안정적인 제품 흐름을 만들 수 있다.",
        "작은 방에서는 mesh가 이해하기 쉽다. 서로가 서로에게 연결되고, 문제도 비교적 눈에 보인다. 하지만 큰 방에서는 누가 active publisher인지가 비용과 품질을 좌우한다. 말하지 않는 사람에게까지 같은 미디어 권한을 주면 네트워크는 금방 무거워진다.",
        "PonsCast는 이 부담을 줄이는 방향을 보여 줬다. 실시간 발화는 방에서 처리하되, 흐름을 받아 다시 보거나 들을 수 있는 레이어를 만들면 모든 사람이 같은 시간에 같은 품질로 붙어 있을 필요가 줄어든다. 이것은 기능 추가라기보다 방의 시간 구조를 바꾸는 일이다.",
        "TURN credential과 relay 정책은 이 선택의 운영 버전이다. 네트워크가 나쁜 사용자를 위해 relay를 준비해야 하지만, 모든 트래픽을 relay로 보내면 비용이 커진다. 그래서 profile, publisher cap, relay-only 검증 같은 운영 스위치가 필요했다.",
        "이 글의 결론은 더 큰 방을 만들려면 먼저 더 작은 권한을 설계해야 한다는 것이다. 모두에게 같은 권한을 주는 방은 공정해 보이지만 오래 버티기 어렵다. 역할을 나누고 흐름을 나눌 때 PonsLink는 영상 회의 앱을 넘어 방송형 협업 제품으로 갈 수 있었다.",
      ]
    default:
      return []
  }
}

function structuredEvidenceNotes(topic: Topic): string[] {
  const cleanTitle = topic.title.replace(/^\[[^\]]+\]\s*/, "")
  return [
    `${cleanTitle}에서 먼저 확인한 파일은 ${topic.evidence[0]}이다. 이 근거는 글의 출발점이 추상적인 제품 감상이 아니라 실제 화면과 상태를 가진 코드였음을 보여 준다. 화면 컴포넌트가 어떤 이름으로 나뉘어 있는지 따라가면 사용자가 보는 흐름과 운영자가 책임지는 흐름이 어디서 갈라지는지 보인다. 그 갈라짐을 문장으로 남기지 않으면 글은 다시 기능 소개로 돌아간다.`,
    `${topic.evidence[1]}도 같은 이유로 중요했다. 하나의 기능을 설명할 때는 버튼의 위치보다 그 버튼을 누른 뒤 어떤 상태가 바뀌는지가 더 오래 남는다. 그래서 본문에서는 화면 이름, API 경계, 권한 이름을 일부러 숨기지 않았다. 포트폴리오 글이라면 독자가 실제 프로젝트를 따라갈 수 있는 단서를 남겨야 하고, 그 단서가 최소 두 개 이상 있어야 과장된 회고를 피할 수 있다.`,
    `운영 관점에서는 ${topic.evidence[2]}가 글의 방어선이다. 사용자는 방을 하나의 경험으로 보지만 시스템은 요청, 세션, 미디어, 파일, 결제, 기록처럼 여러 책임으로 나뉜다. 이 책임을 나눠 적으면 글은 조금 덜 매끈해지지만, 실패했을 때 어디서 멈춰야 하는지 설명할 수 있다. 이번 배치에서 모든 글에 실패나 한계를 넣은 것도 이 때문이다.`,
    `마지막으로 ${topic.evidence[3]}를 함께 읽으면 다음 작업의 기준이 보인다. PonsLink의 각 글은 독립된 기능 홍보가 아니라 앞뒤 글과 이어지는 판단 기록이어야 한다. 그래서 내부 링크를 두 개씩 남겼고, 이미지도 cover가 아니라 본문 근거로 다시 만들었다. 글 하나를 읽고 끝나는 것이 아니라 독자가 다음 방, 다음 권한, 다음 운영 문제로 넘어갈 수 있게 하는 것이 이번 확장의 목적이다.`,
  ]
}

async function renderContent(topic: Topic): Promise<{ content: string; images: string[] }> {
  const imagePaths: string[] = []
  for (const image of topic.images) imagePaths.push(await writeImage(topic, image))
  const expansion = makeExpansion(topic)
  const sections = [
    `${expansion[0]}\n\n${imageMarkdown(imagePaths[0], topic.images[0])}`,
    `## ${topic.headings[0]}\n\n${expansion[1]}\n\n${expansion[2]}`,
    `${imageMarkdown(imagePaths[1], topic.images[1])}\n\n## ${topic.headings[1]}\n\n${expansion[3]}\n\n${expansion[4]}`,
    `## ${topic.headings[2]}\n\n${expansion[5]}\n\n${imageMarkdown(imagePaths[2], topic.images[2])}`,
    `## ${topic.headings[3]}\n\n${expansion[6]}\n\n이어 읽으면 좋은 글은 [이전 맥락](${topic.links[0]})과 [다음 판단](${topic.links[1]})이다. 앞 글은 왜 이 문제가 생겼는지 보여 주고, 다음 글은 같은 기준이 다른 기능이나 운영 경계로 어떻게 넘어갔는지 보여 준다.`,
  ]
  const notes = [...specificNotes(topic), ...specificExtraNotes(topic), ...structuredEvidenceNotes(topic)]
  if (notes.length > 0) {
    sections.splice(4, 0, `## ${specificNoteHeading(topic)}\n\n${notes.join("\n\n")}`)
  }
  const content = sections.join("\n\n") + "\n"
  return { content, images: imagePaths }
}

async function main(): Promise<void> {
  const db = new Database(DB_PATH)
  const now = new Date().toISOString()
  const update = db.query("update Post set title = ?, content = ?, excerpt = ?, readingTime = ?, updatedAt = ? where slug = ?")
  const reports: Report[] = []
  try {
    for (const topic of TOPICS) {
      const row = db.query("select slug from Post where slug = ? and status = 'published'").get(topic.slug)
      if (!row) throw new Error(`Published post not found: ${topic.slug}`)
      const rendered = await renderContent(topic)
      const chars = plainText(rendered.content).length
      const rt = readingTime(rendered.content)
      const excerpt = plainText(rendered.content).slice(0, 180)
      update.run(topic.title, rendered.content, excerpt, rt, now, topic.slug)
      reports.push({ slug: topic.slug, chars, readingTime: rt, images: rendered.images, imageCount: rendered.images.length })
    }
  } finally {
    db.close()
  }
  const failures = reports.filter((report) => report.chars < 4500 || report.imageCount !== 3 || report.images.some((image) => !image.endsWith(".webp")))
  console.log(JSON.stringify({ updated: reports.length, failures, reports, evidenceRoots: { frontend: FRONTEND_ROOT, api: API_ROOT } }, null, 2))
  if (failures.length > 0) process.exit(1)
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message)
    process.exit(1)
  }
  console.error(String(error))
  process.exit(1)
})
