export type TaxonomySeed = {
  readonly slug: string
  readonly name: string
  readonly kind: "category" | "project" | "topic"
  readonly parentSlug: string | null
  readonly description: string
  readonly sortOrder: number
}

export type SeriesSeed = {
  readonly slug: string
  readonly title: string
  readonly projectSlug: string
  readonly description: string
  readonly sortOrder: number
  readonly postSlugs: readonly string[]
}

export type PublishedPost = {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly category: string
  readonly tags: string
}

export type ProjectKey = "ponslink" | "ponswarp" | "document-automation" | "domain-ai" | "local-tools" | "essay" | "operation-note" | "release-note" | "study-note"

export type MappingResult = {
  readonly primarySlug: string
  readonly secondarySlugs: readonly string[]
}

export const TAXONOMY_SEEDS: readonly TaxonomySeed[] = [
  { slug: "dev-retrospective", name: "개발 회고", kind: "category", parentSlug: null, description: "제품을 만들며 남긴 기술, 제품, 운영 판단", sortOrder: 10 },
  { slug: "dev-retrospective/ponslink", name: "PonsLink", kind: "project", parentSlug: "dev-retrospective", description: "링크 기반 room, request-first 세션 데스크, PonsCast", sortOrder: 10 },
  { slug: "dev-retrospective/ponswarp", name: "PonsWarp", kind: "project", parentSlug: "dev-retrospective", description: "PonsLink에서 분리된 대용량 파일 전송 실험", sortOrder: 20 },
  { slug: "dev-retrospective/document-automation", name: "Document Automation", kind: "project", parentSlug: "dev-retrospective", description: "PDF, HWP, OCR, 문서 자동화", sortOrder: 30 },
  { slug: "dev-retrospective/domain-ai", name: "Domain AI", kind: "project", parentSlug: "dev-retrospective", description: "Ruminate, FateMirror 같은 도메인 AI 실험", sortOrder: 40 },
  { slug: "dev-retrospective/local-tools", name: "Local Tools", kind: "project", parentSlug: "dev-retrospective", description: "ClickCap, Flucto, CaptureBrain 등 로컬 도구", sortOrder: 50 },
  { slug: "operation-note", name: "운영 노트", kind: "category", parentSlug: null, description: "배포, SEO, 블로그 운영, 서버 운영 기록", sortOrder: 20 },
  { slug: "operation-note/blog-ops", name: "Blog Ops", kind: "project", parentSlug: "operation-note", description: "Next.js/WordPress형 블로그 운영 기록", sortOrder: 10 },
  { slug: "study-note", name: "공부 노트", kind: "category", parentSlug: null, description: "직접 만든 제품을 이해하기 위해 정리한 네트워크, 브라우저, 시스템 설계 공부 기록", sortOrder: 25 },
  { slug: "study-note/realtime-network", name: "실시간 네트워크 딥다이브", kind: "project", parentSlug: "study-note", description: "P2P, Mesh, SFU, MCU, WebRTC, DataChannel, NAT traversal을 공부하며 실시간 제품 설계 판단으로 연결한 기록", sortOrder: 10 },
  { slug: "study-note/software-design-docs", name: "설계문서 공부 노트", kind: "project", parentSlug: "study-note", description: "PRD, SRS, SDD, ADR, API Spec, Runbook처럼 개발 설계문서를 결정 층위별로 정리한 공부 기록", sortOrder: 30 },
  { slug: "essay", name: "에세이", kind: "category", parentSlug: null, description: "제품과 직접 연결되지 않는 생각 글", sortOrder: 30 },
  { slug: "release-note", name: "릴리즈 노트", kind: "category", parentSlug: null, description: "배포 변화와 기능 출시 기록", sortOrder: 40 },
  { slug: "dev-retrospective/ponslink/origin", name: "Origin", kind: "topic", parentSlug: "dev-retrospective/ponslink", description: "왜 만들었는지, room-first, 링크 기반 연결", sortOrder: 10 },
  { slug: "dev-retrospective/ponslink/product-decision", name: "Product Decisions", kind: "topic", parentSlug: "dev-retrospective/ponslink", description: "request-first, Public Desk, pricing, 직접 판매", sortOrder: 20 },
  { slug: "dev-retrospective/ponslink/architecture", name: "Architecture", kind: "topic", parentSlug: "dev-retrospective/ponslink", description: "room, signaling, BFF, Mesh, state sync", sortOrder: 30 },
  { slug: "dev-retrospective/ponslink/algorithm", name: "Algorithms", kind: "topic", parentSlug: "dev-retrospective/ponslink", description: "negotiation, queue, replay, PonsCast protocol", sortOrder: 40 },
  { slug: "dev-retrospective/ponslink/operation", name: "Operations", kind: "topic", parentSlug: "dev-retrospective/ponslink", description: "결제, 세션 권한, 관리자 OTP, 운영 게이트", sortOrder: 50 },
  { slug: "dev-retrospective/ponslink/metrics", name: "Metrics", kind: "topic", parentSlug: "dev-retrospective/ponslink", description: "정량/정성 지표, before/after, 회고 요약", sortOrder: 60 },
  { slug: "dev-retrospective/ponswarp/origin", name: "Origin", kind: "topic", parentSlug: "dev-retrospective/ponswarp", description: "PonsLink 파일 전송에서 분리된 이유", sortOrder: 10 },
  { slug: "dev-retrospective/ponswarp/transfer-engine", name: "Transfer Engine", kind: "topic", parentSlug: "dev-retrospective/ponswarp", description: "WebRTC, DataChannel, signaling, ACK, backpressure", sortOrder: 20 },
  { slug: "dev-retrospective/ponswarp/browser-storage", name: "Browser Storage", kind: "topic", parentSlug: "dev-retrospective/ponswarp", description: "2GB, OPFS, IndexedDB, StreamSaver, File System Access", sortOrder: 30 },
  { slug: "dev-retrospective/ponswarp/native-wasm", name: "Native & WASM", kind: "topic", parentSlug: "dev-retrospective/ponswarp", description: "Rust/WASM, ZIP64, zero-copy, desktop/Tauri", sortOrder: 40 },
  { slug: "dev-retrospective/ponswarp/operation", name: "Operations", kind: "topic", parentSlug: "dev-retrospective/ponswarp", description: "Cloud Drop, 권한, 결제, 링크 만료", sortOrder: 50 },
  { slug: "dev-retrospective/ponswarp/metrics", name: "Metrics", kind: "topic", parentSlug: "dev-retrospective/ponswarp", description: "파일 크기, 메모리, 실패/복구, before/after", sortOrder: 60 },
]
const REALTIME_NETWORK_DEEP_DIVE_POST_SLUGS = [
  "2026-07-04-realtime-network-01-p2p-is-not-serverless",
  "2026-07-04-realtime-network-02-direct-connection-meaning",
  "2026-07-04-realtime-network-03-p2p-strengths-and-limits",
  "2026-07-04-realtime-network-04-why-p2p-needs-signaling",
  "2026-07-04-realtime-network-05-mesh-gets-heavy-with-people",
  "2026-07-04-realtime-network-06-full-partial-mesh-star",
  "2026-07-04-realtime-network-07-p2p-mesh-breaks-video-call",
  "2026-07-04-realtime-network-08-mesh-cost-by-connection-formula",
  "2026-07-04-realtime-network-09-p2p-mesh-sfu-mcu-comparison",
  "2026-07-04-realtime-network-10-sfu-selective-forwarding",
  "2026-07-04-realtime-network-11-why-sfu-scales-better-than-mesh",
  "2026-07-04-realtime-network-12-simulcast-svc-near-sfu",
  "2026-07-04-realtime-network-13-why-mcu-is-expensive-but-useful",
  "2026-07-04-realtime-network-14-sfu-and-mcu-are-choices",
  "2026-07-04-realtime-network-15-why-webrtc-connection-is-hard",
  "2026-07-04-realtime-network-16-stun-turn-ice-without-confusion",
  "2026-07-04-realtime-network-17-why-nat-traversal-fails",
  "2026-07-04-realtime-network-18-why-turn-costs-money-in-p2p",
  "2026-07-04-realtime-network-19-datachannel-is-not-file-api",
  "2026-07-04-realtime-network-20-ordered-vs-unordered-datachannel",
  "2026-07-04-realtime-network-21-reliable-vs-partially-reliable",
  "2026-07-04-realtime-network-22-bufferedamount-backpressure-file-transfer",
] as const

const SOFTWARE_DESIGN_DOC_POST_SLUGS = [
  "2026-07-07-software-design-documents-map",
  "2026-07-07-software-design-documents-product-docs",
  "2026-07-07-software-design-documents-requirements",
  "2026-07-07-software-design-documents-architecture",
  "2026-07-07-software-design-documents-decisions",
  "2026-07-07-software-design-documents-operations",
] as const



export const SERIES_SEEDS: readonly SeriesSeed[] = [
  {
    slug: "ponslink-origin-story",
    title: "PonsLink Origin Story",
    projectSlug: "ponslink",
    description: "왜 PonsLink를 만들었는지부터 파일 전송 분리까지 읽는 대표 흐름",
    sortOrder: 10,
    postSlugs: [
      "2026-06-16-ponslink-00-link-only-room",
      "2026-06-16-ponslink-01-why-i-came-back-to-connection",
      "2026-06-16-ponslink-01b-room-before-product",
      "2026-06-16-ponslink-02b-signal-behind-link",
      "2026-06-16-ponslink-04b-room-grew-with-context",
      "2026-06-16-ponslink-04c-ponscast-same-time",
      "2026-06-16-ponslink-07b-good-room-not-enough",
      "2026-06-16-ponslink-09b-file-transfer-left-room",
      "2026-06-16-ponslink-12b-connection-method",
    ],
  },
  {
    slug: "ponslink-technical-architecture",
    title: "PonsLink Technical Architecture",
    projectSlug: "ponslink",
    description: "WebRTC, signaling, Mesh, DataChannel, 상태 동기화 설계 흐름",
    sortOrder: 20,
    postSlugs: [
      "2026-06-18-ponslink-algorithm-01-negotiation",
      "2026-06-18-ponslink-deep-dive-05-signaling-broker",
      "2026-06-18-ponslink-deep-dive-06-webrtc-mesh",
      "2026-06-18-ponslink-deep-dive-07-data-channel-file-transfer",
      "2026-06-18-ponslink-deep-dive-04-bff-control-plane",
      "2026-06-18-ponslink-algorithm-04-replay-idempotency",
    ],
  },
  {
    slug: "ponslink-product-operations",
    title: "PonsLink Product Operations",
    projectSlug: "ponslink",
    description: "request-first 세션 데스크, Public Desk, 결제와 운영 게이트",
    sortOrder: 30,
    postSlugs: [
      "2026-06-28-ponslink-product-01-dm-screening",
      "2026-06-28-ponslink-product-02-public-desk-gate",
      "2026-06-28-ponslink-product-05-request-status",
      "2026-06-28-ponslink-product-06-session-access",
      "2026-06-28-ponslink-product-07-meeting-records",
      "2026-06-28-ponslink-product-12-pricing-free-pro",
      "2026-06-28-ponslink-product-24-direct-sales-before-product-hunt",
    ],
  },
  {
    slug: "ponswarp-origin-story",
    title: "PonsWarp Origin Story",
    projectSlug: "ponswarp",
    description: "PonsLink 파일 전송 분리부터 web-first 회귀까지",
    sortOrder: 40,
    postSlugs: [
      "2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink",
      "2026-06-29-main-ponswarp-01-server-does-not-own-file",
      "2026-06-29-ponswarp-01-browser-direct-transfer",
      "2026-06-29-ponswarp-01b-data-grid-tb-experiment",
      "2026-06-29-ponswarp-02b-desktop-testing-fatigue",
      "2026-06-29-ponswarp-03-webrtc-opens-the-road",
      "2026-06-29-ponswarp-04b-ack-backpressure-battle",
      "2026-06-29-ponswarp-05b-browser-memory-2gb",
      "2026-06-29-ponswarp-05c-opfs-safety-net",
      "2026-06-29-ponswarp-06b-rust-wasm-memory-survival",
      "2026-06-29-ponswarp-12b-flow-that-survives-failure",
    ],
  },
  {
    slug: "ponswarp-transfer-engine",
    title: "PonsWarp Transfer Engine",
    projectSlug: "ponswarp",
    description: "signaling, WebRTC, ACK, backpressure, zero-copy 흐름",
    sortOrder: 50,
    postSlugs: [
      "2026-06-29-main-ponswarp-02-signaling-is-matchmaker",
      "2026-06-29-ponswarp-03-webrtc-opens-the-road",
      "2026-06-29-ponswarp-04-backpressure-protects-transfer",
      "2026-06-29-ponswarp-04b-ack-backpressure-battle",
      "2026-06-29-ponswarp-10-pipeline-limits-before-speed",
      "2026-06-29-ponswarp-11-zero-copy-pool",
    ],
  },
  {
    slug: "ponswarp-storage-and-native",
    title: "PonsWarp Storage & Native",
    projectSlug: "ponswarp",
    description: "브라우저 저장소, OPFS, Rust/WASM, ZIP64 판단",
    sortOrder: 60,
    postSlugs: [
      "2026-06-29-ponswarp-05b-browser-memory-2gb",
      "2026-06-29-ponswarp-05-zip64-streaming",
      "2026-06-29-ponswarp-05c-opfs-safety-net",
      "2026-06-29-ponswarp-06b-rust-wasm-memory-survival",
      "2026-06-29-ponswarp-02b-desktop-testing-fatigue",
    ],
  },
  {
    slug: "realtime-network-deep-dive",
    title: "실시간 네트워크 딥다이브: P2P부터 SFU, MCU까지",
    projectSlug: "study-note/realtime-network",
    description: "P2P, Mesh, SFU, MCU, WebRTC 연결 이론, DataChannel 파일 전송을 10,000자급 공부 노트로 정리한 실시간 네트워크 딥다이브.",
    sortOrder: 5,
    postSlugs: REALTIME_NETWORK_DEEP_DIVE_POST_SLUGS,
  },
  {
    slug: "software-design-docs-reading-path",
    title: "설계문서 공부 노트 읽는 순서",
    projectSlug: "study-note/software-design-docs",
    description: "PRD에서 SRS, SDD, ADR, API Spec, Runbook까지 문서 층위를 나눠 읽는 순서.",
    sortOrder: 80,
    postSlugs: SOFTWARE_DESIGN_DOC_POST_SLUGS,
  },
]
