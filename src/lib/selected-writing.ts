import { db } from "@/lib/db"
import { decorateArchivePosts, postSelect } from "@/lib/archive-post-decoration"
import type { ArchivePost } from "@/components/site/writing-archive-utils"

export type SelectedWritingItem = {
  readonly slug: string
  readonly reason: string
}

export type SelectedWritingGroupConfig = {
  readonly title: string
  readonly description: string
  readonly items: readonly SelectedWritingItem[]
}

export type SelectedWritingPost = SelectedWritingItem & {
  readonly post: ArchivePost
}

export type SelectedWritingGroup = Omit<SelectedWritingGroupConfig, "items"> & {
  readonly posts: readonly SelectedWritingPost[]
}

export type ReadingPathConfig = {
  readonly title: string
  readonly description: string
  readonly slugs: readonly string[]
}

export type CollectionReadingGuideConfig = {
  readonly kicker: string
  readonly description: string
  readonly startHere: readonly SelectedWritingItem[]
  readonly paths: readonly ReadingPathConfig[]
}

export type ReadingPath = Omit<ReadingPathConfig, "slugs"> & {
  readonly posts: readonly ArchivePost[]
}

export type CollectionReadingGuide = Omit<CollectionReadingGuideConfig, "startHere" | "paths"> & {
  readonly startHere: readonly SelectedWritingPost[]
  readonly paths: readonly ReadingPath[]
}

export const selectedWritingGroups = [
  {
    title: "처음 보는 사람에게 추천",
    description: "서비스 개발자로서의 문제 정의, 흐름 설계, 운영 감각을 가장 빨리 확인할 수 있는 글.",
    items: [
      {
        slug: "2026-06-29-main-ponslink-01-room-not-call",
        reason: "화상회의 기능보다 협업 방의 제품 흐름을 먼저 본 판단을 보여준다.",
      },
      {
        slug: "2026-06-29-main-ponswarp-01-server-does-not-own-file",
        reason: "대용량 파일 전송에서 서버 저장 책임을 줄이려는 제품 경계를 보여준다.",
      },
      {
        slug: "2026-06-29-main-docuflow-03-local-security-boundary",
        reason: "민감 문서 처리에서 신뢰가 기능보다 먼저 보여야 한다는 기준을 보여준다.",
      },
      {
        slug: "2026-06-29-main-ruminate-01-ai-should-not-answer-too-fast",
        reason: "AI UX에서 빠른 답변보다 해석의 안전성을 먼저 보는 관점을 보여준다.",
      },
    ],
  },
  {
    title: "기술 깊이를 보고 싶다면",
    description: "WebRTC, P2P, DataChannel을 개념 암기가 아니라 제품 책임과 운영 비용으로 나눠 본 글.",
    items: [
      {
        slug: "2026-07-04-realtime-network-01-p2p-is-not-serverless",
        reason: "P2P 제품에서도 서버가 맡아야 하는 책임을 분리한다.",
      },
      {
        slug: "2026-07-04-realtime-network-16-stun-turn-ice-without-confusion",
        reason: "연결 실패를 주소 발견, relay, 후보 선택 문제로 나눠 본다.",
      },
      {
        slug: "2026-07-04-realtime-network-11-why-sfu-scales-better-than-mesh",
        reason: "Mesh와 SFU를 연결 수가 아니라 업로드 책임 위치로 비교한다.",
      },
      {
        slug: "2026-07-04-realtime-network-19-datachannel-is-not-file-api",
        reason: "DataChannel을 파일 전송 제품으로 만들 때 직접 설계해야 하는 책임을 드러낸다.",
      },
    ],
  },
  {
    title: "운영과 실패 기준",
    description: "기능을 붙이는 과정에서 비용, 권한, 실패 복구, 운영 경계를 어떻게 봤는지 확인하는 글.",
    items: [
      {
        slug: "2026-06-29-main-ponslink-03-state-resync",
        reason: "실시간 방에서 상태 어긋남을 먼저 관측해야 하는 이유를 보여준다.",
      },
      {
        slug: "2026-06-29-main-ponswarp-03-backpressure-before-speed",
        reason: "속도보다 흐름 제어가 먼저라는 대용량 전송 운영 기준을 보여준다.",
      },
      {
        slug: "2026-06-29-ponswarp-07-incomplete-transfer-recovery",
        reason: "끊긴 전송에서 partial file을 어떻게 다룰지 제품 정책으로 판단한다.",
      },
    ],
  },
] satisfies readonly SelectedWritingGroupConfig[]

export const collectionReadingGuides: Record<string, CollectionReadingGuideConfig> = {
  "study-note/realtime-network": {
    kicker: "Start here",
    description: "22편을 최신순으로 읽기보다, 먼저 연결 책임과 비용 구조를 잡고 필요한 세부 글로 내려간다.",
    startHere: [
      {
        slug: "2026-07-04-realtime-network-01-p2p-is-not-serverless",
        reason: "P2P를 서버 제거가 아니라 서버 책임 재배치로 보는 출발점.",
      },
      {
        slug: "2026-07-04-realtime-network-15-why-webrtc-connection-is-hard",
        reason: "브라우저, NAT, 방화벽 때문에 연결이 여러 단계로 갈라지는 이유.",
      },
      {
        slug: "2026-07-04-realtime-network-11-why-sfu-scales-better-than-mesh",
        reason: "방이 커질 때 누가 미디어를 복제하는지 보는 대표 비교 글.",
      },
    ],
    paths: [
      {
        title: "P2P 기본 오해 깨기",
        description: "서버가 사라지는 부분과 남는 책임을 먼저 나눈다.",
        slugs: [
          "2026-07-04-realtime-network-01-p2p-is-not-serverless",
          "2026-07-04-realtime-network-02-direct-connection-meaning",
          "2026-07-04-realtime-network-03-p2p-strengths-and-limits",
        ],
      },
      {
        title: "WebRTC 연결 실패 보기",
        description: "signaling, STUN/TURN/ICE, NAT traversal을 장애 원인별로 본다.",
        slugs: [
          "2026-07-04-realtime-network-04-why-p2p-needs-signaling",
          "2026-07-04-realtime-network-15-why-webrtc-connection-is-hard",
          "2026-07-04-realtime-network-16-stun-turn-ice-without-confusion",
          "2026-07-04-realtime-network-17-why-nat-traversal-fails",
        ],
      },
      {
        title: "방 구조 선택하기",
        description: "Mesh, SFU, MCU를 기술 유행이 아니라 책임 위치로 비교한다.",
        slugs: [
          "2026-07-04-realtime-network-05-mesh-gets-heavy-with-people",
          "2026-07-04-realtime-network-11-why-sfu-scales-better-than-mesh",
          "2026-07-04-realtime-network-13-why-mcu-is-expensive-but-useful",
          "2026-07-04-realtime-network-14-sfu-and-mcu-are-choices",
        ],
      },
      {
        title: "DataChannel로 파일 다루기",
        description: "DataChannel을 파일 전송 제품으로 만들 때 필요한 순서, 신뢰성, backpressure 기준.",
        slugs: [
          "2026-07-04-realtime-network-19-datachannel-is-not-file-api",
          "2026-07-04-realtime-network-20-ordered-vs-unordered-datachannel",
          "2026-07-04-realtime-network-21-reliable-vs-partially-reliable",
          "2026-07-04-realtime-network-22-bufferedamount-backpressure-file-transfer",
        ],
      },
    ],
  },
  "study-note/p2p-protocols": {
    kicker: "Reading path",
    description: "프로토콜 이름을 외우기보다 discovery, transport, 검증 책임으로 나눠 읽는다.",
    startHere: [
      {
        slug: "2026-07-04-p2p-protocol-01-dht-bittorrent-peer-discovery",
        reason: "피어를 찾는 문제를 먼저 잡는다.",
      },
      {
        slug: "2026-07-04-p2p-protocol-03-webtransport-quic-vs-webrtc",
        reason: "WebTransport/QUIC/WebRTC를 연결 대상과 서버 경유 여부로 비교한다.",
      },
      {
        slug: "2026-07-04-p2p-protocol-07-merkle-hash-content-verification",
        reason: "분산 전송에서 받은 조각을 어떻게 믿을지 다룬다.",
      },
    ],
    paths: [
      {
        title: "찾고 연결하기",
        description: "피어 발견과 transport 선택을 먼저 본다.",
        slugs: [
          "2026-07-04-p2p-protocol-01-dht-bittorrent-peer-discovery",
          "2026-07-04-p2p-protocol-02-libp2p-transport-security-discovery",
          "2026-07-04-p2p-protocol-03-webtransport-quic-vs-webrtc",
        ],
      },
      {
        title: "신뢰와 검증",
        description: "분산 구조에서 데이터와 상대를 믿는 기준을 본다.",
        slugs: [
          "2026-07-04-p2p-protocol-04-crdt-conflict-resolution",
          "2026-07-04-p2p-protocol-06-trust-boundary-in-p2p-products",
          "2026-07-04-p2p-protocol-07-merkle-hash-content-verification",
        ],
      },
    ],
  },
  "dev-retrospective/document-automation": {
    kicker: "Start here",
    description: "문서 자동화 글은 기능보다 민감 문서가 어디서 처리되는지 보여주는 경계가 핵심이다.",
    startHere: [
      {
        slug: "2026-06-29-main-docuflow-03-local-security-boundary",
        reason: "민감 문서 처리 위치가 먼저 보여야 한다는 핵심 기준.",
      },
      {
        slug: "2026-06-29-main-docuflow-02-korean-document-context",
        reason: "한국 문서 업무가 PDF 기능만으로 끝나지 않는 이유.",
      },
      {
        slug: "2026-06-29-main-docuflow-01-tools-to-flow",
        reason: "흩어진 PDF 도구를 하나의 문서 흐름으로 본 출발점.",
      },
    ],
    paths: [],
  },
  "dev-retrospective/domain-ai": {
    kicker: "Start here",
    description: "도메인 AI 글은 답을 빨리 주는 것보다 단정하지 않는 해석 구조를 보여준다.",
    startHere: [
      {
        slug: "2026-06-29-main-ruminate-01-ai-should-not-answer-too-fast",
        reason: "AI 답변 속도가 오히려 위험해지는 지점을 보여준다.",
      },
      {
        slug: "2026-06-29-main-ruminate-02-classic-text-as-question",
        reason: "고전 문장을 정답이 아니라 질문으로 쓰는 UX 기준.",
      },
      {
        slug: "2026-07-06-navid-fatemirror-failed-prototype",
        reason: "실패한 프로토타입에서 남은 제품 기준을 기록한다.",
      },
    ],
    paths: [],
  },
}

async function postsBySlug(slugs: readonly string[]): Promise<ReadonlyMap<string, ArchivePost>> {
  const uniqueSlugs = [...new Set(slugs)]
  if (!uniqueSlugs.length) return new Map()

  const records = await db.post.findMany({
    where: { status: "published", slug: { in: uniqueSlugs } },
    select: postSelect,
  })
  const posts = await decorateArchivePosts(records)
  return new Map(posts.map((post) => [post.slug, post]))
}

export async function getSelectedWritingGroups(): Promise<readonly SelectedWritingGroup[]> {
  const slugs = selectedWritingGroups.flatMap((group) => group.items.map((item) => item.slug))
  const posts = await postsBySlug(slugs)
  return selectedWritingGroups
    .map((group) => ({
      title: group.title,
      description: group.description,
      posts: group.items
        .map((item) => {
          const post = posts.get(item.slug)
          return post ? { ...item, post } : null
        })
        .filter((item): item is SelectedWritingPost => Boolean(item)),
    }))
    .filter((group) => group.posts.length > 0)
}

export function getCollectionReadingGuide(slug: string, posts: readonly ArchivePost[]): CollectionReadingGuide | null {
  const config = collectionReadingGuides[slug]
  if (!config) return null

  const postsBySlug = new Map(posts.map((post) => [post.slug, post]))
  const startHere = config.startHere
    .map((item) => {
      const post = postsBySlug.get(item.slug)
      return post ? { ...item, post } : null
    })
    .filter((item): item is SelectedWritingPost => Boolean(item))
  const paths = config.paths
    .map((path) => ({
      title: path.title,
      description: path.description,
      posts: path.slugs.map((postSlug) => postsBySlug.get(postSlug)).filter((post): post is ArchivePost => Boolean(post)),
    }))
    .filter((path) => path.posts.length > 0)

  if (!startHere.length && !paths.length) return null
  return {
    kicker: config.kicker,
    description: config.description,
    startHere,
    paths,
  }
}
