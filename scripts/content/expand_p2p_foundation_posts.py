#!/usr/bin/env python3
"""Expand P2P foundation posts and attach deterministic visual assets."""
from __future__ import annotations
import datetime as dt, html, sqlite3, sys
from pathlib import Path

AUTHOR_ID="ponslink-content"; AUTHOR_NAME="PonsLink"; TAXONOMY_ID="tax-dev-retrospective-p2p-foundations"
ASSET_DIR=Path("public/tistory/p2p-foundations")
SERIES_COVER="/tistory/p2p-foundations/2026-06-16-p2p-foundations-imagegen-cover.webp"
TOPICS=[
("2026-06-16-p2p-00-grid-computing-first-step","[P2P] 그리드 컴퓨팅을 만들고 싶어서 P2P를 다시 읽기 시작했다","P2P를 파일 전송이나 화상회의 기능으로만 보지 않고, 분산 작업과 그리드 컴퓨팅의 기반으로 다시 정리한다.","P2P,Grid Computing,Distributed Systems,Foundations,Architecture","2026-06-15T15:10:00.000Z","/tistory/p2p-foundations/2026-06-16-p2p-00-grid-computing-first-step-imagegen.webp",["작업 큐","스케줄러","피어 워커","검증기","결과 조립"],"그리드 컴퓨팅의 핵심은 연결 자체가 아니라 일을 나누고, 맡기고, 검증하고, 실패한 조각을 다시 실행하는 운영 규칙이다.","사용자가 올린 대용량 파일을 여러 브라우저가 나눠 해시하고 일부 노드는 썸네일을 만들며 일부 노드는 조각의 무결성을 다시 확인하는 장면",["작업을 너무 작게 나눠 배분 비용이 계산 이득을 잡아먹는 경우","신뢰할 수 없는 워커가 잘못된 결과를 반환하는 경우","모바일 탭이 백그라운드로 내려가면서 작업이 중간에 사라지는 경우"],["작업은 독립적으로 재시도 가능한가","결과를 빠르게 검증할 방법이 있는가","중앙 서버가 반드시 처리해야 하는 권한과 감사 로그는 무엇인가"]),
("2026-06-16-p2p-01-client-server-vs-peer-to-peer","[P2P] 서버-클라이언트와 피어 투 피어는 무엇이 다른가","P2P를 이해하려면 먼저 누가 중심을 갖고, 누가 데이터를 들고, 누가 장애 지점이 되는지를 구분해야 한다.","P2P,Network Architecture,Client Server,Foundations,WebRTC","2026-06-15T15:12:00.000Z",SERIES_COVER,["클라이언트","중앙 서버","피어 A","피어 B","제어면"],"P2P는 서버를 없애는 기술이 아니라 서버가 맡아야 할 책임과 피어가 직접 감당할 수 있는 책임을 다시 나누는 설계 방식이다.","두 사용자가 파일을 주고받을 때 로그인과 권한은 서버가 판단하지만 실제 파일 조각은 가능한 한 브라우저끼리 직접 흐르는 장면",["서버를 완전히 제거하려다 인증, 권한, 감사 로그까지 잃는 경우","직접 연결 실패를 UX와 로그에 반영하지 않아 사용자가 무한 대기하는 경우","모든 데이터를 피어에게 맡기면서 개인정보와 삭제 정책을 놓치는 경우"],["이 데이터는 반드시 중앙에 저장되어야 하는가","서버가 판단해야 하는 약속과 피어가 운반할 수 있는 바이트는 무엇인가","직접 경로가 실패할 때 어떤 대체 경로가 있는가"]),
("2026-06-16-p2p-02-mesh-sfu-mcu-topology","[P2P] Mesh, SFU, MCU는 연결을 어디서 합칠지의 선택이다","Mesh, SFU, MCU는 화상회의 용어처럼 보이지만 본질은 데이터 경로와 비용, 품질, 제어권의 선택이다.","P2P,WebRTC,Mesh,SFU,MCU,Realtime,Architecture","2026-06-15T15:14:00.000Z",SERIES_COVER,["Mesh","SFU","MCU","업로드","품질 제어"],"Mesh, SFU, MCU의 차이는 미디어나 데이터가 참여자 사이에서 직접 복제되는지, 서버가 전달만 하는지, 서버가 합성까지 하는지에 있다.","2명 상담 방은 Mesh로 충분하지만 12명 세미나와 녹화가 필요한 방은 SFU나 MCU 경계가 필요한 장면",["참여자 수가 늘어도 Mesh를 고집해 업로드 대역폭이 무너지는 경우","SFU를 도입하면서도 품질 레이어와 선택 전달 정책을 설계하지 않는 경우","MCU의 단순한 클라이언트 경험만 보고 서버 인코딩 비용을 과소평가하는 경우"],["한 사용자가 동시에 몇 개의 업로드를 감당해야 하는가","서버는 패킷을 전달만 하면 되는가 합성해야 하는가","녹화와 방송이 제품의 핵심 요구인가"]),
("2026-06-16-p2p-03-what-can-we-build-with-p2p","[P2P] 피어 투 피어로 실제 무엇을 만들 수 있는가","P2P는 화상회의만을 위한 기술이 아니다. 파일 전송, 협업, 엣지 연산, 로컬 우선 제품까지 이어지는 설계 선택이다.","P2P,Product,File Transfer,Realtime,Edge Computing,Collaboration","2026-06-15T15:16:00.000Z",SERIES_COVER,["파일 전송","협업","로컬 우선","엣지 연산","콘텐츠 배포"],"P2P의 제품적 가치는 중앙 서버가 모든 데이터 경로를 소유하지 않아도 되는 순간에 생긴다.","상담 방에서는 음성, 문서 조각, 화이트보드 이벤트, 파일 전송이 서로 다른 경로를 갖고 일부만 직접 연결되는 장면",["P2P를 화상회의 API 하나로 축소해서 다른 제품 가능성을 보지 못하는 경우","협업 상태 충돌을 연결 문제로 착각하는 경우","엣지 연산을 시도하면서 결과 검증과 개인정보 경계를 생략하는 경우"],["제품에서 가장 무거운 바이트는 무엇인가","사용자가 오프라인이어도 계속되어야 하는 작업은 무엇인가","중앙 서버가 줄어들 때 사용자 신뢰는 어떻게 유지되는가"]),
("2026-06-16-p2p-04-grid-computing-from-p2p","[P2P] 그리드 컴퓨팅은 남는 자원을 작업 단위로 묶는 일이다","그리드 컴퓨팅은 여러 장치의 남는 계산 자원을 하나의 큰 작업장처럼 쓰려는 시도다.","P2P,Grid Computing,Distributed Systems,Scheduling,Foundations","2026-06-15T15:18:00.000Z",SERIES_COVER,["분할","배정","실행","검증","재시도"],"그리드는 여러 컴퓨터를 하나처럼 보이게 만드는 마술이 아니라 독립 작업을 안전하게 순환시키는 파이프라인이다.","이미지 변환과 해시 계산을 수십 개의 작은 작업으로 나누고 느린 워커의 조각만 다른 피어에게 다시 맡기는 장면",["공유 상태가 많은 작업을 억지로 분산해 동기화 비용이 폭발하는 경우","스케줄러가 워커의 네트워크와 배터리 상태를 고려하지 않는 경우","검증 없이 가장 빠른 결과만 믿는 경우"],["작업 조각은 얼마나 커야 네트워크 비용보다 계산 이득이 큰가","워커가 떠나면 어떤 조각을 누가 이어받는가","결과 검증은 샘플링인가 중복 계산인가 결정적 검증인가"]),
("2026-06-16-p2p-05-signaling-stun-turn-ice","[P2P] WebRTC 이전에 Signaling, STUN, TURN, ICE를 먼저 이해해야 한다","WebRTC 연결 실패의 대부분은 미디어 API가 아니라 서로를 찾고 통과하는 과정에서 생긴다.","P2P,WebRTC,Signaling,STUN,TURN,ICE,NAT","2026-06-15T15:20:00.000Z",SERIES_COVER,["Signaling","STUN","TURN","ICE","NAT"],"WebRTC 연결은 미디어를 보내기 전에 약속을 교환하고, 외부 주소를 찾고, 직접 경로와 릴레이 경로를 시험하는 과정이다.","두 브라우저가 방 서버로 SDP와 candidate를 주고받고 직접 연결이 막히면 TURN 릴레이로 전환되는 장면",["시그널링을 WebRTC가 알아서 해준다고 착각하는 경우","TURN 비용을 운영 예산에 넣지 않는 경우","ICE 상태를 로그와 UI에 노출하지 않아 실패 원인을 추적하지 못하는 경우"],["SDP와 candidate 교환은 어떤 채널로 기록되는가","TURN 사용률은 어떤 지표로 감시할 것인가","연결 실패와 릴레이 전환을 사용자에게 어떻게 설명할 것인가"]),
("2026-06-16-p2p-06-realtime-product-patterns","[패턴] 실시간 제품은 상태 머신, 역압, 멱등성으로 버틴다","실시간 제품의 안정성은 멋진 프레임워크보다 상태 전이, 흐름 제어, 재시도 가능한 명령에서 나온다.","Design Patterns,Realtime,State Machine,Backpressure,Idempotency,PubSub,P2P","2026-06-15T15:22:00.000Z",SERIES_COVER,["상태 머신","역압","멱등성","Pub/Sub","재시도"],"실시간 제품은 빠르게 보내는 능력보다 상태를 제한하고, 받을 수 있을 만큼만 흐르게 하고, 중복과 재시도를 안전하게 만드는 능력으로 버틴다.","파일 전송 중 네트워크가 흔들릴 때 상태 머신이 재연결을 제한하고 역압이 전송 속도를 낮추며 작업 ID가 중복 처리를 막는 장면",["boolean 플래그가 늘어나 불가능한 상태 조합이 생기는 경우","버퍼 크기를 보지 않고 계속 보내다가 브라우저 메모리를 터뜨리는 경우","재시도 요청에 idempotency key를 붙이지 않아 결제나 승인 이벤트가 중복 처리되는 경우"],["가능한 상태와 전이를 한 장으로 그릴 수 있는가","받는 쪽의 처리 속도가 보내는 쪽에 전달되는가","같은 명령이 두 번 도착해도 결과가 한 번과 같은가"]),
]
SECTION_TITLES=["용어보다 책임을 먼저 나누기","데이터 경로를 그려야 비용이 보인다","작은 성공 사례를 제품 흐름으로 옮기기","실패를 예외가 아니라 정상 경로로 다루기","관찰 가능성을 처음부터 넣기","사용자 경험으로 번역하기","PonsLink와 PonsWarp에 대입하기","운영 비용과 보안 경계 확인하기","실험 단위를 작게 자르기","다음 글로 이어지는 연결점"]

def post_id(slug): return "p2p-foundation-"+slug.replace("2026-06-16-","").replace("-","_")[:42]
def box(x,y,w,h,t,fill="#fbf8f1"): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{fill}" stroke="#b8a489" stroke-width="2"/><text x="{x+w/2}" y="{y+h/2+6}" text-anchor="middle" font-size="24" fill="#3c3128" font-family="sans-serif">{html.escape(t)}</text>'
def arr(x1,y1,x2,y2,l=""):
    mx=(x1+x2)/2; my=(y1+y2)/2-12; txt=f'<text x="{mx}" y="{my}" text-anchor="middle" font-size="16" fill="#735f4a" font-family="sans-serif">{html.escape(l)}</text>' if l else ""
    return f'<path d="M{x1} {y1} C {mx} {y1}, {mx} {y2}, {x2} {y2}" fill="none" stroke="#7c5f43" stroke-width="3" marker-end="url(#arrow)"/>{txt}'
def svg(path,title,kind,labels,questions):
    p=['<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="840" viewBox="0 0 1400 840">','<defs><marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 Z" fill="#7c5f43"/></marker></defs>','<rect width="1400" height="840" fill="#f7f3ea"/><rect x="48" y="48" width="1304" height="744" rx="34" fill="#fffdf8" stroke="#d8c9b4"/>',f'<text x="92" y="118" font-size="34" font-weight="700" fill="#2f2720" font-family="sans-serif">{html.escape(title)}</text>',f'<text x="92" y="158" font-size="16" fill="#8a725a" font-family="monospace">{kind.upper()} · PonsLink visual note</text>']
    if kind=="overview":
        for (x,y),lab in zip([(120,250),(450,250),(780,250),(285,520),(615,520)],labels): p.append(box(x,y,230,96,lab,"#fbf4e8" if y<400 else "#eef2f5"))
        p += [arr(350,298,450,298,"control"),arr(680,298,780,298,"data"),arr(565,346,400,520,"feedback"),arr(895,346,730,520,"retry")]
    elif kind=="flow":
        x=115
        for i,lab in enumerate(labels):
            p.append(box(x+i*245,360,190,92,lab,"#edf4f2"))
            if i<4: p.append(arr(x+i*245+190,406,x+(i+1)*245,406,str(i+1)))
        p.append('<text x="700" y="560" text-anchor="middle" font-size="24" fill="#3c3128" font-family="sans-serif">작은 단위로 나누고, 상태를 기록하고, 실패한 조각만 다시 흘린다.</text>')
    elif kind=="tradeoff":
        p += ['<line x1="180" y1="640" x2="1220" y2="640" stroke="#aa967b" stroke-width="3"/>','<line x1="180" y1="640" x2="180" y2="220" stroke="#aa967b" stroke-width="3"/>']
        for x,y,lab in [(260,560,labels[0]),(480,470,labels[1]),(700,390,labels[2]),(920,310,labels[3]),(1140,250,labels[4])]: p.append(f'<circle cx="{x}" cy="{y}" r="28" fill="#d7b98b" stroke="#7c5f43" stroke-width="3"/><text x="{x}" y="{y+62}" text-anchor="middle" font-size="18" fill="#3c3128" font-family="sans-serif">{html.escape(lab)}</text>')
        p.append('<text x="700" y="710" text-anchor="middle" font-size="20" fill="#735f4a" font-family="sans-serif">복잡도 / 비용 / 제어권의 균형점</text>')
    else:
        for i,q in enumerate(questions): p.append(f'<rect x="130" y="{235+i*135}" width="1140" height="96" rx="20" fill="#fbf8f1" stroke="#c8b697"/><text x="180" y="{235+i*135+58}" font-size="25" fill="#3c3128" font-family="sans-serif">{i+1}. {html.escape(q)}</text>')
        p.append('<text x="700" y="705" text-anchor="middle" font-size="20" fill="#735f4a" font-family="sans-serif">이 질문에 답하지 못하면 아직 설계가 아니라 희망사항이다.</text>')
    p.append('</svg>'); path.write_text('\n'.join(p),encoding='utf-8')
def assets(slug,title,labels,questions):
    ASSET_DIR.mkdir(parents=True,exist_ok=True); out=[]
    for kind in ["overview","flow","tradeoff","checklist"]:
        fn=f"{slug}-{kind}.svg"; svg(ASSET_DIR/fn,f"{title} · {kind}",kind,labels,questions); out.append(f"/tistory/p2p-foundations/{fn}")
    return out
def img(path,alt,cap): return f"![{alt}]({path})\n\n_{cap}_\n"
def block(principle,case,pitfalls,questions,i,heading):
    pitfall_text = " / ".join(pitfalls)
    question_text = " / ".join(questions)
    section_bodies = {
        1: f"""기술 선택을 시작하기 전에 먼저 책임의 이름을 붙인다. 누가 연결을 시작하는지, 누가 상대의 주소를 알고 있는지, 누가 권한을 판단하는지, 누가 실제 바이트를 운반하는지 나누면 막연한 P2P 논의가 설계 논의로 바뀐다. {principle}

{case}에서는 서버와 피어가 동시에 등장한다. 서버는 방과 권한의 기준점이고, 피어는 실제 데이터 경로의 한쪽 끝이다. 이 둘을 섞어서 “서버를 없앤다”라고 말하면 제품은 빨라지는 대신 설명 불가능해진다. 반대로 둘을 분리하면 어느 부분이 중앙 장애 지점이고 어느 부분이 사용자의 네트워크 품질에 의존하는지 보인다.""",
        2: f"""데이터 경로를 그리면 비용 구조가 드러난다. 같은 파일 조각이 서버를 한 번 거치는지, 참가자 수만큼 복제되는지, 릴레이 서버를 타는지에 따라 대역폭 비용과 지연 시간이 달라진다. 그림 없이 회의하면 “빠르다”, “비싸다”, “안정적이다” 같은 말만 오가지만, 화살표를 그리면 어느 구간이 병목인지 바로 보인다.

여기서 봐야 할 것은 평균 속도만이 아니다. 업로드가 약한 사용자가 방 전체의 품질을 낮추는지, TURN이나 SFU 같은 중간 노드가 비용을 흡수하는지, 실패한 조각이 재전송될 때 누구의 배터리와 데이터 요금제를 쓰는지까지 봐야 한다. 그래서 데이터 경로 다이어그램은 문서 장식이 아니라 비용 견적서에 가깝다.""",
        3: f"""작은 성공 사례를 곧바로 전체 제품으로 확대하면 위험하다. 두 브라우저가 같은 와이파이에서 잘 연결된 것과, 실제 사용자가 회사 방화벽·모바일 핫스팟·잠자기 모드·느린 업로드를 오가며 쓰는 것은 전혀 다른 문제다. 실험은 반드시 제품 흐름의 한 조각으로 옮겨 검증해야 한다.

예를 들어 {case}을 구현한다면 첫 단계는 전체 플랫폼이 아니라 한 파일 조각, 한 candidate 교환, 한 작업 ID처럼 관찰 가능한 단위가 된다. 성공 기준도 “연결됐다”가 아니라 “실패 원인이 로그에 남고, 재시도 한계가 있으며, 사용자가 다음 행동을 알 수 있다”가 되어야 한다.""",
        4: f"""P2P와 실시간 기능에서 실패는 예외가 아니라 정상 경로다. NAT가 막을 수 있고, 피어가 탭을 닫을 수 있고, 모바일 OS가 백그라운드 작업을 멈출 수 있다. 따라서 설계 문서에는 성공 흐름만큼 실패 흐름이 크게 들어가야 한다.

대표적인 함정은 {pitfall_text}이다. 이 함정들은 런타임에서 갑자기 나타나는 것처럼 보이지만 대부분은 설계 때 이미 예고되어 있다. 해결책은 무한 retry가 아니다. 타임아웃, 재시도 횟수, fallback 경로, 사용자 메시지, 운영 로그가 함께 있어야 한다.""",
        5: f"""관찰 가능성은 나중에 붙이는 로그가 아니다. 연결 상태, 후보 수집 상태, 릴레이 전환 여부, 워커 작업 시작·완료·실패, 버퍼 수위 같은 값이 처음부터 제품 모델에 들어가야 한다. 운영자가 볼 수 없는 P2P 시스템은 사용자가 실패했다고 말할 때까지 고장 난 사실도 모른다.

좋은 지표는 행동을 바꾼다. TURN 사용률이 높으면 네트워크 정책이나 직접 연결 품질을 봐야 하고, 특정 브라우저에서 ICE 실패가 많으면 candidate 수집 흐름을 봐야 한다. 작업 재시도율이 높으면 그리드 작업 단위가 너무 작거나 워커 신뢰 모델이 약한 것이다.""",
        6: f"""기술 상태는 사용자가 이해할 수 있는 문장으로 번역되어야 한다. “ICE checking”은 개발자에게는 의미가 있지만 사용자에게는 “상대와 직접 연결을 시도하고 있습니다”가 더 낫다. “TURN fallback”은 “직접 연결이 어려워 중계 경로로 전환했습니다”가 된다. 제품은 내부 상태를 숨기는 것이 아니라 불안을 줄이는 언어로 바꿔야 한다.

이 번역이 없으면 사용자는 멈춘 화면을 장애로 받아들인다. 반대로 상태가 명확하면 조금 느린 fallback도 견딜 수 있다. PonsLink와 PonsWarp 같은 제품에서 중요한 것은 기술적으로 완벽한 연결보다 사용자가 지금 무슨 일이 일어나는지 이해하는 것이다.""",
        7: f"""PonsLink와 PonsWarp에 대입하면 기준이 더 선명해진다. 상담·회의·요청 흐름은 권한과 기록이 중요하므로 서버가 제어면을 잡는 편이 안전하다. 반면 파일 바이트, 미디어 일부, 임시 작업 조각은 가능한 경우 피어 경로로 옮길 수 있다. 이것이 하이브리드 설계다.

하이브리드 설계의 장점은 실패할 때도 제품이 완전히 무너지지 않는다는 점이다. 직접 연결이 실패하면 릴레이나 클라우드 드롭으로 전환하고, 워커가 떠나면 작업 큐가 조각을 다시 배정하며, 이벤트가 중복되면 idempotency key가 같은 결과로 수렴시킨다.""",
        8: f"""운영 비용과 보안 경계는 P2P 설계의 현실 검증이다. 서버 비용을 줄였다고 해도 TURN, SFU, 재시도 트래픽, 이미지·파일 캐시, 로그 저장 비용이 새로 생긴다. 또한 피어가 데이터를 직접 다루면 개인정보, 악성 payload, 잘못된 결과 제출 같은 보안 질문도 같이 생긴다.

그래서 {question_text} 같은 질문을 구현 전에 답해야 한다. 답이 없으면 기능을 버리라는 뜻이 아니라 안전한 범위를 정하라는 뜻이다. 예를 들어 민감한 데이터는 직접 경로로 보내더라도 암호화와 만료 정책을 갖고, 검증 어려운 계산은 중복 실행이나 서버 검증을 붙인다.""",
        9: f"""실험 단위는 작아야 한다. 하나의 거대한 P2P 전환보다, 직접 연결 성공률 측정, DataChannel로 10MB 전송, 작업 조각 재시도, 상태 머신 전이 검증처럼 분리된 실험이 낫다. 각 실험은 실패해도 되지만 실패 원인을 설명할 수 있어야 한다.

작게 자른 실험은 문서와 코드에도 이롭다. 나중에 SFU를 붙이거나 그리드 워커를 늘리더라도 기존 실험의 경계가 그대로 회귀 테스트가 된다. 이것이 기초 글을 쓰는 이유다. 용어를 암기하기 위해서가 아니라 다음 구현의 기준선을 만들기 위해서다.""",
        10: f"""다음 글로 이어지는 연결점은 명확하다. {principle} 이 기준으로 보면 Mesh, SFU, MCU, TURN, 그리드 컴퓨팅, 상태 머신, 역압, 멱등성은 서로 다른 주제가 아니라 하나의 질문에서 갈라진다. “누가 책임지고, 어디로 흐르고, 실패하면 어떻게 복구하는가”라는 질문이다.

이 질문을 계속 들고 가면 P2P는 단순한 네트워크 기능이 아니라 제품 구조가 된다. 서버는 약속과 기록을 맡고, 피어는 가능한 데이터 이동을 맡고, 운영 시스템은 실패를 관찰하며, UX는 그 상태를 사람이 이해할 수 있게 만든다. 그 균형이 맞을 때 P2P는 비용 절감 장식이 아니라 실제 제품의 기반이 된다.""",
    }
    selected_question = questions[(i - 1) % len(questions)]
    selected_pitfall = pitfalls[(i - 1) % len(pitfalls)]
    practice_note = f"""실무 점검은 한 문장으로 끝나지 않는다. 이 절을 구현 항목으로 바꾸면 먼저 “{selected_question}”에 대한 답을 코드 주석이 아니라 실행 로그와 화면 상태로 남겨야 한다. 또한 “{selected_pitfall}”이 실제로 발생했을 때 사용자가 보는 문장, 운영자가 보는 지표, 시스템이 선택하는 fallback이 서로 맞아야 한다. 이 세 가지가 분리되면 장애 대응은 감으로 흘러가고, 반대로 세 가지가 연결되면 작은 실험도 제품 신뢰로 이어진다.

테스트 관점에서는 정상 경로 하나만 확인하면 부족하다. 직접 연결 성공, 직접 연결 실패 뒤 우회, 중간 이탈, 중복 이벤트, 느린 수신자, 재시도 한계 도달을 각각 독립 케이스로 잡아야 한다. P2P와 실시간 제품의 품질은 가장 빠른 데모가 아니라 가장 설명 가능한 실패에서 드러난다."""
    return f"## {i}. {heading}\n\n{section_bodies[i]}\n\n{practice_note}\n"
def content(t):
    slug,title,excerpt,tags,pub,cover,labels,principle,case,pitfalls,questions=t; clean=title.split('] ')[-1]; a=assets(slug,clean,labels,questions)
    parts=[f"# {clean}\n",f"{excerpt} 이 글은 짧은 용어 풀이가 아니라 PonsLink와 PonsWarp 같은 실시간 제품을 설계할 때 다시 꺼내 볼 수 있는 기초 노트다. 핵심은 하나다. 기술 이름을 외우는 것보다 데이터의 이동 경로, 상태의 책임, 실패했을 때의 복구 경로를 먼저 그려야 한다.\n",img(a[0],clean+" 개념 지도","본문의 핵심 개념을 한 장으로 정리한 개념 지도."),"## 먼저 잡아야 할 관점\n",f"{principle} 이 관점을 놓치면 P2P는 금방 유행어가 된다. 서버를 줄인다는 말은 매력적이지만, 실제 제품에서는 서버가 줄어든 만큼 클라이언트, 네트워크, 운영 로그, 사용자 경험이 더 많은 책임을 가져간다. 그래서 P2P 설계는 언제나 ‘무엇을 직접 연결할 것인가’와 동시에 ‘무엇은 중앙에 남길 것인가’를 묻는다.\n\n제어면과 데이터면을 나눠보면 판단이 쉬워진다. 제어면은 로그인, 권한, 방 생성, 연결 약속, 상태 기록처럼 제품의 규칙을 담당한다. 데이터면은 오디오, 비디오, 파일 조각, 작업 결과처럼 실제 바이트가 흐르는 경로다. 좋은 P2P 제품은 제어면까지 무리하게 없애지 않는다. 대신 데이터면에서 중앙 서버가 꼭 소유하지 않아도 되는 바이트를 피어에게 맡긴다.\n",img(a[1],clean+" 흐름 다이어그램","제어면과 데이터면이 어떻게 나뉘어 흐르는지 보여주는 흐름도.")]
    for i,h in enumerate(SECTION_TITLES,1):
        parts.append(block(principle,case,pitfalls,questions,i,h))
        if i==4: parts.append(img(a[2],clean+" 트레이드오프","복잡도, 비용, 제어권 사이의 균형을 잡는 판단표."))
        if i==8: parts.append(img(a[3],clean+" 체크리스트","구현 전에 반드시 답해야 할 질문을 모은 체크리스트."))
    parts += ["## 구현 전에 보는 체크리스트\n",*(f"- {q}\n" for q in questions),"- 실패 상태가 사용자에게 보이는 문장으로 번역되어 있는가\n- 직접 연결 실패, 릴레이 전환, 작업 재시도, 권한 만료가 서로 다른 로그로 남는가\n- 이 설계가 서버 비용을 줄이는 대신 사용자 장치에 어떤 부담을 주는지 설명할 수 있는가\n","## 마무리\n",f"{clean}를 이해한다는 것은 단어를 외웠다는 뜻이 아니다. {principle} 이 한 문장을 제품 요구사항, 데이터 경로, 실패 복구, 비용 구조로 풀어낼 수 있어야 한다. 그래야 P2P가 장식이 아니라 제품을 지탱하는 구조가 된다. 이 글의 그림들은 일부러 단순하게 그렸다. 실제 시스템은 더 복잡하지만, 처음부터 복잡한 그림을 보면 중요한 경계가 흐려진다. 먼저 다섯 개 안팎의 상자와 네 개 안팎의 화살표로 책임을 설명할 수 있어야 한다. 그 다음에 NAT, TURN 비용, SFU 운영, 워커 검증, 상태 머신 같은 세부 항목을 추가하는 편이 훨씬 안전하다.\n"]
    body='\n'.join(parts); assert len(body)>=10000,(slug,len(body)); return body
def upsert(conn,t,body):
    slug,title,excerpt,tags,pub,cover,*_=t; now=dt.datetime.utcnow().isoformat(timespec='milliseconds')+'Z'; rid=post_id(slug); rt=max(10,round(len(body)/520))
    conn.execute("""INSERT INTO Post (id,slug,title,excerpt,content,category,tags,coverColor,featuredImage,status,readingTime,views,authorId,authorName,publishedAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,'published',?,0,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,excerpt=excluded.excerpt,content=excluded.content,category=excluded.category,tags=excluded.tags,coverColor=excluded.coverColor,featuredImage=excluded.featuredImage,status=excluded.status,readingTime=excluded.readingTime,authorId=excluded.authorId,authorName=excluded.authorName,publishedAt=excluded.publishedAt,updatedAt=excluded.updatedAt""",(rid,slug,title,excerpt,body,"개발 회고",tags,"#7c5f43",cover,rt,AUTHOR_ID,AUTHOR_NAME,pub,pub,now))
    actual_post_id = conn.execute("SELECT id FROM Post WHERE slug=?", (slug,)).fetchone()[0]
    conn.execute("""INSERT INTO PostTaxonomy (id,postId,nodeId,role,sortOrder) VALUES (?,?,?,'primary',0) ON CONFLICT(postId,nodeId,role) DO UPDATE SET sortOrder=excluded.sortOrder""",(f"pt-{actual_post_id}-{TAXONOMY_ID}",actual_post_id,TAXONOMY_ID))
def main():
    db=Path(sys.argv[1]) if len(sys.argv)>1 else Path("db/custom.db"); conn=sqlite3.connect(db); conn.execute("PRAGMA foreign_keys=ON")
    try:
        for t in TOPICS: upsert(conn,t,content(t))
        conn.commit(); rows=conn.execute("SELECT slug,length(content),readingTime,featuredImage FROM Post WHERE slug LIKE '2026-06-16-p2p-%' ORDER BY slug").fetchall()
    finally: conn.close()
    for r in rows: print(r)
if __name__=="__main__": main()
