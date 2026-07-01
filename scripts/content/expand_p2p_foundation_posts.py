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
    return f"""## {i}. {heading}\n\n{principle} 이 문장을 실제 제품 설계에 적용하려면 먼저 책임의 경계를 나눠야 한다. 연결을 여는 책임, 데이터를 운반하는 책임, 실패를 감지하는 책임, 사용자가 이해할 수 있는 상태로 번역하는 책임은 서로 다르다. 한곳에 몰아두면 구현은 빨라 보이지만 장애가 났을 때 원인을 찾기 어렵고, 너무 빨리 흩어두면 작은 기능 하나에도 운영 비용이 따라붙는다.\n\n구체적인 장면으로 보면 {case}을 생각할 수 있다. 여기서 중요한 것은 기술 이름이 아니라 데이터가 어디서 만들어지고, 어디를 통과하며, 누가 결과를 믿을 수 있게 만드는가다. P2P를 붙였다고 해서 모든 것이 자동으로 분산되는 것은 아니다. 서버가 약속을 만들고, 피어가 바이트를 옮기고, 검증 로직이 결과를 확인하는 식으로 역할을 분리해야 한다.\n\n실패 사례도 같이 봐야 한다. 대표적인 함정은 {'; '.join(pitfalls)}이다. 이 문제들은 대부분 코드 몇 줄의 버그가 아니라 설계 단계에서 관찰 가능성과 fallback을 빼먹었을 때 생긴다. 그래서 처음부터 상태 로그, 전환 조건, 재시도 한계, 사용자 메시지를 같이 잡아야 한다.\n\n설계 회의에서 바로 던져야 할 질문은 {'; '.join(questions)}이다. 답이 흐리면 구현을 미루라는 뜻이 아니라, 최소한 실험 범위를 작게 잘라야 한다는 뜻이다. 실제 사용자 흐름이 있는 제품에서는 전체 기능을 한 번에 P2P화하지 않고, 파일 조각 하나, candidate 교환 하나, 상태 전이 하나처럼 관찰 가능한 단위부터 검증하는 편이 안전하다.\n"""
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
