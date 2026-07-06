import type { RetrospectiveProject } from "@/lib/retrospective-contract"

export type PortfolioCategory =
  | "P2P/Realtime"
  | "Document Automation"
  | "Domain AI"
  | "Creator Tools"
  | "Agent Tools"

export type PortfolioStatus = "Live" | "Prototype / infra check needed" | "Lab" | "Repo proof"
export type PortfolioTier = "primary" | "bonus"

export interface PortfolioProject {
  slug: RetrospectiveProject
  title: string
  category: PortfolioCategory
  status: PortfolioStatus
  year: string
  role: string
  tier: PortfolioTier
  accent: string
  summary: string
  problem: string
  decision: string
  stack: string[]
  liveUrl?: string
  repoUrl?: string
  screenshot?: string
  caseStudyPath?: string
  proofNotes: string
  featured?: boolean
  retrospectiveLinks?: Array<{
    title: string
    href: string
  }>
}

export const portfolioFilters: Array<"All" | PortfolioCategory> = [
  "All",
  "P2P/Realtime",
  "Document Automation",
  "Domain AI",
  "Creator Tools",
  "Agent Tools",
]

export const ponslinkRetrospectiveLinks = [
  { title: "[PonsLink] 한 번 놓친 연결에서 PonsLink가 시작된 이유", href: "/writing/2026-06-16-ponslink-01-why-i-came-back-to-connection" },
  { title: "[PonsLink] 두 달 동안 방 하나에 매달리며 배운 제품의 첫 얼굴", href: "/writing/2026-06-16-ponslink-02-webrtc-first-hell" },
  { title: "[PonsLink] 연결은 붙었지만 신뢰는 쉽게 깨졌다", href: "/writing/2026-06-16-ponslink-03-beyond-calls" },
  { title: "[PonsLink] 말만으로 부족한 순간, 방은 협업 공간이 됐다", href: "/writing/2026-06-16-ponslink-04-feature-sprawl" },
  { title: "[PonsLink] 방은 있었지만 제품을 설명할 문장은 없었다", href: "/writing/2026-06-16-ponslink-05-winter-rebuild" },
  { title: "[PonsLink] 더 큰 방을 꿈꾸자 PonsLink의 무게가 달라졌다", href: "/writing/2026-06-16-ponslink-06-audio-pivot" },
  { title: "[PonsLink] 멋진 분산 구조보다 먼저 감당할 수 있는 제품이 필요했다", href: "/writing/2026-06-16-ponslink-07-requests-payments-ops" },
  { title: "[PonsLink] 다시 P2P로 돌아오며 PonsLink의 중심이 선명해졌다", href: "/writing/2026-06-16-ponslink-08-the-big-pivot" },
  { title: "[PonsLink] 파일 전송은 부가 기능이 아니라 제품의 균형 문제였다", href: "/writing/2026-06-16-ponslink-09-no-go" },
  { title: "[PonsLink] 보여 줄 것만 보여 주고 덜 부담스럽게 들어오게 하기", href: "/writing/2026-06-16-ponslink-10-request-first-desk" },
  { title: "[PonsLink] 회의방보다 먼저 요청과 운영의 혼란을 정리해야 했다", href: "/writing/2026-06-16-ponslink-11-ponswarp-split" },
  { title: "[PonsLink] PonsLink가 아직 진행형인 이유는 기능 부족만이 아니었다", href: "/writing/2026-06-16-ponslink-12-reading-the-commit-log" },
  { title: "[PonsLink] PonsLink 기술 회고: 33편의 아카이브를 읽는 지도", href: "/writing/2026-06-18-ponslink-tech-retrospective" },
  { title: "[PonsLink] 처음 열린 저장소에서 제품의 경계를 읽는 법", href: "/writing/2026-06-18-ponslink-deep-dive-01-map" },
  { title: "[PonsLink] 입장 버튼 뒤에는 어떤 조건들이 숨어 있을까", href: "/writing/2026-06-18-ponslink-deep-dive-02-entry-runtime" },
  { title: "[PonsLink] 전역 상태처럼 보였던 런타임 버스", href: "/writing/2026-06-18-ponslink-deep-dive-03-zustand-runtime" },
  { title: "[PonsLink] 서버가 미디어를 나르지 않을 때 남는 책임", href: "/writing/2026-06-18-ponslink-deep-dive-04-bff-control-plane" },
  { title: "[PonsLink] WebRTC 전에 신호 경계가 먼저 막아야 하는 것", href: "/writing/2026-06-18-ponslink-deep-dive-05-signaling-broker" },
  { title: "[PonsLink] Mesh 연결은 단순해 보여도 순서가 제품 품질을 만든다", href: "/writing/2026-06-18-ponslink-deep-dive-06-webrtc-mesh" },
  { title: "[PonsLink] DataChannel 하나에 모든 메시지를 태우면 왜 위험할까", href: "/writing/2026-06-18-ponslink-deep-dive-07-data-channel-file-transfer" },
  { title: "[PonsLink] 방을 만들기 전에 요청을 먼저 받는 이유", href: "/writing/2026-06-18-ponslink-deep-dive-08-request-first" },
  { title: "[PonsLink] 결제 버튼보다 어려운 것은 입장 권한이다", href: "/writing/2026-06-18-ponslink-deep-dive-09-payment-access" },
  { title: "[PonsLink] 결국 남은 것은 제품을 버티게 한 작은 경계들", href: "/writing/2026-06-18-ponslink-deep-dive-10-patterns-tests" },
  { title: "[PonsLink] WebRTC offer 충돌을 피하는 상태 머신 설계", href: "/writing/2026-06-18-ponslink-algorithm-01-negotiation" },
  { title: "[PonsLink] 실시간 메시지는 모두 같은 줄에 서면 안 됩니다", href: "/writing/2026-06-18-ponslink-algorithm-02-realtime-queue" },
  { title: "[PonsLink] P2P 파일 전송에 작은 TCP가 필요했던 이유", href: "/writing/2026-06-18-ponslink-algorithm-03-file-transfer" },
  { title: "[PonsLink] 놓친 이벤트와 중복 요청을 동시에 줄이는 법", href: "/writing/2026-06-18-ponslink-algorithm-04-replay-idempotency" },
  { title: "[PonsLink] 여러 내부 상태를 하나의 사용자 문장으로 접기", href: "/writing/2026-06-18-ponslink-algorithm-05-request-state" },
  { title: "[PonsLink] DataChannel 위에 PonsCast 프로토콜을 올린 이유", href: "/writing/2026-06-18-ponslink-algorithm-06-ponscast-protocol" },
  { title: "[PonsLink] DataChannel 재생을 버티게 하는 백프레셔와 지터 버퍼", href: "/writing/2026-06-18-ponslink-algorithm-07-ponscast-backpressure" },
  { title: "[PonsLink] PonsCast 파일 감지와 캐시 전략의 기준", href: "/writing/2026-06-18-ponslink-algorithm-08-ponscast-cache" },
  { title: "[PonsLink] 마이크와 PonsCast 오디오를 함께 살리는 라우팅", href: "/writing/2026-06-18-ponslink-algorithm-09-ponscast-audio" },
  { title: "[PonsLink] PonsCast가 화면 공유 대신 DataChannel을 택한 이유", href: "/writing/2026-06-18-ponslink-algorithm-10-ponscast-tradeoff" },
]

export const ponswarpRetrospectiveLinks = [
  { title: "[PonsWarp] 파일 전송은 PonsLink 안에서 먼저 고장났다", href: "/writing/2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink" },
  { title: "[PonsWarp] 서버가 파일을 갖지 않는 전송을 만들고 싶었다", href: "/writing/2026-06-29-main-ponswarp-01-server-does-not-own-file" },
  { title: "[PonsWarp] 브라우저끼리 대용량 파일을 직접 보내는 길", href: "/writing/2026-06-29-ponswarp-01-browser-direct-transfer" },
  { title: "[PonsWarp] WebRTC는 파일을 보내주지 않고 길을 열어준다", href: "/writing/2026-06-29-ponswarp-03-webrtc-opens-the-road" },
  { title: "[PonsWarp] 백프레셔는 기다림이 아니라 전송을 살리는 장치다", href: "/writing/2026-06-29-ponswarp-04-backpressure-protects-transfer" },
  { title: "[PonsWarp] OPFS는 만능키가 아니라 마지막 안전망이었다", href: "/writing/2026-06-29-ponswarp-05c-opfs-safety-net" },
  { title: "[PonsWarp] 끊긴 전송에서 partial file을 어떻게 다룰까", href: "/writing/2026-06-29-ponswarp-07-incomplete-transfer-recovery" },
  { title: "[PonsWarp] 결국 내가 만든 건 파일 전송 버튼이 아니라 실패를 견디는 흐름이었다", href: "/writing/2026-06-29-ponswarp-12b-flow-that-survives-failure" },
]

export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "ponslink",
    title: "PonsLink",
    category: "P2P/Realtime",
    status: "Live",
    year: "2026",
    role: "Product design · Production systems",
    tier: "primary",
    accent: "#c46a32",
    summary:
      "명함 교환 뒤 끊어지는 연결을 용건, 일정, 수락, 세션으로 이어지는 웹 기반 요청 흐름으로 다시 설계한 서비스.",
    problem: "오프라인 네트워킹 이후 연락은 부담스럽고, 맥락 없는 DM은 서로의 시간을 낭비한다.",
    decision: "QR/link 진입, 요청 내용 수집, 수락/거절, 일정 조율, 세션룸을 하나의 흐름으로 묶었다.",
    stack: ["Next.js", "Session workflow", "Scheduling", "Request intake"],
    liveUrl: "https://ponslink.com",
    screenshot: "/portfolio/ponslink.png",
    proofNotes: "운영 URL과 PonsLink 활동 문서로 확인한 대표 서비스.",
    caseStudyPath: "/work/ponslink",
    retrospectiveLinks: ponslinkRetrospectiveLinks,
    featured: true,
  },
  {
    slug: "ponswarp",
    title: "PonsWarp",
    category: "P2P/Realtime",
    status: "Live",
    year: "2026",
    role: "WebRTC · File transfer",
    tier: "primary",
    accent: "#5f78c8",
    summary:
      "민감하거나 큰 파일을 서버에 오래 보관하지 않고 브라우저 간 직접 전송하기 위한 WebRTC 기반 파일 전송 실험.",
    problem: "큰 파일 전송은 클라우드 업로드, 권한 설정, 삭제 확인 부담을 만든다.",
    decision: "WebRTC, OPFS, chunking, backpressure 중심으로 서버 저장 의존도를 낮추는 구조를 실험했다.",
    stack: ["WebRTC", "OPFS", "Chunking", "Backpressure"],
    liveUrl: "https://warp.ponslink.com",
    repoUrl: "https://github.com/DeclanJeon/PonsWarp",
    screenshot: "/portfolio/warp.png",
    proofNotes: "운영 URL과 PonsWarp 회고 글 12편으로 확인한 WebRTC 파일 전송 서비스.",
    caseStudyPath: "/work/ponswarp",
    featured: true,
    retrospectiveLinks: ponswarpRetrospectiveLinks,
  },
  {
    slug: "document-automation-suite",
    title: "DocuFlow / PDF마스터",
    category: "Document Automation",
    status: "Live",
    year: "2026",
    role: "Document tooling · Automation",
    tier: "bonus",
    accent: "#4f8f6b",
    summary:
      "PDF 병합·분할·OCR·HWP 변환·주민번호 마스킹·도장 삽입처럼 한국 문서 업무의 반복 작업을 하나의 흐름으로 묶은 도구군.",
    problem: "문서 변환, 마스킹, HWP, OCR, 도장 삽입 요구가 여러 도구와 수작업으로 흩어진다.",
    decision: "브라우저에서 처리할 수 있는 작업과 서버 변환·OCR fallback이 필요한 작업을 분리했다.",
    stack: ["PDF", "OCR", "HWP workflow", "Privacy masking"],
    liveUrl: "https://docuflow.ponslink.com",
    screenshot: "/portfolio/docuflow.png",
    proofNotes: "DocuFlow와 PDF마스터 운영 화면 캡처로 확인.",
    featured: true,
  },
  {
    slug: "ruminate-fatemirror",
    title: "Ruminate / 명경",
    category: "Domain AI",
    status: "Live",
    year: "2026",
    role: "Domain language · AI UX",
    tier: "bonus",
    accent: "#7e6a50",
    summary:
      "고전과 사주처럼 문맥이 중요한 언어를 AI가 단정하지 않고 다시 생각할 수 있는 안내로 바꾸는 해석형 서비스군.",
    problem: "일반 AI 상담과 운세 서비스는 너무 쉽게 단정하거나 공포를 판다.",
    decision: "고민 요약, 도메인 문장 검색/RAG, 현대적 해석, 선택 가능한 조언을 분리했다.",
    stack: ["RAG", "Interpretive UX", "Domain rules", "Korean copy"],
    liveUrl: "https://ruminate.ponslink.com",
    screenshot: "/portfolio/ruminate.png",
    proofNotes: "Ruminate와 FateMirror 운영 화면 및 프로필 문서의 도메인 AI 활동으로 확인.",
    featured: true,
  },
  {
    slug: "bible-companion",
    title: "Bible Companion",
    category: "Domain AI",
    status: "Lab",
    year: "2026",
    role: "Context exploration",
    tier: "bonus",
    accent: "#8a7a45",
    summary:
      "마음에 걸리는 문장이나 질문에서 출발해 성경 본문, 연결 이야기, 다음 읽을 흐름을 안내하는 맥락 탐색 컴패니언.",
    problem: "성경 읽기는 어디서 시작하고 어떤 문맥으로 이어야 할지 막히기 쉽다.",
    decision: "질문, 본문, 연결 이야기, 다음 읽을 길을 분리해 탐색 흐름으로 구성한다.",
    stack: ["Bilingual content", "Context graph", "Reading guide"],
    liveUrl: "https://bible.ponslink.com/ko",
    screenshot: "/portfolio/bible-ko.png",
    proofNotes: "현재 H1이 '본문을 준비하고 있습니다'로 관찰되어 featured 전 점검 대상.",
  },
  {
    slug: "youtube-to-md",
    title: "YouTube-to-MD / MediaScribe",
    category: "Creator Tools",
    status: "Live",
    year: "2026",
    role: "Content pipeline",
    tier: "bonus",
    accent: "#d25f4a",
    summary:
      "영상·음성 자료를 다시 검색하고 인용할 수 있는 Markdown/TXT/SRT 문서로 바꾸는 변환 흐름.",
    problem: "영상은 보기 쉽지만 다시 검색하고 인용하고 편집 가능한 자료로 쓰기 어렵다.",
    decision: "URL 기반 자막 추출, 언어 감지, timestamp 보존, Markdown export를 작업 단위로 나눴다.",
    stack: ["Transcript", "Markdown", "Timestamps", "faster-whisper"],
    liveUrl: "https://y2md.ponslink.com",
    screenshot: "/portfolio/y2md.png",
    proofNotes: "운영 URL 캡처와 MediaScribe 활동 문서로 확인.",
  },
  {
    slug: "creator-local-tools",
    title: "Flucto / ClickCap / CaptureBrain",
    category: "Creator Tools",
    status: "Repo proof",
    year: "2025 — 2026",
    role: "Local-first tools",
    tier: "bonus",
    accent: "#596d7d",
    summary:
      "콘텐츠 제작자가 자료 수집, 화면 녹화, 클릭 설명, OCR 추출 같은 주변 작업에 쓰는 시간을 줄이기 위한 로컬 우선 도구군.",
    problem: "자료 수집, 화면 녹화, 클릭 설명, OCR 추출은 작지만 제작 시간을 반복적으로 빼앗는다.",
    decision: "Electron, Chrome extension, local processing을 용도별로 나눠 빠르게 실행되는 보조 도구로 만들었다.",
    stack: ["Electron", "Chrome extension", "OCR", "Local workflow"],
    repoUrl: "https://github.com/DeclanJeon/flucto",
    proofNotes: "flucto와 ClickCap GitHub README에서 기능 범위 확인.",
  },
  {
    slug: "agent-work-systems",
    title: "page-production-skills / AgentDock / TraceForge",
    category: "Agent Tools",
    status: "Repo proof",
    year: "2026",
    role: "Agent workflow · QA",
    tier: "bonus",
    accent: "#6e5f9f",
    summary:
      "AI와 함께 작업할 때 결과만이 아니라 근거, 절차, QA, 역할 분담이 남도록 만든 작업 시스템 도구군.",
    problem: "AI 작업은 결과만 남으면 근거, 승인 기준, 실패 복구 경로가 사라진다.",
    decision: "page brief pipeline, tmux workrooms, trace/review 흐름으로 작업 증거와 품질 게이트를 남긴다.",
    stack: ["Agent skills", "tmux", "Evidence gates", "QA workflow"],
    repoUrl: "https://github.com/DeclanJeon/page-production-skills",
    proofNotes: "page-production-skills와 agentdock GitHub README로 확인.",
  },
]

export const signatureSystems = [
  {
    title: "연결을 세션으로",
    body: "PonsLink는 만남 이후 흐릿해지는 연락을 요청·일정·수락·세션으로 바꾼다.",
    projectSlug: "ponslink",
  },
  {
    title: "파일을 직접 전송으로",
    body: "PonsWarp는 서버 저장 대신 브라우저 간 전송과 로컬 저장 전략을 실험한다.",
    projectSlug: "ponswarp",
  },
]

export const writingCaseStudies = [
  "PonsLink: 오프라인 네트워킹을 세션 데스크로 바꾼 이유",
  "PonsWarp: 대용량 파일 전송에서 서버 저장을 줄이는 방식",
  "번외 / PDF마스터와 DocuFlow: 한국 문서 업무를 한 흐름으로 묶기",
  "번외 / Ruminate와 명경: 도메인 언어가 AI UX를 바꾸는 지점",
  "번외 / YouTube-to-MD: 영상 자료를 다시 쓸 수 있는 문서로 바꾸기",
]

export const evidenceItems = [
  "Live product URLs and screenshots: PonsLink, PonsWarp, DocuFlow, Ruminate",
  "GitHub proof: PonsWarp, ClickCap, flucto, page-production-skills",
  "Public profile links: GitHub, email, blog, Threads",
  "Writing archive stays secondary and links back to product decisions",
]
