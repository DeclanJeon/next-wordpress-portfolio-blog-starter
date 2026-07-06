import { portfolioProjects, ponslinkRetrospectiveLinks, ponswarpRetrospectiveLinks } from "@/lib/portfolio"
import type { RetrospectiveProject } from "@/lib/retrospective-contract"

export type CaseStudySection = {
  readonly title: string
  readonly body: string
}

export type CaseStudyEvidenceLink = {
  readonly label: string
  readonly href: string
  readonly kind: "live" | "repo" | "writing" | "contact"
}

export type PortfolioCaseStudy = {
  readonly slug: Extract<RetrospectiveProject, "ponslink" | "ponswarp">
  readonly title: string
  readonly kicker: string
  readonly summary: string
  readonly projectProblem: string
  readonly constraints: readonly string[]
  readonly architecture: readonly CaseStudySection[]
  readonly decisions: readonly CaseStudySection[]
  readonly rejected: readonly CaseStudySection[]
  readonly debuggingEvidence: readonly CaseStudySection[]
  readonly verifiableEvidence: readonly string[]
  readonly knownLimits: readonly string[]
  readonly links: readonly CaseStudyEvidenceLink[]
}

const ponslink = portfolioProjects.find((project) => project.slug === "ponslink")
const ponswarp = portfolioProjects.find((project) => project.slug === "ponswarp")

export const portfolioCaseStudies = [
  {
    slug: "ponslink",
    title: "PonsLink case study",
    kicker: "Connection workflow",
    summary:
      "오프라인 만남 뒤 흐릿해지는 연락을 요청, 수락, 일정, 세션으로 이어지는 운영 가능한 웹 흐름으로 다시 설계한 작업.",
    projectProblem:
      ponslink?.problem ?? "오프라인 네트워킹 이후 연락은 부담스럽고, 맥락 없는 DM은 서로의 시간을 낭비한다.",
    constraints: [
      "처음 만난 사람에게 계정 생성과 장문의 자기소개를 강요하면 진입이 끊긴다.",
      "연결 요청은 수락, 보류, 거절이 모두 자연스러워야 하므로 단순 채팅방보다 상태 경계가 중요하다.",
      "실시간 세션은 WebRTC보다 먼저 권한, 요청 문장, 일정 조율의 제품 흐름을 설명해야 한다.",
    ],
    architecture: [
      {
        title: "Request first",
        body: "QR/link로 들어온 방문자는 먼저 용건을 남기고, 소유자는 요청을 보고 수락·보류·거절을 판단한다.",
      },
      {
        title: "Session desk",
        body: "수락된 요청만 일정과 세션룸으로 이어지게 하여 무작위 DM이 아니라 합의된 만남으로 전환한다.",
      },
      {
        title: "Realtime boundary",
        body: "WebRTC와 실시간 메시지는 제품의 첫 문장이 아니라, 수락 이후 필요한 실행 경로로 배치한다.",
      },
    ],
    decisions: [
      {
        title: "방보다 요청을 먼저 설계",
        body: "처음부터 회의방을 열기보다 왜 만나야 하는지, 상대가 받을 만한 요청인지 판단하는 단계를 앞에 둔다.",
      },
      {
        title: "운영 가능한 거절 포함",
        body: "좋은 요청만 통과시키는 구조가 아니라 보류와 거절까지 제품 상태로 인정해 사용자 부담을 줄인다.",
      },
      {
        title: "Archive를 증거로 연결",
        body: "제품 설명만 두지 않고 회고, 알고리즘 노트, 운영 판단을 연결해 왜 이런 경계가 생겼는지 확인하게 한다.",
      },
    ],
    rejected: [
      {
        title: "바로 화상회의방 열기",
        body: "실시간 방은 만들 수 있지만 처음 만난 사람에게는 왜 들어가야 하는지와 권한 경계가 먼저 필요했다.",
      },
      {
        title: "모든 기능을 한 방에 넣기",
        body: "파일 전송, 결제, 요청, 회의 기능을 한 화면에 쌓으면 첫 사용자가 무엇을 해야 하는지 잃는다.",
      },
    ],
    debuggingEvidence: [
      {
        title: "상태 경계가 제품 언어를 만든다",
        body: "요청 상태, 입장 권한, realtime 연결 상태를 사용자에게 같은 말로 보이면 장애 원인과 다음 행동이 흐려진다.",
      },
      {
        title: "WebRTC보다 앞서는 신뢰 문제",
        body: "연결이 붙어도 상대가 왜 들어왔는지 모르면 제품 신뢰는 깨진다. 그래서 signaling보다 요청 문장이 먼저 온다.",
      },
    ],
    verifiableEvidence: [
      "운영 URL이 공개되어 있다: https://ponslink.com",
      "portfolio 데이터에 PonsLink live URL과 screenshot path가 연결되어 있다.",
      "PonsLink 회고 링크 배열이 제품 판단·WebRTC·요청 흐름 근거로 연결되어 있다.",
    ],
    knownLimits: [
      "현재 공개 포트폴리오에는 사용자 수, 전환율, 세션 성공률 같은 운영 metric을 주장하지 않는다.",
      "PonsLink 공개 repo 링크는 현재 포트폴리오 데이터에 없다. 따라서 code proof 대신 live URL과 writing proof를 우선 노출한다.",
      "실제 채용용 one-page resume 파일은 repo에서 확인되지 않아 Resume 링크를 만들지 않는다.",
    ],
    links: [
      { label: "PonsLink live", href: ponslink?.liveUrl ?? "https://ponslink.com", kind: "live" },
      { label: "왜 PonsLink가 시작됐는가", href: ponslinkRetrospectiveLinks[0].href, kind: "writing" },
      { label: "Request first 설계", href: "/writing/2026-06-18-ponslink-deep-dive-08-request-first", kind: "writing" },
      { label: "권한과 입장 경계", href: "/writing/2026-06-18-ponslink-deep-dive-09-payment-access", kind: "writing" },
    ],
  },
  {
    slug: "ponswarp",
    title: "PonsWarp case study",
    kicker: "Browser direct file transfer",
    summary:
      "큰 파일을 서버에 오래 보관하지 않고 브라우저 간 직접 전송하려는 WebRTC 기반 파일 전송 흐름을 설계한 작업.",
    projectProblem:
      ponswarp?.problem ?? "큰 파일 전송은 클라우드 업로드, 권한 설정, 삭제 확인 부담을 만든다.",
    constraints: [
      "대용량 파일은 서버 저장 비용, 삭제 신뢰, 권한 관리 부담을 동시에 만든다.",
      "WebRTC DataChannel은 파일 전송 제품이 아니라 바이트를 보낼 수 있는 길에 가깝다.",
      "브라우저 메모리, OPFS 저장, backpressure, 끊긴 전송 복구를 제품 흐름으로 설명해야 한다.",
    ],
    architecture: [
      {
        title: "No long-term server ownership",
        body: "서버가 파일을 오래 보관하는 구조를 기본값으로 두지 않고, 연결·권한·상태만 다루는 쪽으로 책임을 줄인다.",
      },
      {
        title: "Chunked transfer",
        body: "파일을 한 번에 밀어 넣지 않고 조각, 진행률, 재시도 단위로 나눠 브라우저가 버틸 수 있는 흐름으로 만든다.",
      },
      {
        title: "Backpressure and local safety net",
        body: "bufferedAmount, OPFS, partial file 처리를 함께 보며 빠른 전송보다 살아남는 전송을 우선한다.",
      },
    ],
    decisions: [
      {
        title: "업로드 UX보다 삭제 책임을 먼저 봄",
        body: "파일을 쉽게 올리는 것보다 서버가 파일을 얼마나 오래 책임지는지, 사용자가 삭제를 믿을 수 있는지가 더 큰 제품 질문이었다.",
      },
      {
        title: "실패를 화면 밖으로 숨기지 않음",
        body: "직접 연결 실패, relay 비용, interrupted transfer를 정상 제품 경로의 일부로 보고 recovery 흐름을 남긴다.",
      },
      {
        title: "Repo proof와 writing proof를 같이 둠",
        body: "PonsWarp는 공개 GitHub repo가 있어 구현 proof를, 회고 글은 판단 proof를 보완한다.",
      },
    ],
    rejected: [
      {
        title: "클라우드 업로드를 기본값으로 두기",
        body: "익숙하지만 서버가 파일을 소유하게 되고, 민감한 파일에서는 삭제와 보관 경계가 흐려진다.",
      },
      {
        title: "전송 성공률만 앞세우기",
        body: "relay를 많이 쓰면 성공률은 올라갈 수 있지만 비용, 지연, abuse 대응을 제품이 떠안게 된다.",
      },
    ],
    debuggingEvidence: [
      {
        title: "Backpressure는 성능 튜닝이 아니라 안전장치",
        body: "수신자가 처리하지 못하는 속도로 밀어 넣으면 전송률보다 먼저 브라우저 안정성이 깨진다.",
      },
      {
        title: "부분 전송은 예외가 아니라 UX 상태",
        body: "끊긴 파일을 어떻게 표시하고 버릴지, 이어받을지 결정하지 않으면 사용자는 성공/실패를 판단하지 못한다.",
      },
    ],
    verifiableEvidence: [
      "운영 URL이 공개되어 있다: https://warp.ponslink.com",
      "공개 GitHub repo가 연결되어 있다: https://github.com/DeclanJeon/PonsWarp",
      "PonsWarp 회고 링크 배열이 파일 전송 실패, backpressure, OPFS, recovery 판단으로 연결되어 있다.",
    ],
    knownLimits: [
      "현재 공개 포트폴리오에는 실제 전송 성공률, 평균 파일 크기, 사용자 수를 주장하지 않는다.",
      "TURN 사용량, 비용, relay fallback 비율은 측정값이 없으므로 metric으로 쓰지 않는다.",
      "운영 URL이 live인 것과 제품 성과 metric은 분리해서 표기한다.",
    ],
    links: [
      { label: "PonsWarp live", href: ponswarp?.liveUrl ?? "https://warp.ponslink.com", kind: "live" },
      { label: "PonsWarp GitHub", href: ponswarp?.repoUrl ?? "https://github.com/DeclanJeon/PonsWarp", kind: "repo" },
      { label: "서버가 파일을 갖지 않는 전송", href: ponswarpRetrospectiveLinks[1].href, kind: "writing" },
      { label: "Backpressure가 전송을 지키는 이유", href: "/writing/2026-06-29-ponswarp-04-backpressure-protects-transfer", kind: "writing" },
    ],
  },
] as const satisfies readonly PortfolioCaseStudy[]

export type PortfolioCaseStudySlug = (typeof portfolioCaseStudies)[number]["slug"]

export function getPortfolioCaseStudy(slug: string): PortfolioCaseStudy | null {
  return portfolioCaseStudies.find((study) => study.slug === slug) ?? null
}
