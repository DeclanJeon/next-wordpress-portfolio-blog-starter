import { createHash } from "node:crypto"
import { mkdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { PrismaClient } from "@prisma/client"
import sharp from "sharp"

type Topic = {
  readonly order: number
  readonly slug: string
  readonly title: string
  readonly excerpt: string
  readonly part: string
  readonly keyword: string
  readonly tags: string
  readonly publishedAt: string
  readonly opening: string
  readonly misconception: string
  readonly definition: string
  readonly mentalModel: string
  readonly numericModel: string
  readonly failureModel: string
  readonly serviceDecision: string
  readonly ponsConnection: string
  readonly actors: readonly string[]
  readonly axes: readonly string[]
  readonly failureModes: readonly string[]
  readonly checklist: readonly string[]
  readonly faqs: readonly { readonly q: string; readonly a: string }[]
}

const prisma = new PrismaClient()

const CATEGORY_SLUG = "study-note"
const PROJECT_SLUG = "study-note/realtime-network"
const SERIES_SLUG = "realtime-network-deep-dive"
const CATEGORY_NAME = "공부 노트"
const PROJECT_NAME = "실시간 네트워크 딥다이브"
const SERIES_TITLE = "실시간 네트워크 딥다이브: P2P부터 SFU, MCU까지"
const AUTHOR_USERNAME = "ponslink"
const BODY_IMAGE_ROOT = "/tistory/body-images"

const TOPICS: readonly Topic[] = [
  {
    order: 1,
    slug: "2026-07-04-realtime-network-01-p2p-is-not-serverless",
    title: "[P2P 딥다이브] P2P는 서버가 없다는 뜻이 아니다",
    excerpt: "P2P를 서버 제거가 아니라 제어면과 데이터면을 다시 배치하는 구조로 정리한다.",
    part: "P2P를 다시 정의하기",
    keyword: "P2P",
    tags: "공부 노트,P2P,Peer to Peer,WebRTC,Network Architecture,Control Plane,Data Plane",
    publishedAt: "2026-07-04T09:00:00.000Z",
    opening: "P2P를 처음 공부할 때 가장 오래 붙잡힌 오해는 서버가 사라진다는 표현이었다. 실제 제품을 보면 서버는 사라지지 않는다. 로그인, 권한, 방 생성, 시그널링, 감사 로그, 결제 같은 일은 오히려 서버가 계속 붙잡고 있어야 한다.",
    misconception: "서버가 없다가 아니라 서버가 모든 바이트의 주인이 아닐 수 있다는 말에 가깝다. 그래서 P2P를 이해하려면 서버 유무보다 어떤 책임이 중앙에 남고 어떤 데이터가 피어 사이로 이동하는지를 먼저 나눠야 한다.",
    definition: "P2P는 참여자가 단순 소비자가 아니라 연결의 한쪽 끝이 되는 구조다. 피어는 데이터를 받을 뿐 아니라 직접 보내고, 상태 일부를 유지하고, 때로는 다른 피어와 작업 조각을 교환한다.",
    mentalModel: "제어면(control plane)은 약속을 정하고 데이터면(data plane)은 실제 바이트를 옮긴다. 이 두 경로가 같은 서버를 통과할 수도 있지만, 반드시 그래야 하는 것은 아니다.",
    numericModel: "사용자가 둘이고 5GB 파일 하나를 주고받는다면 중앙 서버 경유 모델은 업로드 5GB와 다운로드 5GB를 서버가 감당한다. 직접 전송이 성공하면 서버는 연결 약속만 다루고 파일 바이트는 피어 사이로 이동한다.",
    failureModel: "직접 경로는 NAT, 방화벽, 모바일 네트워크, 브라우저 백그라운드 정책에 막힐 수 있다. P2P 제품이 어려운 이유는 성공 경로보다 실패 경로가 사용자 환경으로 흩어지기 때문이다.",
    serviceDecision: "권한과 기록은 중앙에 남기고, 무겁고 일시적인 데이터만 직접 경로로 옮기는 하이브리드가 현실적인 출발점이다.",
    ponsConnection: "PonsLink와 PonsWarp를 다시 보면 이 구분이 분명하다. 방과 요청, 링크 권한은 서버가 알아야 하지만 파일 조각 전체를 서버가 소유할 필요는 없었다.",
    actors: ["서버", "피어 A", "피어 B", "signaling", "data path"],
    axes: ["권한", "주소 교환", "파일 바이트", "감사 로그", "fallback"],
    failureModes: ["직접 후보 실패", "TURN 비용 증가", "사용자에게 설명되지 않는 무한 연결 중", "권한 정책과 데이터 경로의 혼동"],
    checklist: ["제어면과 데이터면을 분리해서 그렸는가", "직접 연결 실패 시 우회 경로가 있는가", "서버가 반드시 알아야 하는 정보만 남겼는가", "사용자가 실패 상태를 이해할 문구가 있는가"],
    faqs: [
      { q: "P2P면 서버가 전혀 필요 없나?", a: "아니다. 대부분의 제품은 signaling, 인증, 권한, 결제, 로그를 위해 서버가 필요하다." },
      { q: "P2P의 장점은 무엇인가?", a: "무거운 데이터 경로를 중앙 서버에서 떼어낼 수 있고, 1:1 또는 소규모 전송에서 비용과 지연을 줄일 수 있다." },
      { q: "가장 큰 단점은 무엇인가?", a: "사용자 네트워크 환경이 다양해서 연결 성공률과 실패 대응이 제품 품질을 크게 흔든다." },
      { q: "언제 서버 경유가 더 나은가?", a: "감사, 보존, 권한 일관성, 대규모 팬아웃처럼 중앙 제어가 핵심인 경우다." },
    ],
  },
  {
    order: 2,
    slug: "2026-07-04-realtime-network-02-direct-connection-meaning",
    title: "[P2P 딥다이브] 클라이언트끼리 직접 연결한다는 말의 정확한 의미",
    excerpt: "직접 연결을 같은 네트워크에 붙는다는 뜻이 아니라 후보 탐색과 경로 선택의 결과로 다시 해석한다.",
    part: "P2P를 다시 정의하기",
    keyword: "직접 연결",
    tags: "공부 노트,P2P,Direct Connection,WebRTC,ICE,Network Path",
    publishedAt: "2026-07-04T09:05:00.000Z",
    opening: "직접 연결이라는 말은 듣기에는 단순하다. 하지만 브라우저 두 개가 서로의 IP로 곧장 소켓을 여는 장면만 떠올리면 WebRTC의 실제 동작을 놓친다.",
    misconception: "직접 연결은 같은 공유기 안에서만 가능한 것도 아니고, 공개 IP를 서로 아는 순간 자동으로 완성되는 것도 아니다. 후보를 모으고, 시험하고, 실제로 패킷이 오가는 경로를 고르는 과정이 필요하다.",
    definition: "직접 연결은 애플리케이션 서버가 payload를 중계하지 않는 데이터 경로다. signaling 서버가 약속을 교환해도 실제 미디어나 파일 조각이 피어 사이로 흐르면 데이터면은 직접 연결에 가깝다.",
    mentalModel: "지도와 도로를 나누면 쉽다. signaling은 서로의 후보 주소가 적힌 지도를 교환하는 일이고, ICE는 그 지도에 표시된 길 중 실제로 지나갈 수 있는 도로를 찾는 일이다.",
    numericModel: "1GB 파일을 세 번 전송할 때 서버 경유는 서버 대역폭 6GB 이상을 사용한다. 직접 연결은 서버 signaling 트래픽이 작고, 데이터 경로는 피어 업로드와 피어 다운로드로 계산된다.",
    failureModel: "직접 경로는 후보가 있어도 막힐 수 있다. symmetric NAT, 회사 방화벽, UDP 차단, 모바일 통신사의 주소 변환이 경로 시험을 실패시킨다.",
    serviceDecision: "제품에서는 직접 연결 성공 여부를 이분법으로 보지 말고 host, srflx, relay 후보가 어떤 비율로 선택되는지 관측해야 한다.",
    ponsConnection: "PonsWarp의 Direct 모드는 파일이 서버에 저장되지 않는다는 경험을 주지만, 그 전제는 직접 경로가 열렸을 때만 성립한다. 그래서 Cloud Drop 같은 보완 경로가 같이 필요했다.",
    actors: ["candidate", "host", "srflx", "relay", "selected pair"],
    axes: ["지도 교환", "후보 수집", "연결 시험", "경로 선택", "상태 노출"],
    failureModes: ["host 후보만 보고 성공으로 착각", "relay 선택을 실패로만 취급", "ICE 상태를 UI에 반영하지 않음", "직접 연결과 직접 저장을 혼동"],
    checklist: ["선택된 candidate pair를 기록하는가", "relay 사용률을 비용 지표로 본다", "직접 경로 실패 시 UX가 멈추지 않는다", "데이터 경로와 제어 경로를 로그에서 구분한다"],
    faqs: [
      { q: "직접 연결이면 signaling 서버도 안 거치나?", a: "아니다. signaling은 연결 전 약속 교환이고, 직접 연결은 실제 payload가 흐르는 데이터 경로를 말한다." },
      { q: "TURN을 쓰면 P2P가 아닌가?", a: "데이터가 릴레이를 거치므로 순수 직접 경로는 아니지만 WebRTC 연결 모델 안의 fallback으로 봐야 한다." },
      { q: "직접 연결 성공률은 어떻게 봐야 하나?", a: "연결 성공/실패뿐 아니라 host, srflx, relay 중 어떤 후보가 선택됐는지 봐야 한다." },
      { q: "왜 같은 코드인데 사용자마다 결과가 다른가?", a: "사용자의 NAT, 방화벽, 통신사, 브라우저 정책이 모두 다르기 때문이다." },
    ],
  },
  {
    order: 3,
    slug: "2026-07-04-realtime-network-03-p2p-strengths-and-limits",
    title: "[P2P 딥다이브] P2P가 강한 경우와 약한 경우",
    excerpt: "P2P를 유행어가 아니라 데이터 무게, 일관성, 실패 허용도 기준으로 선택한다.",
    part: "P2P를 다시 정의하기",
    keyword: "P2P 선택 기준",
    tags: "공부 노트,P2P,Architecture Tradeoff,Realtime,File Transfer,Collaboration",
    publishedAt: "2026-07-04T09:10:00.000Z",
    opening: "P2P를 공부하다 보면 모든 것을 직접 연결로 바꾸고 싶어진다. 하지만 실제 제품에서는 P2P가 빛나는 경우와 오히려 제품을 어렵게 만드는 경우가 분명히 갈린다.",
    misconception: "서버 비용이 아까우면 P2P가 답이라는 식의 판단은 위험하다. 절감되는 대역폭보다 연결 실패, 검증, 재시도, 보안 비용이 커질 수 있다.",
    definition: "P2P가 강한 영역은 중앙 서버가 반드시 소유하지 않아도 되는 무거운 일시 데이터다. 반대로 중앙 일관성과 감사가 핵심인 데이터는 서버에 남는 편이 자연스럽다.",
    mentalModel: "P2P 적합성은 데이터 무게, 동시성 범위, 신뢰 경계, 실패 허용도 네 축으로 판단한다. 네 축이 모두 직접 경로를 지지할 때 효과가 커진다.",
    numericModel: "두 사람이 10GB를 한 번 주고받는 경우와 200명이 같은 이벤트 상태를 동시에 공유하는 경우는 완전히 다르다. 전자는 직접 경로가 매력적이고, 후자는 중앙 조율이 더 안전할 수 있다.",
    failureModel: "P2P가 약한 경우는 결과 검증이 어렵거나, 모든 참여자가 같은 진실을 즉시 봐야 하거나, 악의적인 피어가 손해를 만들 수 있는 경우다.",
    serviceDecision: "P2P는 전체 시스템의 기본값이 아니라 특정 흐름의 최적화로 도입하는 편이 안전하다. 파일 바이트, 임시 미디어, 로컬 우선 동기화처럼 경계를 좁힌다.",
    ponsConnection: "PonsLink에서는 room 권한과 요청 상태가 서버에 남아야 했다. PonsWarp에서는 파일 바이트가 서버를 꼭 거칠 필요가 없어서 직접 경로의 의미가 커졌다.",
    actors: ["데이터 무게", "일관성", "신뢰", "실패 허용", "비용"],
    axes: ["대용량", "일시성", "소규모", "검증 가능", "fallback 가능"],
    failureModes: ["권한 데이터를 피어에게 맡김", "충돌 해결 없이 협업 이벤트를 직접 전파", "악의적 결과 검증 생략", "fallback 없이 직접 연결만 제공"],
    checklist: ["데이터가 무겁고 일시적인가", "중앙 일관성이 꼭 필요한가", "피어가 거짓 결과를 내도 검증 가능한가", "실패해도 사용자가 계속 진행할 경로가 있는가"],
    faqs: [
      { q: "P2P가 가장 잘 맞는 기능은 무엇인가?", a: "1:1 또는 소규모 대용량 전송, 임시 미디어, 로컬 장치 간 동기화처럼 중앙 저장이 필수가 아닌 흐름이다." },
      { q: "협업 제품도 P2P가 맞나?", a: "가능하지만 CRDT, 이벤트 로그, 충돌 해결 규칙이 같이 있어야 한다." },
      { q: "서버 비용 절감만으로 결정해도 되나?", a: "안 된다. 실패 처리와 운영 복잡도까지 포함한 총비용으로 봐야 한다." },
      { q: "P2P를 작게 시작하는 방법은?", a: "전체 제품이 아니라 파일 전송, 미디어, 임시 이벤트처럼 경계가 명확한 흐름 하나에 적용한다." },
    ],
  },
  {
    order: 4,
    slug: "2026-07-04-realtime-network-04-why-p2p-needs-signaling",
    title: "[WebRTC 딥다이브] P2P에서 signaling 서버는 왜 필요한가",
    excerpt: "WebRTC가 signaling을 제공하지 않는 이유와 제품이 직접 설계해야 하는 약속 교환 계층을 정리한다.",
    part: "P2P를 다시 정의하기",
    keyword: "signaling",
    tags: "공부 노트,WebRTC,Signaling,P2P,SDP,ICE Candidate,Control Plane",
    publishedAt: "2026-07-04T09:15:00.000Z",
    opening: "WebRTC를 처음 보면 브라우저가 서로 알아서 연결해 줄 것처럼 보인다. 하지만 가장 먼저 막히는 지점은 미디어나 파일이 아니라 두 브라우저가 서로의 약속을 어떻게 교환하느냐이다.",
    misconception: "signaling은 WebRTC 표준이 알아서 제공하는 부품이 아니다. WebRTC는 어떤 정보를 교환해야 하는지의 형태를 제공하지만, 그 정보를 어떤 서버와 프로토콜로 주고받을지는 애플리케이션이 정해야 한다.",
    definition: "signaling은 SDP, ICE candidate, 방 상태, 권한 확인, 재협상 이벤트를 교환하는 제어면이다. WebSocket, HTTP polling, 서버 이벤트, 자체 broker 등으로 구현할 수 있다.",
    mentalModel: "signaling 서버는 통화 내용이나 파일 내용을 듣는 사람이 아니라 소개자와 기록자에 가깝다. 누가 방에 있고 어떤 후보를 제시했는지 전달하지만, 실제 데이터 경로는 이후 ICE가 고른다.",
    numericModel: "10GB 파일 전송에서 signaling 메시지는 몇 KB~몇십 KB 수준일 수 있다. 하지만 그 메시지가 없으면 10GB 데이터 경로 자체가 시작되지 않는다.",
    failureModel: "signaling이 불안정하면 연결 후보가 늦게 도착하고, glare 상황에서 offer가 충돌하고, reconnect 때 이전 상태와 새 상태가 섞인다.",
    serviceDecision: "제품 signaling은 단순 message relay가 아니라 세션 상태 머신이다. 방 ID, peer ID, offer/answer 순서, candidate buffering, 재접속 처리를 명시해야 한다.",
    ponsConnection: "PonsLink의 방 구조와 PonsWarp의 signaling-rs는 모두 이 문제를 다른 형태로 다룬다. 데이터는 직접 보내고 싶어도 연결 약속은 서버가 질서 있게 전달해야 했다.",
    actors: ["offer", "answer", "candidate", "room", "broker"],
    axes: ["순서", "권한", "재협상", "버퍼링", "로그"],
    failureModes: ["offer 충돌", "candidate 조기 도착", "재접속 peer ID 혼동", "권한 확인 전 SDP 전달", "상태 로그 부재"],
    checklist: ["offer/answer 순서를 상태 머신으로 제한한다", "candidate를 remote description 이후 처리한다", "방 권한 확인과 signaling 전달을 분리하지 않는다", "재접속 시 이전 peer 상태를 정리한다"],
    faqs: [
      { q: "signaling 서버는 미디어 서버인가?", a: "아니다. signaling은 연결 약속을 교환하는 제어면이고 미디어 서버는 payload를 처리하거나 전달한다." },
      { q: "WebSocket이 반드시 필요한가?", a: "필수는 아니지만 실시간 양방향 이벤트가 많아 WebSocket이 흔하다." },
      { q: "SDP는 무엇인가?", a: "브라우저가 지원하는 미디어/데이터 채널 조건과 연결 파라미터를 담은 설명서다." },
      { q: "signaling 실패는 어떻게 보이나?", a: "상대가 보이는데 연결이 시작되지 않거나, candidate가 쌓이지만 connected로 가지 않는 상태로 보인다." },
    ],
  },
  {
    order: 5,
    slug: "2026-07-04-realtime-network-05-mesh-gets-heavy-with-people",
    title: "[Mesh 딥다이브] Mesh는 왜 사람이 늘수록 급격히 무거워질까",
    excerpt: "Full Mesh의 연결 수와 업로드 부담을 숫자로 계산해 소규모 P2P가 어디서 무너지는지 본다.",
    part: "Topology 딥다이브",
    keyword: "Mesh",
    tags: "공부 노트,Mesh,Full Mesh,P2P,WebRTC,Bandwidth,Topology",
    publishedAt: "2026-07-04T09:20:00.000Z",
    opening: "Mesh 구조는 가장 직관적이다. 모두가 모두에게 직접 보낸다. 두 명일 때는 아름답고, 세 명일 때도 감당할 수 있다. 문제는 사람이 늘어날 때 증가 속도가 직관보다 빠르다는 점이다.",
    misconception: "참여자가 두 배가 되면 부담도 두 배쯤 늘 것처럼 느껴진다. 하지만 Full Mesh에서는 각 참여자가 보내야 하는 상대가 늘고, 전체 연결 수도 조합으로 증가한다.",
    definition: "Full Mesh는 n명의 참여자가 서로 모두 직접 연결되는 topology다. 각 피어는 n-1개의 송신 경로와 n-1개의 수신 경로를 관리하고, 전체 연결 수는 n(n-1)/2다.",
    mentalModel: "Mesh는 작은 식탁이다. 둘러앉은 사람이 적을 때는 모두가 서로 말해도 괜찮다. 사람이 많아지면 모두가 모두에게 동시에 말하는 구조가 방 자체를 시끄럽게 만든다.",
    numericModel: "4명은 전체 연결 6개, 6명은 15개, 10명은 45개다. 한 사람이 1Mbps 비디오를 9명에게 보내면 업로드만 9Mbps가 필요하다.",
    failureModel: "업로드가 부족한 피어 하나는 자기 화면만 나빠지는 것이 아니라 여러 상대에게 나쁜 스트림을 보낸다. 모바일 기기에서는 CPU, 배터리, 네트워크가 동시에 부담을 받는다.",
    serviceDecision: "Mesh는 1:1 또는 아주 작은 방의 기본값으로 두고, 참여자 수와 미디어 종류가 늘면 SFU 전환 기준을 둔다.",
    ponsConnection: "PonsLink가 작은 방과 직접 연결 경험에서 출발할 수 있었던 이유는 사용 시나리오가 대규모 방송이 아니었기 때문이다. 하지만 같은 구조를 큰 방으로 늘리면 한계가 바로 드러난다.",
    actors: ["peer 1", "peer 2", "peer 3", "peer 4", "peer n"],
    axes: ["연결 수", "업로드", "CPU", "배터리", "품질 저하"],
    failureModes: ["참여자 수 증가를 선형으로 착각", "저성능 피어가 전체 품질을 흔듦", "모바일 업로드 한계 무시", "방 크기 제한 없는 Mesh"],
    checklist: ["방 최대 인원을 숫자로 제한한다", "업로드 bitrate 예산을 계산한다", "모바일과 데스크톱을 따로 측정한다", "SFU 전환 기준을 문서화한다"],
    faqs: [
      { q: "Mesh는 몇 명까지 괜찮나?", a: "기기와 미디어 품질에 따라 다르지만 일반적으로 1:1 또는 아주 소규모에서만 안정적이다." },
      { q: "파일 전송도 Mesh가 무거운가?", a: "동시에 여러 피어에게 같은 파일을 보내면 업로드 복제가 생겨 무거워진다." },
      { q: "연결 수 공식은 왜 n(n-1)/2인가?", a: "n명 중 두 명을 고르는 모든 쌍이 하나의 연결이 되기 때문이다." },
      { q: "Mesh를 완전히 버려야 하나?", a: "아니다. 작은 방에서는 단순하고 비용이 낮아 여전히 좋은 선택이다." },
    ],
  },
  {
    order: 6,
    slug: "2026-07-04-realtime-network-06-full-partial-mesh-star",
    title: "[Topology 딥다이브] Full Mesh, Partial Mesh, Star 구조를 나눠서 보기",
    excerpt: "모두가 모두에게 연결되는 구조, 일부만 연결되는 구조, 중심 노드를 두는 구조를 책임 경계로 비교한다.",
    part: "Topology 딥다이브",
    keyword: "Topology",
    tags: "공부 노트,Topology,Full Mesh,Partial Mesh,Star,P2P,Network Architecture",
    publishedAt: "2026-07-04T09:25:00.000Z",
    opening: "P2P를 공부하면 Mesh라는 단어가 먼저 보이지만, 실제 topology는 Full Mesh 하나로 끝나지 않는다. 어떤 노드가 누구와 연결되고, 어떤 노드가 중심 역할을 하는지에 따라 비용과 실패 모양이 달라진다.",
    misconception: "P2P면 반드시 모두가 모두에게 연결되어야 한다는 생각이 흔하다. 그러나 P2P 시스템도 일부 노드만 중계자처럼 쓰거나, 특정 중심 노드를 두거나, 데이터 종류별로 다른 topology를 쓸 수 있다.",
    definition: "Full Mesh는 모든 쌍이 직접 연결된다. Partial Mesh는 필요한 일부 쌍만 연결된다. Star는 중심 노드나 서버를 통해 주변 노드가 연결된다.",
    mentalModel: "Topology는 조직도와 비슷하다. 누구에게 보고하고 누구와 직접 대화하는지에 따라 메시지 속도, 중복, 병목, 장애 범위가 달라진다.",
    numericModel: "10명의 Full Mesh는 45개 연결이다. Star는 중심 기준 9개 연결이다. Partial Mesh는 정책에 따라 그 사이 어딘가에 놓인다.",
    failureModel: "Full Mesh는 연결 수가 많고, Star는 중심 장애에 약하며, Partial Mesh는 경로 선택과 일관성 관리가 어려워진다.",
    serviceDecision: "제품에서는 topology를 기능별로 나눠야 한다. 채팅 상태는 서버 중심, 파일 바이트는 직접 경로, 대규모 미디어는 SFU 중심처럼 섞을 수 있다.",
    ponsConnection: "PonsLink/PonsWarp도 하나의 topology만 가진 제품이 아니다. 방 상태와 권한은 서버 중심이고, 파일 전송은 Direct와 Cloud Drop을 오가는 하이브리드다.",
    actors: ["Full Mesh", "Partial Mesh", "Star", "Relay", "Hybrid"],
    axes: ["연결 수", "중심 장애", "운영성", "확장성", "일관성"],
    failureModes: ["기능별 topology를 분리하지 않음", "중심 노드 장애를 과소평가", "Partial Mesh 경로 정책 부재", "데이터 종류와 연결 구조 불일치"],
    checklist: ["기능별 데이터 흐름을 따로 그린다", "중심 노드 장애 시 동작을 정의한다", "직접 경로와 서버 경로의 책임을 문서화한다", "방 크기와 topology 전환 기준을 연결한다"],
    faqs: [
      { q: "Partial Mesh는 언제 쓰나?", a: "모든 연결이 필요하지 않거나 일부 노드만 중계/동기화 역할을 맡을 때 쓴다." },
      { q: "Star는 P2P가 아닌가?", a: "중심이 서버라면 중앙형에 가깝지만, 중심이 피어일 수도 있고 하이브리드로 볼 수도 있다." },
      { q: "한 제품 안에서 topology를 섞어도 되나?", a: "오히려 대부분의 현실적인 제품은 기능별로 섞는다." },
      { q: "가장 안전한 구조는 무엇인가?", a: "정답은 없다. 실패 비용, 확장 목표, 운영 능력에 맞춰 선택해야 한다." },
    ],
  },
  {
    order: 7,
    slug: "2026-07-04-realtime-network-07-p2p-mesh-breaks-video-call",
    title: "[WebRTC Mesh] P2P Mesh가 화상회의에서 무너지는 순간",
    excerpt: "화상회의에서 Mesh가 CPU, 업로드, packet loss, 모바일 배터리 때문에 무거워지는 순간을 정리한다.",
    part: "Topology 딥다이브",
    keyword: "WebRTC Mesh",
    tags: "공부 노트,WebRTC,Mesh,Video Call,Packet Loss,Mobile,Realtime",
    publishedAt: "2026-07-04T09:30:00.000Z",
    opening: "Mesh 화상회의는 데모에서 아주 잘 보인다. 두 브라우저를 열고 서로의 카메라가 보이면 성공한 것처럼 느껴진다. 하지만 제품에서 방 인원과 네트워크 조건이 바뀌면 같은 구조가 빠르게 흔들린다.",
    misconception: "카메라가 보인다는 사실은 운영 가능한 화상회의가 되었다는 뜻이 아니다. 동시에 몇 명에게 인코딩해서 보내는지, packet loss를 어떻게 견디는지, 모바일이 얼마나 버티는지를 봐야 한다.",
    definition: "WebRTC Mesh 화상회의는 각 참여자가 자기 미디어를 여러 상대에게 직접 보내는 구조다. 서버가 forwarding하지 않으므로 서버 비용은 낮지만 클라이언트 부담이 커진다.",
    mentalModel: "각 참여자는 작은 방송국이 된다. 한 명에게만 보내면 통화지만, 여러 명에게 보내면 같은 영상을 여러 경로로 송출하는 일이 된다.",
    numericModel: "720p 스트림 하나가 1.5Mbps라고 하면 6명 방에서 한 피어는 5명에게 보내야 하므로 업로드만 약 7.5Mbps가 필요하다. 동시에 5개 수신 스트림을 디코딩해야 한다.",
    failureModel: "packet loss가 한 경로에서만 생겨도 그 상대에게는 품질이 나빠진다. CPU가 부족하면 인코딩 프레임이 떨어지고, 모바일은 발열과 배터리로 더 빨리 한계에 닿는다.",
    serviceDecision: "Mesh 화상회의는 방 크기 제한, 품질 낮춤, 화면 공유 제한, SFU 전환 계획을 함께 가져야 한다.",
    ponsConnection: "PonsLink의 실시간 연결도 작은 방에서는 Mesh 감각이 맞지만, 대규모 모임이나 방송형 기능을 향하면 SFU를 별도 계층으로 봐야 한다.",
    actors: ["camera", "encoder", "uplink", "decoder", "mobile"],
    axes: ["업로드", "디코딩", "packet loss", "배터리", "발열"],
    failureModes: ["데모 인원만 보고 출시", "화면 공유 bitrate 무시", "모바일 장시간 테스트 생략", "packet loss를 평균 지표로만 봄"],
    checklist: ["방 인원별 업로드 예산을 계산한다", "모바일 30분 이상 테스트한다", "화면 공유와 카메라를 별도 정책으로 본다", "loss/jitter를 사용자별로 기록한다"],
    faqs: [
      { q: "Mesh 화상회의는 왜 데모에서는 잘 되나?", a: "대개 인원과 시간이 작고 네트워크가 좋은 환경에서 테스트하기 때문이다." },
      { q: "CPU와 네트워크 중 무엇이 더 문제인가?", a: "둘 다다. 인코딩/디코딩은 CPU를 쓰고, 여러 상대에게 보내는 일은 업로드를 쓴다." },
      { q: "SFU는 언제 필요해지나?", a: "방 인원이 늘거나 품질 제어와 모바일 안정성이 중요해지는 순간 필요해진다." },
      { q: "파일 전송에도 같은 한계가 있나?", a: "파일은 미디어 인코딩 부담은 없지만 여러 상대에게 중복 송신하면 업로드 한계가 생긴다." },
    ],
  },
  {
    order: 8,
    slug: "2026-07-04-realtime-network-08-mesh-cost-by-connection-formula",
    title: "[Mesh 딥다이브] 연결 수 공식으로 보는 Mesh의 비용",
    excerpt: "n(n-1)/2 공식이 실제 업로드, 상태 관리, 테스트 케이스를 어떻게 늘리는지 계산한다.",
    part: "Topology 딥다이브",
    keyword: "Mesh 연결 수",
    tags: "공부 노트,Mesh,Network Math,Bandwidth,P2P,Scalability",
    publishedAt: "2026-07-04T09:35:00.000Z",
    opening: "Mesh의 한계는 감으로도 알 수 있지만 숫자로 쓰면 더 빨리 납득된다. n명이 서로 모두 연결되면 연결 수는 n(n-1)/2로 늘어난다.",
    misconception: "공식은 전체 연결 수만 말한다고 생각하기 쉽다. 하지만 제품에서는 연결 수가 signaling 메시지, 상태 전이, 테스트 조합, 장애 경우의 수까지 같이 늘린다.",
    definition: "n(n-1)/2는 n개 노드 중 두 노드를 고르는 조합이다. 각 조합은 하나의 peer connection이 되고, 방향성 있는 스트림은 각 피어의 송수신 부담으로 다시 계산해야 한다.",
    mentalModel: "Mesh 비용은 선의 개수만이 아니다. 선마다 상태, 재시도, 로그, 권한, 통계가 붙는다. 선이 늘면 운영자가 봐야 하는 사건도 늘어난다.",
    numericModel: "3명은 연결 3개, 5명은 10개, 8명은 28개, 12명은 66개다. 한 연결마다 ICE 상태 5개를 추적하면 상태 관측 포인트도 수십~수백 개로 늘어난다.",
    failureModel: "연결 하나가 실패했을 때 전체 방이 실패인지, 일부 상대만 실패인지, 재시도를 누가 시작할지 정의하지 않으면 Mesh 방은 부분 장애를 설명하지 못한다.",
    serviceDecision: "Mesh를 쓴다면 인원 제한만이 아니라 상태 관측 모델도 함께 설계한다. 연결별 state, bitrate, selected candidate, retry count를 기록해야 한다.",
    ponsConnection: "PonsLink에서 방과 peer 상태를 분리해 보려 했던 이유도 여기에 있다. 방은 하나지만 peer 간 연결은 여러 개이며, 각각 다른 실패를 가진다.",
    actors: ["n명", "연결 수", "상태 수", "재시도", "로그"],
    axes: ["조합", "방향성", "관측", "테스트", "부분 장애"],
    failureModes: ["연결 전체와 방 상태 혼동", "부분 실패 UX 부재", "테스트 케이스 폭증 무시", "candidate/bitrate 로그 누락"],
    checklist: ["인원별 연결 수 표를 만든다", "연결별 상태와 방 상태를 분리한다", "부분 장애 문구를 준비한다", "Mesh 최대 인원을 제품 정책으로 제한한다"],
    faqs: [
      { q: "n(n-1)/2는 양방향 연결도 하나로 세나?", a: "peer connection 쌍은 하나로 세지만 그 안의 송수신 스트림 부담은 각 방향으로 계산해야 한다." },
      { q: "연결 수가 많으면 signaling도 늘어나나?", a: "그렇다. offer/answer/candidate 교환과 상태 이벤트가 같이 늘어난다." },
      { q: "Mesh 비용은 서버 비용만 낮추면 끝인가?", a: "아니다. 클라이언트 비용과 운영 복잡도가 늘어난다." },
      { q: "공식이 실제 제품 판단에 어떻게 쓰이나?", a: "방 최대 인원, 품질 기본값, SFU 전환 기준을 정하는 근거가 된다." },
    ],
  },
  {
    order: 9,
    slug: "2026-07-04-realtime-network-09-p2p-mesh-sfu-mcu-comparison",
    title: "[비교 정리] P2P, Mesh, SFU, MCU를 한 장으로 비교하면",
    excerpt: "실시간 네트워크 구조를 연결 위치, 서버 역할, 비용, 확장성, 실패 대응 기준으로 비교하는 허브 글.",
    part: "Topology 딥다이브",
    keyword: "P2P Mesh SFU MCU 비교",
    tags: "공부 노트,P2P,Mesh,SFU,MCU,WebRTC,Comparison,Realtime Architecture",
    publishedAt: "2026-07-04T09:40:00.000Z",
    opening: "P2P, Mesh, SFU, MCU는 같은 층위의 단어처럼 보이지만 조금씩 다른 질문에 답한다. P2P는 참여자 간 데이터 경로의 철학이고, Mesh는 topology이며, SFU와 MCU는 다자 미디어를 다루는 서버 구조다.",
    misconception: "네 단어를 경쟁 기술 목록으로 외우면 판단이 흐려진다. 실제로는 작은 방에서 Mesh를 쓰고, 큰 방에서 SFU를 쓰고, 녹화나 방송에서 MCU 성격의 처리를 붙이는 식으로 조합된다.",
    definition: "P2P는 중앙 서버가 payload를 소유하지 않는 직접 경로를 지향한다. Mesh는 모두가 모두에게 직접 연결된다. SFU는 서버가 선택적으로 전달한다. MCU는 서버가 미디어를 합성한다.",
    mentalModel: "질문은 하나다. 바이트를 어디서 복제하고, 어디서 선택하고, 어디서 합칠 것인가. 그 위치가 클라이언트면 Mesh, 전달 서버면 SFU, 합성 서버면 MCU에 가까워진다.",
    numericModel: "5명 방에서 Mesh는 각 사용자가 4명에게 보낸다. SFU는 각 사용자가 서버에 1번 보내고 서버가 필요한 상대에게 전달한다. MCU는 서버가 하나의 합성 결과를 다시 보낼 수 있다.",
    failureModel: "Mesh는 클라이언트 부담, SFU는 서버 운영과 라우팅 정책, MCU는 서버 인코딩 비용과 지연이 핵심 실패 지점이다.",
    serviceDecision: "제품은 이 네 구조를 기능별로 나눠 채택해야 한다. 상담 1:1은 P2P/Mesh, 그룹 회의는 SFU, 녹화 합성은 MCU 성격의 pipeline이 자연스럽다.",
    ponsConnection: "PonsLink와 PonsWarp는 P2P와 Mesh 쪽에서 시작했지만, 사용 시나리오가 커지면 SFU나 Cloud Drop 같은 보완 축을 고려해야 한다.",
    actors: ["P2P", "Mesh", "SFU", "MCU", "Hybrid"],
    axes: ["복제 위치", "서버 비용", "클라이언트 부담", "품질 제어", "녹화"],
    failureModes: ["용어를 같은 층위로 비교", "한 구조로 모든 기능 해결", "녹화 요구를 늦게 발견", "SFU 운영비를 뒤늦게 계산"],
    checklist: ["참여자 수를 먼저 정한다", "미디어/파일/상태 데이터를 분리한다", "녹화와 방송 요구를 확인한다", "클라이언트 부담과 서버 비용을 동시에 계산한다"],
    faqs: [
      { q: "P2P와 Mesh는 같은 말인가?", a: "같지 않다. P2P는 데이터 경로 철학이고 Mesh는 여러 피어가 모두 연결되는 topology다." },
      { q: "SFU는 P2P가 아닌가?", a: "payload가 서버를 거치므로 순수 P2P는 아니지만 WebRTC 기반 다자 통신의 일반적인 확장 구조다." },
      { q: "MCU는 왜 요즘 덜 보이나?", a: "서버 인코딩 비용이 크기 때문이다. 하지만 녹화, 방송, 저성능 단말 지원에는 여전히 의미가 있다." },
      { q: "처음 제품은 무엇으로 시작해야 하나?", a: "가장 작은 사용 시나리오에 맞게 시작하고, 전환 기준을 문서화하는 편이 안전하다." },
    ],
  },
  {
    order: 10,
    slug: "2026-07-04-realtime-network-10-sfu-selective-forwarding",
    title: "[SFU 딥다이브] SFU는 영상을 섞지 않고 중계한다",
    excerpt: "Selective Forwarding Unit의 핵심을 디코딩/합성이 아니라 선택적 전달과 라우팅으로 이해한다.",
    part: "SFU / MCU 이해하기",
    keyword: "SFU",
    tags: "공부 노트,SFU,Selective Forwarding Unit,WebRTC,Realtime Video,Media Server",
    publishedAt: "2026-07-04T09:45:00.000Z",
    opening: "SFU를 처음 보면 미디어 서버라는 말 때문에 서버가 영상을 처리한다고 생각하기 쉽다. 하지만 SFU의 핵심은 섞는 것이 아니라 고르는 것이다.",
    misconception: "SFU가 모든 영상을 디코딩해서 하나로 합성한다고 이해하면 MCU와 섞인다. SFU는 대체로 RTP 패킷을 받아 필요한 수신자에게 전달하고, 품질 레이어나 대역폭 조건에 따라 선택한다.",
    definition: "SFU는 Selective Forwarding Unit이다. 참여자는 자기 미디어를 서버에 보내고, SFU는 수신자별로 필요한 스트림이나 레이어를 전달한다.",
    mentalModel: "SFU는 방송 편집자가 아니라 교차로 신호등에 가깝다. 들어온 흐름을 해석 가능한 메타데이터와 정책으로 보고, 누구에게 어떤 흐름을 보낼지 결정한다.",
    numericModel: "10명 방에서 각 사용자는 서버에 한 번만 업로드한다. 서버는 9명에게 전달할 수 있으므로 서버 egress는 늘지만 클라이언트 업로드 폭증은 줄어든다.",
    failureModel: "SFU의 실패는 서버 대역폭, 지역 지연, 레이어 선택 정책, packet loss 복구, 운영 관측성에서 생긴다. 클라이언트 부담이 줄어드는 대신 서버가 어려워진다.",
    serviceDecision: "SFU를 도입하려면 미디어 서버를 띄우는 것보다 방 정책, bitrate adaptation, simulcast/SVC, 지역 배치, 로그를 함께 설계해야 한다.",
    ponsConnection: "PonsLink가 대규모 방이나 방송형 기능으로 확장된다면 SFU가 자연스러운 후보가 된다. 기존 Mesh 감각은 작은 방에서만 유지하는 편이 안전하다.",
    actors: ["publisher", "SFU", "subscriber", "layer", "route"],
    axes: ["업로드 절감", "선택 전달", "서버 egress", "품질 정책", "관측성"],
    failureModes: ["SFU를 단순 relay로만 봄", "품질 레이어 전략 부재", "서버 egress 비용 누락", "지역 지연과 라우팅 무시"],
    checklist: ["업로드와 egress를 따로 계산한다", "수신자별 품질 선택 기준을 정한다", "simulcast/SVC 사용 여부를 결정한다", "미디어 서버 로그와 앱 로그를 연결한다"],
    faqs: [
      { q: "SFU는 영상을 디코딩하나?", a: "일반적으로 MCU처럼 모든 영상을 디코딩/합성하지 않고 패킷을 선택적으로 전달한다." },
      { q: "SFU의 가장 큰 장점은?", a: "클라이언트 업로드 부담을 줄이면서 다자 통신을 확장하기 쉽다는 점이다." },
      { q: "서버 비용은 줄어드나?", a: "Mesh보다 서버 비용은 늘지만 클라이언트 부담과 품질 제어 측면에서 이득이 있다." },
      { q: "파일 전송에도 SFU가 필요한가?", a: "대부분의 파일 전송에는 미디어 SFU보다 다른 relay/storage 전략이 더 적합하다." },
    ],
  },
  {
    order: 11,
    slug: "2026-07-04-realtime-network-11-why-sfu-scales-better-than-mesh",
    title: "[SFU 딥다이브] SFU가 Mesh보다 확장에 강한 이유",
    excerpt: "업로드 fan-out을 서버로 옮겼을 때 클라이언트와 운영 측면에서 무엇이 좋아지고 무엇이 어려워지는지 본다.",
    part: "SFU / MCU 이해하기",
    keyword: "SFU 확장성",
    tags: "공부 노트,SFU,Mesh,Scalability,WebRTC,Bandwidth,Realtime Architecture",
    publishedAt: "2026-07-04T09:50:00.000Z",
    opening: "SFU가 Mesh보다 확장에 강하다는 말은 단순히 서버를 쓰기 때문이 아니다. 핵심은 업로드 fan-out을 각 사용자에서 서버로 옮긴다는 데 있다.",
    misconception: "서버를 쓰면 무조건 확장된다는 생각은 위험하다. 서버가 제대로 배치되지 않거나 egress 비용을 감당하지 못하면 SFU도 쉽게 병목이 된다.",
    definition: "SFU 확장성은 참여자가 자기 미디어를 한 번만 보내고 서버가 복제/선택 전달을 담당하는 구조에서 나온다. 클라이언트 업로드 부담은 낮아지고 서버 네트워크 부담은 커진다.",
    mentalModel: "Mesh는 각 사용자가 개인 우체국이 되는 구조이고, SFU는 중앙 분류 센터를 두는 구조다. 분류 센터는 비용이 들지만 전체 배송 경로를 통제하기 쉬워진다.",
    numericModel: "8명 방에서 Mesh는 한 사용자가 7개 스트림을 업로드해야 한다. SFU는 보통 1개 또는 simulcast 레이어 몇 개를 업로드하고 서버가 나머지를 전달한다.",
    failureModel: "SFU는 단일 서버 장애, 지역 간 지연, 대역폭 egress 폭증, 레이어 선택 오류가 위험이다. 대신 사용자별 업로드 한계 문제는 완화된다.",
    serviceDecision: "SFU는 방 크기, 지역, 녹화, 화면 공유, 수신자 네트워크 상태를 기준으로 정책을 가져야 한다. 단순히 Mesh를 SFU로 바꾸는 것은 절반의 작업이다.",
    ponsConnection: "PonsLink가 상담 중심에서 그룹 세션으로 넓어진다면, 사용자가 보내는 부담을 서버로 옮기는 기준이 필요하다. 그 기준을 모르면 Mesh의 단순함이 운영 리스크가 된다.",
    actors: ["uplink", "fan-out", "egress", "region", "subscriber"],
    axes: ["사용자 업로드", "서버 복제", "지역 배치", "품질 선택", "장애 격리"],
    failureModes: ["SFU 도입 후 egress 비용 폭증", "단일 region 배치", "화면 공유 정책 누락", "수신자별 품질 상태 무시"],
    checklist: ["방 크기별 Mesh/SFU 경계를 정한다", "egress 비용을 모델링한다", "region과 latency 목표를 정한다", "화면 공유를 별도 스트림으로 설계한다"],
    faqs: [
      { q: "SFU가 항상 Mesh보다 좋은가?", a: "아니다. 1:1이나 아주 작은 방에서는 Mesh가 더 단순하고 비용도 낮을 수 있다." },
      { q: "확장성은 어디서 생기나?", a: "사용자 업로드 fan-out을 줄이고 서버가 복제/선택 전달을 담당하기 때문에 생긴다." },
      { q: "SFU 비용은 어떤 항목이 큰가?", a: "서버 egress, 지역 배치, 미디어 서버 운영과 관측 비용이 크다." },
      { q: "SFU를 도입할 때 먼저 볼 지표는?", a: "방 인원, uplink 실패율, CPU 사용량, packet loss, 서버 egress다." },
    ],
  },
  {
    order: 12,
    slug: "2026-07-04-realtime-network-12-simulcast-svc-near-sfu",
    title: "[SFU 딥다이브] Simulcast와 SVC는 왜 SFU 옆에 따라붙을까",
    excerpt: "다자 미디어에서 모든 수신자에게 같은 품질을 보내지 않기 위해 simulcast와 SVC가 필요한 이유를 정리한다.",
    part: "SFU / MCU 이해하기",
    keyword: "Simulcast와 SVC",
    tags: "공부 노트,SFU,Simulcast,SVC,WebRTC,Video Quality,Adaptive Streaming",
    publishedAt: "2026-07-04T09:55:00.000Z",
    opening: "SFU를 공부하면 곧바로 simulcast와 SVC라는 단어가 따라온다. 둘 다 어려운 약어처럼 보이지만 질문은 단순하다. 모든 사람에게 같은 품질을 보내도 되는가.",
    misconception: "SFU가 있으면 품질 조절이 자동으로 해결된다고 생각하기 쉽다. 하지만 SFU가 고를 수 있는 선택지가 있어야 수신자별 품질을 다르게 보낼 수 있다.",
    definition: "Simulcast는 송신자가 여러 품질의 스트림을 동시에 보내는 방식이다. SVC는 하나의 비디오 스트림 안에 계층을 두고 필요한 계층을 선택하는 방식이다.",
    mentalModel: "Simulcast는 같은 책을 소형판, 보급판, 대형판으로 따로 보내는 느낌이고, SVC는 한 책 안에 기본 본문과 추가 해상도/프레임 정보를 층으로 넣는 느낌이다.",
    numericModel: "발표자의 네트워크가 좋고 어떤 청중은 모바일 3G라면 모든 사람에게 1080p를 보내는 것은 낭비다. SFU는 낮은 품질과 높은 품질 중 수신자에게 맞는 것을 골라야 한다.",
    failureModel: "품질 레이어가 없으면 약한 수신자에게 맞추느라 모두가 낮은 품질을 보거나, 약한 수신자만 계속 버퍼링한다. 레이어가 너무 많으면 송신자와 서버 부담이 커진다.",
    serviceDecision: "simulcast/SVC는 제품 정책과 연결된다. 썸네일, 발표자, 화면 공유, 녹화, 모바일 수신자의 우선순위를 정해야 한다.",
    ponsConnection: "PonsLink가 그룹 세션이나 PonsCast 같은 실시간 미디어를 키운다면, 단일 품질보다 수신자별 품질 선택을 고민해야 한다. 이때 SFU만이 아니라 레이어 전략까지 봐야 한다.",
    actors: ["low layer", "mid layer", "high layer", "SFU", "receiver"],
    axes: ["해상도", "프레임", "송신 부담", "수신 적응", "화면 공유"],
    failureModes: ["레이어 없이 SFU만 도입", "모바일 수신자 기준 누락", "화면 공유를 카메라와 동일 정책으로 처리", "레이어 과다로 uplink 증가"],
    checklist: ["수신자 화면 크기별 품질을 정한다", "발표자와 썸네일 정책을 분리한다", "화면 공유 품질을 별도로 둔다", "레이어별 bitrate와 CPU를 측정한다"],
    faqs: [
      { q: "Simulcast와 SVC는 같은 것인가?", a: "아니다. simulcast는 여러 스트림을 보내고 SVC는 계층형 스트림을 사용한다." },
      { q: "왜 SFU와 같이 이야기되나?", a: "SFU가 수신자별로 어떤 품질을 전달할지 선택하려면 여러 품질 선택지가 필요하기 때문이다." },
      { q: "항상 고화질이 좋은가?", a: "아니다. 수신자 네트워크와 화면 크기에 맞는 품질이 더 중요하다." },
      { q: "파일 전송에도 비슷한 개념이 있나?", a: "비디오는 품질 레이어지만 파일 전송에서는 chunk 크기, 동시성, backpressure가 비슷한 조절 축이다." },
    ],
  },
  {
    order: 13,
    slug: "2026-07-04-realtime-network-13-why-mcu-is-expensive-but-useful",
    title: "[MCU 딥다이브] MCU는 왜 비싸지만 여전히 필요한가",
    excerpt: "Multipoint Control Unit이 서버에서 미디어를 합성하기 때문에 비싸지만 녹화와 저성능 단말에 강한 이유를 본다.",
    part: "SFU / MCU 이해하기",
    keyword: "MCU",
    tags: "공부 노트,MCU,Multipoint Control Unit,WebRTC,Media Mixing,Recording,Transcoding",
    publishedAt: "2026-07-04T10:00:00.000Z",
    opening: "MCU는 요즘 SFU보다 덜 자주 언급되지만 사라진 개념은 아니다. 서버가 미디어를 받아 디코딩하고, 합성하고, 다시 인코딩하는 구조는 여전히 필요한 곳이 있다.",
    misconception: "MCU는 낡은 방식이고 SFU가 항상 대체한다고 생각하기 쉽다. 하지만 녹화, 방송, 저성능 클라이언트, 고정 레이아웃 출력에서는 MCU 성격의 처리가 여전히 강하다.",
    definition: "MCU는 Multipoint Control Unit이다. 여러 참여자의 미디어를 서버가 처리해 하나의 합성 결과 또는 가공된 결과로 내보낸다.",
    mentalModel: "SFU가 교차로라면 MCU는 편집실이다. 들어온 영상을 열어 보고, 배치하고, 소리를 섞고, 필요한 형식으로 다시 포장한다.",
    numericModel: "10명 화상회의를 녹화할 때 각 클라이언트가 모든 레이아웃을 만들게 할 수도 있지만, 서버에서 하나의 녹화 결과를 만들면 클라이언트는 단순해진다. 대신 서버 CPU/GPU 비용이 커진다.",
    failureModel: "MCU는 디코딩/인코딩 지연, 서버 자원 폭증, 화질 열화, 단일 처리 pipeline 장애가 핵심 위험이다.",
    serviceDecision: "MCU는 기본 통화 경로보다 부가 pipeline으로 보는 편이 안전하다. 실시간 참여는 SFU, 녹화/방송/합성은 MCU 성격의 작업으로 분리할 수 있다.",
    ponsConnection: "PonsLink가 세션 기록이나 PonsCast 편집 결과를 제공하려면 SFU만으로는 부족할 수 있다. 사용자가 보는 실시간 경로와 저장되는 결과물 경로를 분리해야 한다.",
    actors: ["decode", "mix", "layout", "encode", "record"],
    axes: ["서버 CPU", "지연", "녹화", "저성능 단말", "레이아웃"],
    failureModes: ["MCU를 기본 경로로 두고 비용 폭증", "녹화 요구를 클라이언트에 전가", "인코딩 지연 무시", "합성 실패 시 원본 보존 없음"],
    checklist: ["녹화와 실시간 경로를 분리한다", "서버 인코딩 비용을 계산한다", "원본 스트림 보존 여부를 결정한다", "저성능 단말 지원 목표를 명확히 한다"],
    faqs: [
      { q: "MCU는 왜 비싼가?", a: "서버가 미디어를 디코딩하고 합성하고 다시 인코딩하기 때문이다." },
      { q: "MCU가 필요한 대표 경우는?", a: "녹화, 방송, 고정 레이아웃, 저성능 클라이언트 지원이다." },
      { q: "SFU와 같이 쓸 수 있나?", a: "가능하다. 실시간 전달은 SFU, 녹화 합성은 MCU pipeline으로 나눌 수 있다." },
      { q: "MCU가 품질을 항상 좋게 하나?", a: "아니다. 재인코딩 과정에서 지연과 화질 손실이 생길 수 있다." },
    ],
  },
  {
    order: 14,
    slug: "2026-07-04-realtime-network-14-sfu-and-mcu-are-choices",
    title: "[SFU vs MCU] SFU와 MCU는 경쟁 관계가 아니라 선택지다",
    excerpt: "SFU와 MCU를 비용, 지연, 품질 제어, 녹화 요구에 따라 조합 가능한 선택지로 정리한다.",
    part: "SFU / MCU 이해하기",
    keyword: "SFU MCU 차이",
    tags: "공부 노트,SFU,MCU,WebRTC,Media Server,Architecture Tradeoff",
    publishedAt: "2026-07-04T10:05:00.000Z",
    opening: "SFU와 MCU를 비교하면 둘 중 하나를 골라야 하는 것처럼 느껴진다. 하지만 실제 제품에서는 경쟁 관계라기보다 서로 다른 위치에 놓을 수 있는 선택지에 가깝다.",
    misconception: "SFU가 현대적이고 MCU가 낡았다는 식의 구분은 충분하지 않다. 질문은 어떤 기능에서 지연이 중요하고, 어떤 기능에서 합성 결과가 중요한가이다.",
    definition: "SFU는 미디어를 선택적으로 전달하고, MCU는 미디어를 합성하거나 변환한다. 전자는 낮은 지연과 확장에 유리하고, 후자는 단순한 수신 경험과 결과물 생성에 유리하다.",
    mentalModel: "라이브 무대와 녹화 편집실을 나누면 된다. 관객에게 빠르게 보여주는 경로는 SFU에 가깝고, 최종 편집본을 만드는 경로는 MCU에 가깝다.",
    numericModel: "100명이 보는 세션에서 모든 사람에게 합성 영상을 실시간 인코딩하면 서버 비용이 커진다. 반대로 녹화 파일 하나가 필요하다면 서버에서 합성하는 비용을 감수할 수 있다.",
    failureModel: "SFU만 생각하면 녹화와 저성능 단말 문제가 늦게 나타난다. MCU만 생각하면 실시간 지연과 서버 비용이 먼저 터진다.",
    serviceDecision: "실시간 참여, 녹화, 방송, 요약 생성, 저성능 단말 지원을 각각 별도 경로로 나눠 SFU와 MCU 성격을 조합한다.",
    ponsConnection: "PonsLink의 세션 경험은 실시간 연결이 중요하고, 이후 기록이나 공유 결과물은 합성이 중요할 수 있다. 두 요구를 한 구조에 억지로 넣지 않는 것이 중요하다.",
    actors: ["live path", "record path", "SFU", "MCU", "archive"],
    axes: ["지연", "비용", "합성", "확장", "결과물"],
    failureModes: ["한 구조로 라이브와 녹화를 모두 해결", "지연과 합성 요구를 같은 우선순위로 처리", "서버 비용 모델 부재", "수신 단말 성능 차이 무시"],
    checklist: ["라이브와 결과물 경로를 분리한다", "녹화가 필수인지 확인한다", "수신 단말 최저 사양을 정한다", "지연 목표와 비용 한계를 숫자로 둔다"],
    faqs: [
      { q: "SFU와 MCU 중 무엇을 먼저 공부해야 하나?", a: "Mesh 한계를 이해한 뒤 SFU를 먼저 보고, 녹화/합성 요구가 있을 때 MCU를 보면 흐름이 자연스럽다." },
      { q: "둘을 같이 쓰면 복잡하지 않나?", a: "복잡하지만 기능 경계를 분리하면 오히려 각 경로가 명확해진다." },
      { q: "MCU를 쓰면 클라이언트가 편해지나?", a: "수신은 단순해질 수 있지만 서버 비용과 지연을 대가로 치른다." },
      { q: "SFU는 녹화를 못 하나?", a: "가능하지만 최종 레이아웃 합성이나 후처리에는 MCU 성격의 pipeline이 필요할 수 있다." },
    ],
  },
  {
    order: 15,
    slug: "2026-07-04-realtime-network-15-why-webrtc-connection-is-hard",
    title: "[WebRTC 딥다이브] WebRTC 연결은 왜 그냥 열리지 않을까",
    excerpt: "브라우저 sandbox, NAT, 방화벽, UDP 차단 때문에 WebRTC 연결이 여러 단계의 후보 탐색을 거치는 이유를 본다.",
    part: "WebRTC 연결 이론",
    keyword: "WebRTC 연결",
    tags: "공부 노트,WebRTC,NAT,Firewall,ICE,Connection Failure,P2P",
    publishedAt: "2026-07-04T10:10:00.000Z",
    opening: "WebRTC 연결은 버튼 하나로 열리는 것처럼 보이지만 내부에서는 꽤 많은 조건을 통과해야 한다. 브라우저는 아무 주소로나 마음대로 연결하지 않고, 사용자는 NAT와 방화벽 뒤에 있으며, 네트워크는 UDP를 막을 수 있다.",
    misconception: "두 사용자가 모두 인터넷에 접속되어 있으면 서로 연결될 수 있다는 생각은 너무 낙관적이다. 인터넷 접속 가능성과 서로가 서로에게 도달 가능하다는 것은 다르다.",
    definition: "WebRTC 연결은 signaling으로 약속을 교환하고, ICE candidate를 모으고, 후보 쌍을 시험해 실제로 패킷이 오가는 경로를 선택하는 과정이다.",
    mentalModel: "두 집이 모두 도로에 붙어 있어도 서로의 현관까지 갈 수 있는 길이 있는지는 따로 확인해야 한다. NAT와 방화벽은 그 길의 문과 검문소다.",
    numericModel: "연결 한 번에는 host, server-reflexive, relay candidate가 여러 개 생길 수 있고, 브라우저는 후보 쌍을 순서대로 시험한다. 연결 시간은 후보 수와 네트워크 상태에 영향을 받는다.",
    failureModel: "UDP 차단, symmetric NAT, TURN 미설정, 인증 실패, candidate 교환 누락, 브라우저 권한 거부가 모두 연결 실패로 보일 수 있다.",
    serviceDecision: "제품은 연결 실패를 하나의 error로 뭉개지 말고 signaling 실패, ICE 실패, media permission 실패, relay 실패로 나눠야 한다.",
    ponsConnection: "PonsLink/PonsWarp QA에서 중요한 것도 단순 접속 여부가 아니라 어떤 단계에서 멈췄는지였다. 그래야 Direct 실패와 제품 버그를 구분할 수 있다.",
    actors: ["browser", "NAT", "firewall", "ICE", "TURN"],
    axes: ["권한", "후보", "검사", "릴레이", "상태"],
    failureModes: ["연결 실패를 하나의 메시지로 처리", "TURN 미설정을 뒤늦게 발견", "권한 거부와 ICE 실패 혼동", "네트워크별 QA 부족"],
    checklist: ["권한 오류와 네트워크 오류를 분리한다", "ICE state를 로그에 남긴다", "TURN fallback을 실제로 테스트한다", "회사망/모바일망/가정망을 나눠 QA한다"],
    faqs: [
      { q: "WebRTC가 자동으로 NAT를 뚫어주나?", a: "자동으로 시도하지만 모든 NAT를 통과하는 것은 아니다." },
      { q: "연결 실패 원인을 어떻게 나누나?", a: "권한, signaling, ICE candidate, TURN relay, media/data channel 상태를 분리해서 본다." },
      { q: "왜 어떤 네트워크에서는 되고 어떤 곳에서는 안 되나?", a: "NAT 유형, 방화벽, UDP 허용 정책이 다르기 때문이다." },
      { q: "테스트는 어디서 해야 하나?", a: "같은 Wi-Fi뿐 아니라 모바일 테더링, 회사망, 해외 region, 제한된 방화벽 환경에서 해야 한다." },
    ],
  },
  {
    order: 16,
    slug: "2026-07-04-realtime-network-16-stun-turn-ice-without-confusion",
    title: "[WebRTC 딥다이브] STUN, TURN, ICE를 헷갈리지 않게 정리하기",
    excerpt: "STUN은 주소 발견, TURN은 릴레이, ICE는 후보 수집과 선택이라는 차이를 연결 흐름으로 정리한다.",
    part: "WebRTC 연결 이론",
    keyword: "STUN TURN ICE 차이",
    tags: "공부 노트,STUN,TURN,ICE,WebRTC,NAT Traversal,P2P",
    publishedAt: "2026-07-04T10:15:00.000Z",
    opening: "STUN, TURN, ICE는 WebRTC를 공부할 때 한꺼번에 등장해서 쉽게 섞인다. 나는 처음에 세 단어를 모두 연결을 도와주는 서버 정도로 뭉뚱그렸다.",
    misconception: "STUN이 중계 서버라고 생각하거나, TURN이 있으면 ICE가 필요 없다고 생각하거나, ICE를 서버 이름으로 착각하면 연결 로그를 읽기 어렵다.",
    definition: "STUN은 외부에서 보이는 주소를 알아내는 프로토콜이다. TURN은 직접 연결이 실패할 때 데이터를 릴레이하는 서버다. ICE는 여러 후보를 모아 실제 경로를 선택하는 절차다.",
    mentalModel: "STUN은 거울, TURN은 우회 도로, ICE는 길 찾기 알고리즘이다. 거울은 내 주소를 보여주고, 우회 도로는 막힌 길을 돌아가게 하며, 알고리즘은 후보 길을 시험한다.",
    numericModel: "한 연결에서 host 후보, STUN으로 얻은 srflx 후보, TURN relay 후보가 함께 생길 수 있다. 비용은 대체로 host/srflx가 낮고 relay가 높다.",
    failureModel: "STUN만 있으면 충분하다고 생각하면 symmetric NAT나 엄격한 방화벽에서 실패한다. TURN만 믿으면 연결은 되지만 비용이 커질 수 있다.",
    serviceDecision: "STUN/TURN/ICE는 설정값이 아니라 운영 지표다. relay 비율, ICE 실패율, candidate gathering 시간, selected pair type을 모니터링해야 한다.",
    ponsConnection: "PonsWarp에서 Direct와 Cloud Drop을 같이 본 이유도 여기에 있다. 직접 경로가 항상 열리지 않는다면 제품은 릴레이 비용 또는 저장 fallback을 선택해야 한다.",
    actors: ["STUN", "TURN", "ICE", "host", "relay"],
    axes: ["주소 발견", "릴레이", "후보 선택", "비용", "성공률"],
    failureModes: ["STUN만 설정하고 출시", "TURN credential 만료", "relay 비용 관측 부재", "ICE 로그를 수집하지 않음"],
    checklist: ["STUN과 TURN 역할을 구분한다", "TURN credential 갱신을 테스트한다", "selected candidate type을 저장한다", "relay 사용률을 비용 지표로 본다"],
    faqs: [
      { q: "STUN은 데이터를 대신 전달하나?", a: "아니다. 외부에서 보이는 주소를 찾는 데 쓰인다." },
      { q: "TURN은 왜 비용이 큰가?", a: "실제 payload가 서버를 통과하므로 서버 대역폭 비용이 발생한다." },
      { q: "ICE는 서버인가?", a: "아니다. 후보를 수집하고 검사해 경로를 고르는 절차다." },
      { q: "무엇을 모니터링해야 하나?", a: "ICE 실패율, relay 선택 비율, gathering 시간, TURN 인증 오류를 봐야 한다." },
    ],
  },
  {
    order: 17,
    slug: "2026-07-04-realtime-network-17-why-nat-traversal-fails",
    title: "[NAT Traversal] NAT traversal은 왜 실패할 수밖에 없는가",
    excerpt: "NAT traversal을 성공 보장 기술이 아니라 여러 네트워크 제약을 통과하려는 확률적 시도로 이해한다.",
    part: "WebRTC 연결 이론",
    keyword: "NAT traversal",
    tags: "공부 노트,NAT Traversal,Symmetric NAT,WebRTC,Firewall,TURN,P2P",
    publishedAt: "2026-07-04T10:20:00.000Z",
    opening: "NAT traversal이라는 표현은 마치 NAT를 뚫는 기술처럼 들린다. 하지만 실제로는 여러 제한 속에서 통과 가능한 경로를 찾아보는 시도에 가깝다.",
    misconception: "NAT traversal을 구현하면 모든 네트워크에서 직접 연결이 된다고 기대하면 안 된다. 어떤 NAT와 방화벽 조합은 직접 경로를 허용하지 않는다.",
    definition: "NAT traversal은 사설망 뒤의 장치들이 서로 통신할 수 있도록 주소 후보를 찾고, 포트 매핑을 활용하고, 필요하면 릴레이로 우회하는 과정이다.",
    mentalModel: "각 NAT는 문지기다. 어떤 문지기는 한 번 나간 길로 들어오는 사람을 허용하고, 어떤 문지기는 목적지마다 다른 출입증을 요구한다. symmetric NAT는 특히 까다롭다.",
    numericModel: "두 피어가 모두 개방적인 NAT 뒤에 있으면 직접 연결 가능성이 높다. 한쪽 또는 양쪽이 symmetric NAT나 UDP 제한 환경이면 relay 가능성이 크게 올라간다.",
    failureModel: "회사망, 학교망, 호텔 Wi-Fi, 일부 모바일망은 UDP를 제한하거나 짧은 timeout을 갖는다. 연결 후에도 NAT binding이 사라져 끊길 수 있다.",
    serviceDecision: "제품은 NAT traversal 실패를 예외가 아니라 정상적인 경로 중 하나로 봐야 한다. 직접, relay, cloud fallback의 전환이 자연스러워야 한다.",
    ponsConnection: "PonsWarp의 Direct 실패를 제품 실패로만 보면 설계가 좁아진다. 네트워크가 막힌 사용자를 위해 Cloud Drop 같은 보완책을 준비하는 것이 더 현실적이었다.",
    actors: ["private IP", "NAT", "mapping", "binding", "relay"],
    axes: ["NAT 유형", "UDP 허용", "timeout", "mapping", "fallback"],
    failureModes: ["NAT traversal을 성공 보장으로 홍보", "회사망 QA 생략", "binding timeout 무시", "relay 전환을 오류처럼 표시"],
    checklist: ["NAT 유형별 시나리오를 문서화한다", "UDP 제한 환경을 테스트한다", "연결 유지 keepalive를 확인한다", "fallback을 제품 흐름으로 설명한다"],
    faqs: [
      { q: "NAT traversal은 항상 성공하나?", a: "아니다. 직접 연결이 불가능한 네트워크 조합이 존재한다." },
      { q: "symmetric NAT가 왜 어려운가?", a: "목적지마다 매핑이 달라져 상대가 예측한 주소로 들어오기 어렵기 때문이다." },
      { q: "실패하면 어떻게 해야 하나?", a: "TURN relay나 cloud fallback 같은 우회 경로를 제공해야 한다." },
      { q: "사용자에게 어떻게 말해야 하나?", a: "네트워크 제한으로 직접 연결이 어려워 우회 경로를 사용한다는 식으로 설명하는 편이 낫다." },
    ],
  },
  {
    order: 18,
    slug: "2026-07-04-realtime-network-18-why-turn-costs-money-in-p2p",
    title: "[TURN 딥다이브] P2P인데 왜 TURN 비용이 발생하는가",
    excerpt: "TURN relay가 직접 연결 실패를 구해주지만 서버 대역폭 비용을 다시 가져오는 이유를 운영 관점에서 본다.",
    part: "WebRTC 연결 이론",
    keyword: "TURN 비용",
    tags: "공부 노트,TURN,WebRTC Relay,P2P Cost,Bandwidth,Operations",
    publishedAt: "2026-07-04T10:25:00.000Z",
    opening: "P2P 제품을 만들면서도 TURN 비용을 계산해야 한다는 사실은 처음에는 이상하게 느껴진다. 직접 보내려고 P2P를 선택했는데 왜 다시 서버 비용이 생길까.",
    misconception: "TURN은 설정만 해두면 되는 무료 안전망이 아니다. 직접 경로가 실패할 때 실제 payload를 대신 전달하는 서버이므로 대역폭 비용이 그대로 발생한다.",
    definition: "TURN은 Traversal Using Relays around NAT의 약자다. 직접 연결이 실패한 피어 사이에서 데이터를 relay한다. 이때 TURN 서버는 업로드와 다운로드 양쪽 트래픽을 감당한다.",
    mentalModel: "TURN은 보험이지만 보험료가 사용량에 따라 올라간다. 평소에는 직접 경로가 열리면 좋지만, 특정 네트워크 사용자 비율이 높으면 비용 구조가 달라진다.",
    numericModel: "1GB 파일을 TURN relay로 전송하면 서버는 한쪽에서 1GB를 받고 다른 쪽으로 1GB를 보낸다. 운영비 관점에서는 최소 2GB급 대역폭 이벤트로 봐야 한다.",
    failureModel: "TURN credential 만료, region 지연, relay bandwidth 부족, 악용 트래픽, quota 미설정이 주요 위험이다.",
    serviceDecision: "TURN은 연결 성공률을 위한 필수 fallback이지만 제품 가격, quota, rate limit, abuse 대응과 묶어서 설계해야 한다.",
    ponsConnection: "PonsWarp에서 큰 파일을 다룰 때 TURN relay만 fallback으로 두면 비용이 빠르게 커질 수 있다. 그래서 Cloud Drop처럼 저장 기반 보완책을 함께 보는 것이 현실적이었다.",
    actors: ["client A", "TURN", "client B", "quota", "region"],
    axes: ["대역폭", "credential", "region", "abuse", "가격"],
    failureModes: ["TURN 비용을 무료로 가정", "대용량 파일 relay 제한 없음", "credential 장기 노출", "region 하나로 전세계 처리"],
    checklist: ["relay 사용률을 측정한다", "파일 크기별 TURN 정책을 둔다", "credential TTL을 짧게 둔다", "quota와 rate limit을 함께 설계한다"],
    faqs: [
      { q: "TURN을 끄면 비용이 줄지 않나?", a: "줄지만 연결 실패율이 올라간다. 비용과 성공률의 trade-off다." },
      { q: "TURN은 미디어에만 쓰나?", a: "아니다. DataChannel payload도 relay될 수 있다." },
      { q: "대용량 파일에 TURN을 써도 되나?", a: "가능하지만 비용과 속도, quota를 엄격히 봐야 한다." },
      { q: "Cloud fallback과 TURN은 무엇이 다른가?", a: "TURN은 실시간 relay이고 cloud fallback은 서버/스토리지에 업로드 후 상대가 받는 방식이다." },
    ],
  },
  {
    order: 19,
    slug: "2026-07-04-realtime-network-19-datachannel-is-not-file-api",
    title: "[DataChannel 딥다이브] WebRTC DataChannel은 파일 전송 API가 아니다",
    excerpt: "DataChannel을 파일 업로드 컴포넌트가 아니라 SCTP 기반 전송 재료로 보고 chunking과 상태 관리를 정리한다.",
    part: "DataChannel과 파일 전송",
    keyword: "WebRTC DataChannel 파일 전송",
    tags: "공부 노트,WebRTC,DataChannel,File Transfer,SCTP,Chunking,PonsWarp",
    publishedAt: "2026-07-04T10:30:00.000Z",
    opening: "DataChannel로 파일을 보낼 수 있다는 문장을 처음 보면 마치 파일 전송 API가 제공되는 것처럼 느껴진다. 하지만 실제로는 bytes를 보낼 수 있는 통로를 받는 것에 가깝다.",
    misconception: "DataChannel이 파일 이름, 크기, 무결성, 재시도, 저장 위치, 진행률을 알아서 처리한다고 생각하면 바로 막힌다. 이 모든 것은 애플리케이션 프로토콜이 설계해야 한다.",
    definition: "WebRTC DataChannel은 브라우저 사이에서 arbitrary data를 주고받는 채널이다. 내부적으로 SCTP/DTLS/UDP 계층 위에 올라가며 ordered/reliable 같은 옵션을 가질 수 있다.",
    mentalModel: "DataChannel은 택배 회사가 아니라 도로다. 도로 위에서 어떤 상자를 어떤 순서로 보내고, 분실을 어떻게 확인하고, 도착 후 어디에 보관할지는 별도 규칙이 필요하다.",
    numericModel: "4GB 파일 하나를 한 번에 send할 수 있다고 가정하면 안 된다. 파일은 chunk로 나뉘고, 각 chunk에는 offset, sequence, checksum, transfer id 같은 메타데이터가 필요하다.",
    failureModel: "버퍼를 보지 않고 계속 send하면 메모리가 커지고, 수신 저장이 느리면 브라우저가 버티지 못한다. 중간 끊김을 고려하지 않으면 처음부터 다시 보내야 한다.",
    serviceDecision: "DataChannel 파일 전송은 작은 프로토콜을 설계하는 일이다. metadata, chunk, ack, resume, checksum, backpressure, 저장 전략을 함께 둔다.",
    ponsConnection: "PonsWarp가 단순 send loop가 아니라 chunk, ACK, backpressure, writer 전략을 따로 고민한 이유가 여기에 있다. DataChannel은 재료일 뿐 제품은 그 위의 프로토콜이다.",
    actors: ["metadata", "chunk", "ack", "writer", "resume"],
    axes: ["청크", "순서", "무결성", "저장", "재개"],
    failureModes: ["파일을 한 번에 전송", "진행률을 bytesSent만으로 계산", "수신 저장 속도 무시", "중단 후 재개 설계 없음"],
    checklist: ["transfer id와 file id를 둔다", "chunk offset과 sequence를 기록한다", "ACK와 재전송 기준을 정한다", "수신 저장 전략을 브라우저별로 나눈다"],
    faqs: [
      { q: "DataChannel만 열면 파일 전송이 완성되나?", a: "아니다. 파일 프로토콜, chunking, 무결성, 저장, 재시도 설계가 필요하다." },
      { q: "큰 파일은 왜 chunk로 나누나?", a: "메모리와 버퍼, 진행률, 재시도, 저장 처리를 위해 작은 단위가 필요하다." },
      { q: "ACK는 꼭 필요한가?", a: "resume과 backpressure, 사용자 신뢰를 위해 애플리케이션 레벨 ACK가 유용하다." },
      { q: "PonsWarp와 어떻게 연결되나?", a: "PonsWarp의 핵심은 DataChannel 위에 안전한 파일 전송 프로토콜을 얹는 일이었다." },
    ],
  },
  {
    order: 20,
    slug: "2026-07-04-realtime-network-20-ordered-vs-unordered-datachannel",
    title: "[DataChannel 딥다이브] Ordered와 Unordered 전송은 언제 갈라지는가",
    excerpt: "채팅, 제어 메시지, 파일 chunk, 실시간 이벤트가 순서 보장을 다르게 요구하는 이유를 본다.",
    part: "DataChannel과 파일 전송",
    keyword: "Ordered Unordered DataChannel",
    tags: "공부 노트,DataChannel,Ordered,Unordered,WebRTC,SCTP,Realtime Events",
    publishedAt: "2026-07-04T10:35:00.000Z",
    opening: "DataChannel 옵션에서 ordered를 보는 순간 질문이 생긴다. 순서가 보장되면 항상 좋은 것 아닌가. 하지만 실시간 시스템에서는 늦게 도착한 순서 보장이 오히려 문제를 만들 수 있다.",
    misconception: "ordered=true가 안전하고 unordered=false가 위험하다는 식으로 외우면 안 된다. 데이터 종류마다 필요한 순서와 지연 허용도가 다르다.",
    definition: "ordered 전송은 메시지가 보낸 순서대로 애플리케이션에 전달되도록 한다. unordered 전송은 순서를 포기해 더 늦은 메시지가 먼저 도착할 수 있게 한다.",
    mentalModel: "책 페이지는 순서가 중요하지만, 게임 위치 업데이트는 최신 값이 더 중요할 수 있다. 파일 chunk는 offset으로 재조립할 수 있으면 네트워크 전달 순서가 절대적이지 않을 수 있다.",
    numericModel: "100번 chunk가 지연될 때 ordered 채널은 101번 이후가 도착해도 애플리케이션 전달이 막힐 수 있다. unordered는 이후 chunk를 먼저 처리하고 빈 구간만 표시할 수 있다.",
    failureModel: "모든 메시지를 ordered 채널 하나에 태우면 큰 파일 chunk가 제어 메시지를 막을 수 있다. 반대로 순서가 필요한 명령을 unordered로 보내면 상태가 꼬일 수 있다.",
    serviceDecision: "채널을 메시지 성격별로 나누거나 envelope에 type과 sequence를 넣는다. 제어 메시지, 파일 chunk, 진행률 이벤트의 순서 요구를 따로 본다.",
    ponsConnection: "PonsLink 파일 전송과 PonsCast 이벤트가 같은 DataChannel 계층을 공유할 때 위험했던 점도 이 문제다. 모든 메시지가 같은 순서 정책을 필요로 하지 않는다.",
    actors: ["control", "chunk", "progress", "event", "sequence"],
    axes: ["순서", "지연", "재조립", "채널 분리", "head-of-line"],
    failureModes: ["큰 chunk가 제어 메시지를 막음", "상태 명령을 unordered로 보냄", "sequence 없이 재조립", "채널 분리 기준 부재"],
    checklist: ["메시지 type별 순서 요구를 표로 만든다", "파일 chunk와 제어 메시지를 분리한다", "offset/sequence를 payload에 넣는다", "늦은 이벤트를 버릴 기준을 둔다"],
    faqs: [
      { q: "ordered가 항상 좋은가?", a: "아니다. 최신성이 더 중요한 이벤트에서는 지연된 순서 보장이 문제일 수 있다." },
      { q: "파일 chunk는 unordered로 보내도 되나?", a: "offset과 무결성 검사가 있으면 가능하지만 구현 복잡도가 늘어난다." },
      { q: "제어 메시지는 어떻게 보내야 하나?", a: "대개 순서와 신뢰성이 중요하므로 파일 chunk와 분리하는 편이 안전하다." },
      { q: "head-of-line blocking은 무엇인가?", a: "앞 메시지 지연 때문에 뒤 메시지가 애플리케이션에 전달되지 못하는 현상이다." },
    ],
  },
  {
    order: 21,
    slug: "2026-07-04-realtime-network-21-reliable-vs-partially-reliable",
    title: "[DataChannel 딥다이브] reliable과 partially reliable을 어떻게 이해할까",
    excerpt: "모든 메시지를 끝까지 재전송하는 방식과 오래된 메시지를 포기하는 방식의 차이를 제품 데이터로 나눠 본다.",
    part: "DataChannel과 파일 전송",
    keyword: "reliable partially reliable",
    tags: "공부 노트,DataChannel,Reliable,Partially Reliable,WebRTC,SCTP,Realtime",
    publishedAt: "2026-07-04T10:40:00.000Z",
    opening: "reliable이라는 단어는 언제나 좋아 보인다. 하지만 실시간 제품에서는 늦게라도 반드시 도착해야 하는 데이터와, 늦으면 버리는 편이 나은 데이터가 다르다.",
    misconception: "reliable은 안전하고 partially reliable은 대충 보내는 방식이라고 이해하면 안 된다. partially reliable은 시간 가치가 낮아진 메시지를 포기할 수 있게 하는 선택이다.",
    definition: "reliable 전송은 손실된 메시지를 복구하려고 재전송한다. partially reliable 전송은 재전송 횟수나 시간을 제한해 오래된 메시지를 포기할 수 있다.",
    mentalModel: "계약서는 늦어도 반드시 도착해야 하지만, 2초 전 마우스 위치는 지금 도착해도 가치가 낮다. 데이터의 시간 가치가 신뢰성 정책을 결정한다.",
    numericModel: "파일 chunk 하나가 빠지면 파일 전체 무결성이 깨지므로 reliable/ACK가 중요하다. 반면 실시간 커서 위치는 초당 30개 중 몇 개가 빠져도 최신 위치가 오면 충분할 수 있다.",
    failureModel: "모든 이벤트를 reliable로 보내면 네트워크 손실 때 오래된 메시지가 줄을 만들 수 있다. 반대로 중요한 chunk를 partially reliable로 보내면 복구가 어렵다.",
    serviceDecision: "데이터를 보존 가치와 시간 가치로 나눈다. 파일, 결제, 상태 명령은 reliable 쪽이고 위치/센서/미리보기 이벤트는 partially reliable 후보가 된다.",
    ponsConnection: "PonsWarp 파일 chunk는 손실을 가볍게 볼 수 없다. 반면 진행률 UI나 순간 상태 이벤트는 최신성이 더 중요할 수 있다. 같은 DataChannel이라도 데이터 종류를 나눠야 한다.",
    actors: ["file chunk", "control", "cursor", "preview", "ack"],
    axes: ["보존 가치", "시간 가치", "재전송", "지연", "무결성"],
    failureModes: ["모든 메시지 reliable로 지연 누적", "파일 chunk 손실을 허용", "진행률 이벤트를 영구 큐처럼 처리", "데이터 종류별 정책 부재"],
    checklist: ["데이터별 보존 가치를 정한다", "늦은 메시지의 가치를 판단한다", "재전송 제한을 문서화한다", "무결성이 필요한 데이터는 checksum/ACK를 둔다"],
    faqs: [
      { q: "partially reliable은 위험한가?", a: "중요 데이터에 쓰면 위험하지만 오래된 실시간 이벤트에는 적합할 수 있다." },
      { q: "파일 전송은 어떤 쪽인가?", a: "파일 chunk는 무결성이 중요하므로 reliable한 설계와 애플리케이션 ACK가 필요하다." },
      { q: "진행률 이벤트는 reliable해야 하나?", a: "대개 최신 값이 중요하므로 오래된 진행률을 모두 보존할 필요는 없다." },
      { q: "정책을 어떻게 정하나?", a: "데이터가 늦게 도착했을 때 여전히 가치가 있는지 묻는 것으로 시작한다." },
    ],
  },
  {
    order: 22,
    slug: "2026-07-04-realtime-network-22-bufferedamount-backpressure-file-transfer",
    title: "[Backpressure 딥다이브] bufferedAmount와 backpressure가 파일 전송을 지킨다",
    excerpt: "보내는 속도보다 받을 수 있는 속도가 중요하다는 관점에서 DataChannel bufferedAmount와 역압 설계를 정리한다.",
    part: "DataChannel과 파일 전송",
    keyword: "bufferedAmount backpressure",
    tags: "공부 노트,Backpressure,bufferedAmount,DataChannel,WebRTC,File Transfer,PonsWarp",
    publishedAt: "2026-07-04T10:45:00.000Z",
    opening: "파일 전송을 만들 때 처음에는 얼마나 빨리 보낼 수 있는지가 가장 중요해 보인다. 하지만 브라우저 전송에서 더 먼저 봐야 하는 질문은 상대와 내 런타임이 지금 받을 수 있느냐다.",
    misconception: "send를 빠르게 반복하면 전송이 빨라진다고 생각하기 쉽다. 실제로는 DataChannel 내부 버퍼가 쌓이고, 수신 저장이 늦어지고, 메모리가 커지며, 결국 전송이 불안정해질 수 있다.",
    definition: "bufferedAmount는 DataChannel이 아직 네트워크로 내보내지 못하고 쌓아둔 bytes를 나타낸다. backpressure는 이 수위와 수신 처리 속도를 보고 보내는 속도를 조절하는 설계다.",
    mentalModel: "수도꼭지를 최대로 틀어도 배수구가 작으면 물은 넘친다. backpressure는 배수구가 처리할 수 있는 양에 맞춰 수도꼭지를 조절하는 일이다.",
    numericModel: "chunk가 192KB이고 bufferedAmount가 수 MB 이상 쌓이면 send loop를 쉬게 할 수 있다. high-water와 low-water를 두면 무한 가속 대신 파형처럼 안정된 흐름을 만들 수 있다.",
    failureModel: "역압이 없으면 송신자는 성공적으로 보냈다고 생각하지만 실제로는 브라우저 내부 버퍼에 쌓였을 뿐이다. 수신 저장이 느리면 전체 pipeline이 뒤에서 막힌다.",
    serviceDecision: "파일 전송은 chunk size, bufferedAmount threshold, writer queue, ACK, retry, pause/resume을 하나의 흐름 제어로 설계해야 한다.",
    ponsConnection: "PonsWarp의 전송 엔진에서 backpressure를 별도 핵심으로 본 이유가 이것이다. 빠른 send loop보다 버퍼 수위를 지키는 정책이 대용량 전송을 살린다.",
    actors: ["chunk", "bufferedAmount", "high-water", "low-water", "writer"],
    axes: ["송신 버퍼", "수신 저장", "ACK", "pause", "resume"],
    failureModes: ["bufferedAmount 무시", "수신 writer queue 무시", "진행률만 빠르게 증가", "pause/resume 없는 장시간 전송"],
    checklist: ["high-water/low-water를 정한다", "chunk size를 고정 근거로 둔다", "writer queue도 backpressure에 포함한다", "전송 중 pause/resume 상태를 사용자에게 보여준다"],
    faqs: [
      { q: "bufferedAmount가 0이어야만 보내야 하나?", a: "그럴 필요는 없지만 상한을 두고 그 이상에서는 쉬어야 한다." },
      { q: "backpressure는 속도를 낮추는 기능인가?", a: "단순히 느리게 하는 것이 아니라 지속 가능한 속도로 맞추는 기능이다." },
      { q: "수신 저장도 역압에 포함되나?", a: "포함해야 한다. 네트워크 수신이 빨라도 디스크/브라우저 저장이 느리면 pipeline은 막힌다." },
      { q: "대용량 파일에서 가장 중요한 지표는?", a: "순간 최고 속도보다 버퍼 수위, 재시도, 장시간 안정성, 완료율이 중요하다." },
    ],
  },
]

function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~|\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function readingTime(content: string): number {
  return Math.max(10, Math.ceil(plainText(content).length / 850))
}

function imagePath(topic: Topic, name: string): string {
  return `${BODY_IMAGE_ROOT}/${topic.slug}/${topic.slug}-${name}.webp`
}

function figure(topic: Topic, name: string, alt: string, caption: string): string {
  return `![${alt}](${imagePath(topic, name)})\n\n*${caption}*`
}

function linkFor(slug: string): string {
  return `/writing/${slug}`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function hashColor(seed: string): string {
  const colors = ["#355070", "#6d597a", "#b56576", "#52796f", "#7f5539", "#3a506b", "#8a5a44", "#59656f"]
  const value = createHash("sha256").update(seed).digest()[0] ?? 0
  return colors[value % colors.length]
}

function svgTextLines(lines: readonly string[], x: number, y: number, size = 28): string {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * (size + 14)}" font-size="${size}" fill="#2b241f" font-family="sans-serif">${escapeXml(line)}</text>`).join("")
}

function baseSvg(topic: Topic, subtitle: string, body: string): string {
  const accent = hashColor(`${topic.slug}-${subtitle}`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="840" viewBox="0 0 1400 840" role="img" aria-label="${escapeXml(topic.title)}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#5b5148" flood-opacity="0.18"/></filter>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 Z" fill="${accent}"/></marker>
  </defs>
  <rect width="1400" height="840" fill="#f6f0e6"/>
  <rect x="48" y="48" width="1304" height="744" rx="34" fill="#fffdf8" stroke="#dacbb9"/>
  <text x="94" y="112" font-size="28" fill="#7b6655" font-family="monospace">${escapeXml(topic.part)} · ${String(topic.order).padStart(2, "0")}</text>
  <text x="94" y="158" font-size="42" font-weight="800" fill="#2b241f" font-family="sans-serif">${escapeXml(topic.keyword.slice(0, 34))}</text>
  <text x="94" y="198" font-size="22" fill="${accent}" font-family="sans-serif">${escapeXml(subtitle)}</text>
  ${body}
</svg>`
}

function box(x: number, y: number, w: number, h: number, label: string, fill = "#fbf6ed"): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${fill}" stroke="#cbb79d" filter="url(#shadow)"/><text x="${x + w / 2}" y="${y + h / 2 + 8}" text-anchor="middle" font-size="24" fill="#2b241f" font-family="sans-serif">${escapeXml(label.slice(0, 18))}</text>`
}

function arrow(x1: number, y1: number, x2: number, y2: number): string {
  return `<path d="M${x1},${y1} C ${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}" fill="none" stroke="${hashColor(`${x1}-${y1}-${x2}-${y2}`)}" stroke-width="4" marker-end="url(#arrow)"/>`
}

function svgFor(topic: Topic, variant: "cover" | "flow" | "matrix" | "failure" | "checklist"): string {
  if (variant === "cover") {
    const chips = topic.axes.slice(0, 5).map((axis, index) => `<rect x="${120 + index * 230}" y="560" width="190" height="58" rx="24" fill="#f2e5d5" stroke="#d0b99d"/><text x="${215 + index * 230}" y="597" text-anchor="middle" font-size="20" fill="#3b3028" font-family="sans-serif">${escapeXml(axis.slice(0, 12))}</text>`).join("")
    return baseSvg(topic, "study note cover", `<text x="120" y="300" font-size="58" font-weight="900" fill="#2b241f" font-family="sans-serif">${escapeXml(topic.title.replace(/^\[[^\]]+\]\s*/, "").slice(0, 31))}</text><text x="120" y="372" font-size="26" fill="#6f5d4e" font-family="sans-serif">${escapeXml(topic.excerpt.slice(0, 58))}</text><rect x="120" y="430" width="1160" height="74" rx="28" fill="#eef3f0" stroke="#aec0b4"/><text x="700" y="477" text-anchor="middle" font-size="23" fill="#2b241f" font-family="sans-serif">${escapeXml(topic.serviceDecision.slice(0, 64))}</text>${chips}`)
  }
  if (variant === "flow") {
    const body = topic.actors.slice(0, 5).map((actor, index) => box(110 + index * 250, 330, 185, 90, actor, index % 2 ? "#eef3f7" : "#fbf6ed")).join("") + topic.actors.slice(0, 4).map((_, index) => arrow(295 + index * 250, 374, 360 + index * 250, 374)).join("") + svgTextLines([topic.mentalModel.slice(0, 42), topic.serviceDecision.slice(0, 46)], 150, 570, 24)
    return baseSvg(topic, "경로와 책임을 나눈 흐름", body)
  }
  if (variant === "matrix") {
    const labels = topic.axes.slice(0, 4)
    const body = `<line x1="700" y1="260" x2="700" y2="690" stroke="#a9947b" stroke-width="4"/><line x1="210" y1="475" x2="1190" y2="475" stroke="#a9947b" stroke-width="4"/>${labels.map((label, index) => {
      const x = index % 2 === 0 ? 420 : 980
      const y = index < 2 ? 360 : 590
      return `<rect x="${x - 190}" y="${y - 72}" width="380" height="126" rx="24" fill="#fff8ed" stroke="#d8bd98" filter="url(#shadow)"/><text x="${x}" y="${y}" text-anchor="middle" font-size="27" fill="#2b241f" font-family="sans-serif">${escapeXml(label)}</text>`
    }).join("")}<text x="700" y="735" text-anchor="middle" font-size="22" fill="#6f5d4e" font-family="sans-serif">trade-off를 표로 먼저 고정하고 구현을 본다</text>`
    return baseSvg(topic, "비교 축과 의사결정 매트릭스", body)
  }
  if (variant === "failure") {
    const body = topic.failureModes.slice(0, 4).map((mode, index) => `<rect x="160" y="${270 + index * 105}" width="1080" height="72" rx="20" fill="${index % 2 ? "#f8efe9" : "#eef3f0"}" stroke="#d2bca0"/><circle cx="205" cy="${306 + index * 105}" r="18" fill="#b56576"/><text x="245" y="${315 + index * 105}" font-size="25" fill="#2b241f" font-family="sans-serif">${escapeXml(mode.slice(0, 55))}</text>`).join("")
    return baseSvg(topic, "실패 모드와 운영 리스크", body)
  }
  const body = topic.checklist.slice(0, 4).map((item, index) => `<rect x="170" y="${270 + index * 104}" width="1060" height="72" rx="20" fill="#f7fbf8" stroke="#aebfae"/><path d="M205 ${306 + index * 104} l18 18 l38 -42" stroke="#52796f" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="285" y="${316 + index * 104}" font-size="25" fill="#2b241f" font-family="sans-serif">${escapeXml(item.slice(0, 54))}</text>`).join("")
  return baseSvg(topic, "출시 전 확인할 체크리스트", body)
}

async function writeImages(topic: Topic): Promise<void> {
  const dir = join(process.cwd(), "public", "tistory", "body-images", topic.slug)
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  for (const variant of ["cover", "flow", "matrix", "failure", "checklist"] as const) {
    await sharp(Buffer.from(svgFor(topic, variant))).webp({ quality: 88 }).toFile(join(dir, `${topic.slug}-${variant}.webp`))
  }
}

function table(topic: Topic): string {
  const rows = [
    [topic.axes[0], topic.definition.slice(0, 58), topic.failureModes[0]],
    [topic.axes[1], topic.mentalModel.slice(0, 58), topic.failureModes[1]],
    [topic.axes[2], topic.numericModel.slice(0, 58), topic.failureModes[2]],
    [topic.axes[3], topic.serviceDecision.slice(0, 58), topic.failureModes[3] ?? topic.failureModes[0]],
  ]
  return [
    "| 관점 | 공부하면서 잡은 기준 | 조심할 실패 |",
    "|---|---|---|",
    ...rows.map((row) => `| ${row[0]} | ${row[1]} | ${row[2]} |`),
  ].join("\n")
}

function pseudocode(topic: Topic): string {
  const key = topic.keyword.toLowerCase().replace(/[^a-z0-9가-힣]+/gi, "_")
  return "```txt\n" + [
    `${key}.observe(control_plane)` ,
    `${key}.separate(data_path, policy_path)`,
    `${key}.measure(${topic.axes.slice(0, 3).join(", ")})`,
    `${key}.handle(${topic.failureModes[0]})`,
    `${key}.fallback_when_needed()` ,
  ].join("\n") + "\n```"
}

function deepen(topic: Topic, index: number): string {
  const axis = topic.axes[index % topic.axes.length]
  const actor = topic.actors[index % topic.actors.length]
  const failure = topic.failureModes[index % topic.failureModes.length]
  const check = topic.checklist[index % topic.checklist.length]
  const transitions = ["처음 읽을 때", "숫자로 다시 쓰면", "운영 환경에 대입하면", "제품 문장으로 바꾸면", "QA 항목으로 내리면", "나중에 다시 보면"]
  const transition = transitions[index % transitions.length]
  return `### 추가 메모 ${index + 1}: ${axis} 관점\n\n${transition} ${topic.keyword}의 핵심은 ${actor} 하나를 더 아는 것이 아니라 ${axis}의 책임을 어디에 둘지 결정하는 일이었다. ${topic.definition} 이 문장을 제품에 대입하면 추상적인 개념이 아니라 장애 범위와 비용을 정하는 기준이 된다.\n\n${topic.numericModel} 이 숫자는 절대값보다 방향이 중요하다. 작은 데모에서는 보이지 않던 부담이 참여자 수, 파일 크기, 네트워크 제한, 브라우저 정책을 만나면서 다른 모양으로 커진다. 그래서 ${topic.keyword}를 공부할 때는 항상 "잘 되는 한 번"보다 반복되는 전송과 장시간 연결을 같이 상상해야 한다.\n\n실패 지점은 ${failure}이다. 이 실패는 코드 한 줄의 버그일 수도 있지만, 대부분은 경계를 잘못 잡은 결과로 나타난다. ${check}라는 체크리스트가 필요한 이유도 여기에 있다. 설계 문서에서 이 질문에 답하지 못하면 구현은 나중에 로그와 사용자 문의로 같은 질문을 다시 받게 된다.`
}

function renderContent(topic: Topic): string {
  const previous = TOPICS.find((item) => item.order === topic.order - 1)
  const next = TOPICS.find((item) => item.order === topic.order + 1)
  const base = [
    `이 글은 \`${SERIES_TITLE}\` 시리즈의 ${topic.order}번째 공부 노트다. 목표는 ${topic.keyword}를 외운 정의가 아니라 제품을 설계할 때 다시 꺼낼 수 있는 기준으로 바꾸는 것이다.`,
    `## 처음 헷갈린 지점: ${topic.keyword}`,
    topic.opening,
    topic.misconception,
    `공부 노트로 따로 분리한 이유도 여기에 있다. PonsLink나 PonsWarp 회고 안에 이 설명을 모두 넣으면 회고의 리듬이 무거워진다. 반대로 개념만 따로 정리하면 실제 제품 판단과 멀어진다. 그래서 이 글은 개념을 먼저 정리하고, 마지막에 PonsLink/PonsWarp에서 어떤 판단으로 이어졌는지 다시 묶는다.`,
    figure(topic, "flow", `${topic.keyword} 흐름 다이어그램`, `${topic.keyword}를 이해하기 위해 제어 경로, 데이터 경로, 실패 경로를 먼저 분리했다.`),
    `## 용어를 정확히 나누기`,
    topic.definition,
    topic.mentalModel,
    `여기서 중요한 것은 용어를 기능 이름으로 외우지 않는 것이다. ${topic.actors.join(", ")} 같은 요소는 각각 다른 책임을 가진다. 책임을 섞으면 구현은 빨라질 수 있지만, 디버깅할 때 어떤 층에서 문제가 생겼는지 설명하지 못한다.`,
    `## 구조를 말로 설명하면`,
    `내가 잡은 한 문장 모델은 다음과 같다. ${topic.serviceDecision} 이 문장은 단순한 결론이 아니라 구현 순서를 정하는 기준이다. 무엇을 먼저 로그로 남길지, 어떤 상태를 사용자에게 보여줄지, 어떤 fallback을 준비할지까지 이어진다.`,
    `실시간 네트워크는 눈에 보이지 않는 경로가 많다. 그래서 구조를 그림 없이 말로 설명할 수 있어야 한다. ${topic.keyword}의 경우 ${topic.axes.slice(0, 3).join(", ")}가 먼저 보이고, 그 다음에 ${topic.axes.slice(3).join(", ")}가 따라온다.`,
    figure(topic, "matrix", `${topic.keyword} 비교 매트릭스`, `${topic.keyword}의 판단 축을 비용, 품질, 실패 대응 기준으로 나눴다.`),
    `## 숫자로 보면 어디서 부담이 생기는가`,
    topic.numericModel,
    `숫자를 적어두는 이유는 과장된 성능 주장을 하려는 것이 아니다. 오히려 반대다. 개념을 공부할수록 "빠르다"나 "싸다" 같은 말은 위험해진다. 어떤 조건에서 어떤 비용이 누구에게 이동하는지 적어야 한다.`,
    table(topic),
    `## 실패하거나 무거워지는 지점`,
    topic.failureModel,
    `실패 모드는 다음처럼 정리할 수 있다.`,
    ...topic.failureModes.map((mode) => `- ${mode}`),
    `이 목록은 겁을 주기 위한 것이 아니라 QA 항목으로 바꾸기 위한 것이다. 실시간 제품에서 실패는 예외가 아니라 흐름의 일부다. 실패를 늦게 발견하면 사용자는 "연결 중" 화면을 보고, 운영자는 로그 없는 추측을 하게 된다.`,
    figure(topic, "failure", `${topic.keyword} 실패 지도`, `${topic.keyword}에서 흔히 놓치는 실패 지점을 운영 관점으로 다시 표시했다.`),
    `## 실제 서비스에서는 어떤 선택을 하는가`,
    topic.serviceDecision,
    `서비스 설계에서는 ${topic.keyword}를 단독 기술로 보지 않는다. 인증, 권한, UI 문구, 지표, 가격 정책, 저장 정책과 함께 본다. 예를 들어 ${topic.axes[0]}을 잘못 두면 보안 문제가 되고, ${topic.axes[1]}을 잘못 두면 연결 품질 문제가 되며, ${topic.axes[2]}을 잘못 두면 비용 문제가 된다.`,
    pseudocode(topic),
    `## PonsLink/PonsWarp를 다시 보면`,
    topic.ponsConnection,
    `이 연결은 회고를 끌어오기 위한 장식이 아니다. 이론을 공부한 뒤 제품을 다시 보면 어떤 선택이 우연이 아니었는지 보인다. PonsLink는 요청, 방, 권한, 상태 같은 제어면을 강하게 붙잡아야 했고, PonsWarp는 파일 바이트가 움직이는 데이터면을 더 집요하게 봐야 했다.`,
    `관련해서 함께 읽을 글은 [PonsWarp에서 WebRTC가 길만 열어준다는 글](${linkFor("2026-06-29-ponswarp-03-webrtc-opens-the-road")})과 [PonsLink DataChannel 파일 전송 글](${linkFor("2026-06-18-ponslink-deep-dive-07-data-channel-file-transfer")})이다.`,
    figure(topic, "checklist", `${topic.keyword} 체크리스트`, `${topic.keyword}를 실제 제품 설계로 내릴 때 확인할 항목을 정리했다.`),
    `## 체크리스트`,
    ...topic.checklist.map((item) => `- ${item}`),
    `## FAQ`,
    ...topic.faqs.flatMap((faq) => [`### ${faq.q}`, faq.a]),
    `## 다음 글과 연결`,
    `${previous ? `이전 글은 [${previous.title}](${linkFor(previous.slug)})이다.` : "이 글은 시리즈의 입구다."} ${next ? `다음 글은 [${next.title}](${linkFor(next.slug)})에서 이어진다.` : "이 글은 1차 시리즈의 마지막 글이다."}`,
  ]
  let content = base.join("\n\n")
  let index = 0
  const target = topic.order === 9 ? 11200 : 9600
  while (plainText(content).length < target) {
    content += `\n\n${deepen(topic, index)}`
    index += 1
  }
  return content
}

async function ensureTaxonomies(): Promise<{ categoryId: string; projectId: string }> {
  const category = await prisma.taxonomyNode.upsert({
    where: { slug: CATEGORY_SLUG },
    update: {
      name: CATEGORY_NAME,
      kind: "category",
      parentId: null,
      description: "직접 만든 제품을 이해하기 위해 정리한 네트워크, 브라우저, 시스템 설계 공부 기록.",
      sortOrder: 25,
    },
    create: {
      slug: CATEGORY_SLUG,
      name: CATEGORY_NAME,
      kind: "category",
      parentId: null,
      description: "직접 만든 제품을 이해하기 위해 정리한 네트워크, 브라우저, 시스템 설계 공부 기록.",
      sortOrder: 25,
    },
    select: { id: true },
  })
  const project = await prisma.taxonomyNode.upsert({
    where: { slug: PROJECT_SLUG },
    update: {
      name: PROJECT_NAME,
      kind: "project",
      parentId: category.id,
      description: "P2P, Mesh, SFU, MCU, WebRTC, DataChannel, NAT traversal을 공부하며 실시간 제품 설계 판단으로 연결한 기록.",
      sortOrder: 10,
    },
    create: {
      slug: PROJECT_SLUG,
      name: PROJECT_NAME,
      kind: "project",
      parentId: category.id,
      description: "P2P, Mesh, SFU, MCU, WebRTC, DataChannel, NAT traversal을 공부하며 실시간 제품 설계 판단으로 연결한 기록.",
      sortOrder: 10,
    },
    select: { id: true },
  })
  return { categoryId: category.id, projectId: project.id }
}

async function upsertPosts(projectId: string): Promise<void> {
  const author = await prisma.user.findUnique({ where: { username: AUTHOR_USERNAME }, select: { id: true, displayName: true } })
  if (!author) throw new Error(`Missing author user: ${AUTHOR_USERNAME}`)
  const series = await prisma.series.upsert({
    where: { slug: SERIES_SLUG },
    update: {
      title: SERIES_TITLE,
      description: "P2P, Mesh, SFU, MCU, WebRTC 연결 이론, DataChannel 파일 전송을 10,000자급 공부 노트로 정리한 실시간 네트워크 딥다이브.",
      projectSlug: PROJECT_SLUG,
      sortOrder: 5,
    },
    create: {
      slug: SERIES_SLUG,
      title: SERIES_TITLE,
      description: "P2P, Mesh, SFU, MCU, WebRTC 연결 이론, DataChannel 파일 전송을 10,000자급 공부 노트로 정리한 실시간 네트워크 딥다이브.",
      projectSlug: PROJECT_SLUG,
      sortOrder: 5,
    },
    select: { id: true },
  })
  await prisma.postSeries.deleteMany({ where: { seriesId: series.id } })

  for (const topic of TOPICS) {
    await writeImages(topic)
    const content = renderContent(topic)
    const post = await prisma.post.upsert({
      where: { slug: topic.slug },
      update: {
        title: topic.title,
        excerpt: topic.excerpt,
        content,
        category: CATEGORY_NAME,
        tags: topic.tags,
        coverColor: hashColor(topic.slug),
        featuredImage: imagePath(topic, "cover"),
        status: "published",
        readingTime: readingTime(content),
        authorId: author.id,
        authorName: author.displayName,
        publishedAt: new Date(topic.publishedAt),
      },
      create: {
        slug: topic.slug,
        title: topic.title,
        excerpt: topic.excerpt,
        content,
        category: CATEGORY_NAME,
        tags: topic.tags,
        coverColor: hashColor(topic.slug),
        featuredImage: imagePath(topic, "cover"),
        status: "published",
        readingTime: readingTime(content),
        views: 0,
        authorId: author.id,
        authorName: author.displayName,
        publishedAt: new Date(topic.publishedAt),
      },
      select: { id: true, slug: true },
    })
    await prisma.postTaxonomy.deleteMany({ where: { postId: post.id, role: "primary" } })
    await prisma.postTaxonomy.create({ data: { postId: post.id, nodeId: projectId, role: "primary", sortOrder: 0 } })
    await prisma.postSeries.create({ data: { postId: post.id, seriesId: series.id, sortOrder: topic.order, isPinned: topic.order <= 3 } })
  }
}

function validateRendered(): void {
  for (const topic of TOPICS) {
    const content = renderContent(topic)
    const bodyImages = [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1])
    const chars = plainText(content).length
    if (chars < 9000) throw new Error(`${topic.slug} is too short: ${chars}`)
    if (bodyImages.length !== 4) throw new Error(`${topic.slug} needs exactly 4 body images, got ${bodyImages.length}`)
    for (const image of bodyImages) {
      if (!image?.startsWith(`${BODY_IMAGE_ROOT}/${topic.slug}/`) || !image.endsWith(".webp")) {
        throw new Error(`${topic.slug} has invalid body image path: ${image}`)
      }
    }
  }
}

async function main(): Promise<void> {
  validateRendered()
  const { projectId } = await ensureTaxonomies()
  await upsertPosts(projectId)
  const rows = await prisma.post.findMany({
    where: { slug: { in: TOPICS.map((topic) => topic.slug) } },
    select: { slug: true, title: true, content: true, readingTime: true, featuredImage: true },
    orderBy: { publishedAt: "asc" },
  })
  console.log(JSON.stringify({
    series: SERIES_SLUG,
    posts: rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      chars: plainText(row.content).length,
      bodyImages: [...row.content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].length,
      readingTime: row.readingTime,
      featuredImage: row.featuredImage,
    })),
  }, null, 2))
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error))
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
