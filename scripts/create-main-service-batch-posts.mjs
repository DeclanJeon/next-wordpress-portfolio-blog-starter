import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

function resolveSqliteFileUrl(rawUrl) {
  if (!rawUrl || !rawUrl.startsWith('file:')) return null
  const value = rawUrl.slice('file:'.length)
  if (!value || value.startsWith('..')) return null
  return path.resolve(process.cwd(), value)
}

function assertLocalDatabaseTarget() {
  const expected = path.resolve(process.cwd(), 'db', 'custom.db')
  const actual = resolveSqliteFileUrl(process.env.DATABASE_URL)

  if (actual !== expected) {
    throw new Error(
      `Refusing to write blog posts outside the local DB. Expected DATABASE_URL=file:${expected}, received ${process.env.DATABASE_URL || '<unset>'}.`,
    )
  }

  if (!fs.existsSync(expected)) {
    throw new Error(`Local DB does not exist: ${expected}`)
  }
}

assertLocalDatabaseTarget()

const prisma = new PrismaClient()
const OUT_DIR = path.join(process.cwd(), 'public', 'tistory', 'main-services')
const DIAGRAM_DIR = path.join(OUT_DIR, 'diagrams')
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(DIAGRAM_DIR, { recursive: true })

function estimateReadingTime(content) {
  let codeLineCount = 0
  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, (block) => {
    const lines = block.split(/\r?\n/)
    codeLineCount += Math.max(0, lines.length - 2)
    return ' '
  })
  const text = withoutCodeBlocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~>#|\-[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const korean = (text.match(/[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7af\ud7b0-\ud7ff\u3040-\u30ff\u4e00-\u9fff]/g) || []).length
  const latin = (text.match(/\b[A-Za-z][A-Za-z0-9'’.-]*\b/g) || []).length
  return Math.max(1, Math.ceil(korean / 550 + latin / 220 + codeLineCount / 20))
}

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function writeCover(post, index) {
  const file = path.join(OUT_DIR, `${post.slug}.svg`)
  const accent = post.accent
  const secondary = post.secondary
  const nodes = post.coverNodes.map((node, i) => {
    const x = 135 + i * 215
    const y = i % 2 === 0 ? 300 : 455
    return `<g><circle cx="${x}" cy="${y}" r="54" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.5)"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="22" fill="#fff" font-family="Inter, Arial, sans-serif">${esc(node)}</text></g>`
  }).join('\n')
  const lines = post.coverNodes.slice(1).map((_, i) => {
    const x1 = 135 + i * 215
    const y1 = i % 2 === 0 ? 300 : 455
    const x2 = 135 + (i + 1) * 215
    const y2 = (i + 1) % 2 === 0 ? 300 : 455
    return `<path d="M ${x1 + 58} ${y1} C ${x1 + 118} ${y1 - 80}, ${x2 - 118} ${y2 + 80}, ${x2 - 58} ${y2}" fill="none" stroke="rgba(255,255,255,0.38)" stroke-width="4" stroke-linecap="round"/>`
  }).join('\n')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${secondary}"/></linearGradient>
    <radialGradient id="glow" cx="75%" cy="20%" r="70%"><stop offset="0" stop-color="rgba(255,255,255,0.34)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>
  </defs>
  <rect width="1200" height="630" rx="42" fill="url(#bg)"/>
  <rect width="1200" height="630" rx="42" fill="url(#glow)"/>
  <path d="M0 535 C240 470 355 620 590 548 C790 486 929 435 1200 510 L1200 630 L0 630 Z" fill="rgba(0,0,0,0.18)"/>
  <text x="72" y="96" font-size="24" fill="rgba(255,255,255,0.72)" font-family="Inter, Arial, sans-serif">Portfolio Blog · Main Services ${String(index).padStart(2, '0')}</text>
  <text x="72" y="168" font-size="56" font-weight="800" fill="#fff" font-family="Inter, Arial, sans-serif">${esc(post.coverTitle)}</text>
  <text x="72" y="220" font-size="28" fill="rgba(255,255,255,0.82)" font-family="Inter, Arial, sans-serif">${esc(post.coverSubtitle)}</text>
  ${lines}
  ${nodes}
</svg>`
  fs.writeFileSync(file, svg)
  return `/tistory/main-services/${post.slug}.svg`
}

function writeDiagram(post) {
  if (!post.diagram) return ''
  const file = path.join(DIAGRAM_DIR, `${post.slug}-diagram.svg`)
  const width = 980
  const height = 360
  const step = (width - 160) / Math.max(1, post.diagram.nodes.length - 1)
  const nodes = post.diagram.nodes.map((node, i) => {
    const x = 80 + step * i
    return `<g><rect x="${x - 72}" y="130" width="144" height="72" rx="18" fill="#fff" stroke="${post.accent}" stroke-width="2"/><text x="${x}" y="172" text-anchor="middle" font-size="18" font-family="Inter, Arial, sans-serif" fill="#1f2937">${esc(node)}</text></g>`
  }).join('\n')
  const arrows = post.diagram.nodes.slice(1).map((_, i) => {
    const x1 = 80 + step * i + 78
    const x2 = 80 + step * (i + 1) - 78
    return `<path d="M ${x1} 166 L ${x2} 166" stroke="${post.secondary}" stroke-width="3" marker-end="url(#arrow)"/>`
  }).join('\n')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${post.secondary}"/></marker></defs>
  <rect width="${width}" height="${height}" rx="28" fill="#f8fafc"/>
  <text x="40" y="58" font-size="24" font-weight="800" font-family="Inter, Arial, sans-serif" fill="#111827">${esc(post.diagram.title)}</text>
  <text x="40" y="92" font-size="17" font-family="Inter, Arial, sans-serif" fill="#64748b">${esc(post.diagram.caption)}</text>
  ${arrows}
  ${nodes}
</svg>`
  fs.writeFileSync(file, svg)
  return `/tistory/main-services/diagrams/${post.slug}-diagram.svg`
}

const paragraph = {
  ponslinkEvidence: '로컬 소스는 `pons_p2p/ponslink-room-frontend`와 `pons_p2p/ponslink-api-infra`로 나뉘어 있다. GitHub에도 `ponslink-room-frontend`, `ponslink-api-infra`, `ponslink-mesh-room`, `ponslink_signal` 흐름이 따로 남아 있다. 이 분리는 우연이 아니다. 화면에서 보이는 방, API에서 지키는 운영 경계, 연결을 시작하게 만드는 signaling이 서로 다른 속도로 변했기 때문에 그렇게 갈라졌다.',
  ponswarpEvidence: '소스도 그 고민을 그대로 보여준다. `ponswarp/PonsWarp`는 사용자가 만지는 제품이고, `ponswarp/pons-core-wasm`은 전송 핵심을 따로 떼어낸 흔적이고, `ponswarp/ponswarp-signaling-rs`는 연결을 시작하는 서버 쪽 고민이다. GitHub에는 `ponswarp-desktop`, `ponswarp-signal` 같은 이전 또는 확장 실험도 남아 있다.',
  docEvidence: '`pdf-master`, `docuflow/reference/DocuFlow`, `Private-PDF`, `privacy-shield-pdf`, `pdftomd`, `HwpForge`는 같은 질문을 다른 각도에서 건드린다. PDF를 합치고 나누는 기능, 민감정보를 가리는 기능, OCR로 텍스트를 뽑는 기능, HWPX를 다루는 기능이 각각 따로 존재하지만 실제 사용자의 하루에서는 한 줄로 이어진다.',
  ruminateEvidence: '`ruminate`는 고전 기반 상담 흐름을 다루고, saju-engine-web, saju-api, discord-saju-engine, discord-saju-bot은 명경 쪽 계산과 표현의 경계를 보여준다. 같은 해석형 제품이어도 질문을 다루는 층, 계산하는 층, 사용자에게 보여주는 층은 분리되어야 했다.'
}

const posts = [
  {
    slug: '2026-06-29-main-ponslink-01-room-not-call',
    title: '[PonsLink] 화상회의 앱을 만들려다 협업 방을 만들게 됐다',
    excerpt: 'PonsLink의 출발점은 영상 통화가 아니라, 요청과 대화와 작업이 한 방 안에서 이어지는 경험이었다.',
    category: 'PonsLink',
    tags: 'PonsLink,Main Services,WebRTC,Collaboration,Product Retrospective',
    accent: '#2563eb', secondary: '#0f172a', coverTitle: 'Room, not just Call', coverSubtitle: '영상 연결보다 어려웠던 건 방의 맥락이었다', coverNodes: ['요청','방','대화','작업'],
    diagram: { title: 'PonsLink가 방을 중심에 둔 이유', caption: '기능을 따로 붙이지 않고 하나의 세션 맥락에 묶는다.', nodes: ['요청','Room Session','Media','Chat','Work'] },
    content: `처음에는 화상회의 앱을 만들면 된다고 생각했다. 링크를 만들고, 상대가 들어오고, 카메라와 마이크가 켜지면 기본 문제는 끝난 것처럼 보였다.

그런데 막상 제품으로 보면 영상 통화는 시작점일 뿐이었다. 사용자는 통화 전에 요청을 보내고, 통화 중에는 대화하고, 자료를 공유하고, 끝난 뒤에는 기록을 찾는다. 이 흐름이 끊기면 영상은 연결되어 있어도 일은 이어지지 않았다.

## 진짜 문제는 연결이 아니라 방이었다

화면에 보이는 기능은 영상, 채팅, 화이트보드, 파일 공유처럼 나뉘어 있다. 하지만 사용자가 기억하는 단위는 기능이 아니라 “그 방에서 무슨 일이 있었는지”다. 그래서 PonsLink는 통화 기능을 중심에 둔 앱이 아니라 방을 중심에 둔 제품이 되어야 했다.

![PonsLink room session diagram](__DIAGRAM__)

${paragraph.ponslinkEvidence}

## 기능을 많이 붙이는 것보다 맥락을 잃지 않는 게 먼저였다

한때는 기능을 더 넣으면 제품이 강해질 거라고 봤다. 하지만 기능이 많아질수록 사용자는 어디서 무엇을 해야 하는지 더 자주 잃어버렸다. 통화방 안에서 대화가 이어지고, 파일이 붙고, 작업 기록이 남아야 제품이 하나로 느껴졌다.

그래서 핵심 판단은 단순했다. PonsLink는 “영상 통화 링크”가 아니라 “요청에서 세션까지 이어지는 작업 방”이어야 했다.

## 지금 돌아보면

이 판단은 아직도 맞다고 본다. 다만 처음부터 방의 시간선과 기록 구조를 더 강하게 잡았으면 좋았을 것 같다. 실시간 제품은 연결된 순간보다, 사용자가 나갔다가 다시 돌아왔을 때 맥락이 남아 있는지가 더 중요했다.`
  },
  {
    slug: '2026-06-29-main-ponslink-02-mesh-limits',
    title: '[PonsLink] WebRTC Mesh는 단순했지만 한계도 빨리 드러났다',
    excerpt: 'Mesh 구조는 서버 비용과 구조를 줄여줬지만, 참여자가 늘고 네트워크가 흔들리면 품질과 상태 관리가 바로 문제로 올라왔다.',
    category: 'PonsLink', tags: 'PonsLink,Main Services,WebRTC,Mesh,Realtime', accent: '#0891b2', secondary: '#164e63', coverTitle: 'Mesh has a cost', coverSubtitle: '단순한 연결 구조가 운영 문제를 숨기지는 않았다', coverNodes: ['Peer','Peer','Peer','TURN'],
    diagram: { title: 'Mesh 연결의 장점과 부담', caption: '서버는 가벼워지지만 브라우저가 여러 연결을 직접 감당한다.', nodes: ['User A','Peer Links','User B/C','Quality','Fallback'] },
    content: `WebRTC Mesh를 고른 이유는 명확했다. 서버가 모든 미디어를 받아서 다시 뿌리는 구조보다 단순했고, 작은 방에서는 브라우저끼리 직접 연결하는 편이 자연스러웠다.

하지만 단순한 구조가 항상 쉬운 구조는 아니었다. 참여자가 늘어나면 각 브라우저가 감당해야 하는 연결이 늘고, 한 명의 네트워크 상태가 흔들리면 방 전체의 체감 품질도 흔들렸다.

## 처음에는 서버를 줄이는 게 이득처럼 보였다

작은 방에서는 Mesh가 매력적이다. 미디어 서버를 크게 운영하지 않아도 되고, 연결 경로도 직관적이다. 하지만 사용자는 내부 구조를 보지 않는다. 사용자가 보는 것은 “왜 어떤 사람 화면만 끊기지?” 같은 현상이다.

![WebRTC mesh limit diagram](__DIAGRAM__)

${paragraph.ponslinkEvidence}

## Mesh는 제품 규모를 정직하게 드러낸다

Mesh는 거짓말을 하지 않는다. 두세 명이 쓰는 방에서는 간결하다. 하지만 방이 커지고 기능이 붙으면, 브라우저가 감당하는 부담과 signaling의 복잡도가 같이 올라간다. 이때 제품은 선택해야 한다. 작은 방에 최적화할지, 더 큰 방을 위해 구조를 바꿀지.

PonsLink에서는 이 선택이 단순한 기술 선택이 아니었다. 누구를 위한 방인지, 어떤 사용 시나리오를 먼저 잡을지와 연결됐다.

## 지금 돌아보면

Mesh를 택한 건 빠른 제품 검증에는 좋은 판단이었다. 다만 이 구조를 계속 가져가려면 방 크기, 품질 저하, 대체 경로 기준을 사용자에게 더 선명하게 보여줘야 한다. 실시간 제품에서 기술 한계는 숨기는 순간 신뢰 문제로 바뀐다.`
  },
  {
    slug: '2026-06-29-main-ponslink-03-state-resync',
    title: '[PonsLink] 실시간 방에서 상태가 어긋나는 순간을 먼저 봐야 했다',
    excerpt: '실시간 제품은 정상 접속보다 끊겼다가 다시 돌아오는 흐름에서 제품성이 드러난다.',
    category: 'PonsLink', tags: 'PonsLink,Main Services,Realtime,State Sync,Operations', accent: '#7c3aed', secondary: '#312e81', coverTitle: 'Resync matters', coverSubtitle: '끊김 이후에도 같은 방으로 돌아와야 했다', coverNodes: ['입장','동기화','끊김','복구'],
    diagram: { title: '실시간 방의 복구 흐름', caption: '입장보다 중요한 것은 끊긴 뒤 다시 같은 상태로 돌아오는 과정이다.', nodes: ['Join','Snapshot','Updates','Disconnect','Resync'] },
    content: `실시간 방은 처음 들어갈 때보다 다시 들어올 때 더 어렵다. 처음에는 빈 상태를 만들면 된다. 하지만 이미 대화가 오갔고, 파일이 공유됐고, 화면 상태가 바뀐 뒤에는 사용자를 같은 맥락으로 돌려보내야 한다.

영상이 연결되어 있는데 채팅 상태가 늦거나, 화이트보드가 다르게 보이거나, 파일 공유 상태가 어긋나면 사용자는 제품을 불안하게 느낀다. 이 불안은 버그 하나보다 더 오래 남는다.

## 상태는 기능보다 늦게 문제로 보인다

처음에는 카메라가 켜지는지, 마이크가 연결되는지 같은 눈에 보이는 문제를 먼저 고친다. 그런데 제품을 계속 쓰다 보면 더 자주 부딪히는 것은 상태 복구다.

![Realtime resync diagram](__DIAGRAM__)

${paragraph.ponslinkEvidence}

## 방은 지금 상태와 지나간 이벤트를 같이 가져야 한다

실시간 업데이트만 있으면 새로 들어온 사람은 맥락을 모른다. 반대로 스냅샷만 있으면 지금 일어나는 변화가 늦다. 그래서 방은 현재 상태를 보여주는 층과, 이후 이벤트를 밀어주는 층을 같이 가져야 했다.

이 판단은 UI에도 영향을 준다. 사용자가 다시 들어왔을 때 “처음부터 다시 시작된 방”처럼 보이면 안 된다. 같은 방에 돌아온 느낌이 나야 한다.

## 지금 돌아보면

PonsLink에서 상태 동기화는 더 일찍 제품의 중심으로 올렸어야 했다. 실시간 제품은 빠른 연결보다 믿을 수 있는 복구가 더 오래 남는다. 사용자는 한 번 끊길 수 있다는 건 이해한다. 하지만 돌아왔을 때 모든 것이 사라져 있으면 다시 믿지 않는다.`
  },
  {
    slug: '2026-06-29-main-ponswarp-01-server-does-not-own-file',
    title: '[PonsWarp] 서버가 파일을 갖지 않는 전송을 만들고 싶었다',
    excerpt: 'PonsWarp는 서버에 파일을 올리지 않고, 브라우저끼리 직접 대용량 파일을 주고받게 하려는 실험에서 시작됐다.',
    category: 'PonsWarp', tags: 'PonsWarp,Main Services,WebRTC,File Transfer,P2P', accent: '#ea580c', secondary: '#7c2d12', coverTitle: 'Server never owns it', coverSubtitle: '서버는 파일이 아니라 만남만 도와준다', coverNodes: ['Sender','Signal','Peer','Receiver'],
    diagram: { title: 'PonsWarp의 기본 경계', caption: 'signaling은 연결만 돕고 파일 데이터는 브라우저끼리 이동한다.', nodes: ['Sender','Signaling','DataChannel','Receiver'] },
    content: `큰 파일을 보내는 일은 생각보다 자주 막힌다. 업로드 제한이 있고, 서버 비용이 있고, 민감한 파일을 어딘가에 올려야 한다는 찝찝함도 있다. PonsWarp는 이 불편함에서 시작했다.

처음 질문은 단순했다. 파일을 서버에 맡기지 않고 브라우저끼리 직접 보낼 수 없을까. 서버는 두 사용자가 서로를 찾게만 해주고, 파일 자체는 건드리지 않는 구조를 만들고 싶었다.

## P2P라고 해서 서버가 사라지는 건 아니었다

서버가 파일을 갖지 않는 것과 서버가 필요 없는 것은 다르다. 두 브라우저가 처음부터 서로를 아는 게 아니기 때문에 연결을 시작하는 과정은 여전히 필요했다.

![PonsWarp boundary diagram](__DIAGRAM__)

${paragraph.ponswarpEvidence}

## 파일을 모르는 서버라는 경계

이 경계는 제품 메시지에도 중요하다. “서버를 안 쓴다”라고 말하면 과장이다. 하지만 “서버가 파일을 모른다”라고 말하면 구조가 분명해진다. 서버는 방을 만들고, 신호를 전달하고, 연결을 돕는다. 파일 데이터는 그 경계를 넘지 않는다.

이렇게 나누면 사용자의 신뢰도 다르게 설명할 수 있다. 개인정보 보호를 감성적으로 말하는 대신, 어떤 데이터가 어디로 가지 않는지를 보여줄 수 있다.

## 지금 돌아보면

PonsWarp의 핵심은 빠른 전송보다 이 경계였다. 대용량 파일을 다루는 제품에서 신뢰는 속도보다 먼저 온다. 서버가 무엇을 하지 않는지 명확하게 말할 수 있어야 사용자는 안심하고 파일을 보낼 수 있다.`
  },
  {
    slug: '2026-06-29-main-ponswarp-02-signaling-is-matchmaker',
    title: '[PonsWarp] Signaling 서버는 파일 운반자가 아니라 소개자였다',
    excerpt: 'P2P 전송에서도 두 브라우저를 처음 만나게 하는 signaling 흐름은 제품 UX를 좌우한다.',
    category: 'PonsWarp', tags: 'PonsWarp,Main Services,Signaling,WebRTC,Rust', accent: '#dc2626', secondary: '#450a0a', coverTitle: 'Signaling is a matchmaker', coverSubtitle: '파일은 지나가지 않지만 연결은 여기서 시작된다', coverNodes: ['Room','SDP','ICE','Connect'],
    diagram: { title: 'signaling이 담당하는 최소 역할', caption: '연결 정보를 교환하지만 파일 데이터 경로에는 들어가지 않는다.', nodes: ['Room Code','SDP','ICE','Peer Path'] },
    content: `P2P 전송이라는 말을 들으면 서버가 아예 없는 그림을 떠올리기 쉽다. 하지만 현실에서는 두 브라우저가 처음 만나는 장치가 필요하다. PonsWarp에서 signaling 서버는 바로 그 소개자 역할을 맡는다.

이 서버는 파일을 운반하지 않는다. 대신 누가 같은 방에 있는지, 어떤 연결 정보를 주고받아야 하는지, 연결이 실패했을 때 어떤 상태로 돌아가야 하는지를 정리한다.

## 작아 보이지만 UX를 크게 흔든다

signaling은 화면에 잘 보이지 않는다. 사용자는 방 코드 입력, 연결 대기, 상대 접속 같은 UI만 본다. 하지만 이 작은 흐름이 어긋나면 사용자는 파일 전송을 시작조차 못 한다.

![PonsWarp signaling diagram](__DIAGRAM__)

${paragraph.ponswarpEvidence}

## 데이터 경로와 제어 경로를 나누는 일

PonsWarp에서 중요한 기준은 파일 데이터 경로와 제어 경로를 섞지 않는 것이다. signaling 서버는 연결 정보를 다룬다. 전송 데이터는 DataChannel로 간다. 이 경계가 흐려지면 제품 설명도 흐려지고, 운영 책임도 흐려진다.

Rust signaling 실험이 나온 것도 이 경계와 관련이 있다. 작은 서버라도 연결의 안정성과 지연을 다루는 곳이라면 명확하고 단단한 구조가 필요했다.

## 지금 돌아보면

signaling은 보조 기능이 아니었다. P2P 제품에서 사용자가 처음 만나는 제품 경험은 signaling 흐름이다. 파일을 보내는 순간보다 “상대와 연결됐다”는 확신을 주는 순간이 먼저였다.`
  },
  {
    slug: '2026-06-29-main-ponswarp-03-backpressure-before-speed',
    title: '[PonsWarp] 대용량 전송에서는 속도보다 흐름 제어가 먼저였다',
    excerpt: '빠르게 보내는 것만 생각하면 브라우저 버퍼와 수신자 저장 흐름이 먼저 무너진다.',
    category: 'PonsWarp', tags: 'PonsWarp,Main Services,Backpressure,WASM,Large Files', accent: '#f59e0b', secondary: '#422006', coverTitle: 'Flow before speed', coverSubtitle: '대용량 파일은 밀어붙이면 먼저 깨진다', coverNodes: ['Chunk','Queue','Buffer','Write'],
    diagram: { title: '대용량 전송의 압력 흐름', caption: '보내는 속도와 받는 속도 사이의 차이를 계속 조절해야 한다.', nodes: ['Read','Queue','Buffer','Ack','Write'] },
    content: `대용량 파일 전송을 만들면 처음에는 속도에 눈이 간다. 더 큰 chunk를 쓰고, 더 빨리 밀어 넣고, 전송률을 올리고 싶어진다. 하지만 브라우저는 무한한 파이프가 아니다.

수신자가 저장하는 속도보다 송신자가 보내는 속도가 빠르면 어딘가에 압력이 쌓인다. 그 압력은 메모리, DataChannel buffer, 저장소 쓰기 지연으로 나타난다. 결국 빠르게 보내려다 전송 자체가 불안정해진다.

## 빠른 전송보다 무너지지 않는 전송

PonsWarp에서 backpressure는 성능 최적화가 아니라 보호 장치였다. 보내는 쪽이 잠깐 멈추고, 받는 쪽이 처리할 시간을 주고, 다시 이어가는 구조가 있어야 했다.

![PonsWarp backpressure diagram](__DIAGRAM__)

${paragraph.ponswarpEvidence}

## WASM core 분리는 이 고민의 흔적이다

전송 UI와 데이터 처리 로직이 계속 섞이면 병목을 찾기도 어렵고, 같은 로직을 다른 환경에서 쓰기도 어렵다. 그래서 core를 따로 분리하려는 흐름이 생겼다. 이것은 처음부터 멋진 아키텍처를 만들기 위한 선택이 아니라, 대용량 전송에서 반복해서 보이는 문제를 격리하려는 선택이었다.

## 지금 돌아보면

PonsWarp에서 속도는 결과지 출발점이 아니었다. 흐름을 안전하게 유지하면 속도는 그 다음에 올릴 수 있다. 반대로 흐름 제어가 없으면 숫자로 보이는 속도는 잠깐 좋아 보여도 사용자가 받는 경험은 더 나빠진다.`
  },
  {
    slug: '2026-06-29-main-docuflow-01-tools-to-flow',
    title: '[DocuFlow] PDF 도구를 만들다가 문서 흐름을 보게 됐다',
    excerpt: '문서 자동화의 문제는 기능 하나가 부족한 게 아니라, 여러 문서 작업이 계속 끊기는 데 있었다.',
    category: 'Document Automation', tags: 'DocuFlow,PDF마스터,PDF Master,문서 자동화,Main Services', accent: '#0d9488', secondary: '#134e4a', coverTitle: 'Tools to Flow', coverSubtitle: '기능 모음보다 작업 흐름이 먼저였다', coverNodes: ['PDF','OCR','Mask','Export'],
    diagram: { title: '문서 처리 흐름', caption: '사용자는 개별 도구가 아니라 입력부터 출력까지 이어지는 흐름을 원한다.', nodes: ['Input','Analyze','Convert','Protect','Output'] },
    content: `PDF 도구를 만들 때 처음에는 기능 단위로 생각했다. 합치기, 나누기, 회전, 압축, OCR, 마스킹. 각각은 분명 쓸모 있는 기능이다.

그런데 실제 문서 작업을 보면 사용자는 기능 하나만 쓰고 끝내지 않는다. 스캔 문서를 받고, 텍스트를 뽑고, 민감정보를 지우고, 다시 공유 가능한 형태로 만든다. 문제는 기능 부족이 아니라 흐름의 단절이었다.

## 도구가 많아도 일이 줄지 않는 순간

여러 웹사이트를 돌아다니며 문서를 처리하면 사용자는 계속 파일을 다시 올리고, 다시 내려받고, 다시 확인한다. 이 반복이 문서 작업을 피곤하게 만든다.

![DocuFlow pipeline diagram](__DIAGRAM__)

${paragraph.docEvidence}

## 제품의 기준을 기능표가 아니라 작업 흐름으로 바꿨다

DocuFlow라는 이름은 이 지점에서 의미가 생긴다. PDF 도구 하나를 더 만드는 것이 아니라, 문서가 들어와서 처리되고 안전하게 나가는 흐름을 만들자는 방향이다.

PDF마스터는 이 흐름의 현실적인 입구에 가깝다. 사용자가 당장 필요한 PDF 작업을 처리하게 하고, 그 뒤에 OCR, 마스킹, HWPX 같은 더 깊은 자동화로 이어질 수 있다.

## 지금 돌아보면

문서 자동화는 기능이 많다고 완성되지 않는다. 사용자가 파일을 몇 번 다시 올리는지, 중간 결과를 얼마나 믿을 수 있는지, 민감정보를 언제 확인할 수 있는지가 더 중요했다. 도구를 만들던 시선에서 흐름을 설계하는 시선으로 넘어간 게 가장 큰 변화였다.`
  },
  {
    slug: '2026-06-29-main-docuflow-02-korean-document-context',
    title: '[PDF마스터] 한국 문서 업무에는 PDF만으로 부족했다',
    excerpt: '한국 사용자의 문서 업무에는 HWP, 도장, 주민번호, 스캔본이라는 현실적인 맥락이 같이 붙어 있었다.',
    category: 'Document Automation', tags: 'DocuFlow,PDF마스터,HWP,HWPX,문서 자동화,Main Services', accent: '#4f46e5', secondary: '#1e1b4b', coverTitle: 'Korean document context', coverSubtitle: 'PDF 바깥의 업무 맥락까지 봐야 했다', coverNodes: ['HWP','PDF','도장','마스킹'],
    diagram: { title: '한국 문서 업무의 주변 맥락', caption: 'PDF 처리만으로는 실제 업무의 재료를 전부 담기 어렵다.', nodes: ['HWPX','PDF','Stamp','ID Mask','Share'] },
    content: `PDF 도구만 보면 글로벌 제품처럼 만들 수 있을 것 같았다. 하지만 한국 사용자의 문서 업무를 보면 PDF만으로는 부족했다. HWP 문서가 있고, 도장과 인감 이미지가 있고, 주민번호와 연락처가 들어간 스캔본이 있다.

이 요소들은 부가 기능처럼 보이지만 실제 업무에서는 중심에 있다. 문서를 제출하거나 공유하기 전에는 이런 맥락을 처리해야 한다.

## 로컬 문제를 보면 제품 방향이 달라진다

PDF 합치기만 잘해도 쓸모는 있다. 하지만 한국 문서 환경에서는 HWPX, 마스킹, OCR, 도장 처리까지 이어지는 순간이 자주 생긴다.

![Korean document context diagram](__DIAGRAM__)

${paragraph.docEvidence}

## HWPX와 민감정보는 따로 볼 문제가 아니었다

HwpForge 같은 실험은 이 문제의 확장이다. Markdown을 HWPX로 바꾸거나, 문서를 구조화해서 다시 편집 가능한 형태로 다루려는 시도는 단순 변환 도구를 넘어선다.

민감정보 마스킹도 마찬가지다. 보안 기능 하나를 붙이는 게 아니라, 문서가 외부로 나가기 전 반드시 거쳐야 하는 검토 단계로 봐야 한다.

## 지금 돌아보면

PDF마스터와 DocuFlow 계열에서 중요한 건 한국 업무의 구체성을 피하지 않는 것이었다. 글로벌하게 예쁜 문서 도구보다, 실제로 사람들이 매일 부딪히는 HWP, 스캔본, 주민번호, 제출 양식을 정면으로 보는 쪽이 더 제품에 가까웠다.`
  },
  {
    slug: '2026-06-29-main-docuflow-03-local-security-boundary',
    title: '[DocuFlow] 민감한 문서는 어디서 처리되는지가 먼저 보여야 했다',
    excerpt: '문서 보안은 안전하다고 말하는 것보다, 어떤 처리가 로컬에서 일어나는지 보여주는 일이 먼저였다.',
    category: 'Document Automation', tags: 'DocuFlow,Private-PDF,privacy-shield-pdf,보안,Main Services', accent: '#059669', secondary: '#064e3b', coverTitle: 'Visible security boundary', coverSubtitle: '안전하다는 말보다 처리 위치가 중요했다', coverNodes: ['Local','Detect','Mask','Share'],
    diagram: { title: '문서 보안의 처리 경계', caption: '민감한 처리는 가능하면 로컬에서 끝내고, 외부 전송 전 확인 단계를 둔다.', nodes: ['Open Local','Detect','Mask','Review','Export'] },
    content: `민감한 문서를 다루는 제품에서 “안전하다”는 말은 부족하다. 사용자는 내 파일이 어디로 가는지, 어떤 처리가 내 브라우저에서 끝나는지, 서버로 가는 정보가 무엇인지 알고 싶어 한다.

Private-PDF와 privacy-shield-pdf 계열의 고민은 여기서 시작된다. 파일을 올려야만 처리되는 도구는 편하지만, 문서가 민감해질수록 사용자는 그 편함을 의심한다.

## 보안은 문구가 아니라 경계다

안전하다고 크게 쓰는 것보다 중요한 건 경계를 보여주는 일이다. 브라우저 안에서 열고, 민감정보를 찾고, 마스킹하고, 사용자가 확인한 뒤 내보내는 흐름이 보이면 신뢰가 생긴다.

![Document security boundary diagram](__DIAGRAM__)

${paragraph.docEvidence}

## 모든 처리를 로컬에 밀어 넣을 수는 없다

그렇다고 모든 것을 브라우저에서만 처리하겠다고 말하는 것도 위험하다. OCR이나 대용량 변환은 성능 문제가 생길 수 있다. 그래서 중요한 건 원칙이다. 민감한 원본과 검토가 필요한 처리는 로컬 우선으로 두고, 무거운 자동화는 사용자가 경계를 이해한 상태에서 선택하게 해야 한다.

## 지금 돌아보면

DocuFlow의 보안 UX는 더 명확해져야 한다. 사용자가 파일을 넣는 순간부터 “지금 이 처리는 내 기기에서 끝난다”거나 “이 단계는 서버 처리가 필요하다”는 식으로 알려줘야 한다. 문서 자동화에서 신뢰는 기능 설명보다 처리 경계 설명에서 시작된다.`
  },
  {
    slug: '2026-06-29-main-ruminate-01-ai-should-not-answer-too-fast',
    title: '[Ruminate] AI가 너무 빨리 답을 주는 게 오히려 위험했다',
    excerpt: 'Ruminate는 고민에 정답을 주는 서비스가 아니라, 사용자가 자기 상황을 다시 보게 만드는 도구로 설계됐다.',
    category: 'Ruminate', tags: 'Ruminate,명경,FateMirror,고전,Main Services', accent: '#9333ea', secondary: '#3b0764', coverTitle: 'Don’t answer too fast', coverSubtitle: '고민을 다룰 때는 유창함보다 조심성이 먼저였다', coverNodes: ['고민','질문','고전','회고'],
    diagram: { title: 'Ruminate의 반추 흐름', caption: '답을 바로 닫지 않고, 사용자가 자기 상황을 다시 보게 만든다.', nodes: ['고민','맥락','고전','질문','회고'] },
    content: `AI 상담 서비스를 만들면 가장 쉬운 방향은 빠르게 답을 주는 것이다. 사용자가 고민을 쓰면 그럴듯한 조언을 만들고, 위로 문장을 붙이고, 다음 행동을 제안한다.

하지만 사람의 고민은 그렇게 쉽게 닫아도 되는 문제가 아니었다. 너무 유창한 답은 오히려 위험할 수 있다. 사용자의 상황을 단정하고, 선택을 대신하고, 복잡한 감정을 너무 빨리 정리해버릴 수 있기 때문이다.

## 답보다 반추가 먼저였다

Ruminate는 그래서 정답을 주는 서비스가 아니라 되새기게 만드는 서비스로 잡았다. 고전 문장은 권위 있는 결론이 아니라, 사용자가 자기 상황을 다른 각도에서 보게 만드는 장치여야 했다.

![Ruminate reflection diagram](__DIAGRAM__)

${paragraph.ruminateEvidence}

## AI가 잘 말할수록 더 조심해야 한다

AI는 자연스럽게 말한다. 그래서 사용자는 그 말을 쉽게 받아들인다. 이때 제품이 해야 할 일은 더 강한 결론을 내는 게 아니라, 결론을 늦추고 사용자의 판단 공간을 남기는 것이다.

Ruminate에서 고전 기반 흐름을 둔 이유도 여기에 있다. 고전은 답을 대신하는 것이 아니라 질문을 여는 재료가 된다.

## 지금 돌아보면

사람의 고민을 다루는 제품에서 가장 중요한 것은 똑똑함보다 경계였다. 어디까지 말하고, 어디서 멈출지 정하지 않으면 좋은 의도로 만든 AI도 사용자의 삶에 너무 깊게 들어가 버린다.`
  },
  {
    slug: '2026-06-29-main-ruminate-02-classic-text-as-question',
    title: '[Ruminate] 고전 문장은 답이 아니라 질문으로 쓰여야 했다',
    excerpt: '고전 문장을 인용하는 것보다 중요한 건, 그 문장이 사용자의 상황을 다시 생각하게 만드는 방식이었다.',
    category: 'Ruminate', tags: 'Ruminate,고전,상담 UX,Main Services', accent: '#a16207', secondary: '#422006', coverTitle: 'Classic text as question', coverSubtitle: '권위 있는 문장보다 생각을 여는 문장이 필요했다', coverNodes: ['문장','맥락','질문','선택'],
    diagram: { title: '고전 문장을 사용하는 방식', caption: '문장은 결론이 아니라 사용자의 맥락을 비추는 질문으로 쓰인다.', nodes: ['고민','문장','비유','질문','정리'] },
    content: `고전 문장을 쓰면 글은 금방 그럴듯해진다. 오래된 문장에는 무게가 있고, 사용자는 거기서 의미를 찾고 싶어 한다. 하지만 그럴듯함이 항상 좋은 제품을 만들지는 않는다.

문제가 되는 순간은 고전 문장이 답처럼 사용될 때다. 사용자의 고민은 복잡한데, 오래된 한 문장으로 결론을 내려버리면 제품은 깊어 보이지만 실제로는 얕아진다.

## 문장을 붙이는 것과 생각을 열어주는 것은 다르다

Ruminate에서 고전 문장은 사용자의 상황 위에 덮어씌우는 해석이 아니어야 했다. 오히려 사용자가 자기 말을 다시 보게 만드는 거울에 가까워야 했다.

![Classic text question diagram](__DIAGRAM__)

${paragraph.ruminateEvidence}

## 좋은 문장은 답을 닫지 않는다

고전의 역할은 “이렇게 살아라”가 아니라 “너는 지금 무엇을 붙잡고 있나”에 가깝다. 그래서 글의 흐름도 조언보다 질문으로 가야 했다. 사용자가 다시 생각하게 만들고, 자기 선택을 스스로 정리할 여지를 남겨야 했다.

이 방식은 느리다. 하지만 고민을 다루는 제품에서 빠른 결론은 항상 좋은 경험이 아니다.

## 지금 돌아보면

Ruminate는 더 많은 고전 문장을 넣는 방향이 아니라, 적은 문장을 더 정확한 질문으로 바꾸는 방향이 맞다. 콘텐츠 양보다 중요한 것은 사용자의 문맥과 문장이 만나는 방식이었다.`
  },
  {
    slug: '2026-06-29-main-fatemirror-01-mirror-not-fortune',
    title: '[명경] 운세가 아니라 자기 해석의 거울로 만들고 싶었다',
    excerpt: '명경은 사주를 맞고 틀리는 예측 게임이 아니라, 자기 패턴을 관찰하는 인터페이스로 다루려는 시도였다.',
    category: 'FateMirror', tags: '명경,FateMirror,사주,Ruminate,Main Services', accent: '#be123c', secondary: '#4c0519', coverTitle: 'Mirror, not fortune', coverSubtitle: '미래를 맞히는 것보다 자기 패턴을 보는 일이 먼저였다', coverNodes: ['생년월일','엔진','해석','거울'],
    diagram: { title: '명경의 해석 경계', caption: '계산과 표현을 분리해 결과를 단정이 아니라 관찰 프레임으로 보여준다.', nodes: ['입력','계산','API','표현','회고'] },
    content: `사주 서비스를 만들면 쉽게 운세 콘텐츠가 된다. 오늘의 운, 재물운, 연애운처럼 빠르게 소비되는 문장으로 흘러간다. 하지만 명경에서 보고 싶었던 것은 맞추는 게임이 아니었다.

사용자가 자기 삶의 패턴을 다른 언어로 바라보게 만드는 것. 그것이 명경의 중심에 더 가까웠다. 그래서 이름도 거울에 가깝게 잡았다.

## 예측보다 관찰이 먼저였다

사주는 계산 구조가 있다. 하지만 계산 결과를 어떻게 보여줄지는 다른 문제다. 결과를 단정적으로 말하면 사용자는 자기 선택을 결과에 맡기게 될 수 있다. 반대로 관찰 프레임으로 보여주면 사용자는 자기 경험과 비교하며 읽을 수 있다.

![FateMirror interpretation diagram](__DIAGRAM__)

${paragraph.ruminateEvidence}

## 엔진과 화면을 나눈 이유

saju-engine-web, saju-api, discord-saju-engine, discord-saju-bot 같은 분리는 이 고민과 연결된다. 계산하는 층과 표현하는 층이 섞이면 검증도 어렵고, 사용자에게 어떤 톤으로 보여줄지도 흐려진다.

명경은 계산 결과를 예언처럼 포장하기보다, 사용자가 자기 패턴을 보는 화면으로 만들어야 했다.

## 지금 돌아보면

명경에서 가장 조심해야 할 것은 “맞다”는 반응에 취하는 것이다. 해석형 제품은 사용자가 놀랄 만한 문장을 만드는 것보다, 사용자가 자기 선택을 더 분명히 보게 만드는 쪽으로 가야 한다. 거울은 대신 살아주지 않는다. 다만 더 잘 보이게 해준다.`
  }
]

async function main() {
  const author = await prisma.user.findFirst({ where: { username: 'ponslink' } })
  if (!author) throw new Error('Author user ponslink not found')

  const baseDate = new Date('2026-06-29T09:00:00.000Z')
  const results = []
  for (const [index, post] of posts.entries()) {
    const featuredImage = writeCover(post, index + 1)
    const diagramPath = writeDiagram(post)
    const content = post.content.replaceAll('__DIAGRAM__', diagramPath)
    const readingTime = estimateReadingTime(content)
    const data = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content,
      category: post.category,
      tags: post.tags,
      coverColor: post.accent,
      featuredImage,
      status: 'published',
      readingTime,
      authorId: author.id,
      authorName: author.displayName,
      publishedAt: new Date(baseDate.getTime() + index * 60_000),
    }
    const saved = await prisma.post.upsert({
      where: { slug: post.slug },
      create: data,
      update: { ...data, updatedAt: new Date() },
      select: { slug: true, title: true, category: true, readingTime: true, featuredImage: true }
    })
    results.push(saved)
  }
  console.log(JSON.stringify({ count: results.length, results }, null, 2))
}

main().finally(async () => prisma.$disconnect())
