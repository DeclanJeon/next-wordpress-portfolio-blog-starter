#!/usr/bin/env python3
import sqlite3, re, time
from pathlib import Path

DB=Path('db/custom.db')
ORDER=[
('2026-06-16-p2p-00-grid-computing-first-step','이 질문은 두 갈래로 갈라졌다. 하나는 사람들이 계정 없이 만나는 방, 다른 하나는 큰 파일이 무너지지 않고 흐르는 길이었다. 먼저 방의 이야기부터 따라가면 된다.'),
('2026-06-16-ponslink-00-link-only-room','링크 하나로 들어오는 방은 가벼워 보였지만, 그 방이 왜 필요했는지는 한 번 놓친 연결의 기억에서 더 선명해졌다.'),
('2026-06-16-ponslink-01-why-i-came-back-to-connection','그 다음 질문은 단순했다. 연결의 감정은 있었는데, 제품은 어디서 시작해야 할까. 나는 설명보다 먼저 방을 만들었다.'),
('2026-06-16-ponslink-01b-room-before-product','방을 먼저 만들고 나니 링크 뒤에서 신호가 어떻게 오가야 하는지가 문제로 올라왔다. 겉은 단순해야 했지만 속은 그렇지 않았다.'),
('2026-06-16-ponslink-02b-signal-behind-link','연결이 붙고 나니 말만으로는 부족한 순간들이 보였다. 그래서 방은 통화 화면이 아니라 공유 작업대로 커지기 시작했다.'),
('2026-06-16-ponslink-04b-room-grew-with-context','방에 기능이 붙는 이유는 개인적인 사용 장면에서도 나왔다. 같은 파일을 보고 같은 시간을 공유하고 싶어서 PonsCast가 생겼다.'),
('2026-06-16-ponslink-04c-ponscast-same-time','하지만 좋은 방만으로는 실제 약속이 굴러가지 않았다. 방 밖의 요청, 예약, 결제, 상태가 다음 문제로 튀어나왔다.'),
('2026-06-16-ponslink-07b-good-room-not-enough','운영 흐름을 붙일수록 파일 전송은 더 무거운 문제로 보였다. 결국 파일 전송은 방 안에 계속 둘 수 없었다.'),
('2026-06-16-ponslink-09b-file-transfer-left-room','파일 전송을 밖으로 떼어내고 나서야 PonsLink가 무엇을 남겨야 하는지도 보였다. 회의 앱보다 연결 방식에 가까웠다.'),
('2026-06-16-ponslink-12b-connection-method','여기서 이야기는 PonsWarp로 넘어간다. PonsLink 안에서 먼저 고장난 파일 전송이 별도 제품의 출발점이 됐다.'),
('2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink','파일 전송을 분리하자 첫 기준은 분명했다. 서버가 파일을 갖지 않는 전송이어야 했다.'),
('2026-06-29-main-ponswarp-01-server-does-not-own-file','서버가 파일을 들지 않게 하려면 브라우저끼리 직접 보내야 했다. 하지만 브라우저 직접 전송은 말처럼 단순하지 않았다.'),
('2026-06-29-ponswarp-01-browser-direct-transfer','직접 전송을 더 크게 상상하자 TB급 파일과 데이터 그리드라는 질문이 나왔다. 파일은 덩어리가 아니라 흐름이었다.'),
('2026-06-29-ponswarp-01b-data-grid-tb-experiment','그 상상을 구현하려고 데스크탑 앱과 Rust/WASM까지 갔지만, 테스트 환경 자체가 피로해졌다. 그래서 먼저 웹에서 안정화하기로 했다.'),
('2026-06-29-ponswarp-02b-desktop-testing-fatigue','웹으로 돌아오자 WebRTC가 해주는 일과 해주지 않는 일이 갈라졌다. WebRTC는 파일을 보내주는 게 아니라 길을 열어줄 뿐이었다.'),
('2026-06-29-ponswarp-03-webrtc-opens-the-road','길이 열려도 전송은 쉽게 무너졌다. ACK 하나와 backpressure 하나가 전송을 멈추고 다시 살렸다.'),
('2026-06-29-ponswarp-04b-ack-backpressure-battle','흐름 제어를 붙이고 나니 다음 벽은 브라우저 메모리였다. 2GB를 넘기자 전송보다 저장이 먼저 무너졌다.'),
('2026-06-29-ponswarp-05b-browser-memory-2gb','메모리 문제를 피하려고 IndexedDB를 떠올렸고, 결국 OPFS를 마지막 안전망으로 보게 됐다.'),
('2026-06-29-ponswarp-05c-opfs-safety-net','저장 경계가 보이자 Rust와 WASM도 속도 욕심이 아니라 메모리 생존의 문제로 다시 보였다.'),
('2026-06-29-ponswarp-06b-rust-wasm-memory-survival','이 모든 선택을 지나고 나서 PonsWarp는 파일 전송 버튼이 아니라 실패를 견디는 흐름에 가까워졌다.'),
('2026-06-29-ponswarp-12b-flow-that-survives-failure','이 흐름은 다시 P2P와 그리드 컴퓨팅의 질문으로 돌아간다. 아직 완성은 아니지만, 어떤 경계부터 다뤄야 하는지는 훨씬 선명해졌다.'),
]

NAV_RE=re.compile(r'\n(?:다음 글부터는 이 질문이 각각 어떻게 갈라졌는지 따라가면 된다\.\n\n- \[\[PonsLink\].*?ponswarp-00-file-transfer-broke-in-ponslink\)\n\n)?---\n\n## 이어지는 글\n.*?$', re.S)

def label(title):
    return title.replace('[PonsLink] ', 'PonsLink: ').replace('[PonsWarp] ', 'PonsWarp: ').replace('[P2P] ', 'P2P: ')

def link(title, slug):
    return f'[{label(title)}](/writing/{slug})'

con=sqlite3.connect(DB)
con.row_factory=sqlite3.Row
rows={r['slug']:dict(r) for r in con.execute("select slug,title,content from Post where status='published'")}
missing=[s for s,_ in ORDER if s not in rows]
if missing:
    raise SystemExit(f'missing posts: {missing}')
now=int(time.time()*1000)
for idx,(slug, bridge) in enumerate(ORDER):
    prev_slug=ORDER[idx-1][0] if idx>0 else None
    next_slug=ORDER[idx+1][0] if idx+1<len(ORDER) else None
    row=rows[slug]
    content=NAV_RE.sub('', row['content'].rstrip())
    lines=['---','','## 이어지는 글','',bridge,'']
    if slug == '2026-06-16-p2p-00-grid-computing-first-step':
        lines.append(f'- PonsLink 갈래: {link(rows["2026-06-16-ponslink-00-link-only-room"]["title"], "2026-06-16-ponslink-00-link-only-room")}')
        lines.append(f'- PonsWarp 갈래: {link(rows["2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink"]["title"], "2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink")}')
    else:
        if prev_slug:
            lines.append(f'- 이전 글: {link(rows[prev_slug]["title"], prev_slug)}')
        if next_slug:
            lines.append(f'- 다음 글: {link(rows[next_slug]["title"], next_slug)}')
    content=content.rstrip()+'\n\n'+'\n'.join(lines).rstrip()+'\n'
    con.execute('update Post set content=?, updatedAt=? where slug=?',(content,now,slug))
con.commit()
print({'updated':len(ORDER),'first':ORDER[0][0],'last':ORDER[-1][0]})
