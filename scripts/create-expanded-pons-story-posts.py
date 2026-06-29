# allow: SIZE_OK — one-off content generation script with embedded post dataset.
#!/usr/bin/env python3
from __future__ import annotations

import html
import math
import re
import shutil
import sqlite3
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'db' / 'custom.db'
BACKUP_DIR = ROOT / 'db' / 'backups'
COVER_DIR = ROOT / 'public' / 'tistory' / 'pons-story-inserts' / 'covers'
DIAGRAM_DIR = ROOT / 'public' / 'tistory' / 'pons-story-inserts' / 'diagrams'
AUTHOR_ID = 'ponslink-content'
AUTHOR_NAME = 'PonsLink'

FORBIDDEN_HONORIFIC = re.compile(r'(합니다|했습니다|됩니다|되었습니다|있습니다|없습니다|입니다|드립니다|주세요|하십시오)')
COMMIT_HASH = re.compile(r'\b[0-9a-f]{7,40}\b', re.I)
FUNCTION_LIKE = re.compile(r'\b[A-Za-z_$][A-Za-z0-9_$]*\s*\(')


def estimate_reading_time(content: str) -> int:
    code_lines = 0
    def remove_code(match: re.Match[str]) -> str:
        nonlocal code_lines
        code_lines += max(0, len(match.group(0).splitlines()) - 2)
        return ' '
    text = re.sub(r'```[\s\S]*?```', remove_code, content)
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'[`*_~>#|\-\[\]()!]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    korean = len(re.findall(r'[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7af\ud7b0-\ud7ff\u3040-\u30ff\u4e00-\u9fff]', text))
    latin = len(re.findall(r"\b[A-Za-z][A-Za-z0-9'’.-]*\b", text))
    return max(1, math.ceil(korean / 550 + latin / 220 + code_lines / 20))


def esc(value: str) -> str:
    return html.escape(value, quote=False)


def write_cover(post: dict, index: int) -> str:
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    file = COVER_DIR / f"{post['slug']}.svg"
    nodes = post['cover_nodes']
    node_svg = []
    line_svg = []
    for i, node in enumerate(nodes):
        x = 150 + i * 210
        y = 400 if i % 2 == 0 else 292
        node_svg.append(f'<g><circle cx="{x}" cy="{y}" r="58" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.58)" stroke-width="2"/><text x="{x}" y="{y+7}" text-anchor="middle" font-size="22" font-weight="700" fill="#fff" font-family="Inter, Arial, sans-serif">{esc(node)}</text></g>')
        if i:
            px = 150 + (i - 1) * 210
            py = 400 if (i - 1) % 2 == 0 else 292
            line_svg.append(f'<path d="M {px+62} {py} C {px+125} {py-90}, {x-125} {y+90}, {x-62} {y}" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="4" stroke-linecap="round"/>')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{post['accent']}"/><stop offset="1" stop-color="{post['secondary']}"/></linearGradient>
    <radialGradient id="glow" cx="76%" cy="18%" r="72%"><stop offset="0" stop-color="rgba(255,255,255,0.35)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>
    <filter id="soft"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="rgba(0,0,0,0.28)"/></filter>
  </defs>
  <rect width="1200" height="630" rx="42" fill="url(#bg)"/>
  <rect width="1200" height="630" rx="42" fill="url(#glow)"/>
  <path d="M0 536 C170 475 326 590 514 530 C738 458 905 416 1200 492 L1200 630 L0 630 Z" fill="rgba(0,0,0,0.20)"/>
  <g filter="url(#soft)">
    <text x="72" y="92" font-size="22" fill="rgba(255,255,255,0.76)" font-family="Inter, Arial, sans-serif">PonsLink Blog · Story Insert {index:02d}</text>
    <text x="72" y="166" font-size="54" font-weight="850" fill="#fff" font-family="Inter, Arial, sans-serif">{esc(post['cover_title'])}</text>
    <text x="72" y="218" font-size="27" fill="rgba(255,255,255,0.84)" font-family="Inter, Arial, sans-serif">{esc(post['cover_subtitle'])}</text>
  </g>
  {''.join(line_svg)}
  {''.join(node_svg)}
</svg>'''
    file.write_text(svg, encoding='utf-8')
    return f"/tistory/pons-story-inserts/covers/{post['slug']}.svg"


def write_diagram(post: dict) -> str:
    DIAGRAM_DIR.mkdir(parents=True, exist_ok=True)
    file = DIAGRAM_DIR / f"{post['slug']}-diagram.svg"
    nodes = post['diagram_nodes']
    width = 1040
    height = 390
    step = (width - 170) / max(1, len(nodes) - 1)
    node_svg = []
    arrow_svg = []
    for i, node in enumerate(nodes):
        x = 85 + step * i
        node_svg.append(f'<g><rect x="{x-76}" y="154" width="152" height="76" rx="18" fill="#fff" stroke="{post["accent"]}" stroke-width="2"/><text x="{x}" y="197" text-anchor="middle" font-size="18" font-weight="720" fill="#111827" font-family="Inter, Arial, sans-serif">{esc(node)}</text></g>')
        if i:
            px = 85 + step * (i - 1)
            arrow_svg.append(f'<path d="M {px+82} 192 L {x-84} 192" stroke="{post["secondary"]}" stroke-width="3" marker-end="url(#arrow)"/>')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="{post['secondary']}"/></marker></defs>
  <rect width="{width}" height="{height}" rx="30" fill="#f8fafc"/>
  <rect x="18" y="18" width="{width-36}" height="{height-36}" rx="24" fill="none" stroke="#e2e8f0"/>
  <text x="42" y="64" font-size="25" font-weight="850" fill="#111827" font-family="Inter, Arial, sans-serif">{esc(post['diagram_title'])}</text>
  <text x="42" y="100" font-size="17" fill="#64748b" font-family="Inter, Arial, sans-serif">{esc(post['diagram_caption'])}</text>
  {''.join(arrow_svg)}
  {''.join(node_svg)}
</svg>'''
    file.write_text(svg, encoding='utf-8')
    return f"/tistory/pons-story-inserts/diagrams/{post['slug']}-diagram.svg"


POSTS = [
    {
        'slug': '2026-06-16-ponslink-00-link-only-room',
        'title': '[PonsLink] 계정 없이 링크 하나로 만나는 방을 만들고 싶었다',
        'excerpt': 'PonsLink의 첫 감각은 화려한 회의 앱이 아니라, 개인정보를 먼저 요구하지 않는 링크 기반 연결이었다.',
        'category': 'PonsLink', 'tags': 'PonsLink,Product Retrospective,Room,Link First,No Login',
        'publishedAt': 1781535630000, 'accent': '#1d4ed8', 'secondary': '#0f172a',
        'cover_title': 'Link before profile', 'cover_subtitle': '먼저 묻지 않고, 먼저 이어지는 방', 'cover_nodes': ['링크', '로비', '방', '대화'],
        'diagram_title': '처음 원했던 연결 방식', 'diagram_caption': '계정과 프로필보다 링크와 방을 먼저 두는 흐름이었다.', 'diagram_nodes': ['링크 공유', '닉네임', '로비', '룸'],
        'body': '''처음부터 거창한 회의 SaaS를 만들고 싶었던 건 아니었다. 그냥 링크 하나로 누군가와 바로 이어지고 싶었다.

연결 전에 이메일을 요구하고, 프로필을 만들게 하고, 이것저것 동의를 받게 하면 이미 부담이 생긴다. 내가 원했던 건 그 반대였다. 상대가 링크를 누르고, 자기 이름 정도만 정하고, 바로 같은 방에 들어오는 경험이었다.

![링크 중심 진입 흐름](__DIAGRAM__)

## 개인정보보다 먼저 방이 있어야 했다

PonsLink의 초기는 제품 설명보다 방이 먼저였다. 누군가에게 링크를 보내면 그 사람이 들어와서 카메라를 켜고, 말하고, 채팅하고, 필요한 자료를 주고받는 장면이 먼저 필요했다. 이때의 핵심은 회원 관리가 아니라 부담을 낮추는 일이었다.

물론 나중에는 요청, 예약, 기록, 결제 같은 운영 기능이 들어왔다. 그래도 원형은 바뀌지 않았다. PonsLink의 가장 오래된 감각은 “너 누구야?”를 먼저 묻지 않고 “일단 여기서 만나자”라고 말하는 쪽에 가까웠다.

## 링크는 가볍지만, 책임은 가볍지 않았다

링크 기반 진입은 겉으로 가벼워 보인다. 하지만 내부에서는 방 이름, 참가자 상태, 미디어 권한, 게스트 식별, 입장 조건이 다 맞아야 한다. 링크 하나로 들어온다는 말은 제품이 책임질 일이 줄어든다는 뜻이 아니었다. 오히려 사용자가 신경 쓰지 않아도 되게 내부 책임을 더 많이 가져간다는 뜻이었다.

그때는 이걸 다 말로 정리하지 못했다. 그냥 방이 먼저 열려야 한다고 느꼈다. 지금 돌아보면 그 감각이 PonsLink의 방향을 꽤 오래 끌고 갔다.'''},
    {
        'slug': '2026-06-16-ponslink-01b-room-before-product',
        'title': '[PonsLink] 나는 먼저 방을 만들었다, 제품 설명은 그다음이었다',
        'excerpt': 'PonsLink는 랜딩보다 룸이 먼저였다. 제품의 첫 얼굴은 설명 문장이 아니라 실제로 들어갈 수 있는 방이었다.',
        'category': 'PonsLink', 'tags': 'PonsLink,Product Retrospective,Room Page,WebRTC',
        'publishedAt': 1781535690000, 'accent': '#2563eb', 'secondary': '#312e81',
        'cover_title': 'Room came first', 'cover_subtitle': '설명보다 먼저 작동하는 공간이 필요했다', 'cover_nodes': ['Room', 'Chat', 'Board', 'Media'],
        'diagram_title': 'Room shell이 먼저 생긴 이유', 'diagram_caption': '제품 설명보다 사용자가 머무를 구조가 먼저 필요했다.', 'diagram_nodes': ['Lobby', 'Room shell', 'Chat', 'Board', 'Media'],
        'body': '''PonsLink는 랜딩보다 룸이 먼저였다. 제품을 멋지게 설명하기 전에, 사람이 실제로 들어가서 머물 수 있는 공간이 있어야 했다.

처음 코드를 다시 보면 방, 로비, 채팅, 화이트보드 같은 조각들이 빠르게 등장한다. 그때 내가 붙잡고 있던 질문은 “이걸 어떻게 팔까?”가 아니었다. “링크를 받은 사람이 들어왔을 때 어디에 서 있어야 하지?”에 가까웠다.

![Room shell 구조](__DIAGRAM__)

## 제품의 첫 화면은 설명이 아니라 체험이었다

회의 도구는 설명만으로 설득하기 어렵다. 사용자는 버튼을 눌렀을 때 방이 열리는지, 상대가 보이는지, 내 상태가 안전하게 보이는지로 판단한다. 그래서 룸 페이지는 단순한 기능 화면이 아니라 제품의 첫 신뢰 테스트였다.

그 방 안에는 채팅이 있어야 했고, 말로 부족한 순간을 위한 보드가 있어야 했고, 상대와 같은 자료를 볼 수 있는 공간도 필요했다. 기능이 먼저라기보다 방이라는 컨테이너가 먼저였고, 기능은 그 안에서 자연스럽게 자리를 찾았다.

## 지금 보면 서툴렀지만 방향은 분명했다

초기 PonsLink는 제품 문장이 약했다. 누구를 위한 서비스인지, 어떤 시장을 겨냥하는지, 어떤 가격을 받을지 흐릿했다. 그래도 방을 먼저 만든 건 틀리지 않았다. 실시간 제품은 말로 정의하기 전에 몸으로 들어가 보는 순간이 필요하다.

나중에 request-first로 방향을 바꾸면서도 이 판단은 남았다. 요청을 먼저 받더라도 결국 사용자가 도착하는 곳은 방이다. PonsLink의 제품성은 그 방에서 무너지거나 살아난다.'''
    },
    {
        'slug': '2026-06-16-ponslink-02b-signal-behind-link',
        'title': '[PonsLink] 링크는 단순했지만, 뒤에서는 신호가 계속 엉켰다',
        'excerpt': '사용자에게는 링크 하나지만, 내부에서는 방 참가와 신뢰 경계와 연결 순서가 계속 부딪혔다.',
        'category': 'PonsLink', 'tags': 'PonsLink,Product Retrospective,Signaling,WebRTC,Trust Boundary',
        'publishedAt': 1781535750000, 'accent': '#0e7490', 'secondary': '#134e4a',
        'cover_title': 'A simple link hides signals', 'cover_subtitle': '링크 하나 뒤에서 조인 순서와 신뢰 경계가 싸웠다', 'cover_nodes': ['링크', '신호', '권한', '연결'],
        'diagram_title': '링크 뒤의 실제 책임', 'diagram_caption': '사용자는 링크만 보지만 제품은 signaling, TURN, session 경계를 챙겨야 한다.', 'diagram_nodes': ['Guest link', 'Join check', 'Signal', 'TURN', 'Peer'],
        'body': '''사용자에게는 링크 하나면 충분해 보인다. 하지만 내부에서는 누가 방에 들어왔는지, 조인이 끝났는지, 어떤 신호를 믿어도 되는지가 계속 문제였다.

WebRTC는 마법처럼 두 브라우저를 붙여주는 기술이 아니다. 서로를 찾고, 연결 후보를 교환하고, 네트워크가 막히면 우회로를 찾고, 방에 들어올 자격이 있는지도 따로 봐야 한다. 링크가 단순할수록 내부 신호는 더 엄격해야 했다.

![링크 뒤 신호 경계](__DIAGRAM__)

## 직접 연결은 서버가 없어도 된다는 뜻이 아니었다

P2P라는 말을 쓰면 서버가 아무 역할도 하지 않는다고 오해하기 쉽다. 실제로는 반대에 가깝다. 파일이나 미디어 바이트를 서버가 들고 있지 않게 하려면, 연결을 시작하는 신호와 권한의 경계가 더 정확해야 한다.

PonsLink의 signaling 쪽 기록을 보면 방 참가, 상태 동기화, TURN 경계, 공개룸 조인 같은 문제가 반복해서 나타난다. 이것들은 화면에서는 잘 보이지 않지만, 사용자가 “왜 안 들어가져?”라고 느끼는 순간 바로 제품 문제가 된다.

## 링크의 가벼움은 내부의 무거움으로 유지된다

링크 기반 제품을 만들면서 배운 건 이거다. 사용자의 입구를 가볍게 만들려면 내부는 더 무거운 책임을 져야 한다. 세션, 권한, 조인 순서, 연결 실패 처리가 뒤에서 버텨야 앞에서는 단순한 링크처럼 보인다.

그래서 PonsLink의 초반 고생은 연결 기술의 고생이면서 동시에 제품 톤의 고생이었다. 겉은 가볍게, 속은 신중하게. 이 균형을 잡는 데 시간이 꽤 걸렸다.'''
    },
    {
        'slug': '2026-06-16-ponslink-04b-room-grew-with-context',
        'title': '[PonsLink] 말로 부족한 순간마다 방에 기능이 하나씩 붙었다',
        'excerpt': '파일전송, 화이트보드, 통역, 회의록은 기능 욕심이 아니라 대화의 맥락을 끊지 않기 위한 장치였다.',
        'category': 'PonsLink', 'tags': 'PonsLink,Product Retrospective,Whiteboard,Translation,Meeting Records',
        'publishedAt': 1781535860000, 'accent': '#7c3aed', 'secondary': '#1e1b4b',
        'cover_title': 'Context kept growing', 'cover_subtitle': '대화가 막힐 때마다 방은 작업대가 됐다', 'cover_nodes': ['대화', '보드', '통역', '기록'],
        'diagram_title': '대화 중 생긴 문제와 붙은 기능', 'diagram_caption': '각 기능은 따로 놀기보다 방의 맥락을 지키는 역할이었다.', 'diagram_nodes': ['말로 부족', '그리기', '언어 장벽', '회의록', '자료 공유'],
        'body': '''화이트보드는 회의 앱에 멋을 내려고 넣은 게 아니었다. 말로 설명하다 막히는 순간, 그림을 그릴 곳이 필요했다.

파일 전송도 비슷했다. 대화하다 보면 “이거 봐봐”라는 순간이 온다. 그때 다른 메신저를 열고, 파일을 따로 보내고, 다시 회의방으로 돌아오면 맥락이 끊긴다. PonsLink의 기능 확장은 기능 욕심이라기보다 이 끊김을 줄이려는 시도였다.

![대화 문제와 기능 매핑](__DIAGRAM__)

## 방은 통화 화면이 아니라 공유 작업대가 됐다

채팅은 말로 놓친 것을 남겼다. 화이트보드는 설명을 그림으로 바꿨다. 통역과 자막은 언어가 다른 사람이 같은 대화에 머물게 했다. 회의록은 지나간 대화를 다시 찾게 했다. 파일 전송과 스트리밍은 자료를 방 안에 붙잡아 두려는 시도였다.

이렇게 쓰면 기능이 많아 보인다. 실제로 많았다. 하지만 내가 원했던 건 기능 목록이 아니었다. 하나의 방에서 커뮤니케이션이 끝나면 좋겠다는 감각이었다. 대화 중에 필요한 도구가 방 밖으로 새지 않게 하고 싶었다.

## 문제는 무게였다

기능이 붙을수록 방은 강해졌지만 동시에 무거워졌다. 미디어, 데이터채널, 파일, 자막, 회의록이 한꺼번에 움직이면 실시간 방은 쉽게 복잡해진다. 사용자는 하나의 방으로 느끼지만 내부에서는 서로 다른 속도의 작업이 같이 달린다.

이때부터 PonsLink는 선택을 해야 했다. 방 안에 남겨야 할 기능과 밖으로 분리해야 할 기능을 나눠야 했다. 나중에 파일 전송이 PonsWarp로 독립한 것도 이 무게 때문이었다.'''
    },
    {
        'slug': '2026-06-16-ponslink-04c-ponscast-same-time',
        'title': '[PonsLink] PonsCast는 같은 시간을 공유하고 싶어서 만든 기능이었다',
        'excerpt': 'PonsCast는 화면공유 개선이 아니라, 언어가 다른 사람과 같은 파일을 보며 같은 시간을 보내고 싶었던 경험에서 나왔다.',
        'category': 'PonsLink', 'tags': 'PonsLink,Product Retrospective,PonsCast,CoWatch,Translation',
        'publishedAt': 1781535880000, 'accent': '#db2777', 'secondary': '#831843',
        'cover_title': 'Same time, different words', 'cover_subtitle': '같은 장면을 보면서 각자의 언어로 이해하고 싶었다', 'cover_nodes': ['파일', '동기화', '자막', '함께'],
        'diagram_title': 'PonsCast가 방 안에 있어야 했던 이유', 'diagram_caption': '파일 선택부터 재생 동기화와 자막까지 같은 세션 안에 묶는다.', 'diagram_nodes': ['파일 선택', '메타 공유', '버퍼 준비', '동기 재생', '자막'],
        'body': '''PonsCast는 “화면 공유를 더 잘하자”에서 시작한 기능이 아니었다. 언어가 다른 사람과 같은 파일을 보고, 같은 장면을 지나가고, 같은 시간을 보내고 싶어서 나온 기능이었다.

당시 나는 일본 여자친구와 통신하면서 서로의 취미를 교환하는 일이 많았다. 내가 가진 파일을 같이 보고 싶었고, 상대는 자기 언어로 이해했으면 했다. 말이 완벽히 통하지 않으니 같은 화면과 각자의 언어가 필요했다.

![PonsCast 동기화 흐름](__DIAGRAM__)

## 화면을 공유하는 것과 시간을 공유하는 것은 달랐다

그냥 화면을 공유하면 상대는 내 화면을 보는 사람이 된다. 하지만 내가 원했던 건 같이 보는 경험이었다. 같은 파일을 열고, 같은 타임라인을 지나가고, 자막이나 설명을 각자 이해할 수 있는 형태가 필요했다.

그래서 PonsCast는 파일 미리보기가 아니라 방 안의 동기화 가능한 방송 레이어에 가까워졌다. 송신 쪽에서 파일을 고르고, 수신 쪽이 버퍼를 준비하고, 재생 상태가 맞춰지고, 자막과 오디오가 방의 다른 미디어와 충돌하지 않아야 했다.

## 개인적인 문제는 제품의 요구사항이 됐다

이 이야기를 공개 글에 넣을 때 조심해야 한다. 중요한 건 사적인 에피소드가 아니라 그 경험이 어떤 요구사항으로 바뀌었는지다. 언어 장벽, 같은 시간, 같은 파일, 각자의 이해 방식. 이 네 가지가 PonsCast를 방 안에 붙잡아 둔 이유였다.

지금 돌아보면 PonsCast는 PonsLink에서 가장 개인적인 기능이었다. 동시에 가장 제품적인 기능이기도 했다. 누군가와 같은 시간을 공유하고 싶다는 문제는 생각보다 많은 협업 도구의 밑바닥에 깔려 있다.'''
    },
    {
        'slug': '2026-06-16-ponslink-07b-good-room-not-enough',
        'title': '[PonsLink] 좋은 방만으로는 실제 약속이 굴러가지 않았다',
        'excerpt': '방이 좋아져도 누가 왜 들어오는지, 언제 들어오는지, 끝나고 무엇이 남는지가 없으면 제품은 운영되지 않았다.',
        'category': 'PonsLink', 'tags': 'PonsLink,Product Retrospective,Request First,Meeting Records,Operations',
        'publishedAt': 1781536050000, 'accent': '#059669', 'secondary': '#064e3b',
        'cover_title': 'A room is not enough', 'cover_subtitle': '좋은 방보다 먼저 좋은 약속 흐름이 필요했다', 'cover_nodes': ['요청', '검토', '입장', '기록'],
        'diagram_title': '방 밖의 운영 흐름', 'diagram_caption': '요청과 승인, 세션 접근, 회의록이 방 전후를 받쳐야 했다.', 'diagram_nodes': ['요청', '승인', '세션 접근', '룸', '기록'],
        'body': '''방이 좋아져도 실제 약속은 저절로 굴러가지 않았다. 누가 왜 들어오는지 모르면, 좋은 회의방도 그냥 빈 공간이 된다.

처음에는 방의 기능을 안정화하면 제품이 될 줄 알았다. 하지만 사람들은 방에 갑자기 떨어지지 않는다. 누군가는 요청을 보내고, 누군가는 받을지 말지 판단하고, 시간이 정해지고, 끝난 뒤에는 기록이 필요하다.

![요청에서 기록까지](__DIAGRAM__)

## 회의는 방 안에서만 일어나지 않았다

PonsLink가 request-first로 기울어진 이유가 여기에 있다. 영상, 채팅, 화이트보드가 아무리 좋아도 방에 들어오기 전의 맥락이 없으면 운영은 다시 메신저와 캘린더로 흩어진다. 사용자는 방 안에서만 일하지 않는다. 방 앞과 방 뒤에서도 계속 일한다.

그래서 공개 데스크, 요청 검토, 예약, 이메일, 캘린더, 회의록이 중요해졌다. 이것들은 화려한 기능은 아니지만 제품을 실제 사용 흐름으로 묶어준다.

## 좋은 방은 운영의 일부여야 했다

이때 배운 건 조금 아팠다. 내가 공들인 방은 제품의 중심이지만 전부는 아니었다. 방이 잘 만들어져도 요청을 받는 사람이 부담스럽고, 들어오는 사람이 맥락을 모르고, 끝난 뒤 기록이 사라지면 반복 사용으로 이어지기 어렵다.

지금 PonsLink를 보면 방보다 먼저 요청을 받는 흐름이 강조된다. 이건 방을 포기한 게 아니다. 방을 실제 약속 속에 넣기 위해 앞뒤를 만든 것이다.'''
    },
    {
        'slug': '2026-06-16-ponslink-09b-file-transfer-left-room',
        'title': '[PonsLink] 파일 전송은 결국 방 밖으로 독립해야 했다',
        'excerpt': 'PonsLink 안의 파일 전송은 부가 기능처럼 시작했지만, 대용량 전송을 파고들수록 별도 제품의 무게가 됐다.',
        'category': 'PonsLink', 'tags': 'PonsLink,PonsWarp,Product Retrospective,File Transfer',
        'publishedAt': 1781536170000, 'accent': '#ea580c', 'secondary': '#431407',
        'cover_title': 'File transfer left the room', 'cover_subtitle': '방 안의 기능이 독립 제품의 무게가 됐다', 'cover_nodes': ['룸', '파일', '병목', '분리'],
        'diagram_title': '방 UX와 대용량 전송의 충돌', 'diagram_caption': '룸은 가벼워야 했고, 파일 전송은 더 깊은 전용 구조가 필요했다.', 'diagram_nodes': ['룸 맥락', '파일 공유', '대용량', '전송 제어', 'PonsWarp'],
        'body': '''파일 전송은 처음엔 부가 기능처럼 보였다. 회의 중 자료를 보내면 되니까 방 안에 있으면 자연스러웠다.

그런데 대용량 파일을 다루기 시작하면 이야기가 달라진다. 파일을 어떻게 자를지, 어디까지 받았는지, 멈췄을 때 어떻게 이어갈지, 브라우저 메모리를 어떻게 피할지 같은 문제가 방의 다른 기능보다 훨씬 깊었다.

![파일 전송 분리 흐름](__DIAGRAM__)

## 방은 가벼워야 했고, 파일 전송은 깊어져야 했다

PonsLink 안에서 파일 전송을 고치던 흔적을 보면 2GB 이상 전송, 속도 표시, 완료 확인, 중간 저장소 고민 같은 문제가 반복해서 나온다. 이 문제들은 채팅이나 화이트보드처럼 방의 한 패널로 다루기엔 너무 컸다.

방은 사용자가 들어와서 자연스럽게 대화해야 한다. 반면 대용량 파일 전송은 전용 파이프라인, backpressure, 재개, 저장소 전략이 필요하다. 두 요구는 서로 다른 속도로 자란다.

## 그래서 PonsWarp가 필요했다

PonsWarp는 갑자기 나온 새 프로젝트가 아니었다. PonsLink의 파일전송 시스템이 커지면서 방 밖으로 독립한 결과에 가깝다. 방은 연결과 협업을 맡고, PonsWarp는 파일 전송의 깊은 문제를 따로 파고드는 쪽으로 갈라졌다.

지금 보면 이 분리는 늦었지만 필요했다. 모든 것을 한 방 안에 넣으면 제품은 풍성해 보이지만, 각 기능이 요구하는 깊이를 감당하기 어려워진다.'''
    },
    {
        'slug': '2026-06-16-ponslink-12b-connection-method',
        'title': '[PonsLink] 커밋을 다시 보니, 내가 만든 건 회의 앱보다 연결 방식에 가까웠다',
        'excerpt': 'PonsLink의 기록을 다시 보면 기능 목록보다, 사람들이 부담 없이 연결되는 방식을 계속 만진 흔적이 더 크게 보인다.',
        'category': 'PonsLink', 'tags': 'PonsLink,Product Retrospective,Storyline,Connection',
        'publishedAt': 1781536350000, 'accent': '#334155', 'secondary': '#020617',
        'cover_title': 'A way to connect', 'cover_subtitle': '회의 앱보다 연결 방식을 계속 만지고 있었다', 'cover_nodes': ['링크', '룸', '요청', '기록'],
        'diagram_title': 'PonsLink 1부의 흐름', 'diagram_caption': '링크 기반 연결에서 요청 중심 운영으로 중심이 이동했다.', 'diagram_nodes': ['링크', '룸', '협업', '운영', '요청'],
        'body': '''커밋을 다시 보면 기능 목록보다 고민의 방향이 더 잘 보인다. 나는 회의 앱을 만든 게 아니라, 사람들이 부담 없이 연결되는 방식을 계속 만지고 있었다.

처음에는 링크 하나로 들어오는 방이었다. 그다음에는 그 방 안에서 대화, 파일, 화이트보드, 통역, 회의록, PonsCast가 이어지길 바랐다. 나중에는 방 앞뒤의 요청과 운영이 더 중요하다는 것도 알게 됐다.

![PonsLink 흐름 정리](__DIAGRAM__)

## 기능은 계속 바뀌었지만 질문은 비슷했다

어떻게 하면 상대가 덜 부담스럽게 들어올까. 어떻게 하면 대화 중 맥락이 흩어지지 않을까. 어떻게 하면 끝난 뒤에도 기록이 남을까. PonsLink의 기능은 이 질문들에 대한 임시 답이었다.

중간에 너무 많은 것을 방에 넣기도 했다. 파일 전송은 결국 PonsWarp로 분리해야 했고, 제품 설명은 request-first로 다시 잡아야 했다. 그래도 이 시행착오는 흩어진 게 아니라 하나의 방향을 가리킨다.

## 다음 이야기는 파일 전송이다

PonsLink 안에서 가장 무거워진 기능은 파일 전송이었다. 이 기능은 방 안에 남기기엔 너무 깊었고, 별도 제품으로 나눠도 될 만큼 문제가 많았다. 그래서 다음 흐름은 PonsWarp로 이어진다.

PonsLink가 사람을 같은 방에 놓는 문제였다면, PonsWarp는 큰 파일을 안전하게 흘려보내는 문제였다. 둘은 다른 제품처럼 보이지만 뿌리는 같다. 연결을 가볍게 만들고, 실패를 사용자가 덜 느끼게 만드는 일이다.'''
    },
    {
        'slug': '2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink',
        'title': '[PonsWarp] 파일 전송은 PonsLink 안에서 먼저 고장났다',
        'excerpt': 'PonsWarp는 갑자기 나온 파일 전송 서비스가 아니라, PonsLink 안에서 먼저 무거워진 문제를 따로 떼어낸 결과였다.',
        'category': 'PonsWarp', 'tags': 'PonsWarp,PonsLink,Product Retrospective,File Transfer',
        'publishedAt': 1782711270000, 'accent': '#f97316', 'secondary': '#7c2d12',
        'cover_title': 'It broke inside PonsLink', 'cover_subtitle': '파일 전송은 부가 기능에서 독립 문제로 커졌다', 'cover_nodes': ['PonsLink', '파일', '한계', '분리'],
        'diagram_title': 'PonsWarp의 출발점', 'diagram_caption': 'PonsLink 안의 파일 전송 문제가 독립 서비스의 출발점이 됐다.', 'diagram_nodes': ['룸 파일공유', '2GB 문제', '전송 제어', '분리', 'PonsWarp'],
        'body': '''PonsWarp는 갑자기 나온 파일 전송 서비스가 아니었다. PonsLink 안에서 파일 전송이 먼저 고장났고, 그 문제를 더 깊게 파다 보니 독립한 것이다.

회의방 안에서 파일을 보내는 건 자연스럽다. 하지만 파일이 커지는 순간 자연스러움은 사라진다. 브라우저 메모리, 전송 완료 확인, 속도 표시, 끊김 복구가 한꺼번에 튀어나온다.

![PonsWarp 출발점](__DIAGRAM__)

## 방 안의 부가 기능이 아니었다

PonsLink 시절에도 큰 파일을 보내려는 시도가 있었다. 파일을 한 번에 읽지 않고 잘라서 보내는 쪽으로 바꾸고, 수신자가 정말 조립을 끝냈는지 확인하고, 속도 표시가 얼지 않게 다듬는 일이 이어졌다. 이건 단순한 버튼 개선이 아니었다.

파일 전송은 자체 프로토콜을 요구했다. 어디까지 보냈는지, 어디까지 썼는지, 멈추면 어디서 다시 시작해야 하는지, 사용자가 보는 진행률은 무엇을 뜻하는지 정해야 했다.

## 그래서 별도 이름이 필요했다

PonsWarp라는 이름은 이 문제를 따로 보겠다는 선언이었다. PonsLink가 같은 방에 들어오는 문제라면, PonsWarp는 큰 파일이 무사히 건너가는 문제다. 둘은 이어져 있지만 같은 제품 안에서 같은 속도로 자라기 어렵다.

지금 돌아보면 분리는 자연스러운 선택이었다. 방은 사람의 맥락을 다루고, PonsWarp는 파일의 흐름을 다룬다.'''
    },
    {
        'slug': '2026-06-29-ponswarp-01b-data-grid-tb-experiment',
        'title': '[PonsWarp] TB급 전송을 꿈꾸자 데이터 그리드가 필요해졌다',
        'excerpt': 'TB급 전송은 완료된 성과가 아니라 구조 실험의 목표였다. 큰 파일을 격자처럼 나누고 다시 맞추는 사고가 필요했다.',
        'category': 'PonsWarp', 'tags': 'PonsWarp,Product Retrospective,Data Grid,Large File,Architecture',
        'publishedAt': 1782711330000, 'accent': '#dc2626', 'secondary': '#450a0a',
        'cover_title': 'TB as a design pressure', 'cover_subtitle': '성공 주장보다 구조 압력으로 다뤄야 했다', 'cover_nodes': ['파일', '격자', '청크', '재조립'],
        'diagram_title': '데이터 그리드 관점의 전송', 'diagram_caption': '거대한 파일을 작은 단위로 나누고 순서와 무결성을 다시 맞춘다.', 'diagram_nodes': ['File', 'Partition', 'Chunk', 'ACK', 'Rebuild'],
        'body': '''목표가 몇 MB 파일 공유라면 브라우저 UI만 잘 만들면 된다. 그런데 TB급 파일을 상상하는 순간, 문제는 UI가 아니라 구조가 된다.

여기서 TB급은 “이미 다 검증됐다”는 뜻이 아니다. 목표가 그 정도로 커질 때 어떤 구조가 필요해지는지 실험했다는 뜻이다. 큰 파일은 하나의 덩어리로 다루면 안 된다. 잘게 나누고, 순서를 기록하고, 일부가 늦거나 빠져도 다시 맞출 수 있어야 한다.

![데이터 그리드 전송 흐름](__DIAGRAM__)

## 파일을 덩어리가 아니라 흐름으로 봐야 했다

대용량 전송에서 중요한 건 파일 전체가 아니라 이동 중인 조각들이다. 어느 조각이 나갔는지, 어느 조각이 도착했는지, 어디까지 디스크에 쓰였는지, 어떤 조각을 다시 보내야 하는지가 중요해진다.

이 관점이 데이터 그리드에 가까웠다. 하나의 파일을 격자처럼 쪼개고, 각 칸의 상태를 추적하고, 마지막에 다시 하나로 맞춘다. UI는 전송 버튼 하나처럼 보여도 내부에서는 작은 상태들이 계속 움직인다.

## 과장하지 않는 게 중요했다

이 글에서 “TB급”은 마케팅 문구가 아니라 설계 압력으로 써야 한다. 큰 목표를 잡으면 지금 코드의 약한 부분이 빨리 드러난다. ZIP, 버퍼, 재정렬, 저장소, 재개, 무결성이 모두 질문이 된다.

PonsWarp가 Rust와 WASM까지 간 이유도 이 압력 때문이다. 큰 파일을 브라우저 메모리 위에 올려놓고 버티는 방식으로는 오래 갈 수 없었다.'''
    },
    {
        'slug': '2026-06-29-ponswarp-02b-desktop-testing-fatigue',
        'title': '[PonsWarp] 데스크탑 앱까지 갔지만, 테스트할 기기가 없었다',
        'excerpt': 'Tauri, Rust, QUIC 기반 데스크탑 앱은 매력적이었지만 혼자서 실제 P2P를 검증하기에는 테스트 비용이 너무 컸다.',
        'category': 'PonsWarp', 'tags': 'PonsWarp,Product Retrospective,Desktop,Tauri,QUIC,Web First',
        'publishedAt': 1782711390000, 'accent': '#0f766e', 'secondary': '#042f2e',
        'cover_title': 'Desktop detour', 'cover_subtitle': '좋은 구조보다 먼저 테스트 가능한 경로가 필요했다', 'cover_nodes': ['Desktop', 'QUIC', '기기', 'Web'],
        'diagram_title': 'Desktop 경로와 Web-first 경로', 'diagram_caption': '네이티브 성능보다 먼저 혼자 검증 가능한 제품 경로를 택했다.', 'diagram_nodes': ['Tauri 앱', '다중 기기', '모바일 앱 부담', '웹 P2P'],
        'body': '''데스크탑 앱은 기술적으로 그럴듯했다. Tauri, Rust, QUIC, 로컬 디스커버리까지 가면 브라우저 제약을 많이 피할 수 있다.

문제는 그걸 혼자 제대로 테스트하기가 너무 피곤했다는 점이다. P2P 파일 전송은 최소 두 기기가 있어야 체감이 나온다. 내 노트북은 한 대였고, 스마트폰으로 테스트하려면 모바일 앱까지 만들어야 했다.

![Desktop에서 Web-first로](__DIAGRAM__)

## 좋은 기술 경로가 항상 좋은 제품 경로는 아니었다

PonsWarp Desktop 레포에는 네이티브 성능을 향한 흔적이 남아 있다. 100GB 이상 파일, disk-to-disk, QUIC, WebRTC, mDNS 같은 단어들이 나온다. 방향 자체는 매력적이었다. 브라우저가 막는 저장소와 메모리 문제를 네이티브로 피할 수 있기 때문이다.

하지만 제품은 내가 계속 검증할 수 있어야 한다. 혼자 만드는 프로젝트에서 테스트 장비와 설치 경로가 무거워지면 속도가 급격히 떨어진다. 데스크탑 앱은 가능성이 있었지만, 그 순간 나에게는 너무 큰 검증 비용이었다.

## 그래서 웹으로 돌아왔다

결국 먼저 안정화해야 할 것은 웹에서 바로 쓰는 P2P였다. 설치 없이 링크를 열고, 브라우저끼리 파일을 보내고, 실제 사람들이 바로 써볼 수 있는 경로가 필요했다.

이건 데스크탑을 포기했다는 뜻이 아니다. 우선순위를 바꾼 것이다. 먼저 웹에서 전송의 핵심 문제를 안정화하고, 나중에 네이티브가 필요하면 그때 다시 가도 된다. 제품은 가능한 경로에서 살아남아야 한다.'''
    },
    {
        'slug': '2026-06-29-ponswarp-04b-ack-backpressure-battle',
        'title': '[PonsWarp] ACK 하나 때문에 전송이 멈추고 살아났다',
        'excerpt': '보낸 쪽 큐가 비었다는 사실과 받은 쪽 디스크에 저장됐다는 사실은 달랐다. 이 차이가 PonsWarp의 백프래셔를 만들었다.',
        'category': 'PonsWarp', 'tags': 'PonsWarp,Product Retrospective,ACK,Backpressure,WebRTC',
        'publishedAt': 1782711510000, 'accent': '#9333ea', 'secondary': '#3b0764',
        'cover_title': 'ACK is not a detail', 'cover_subtitle': '보낸 것과 저장된 것은 같은 말이 아니었다', 'cover_nodes': ['전송', '버퍼', '쓰기', 'ACK'],
        'diagram_title': 'ACK와 백프래셔 흐름', 'diagram_caption': '수신자가 디스크 쓰기를 감당할 때까지 송신자가 기다려야 한다.', 'diagram_nodes': ['Send', 'Receiver buffer', 'Disk write', 'Partition ACK', 'Next window'],
        'body': '''보낸 쪽의 큐가 비었다고 받은 쪽의 디스크에 저장된 건 아니었다. 이걸 늦게 받아들이면서 ACK와 백프래셔가 계속 다시 설계됐다.

WebRTC DataChannel에는 보낸 쪽 버퍼 상태가 있다. 처음에는 이 값만 보면 충분할 것처럼 느껴진다. 하지만 이건 송신자 쪽 큐일 뿐이다. 수신자가 파일을 실제로 쓰고 있는지, 저장소가 밀리고 있는지는 다른 문제다.

![ACK와 백프래셔](__DIAGRAM__)

## 전송 속도보다 저장 속도가 먼저 막혔다

네트워크가 빠르면 좋은 줄 알았다. 그런데 수신자의 디스크 쓰기나 브라우저 저장 전략이 느리면 빠른 네트워크는 오히려 문제를 만든다. 데이터가 수신 쪽에 쌓이고, 메모리가 올라가고, 어느 순간 전송이 멈추거나 파일이 깨진다.

그래서 수신자가 힘들면 멈추라고 말해야 했다. 일정량 이상 버퍼가 쌓이면 PAUSE를 보내고, 충분히 비워지면 RESUME을 보낸다. 또 일정 파티션 단위로 “여기까지 썼다”는 ACK를 받아야 다음 구간을 안심하고 보낼 수 있다.

## 백프래셔는 느리게 만드는 장치가 아니었다

처음엔 백프래셔가 속도를 죽이는 것처럼 느껴졌다. 하지만 실제로는 전송을 살리는 장치였다. 멈출 수 있어야 계속 갈 수 있다. 기다릴 수 있어야 파일이 깨지지 않는다.

PonsWarp에서 파일 전송이 어려웠던 이유는 속도 경쟁 때문이 아니었다. 보낸 것, 받은 것, 저장된 것을 구분하는 일이 어려웠다. ACK는 작은 신호지만 제품의 신뢰를 지키는 경계였다.'''
    },
    {
        'slug': '2026-06-29-ponswarp-05b-browser-memory-2gb',
        'title': '[PonsWarp] 2GB를 넘기자 브라우저 메모리가 먼저 무너졌다',
        'excerpt': '파일 전송이 안 되는 줄 알았지만, 실제 문제는 브라우저 메모리 위에 파일이 그대로 올라가는 구조였다.',
        'category': 'PonsWarp', 'tags': 'PonsWarp,Product Retrospective,Browser Memory,2GB,Large File',
        'publishedAt': 1782711560000, 'accent': '#be123c', 'secondary': '#4c0519',
        'cover_title': 'The 2GB wall', 'cover_subtitle': '파일이 아니라 브라우저 메모리가 먼저 터졌다', 'cover_nodes': ['Blob', 'Memory', '2GB', 'Stream'],
        'diagram_title': '메모리 저장과 스트리밍 저장의 차이', 'diagram_caption': '큰 파일을 브라우저 메모리에 모으면 마지막 단계에서 제품이 무너진다.', 'diagram_nodes': ['Receive', 'Blob memory', 'Crash risk', 'Stream writer'],
        'body': '''처음에는 파일 전송이 안 되는 줄 알았다. 그런데 들여다보니 파일이 브라우저 메모리에 그대로 올라가고 있었다.

작은 파일은 이 방식도 버틴다. 다 받은 뒤 Blob으로 만들고 다운로드를 트리거하면 된다. 하지만 2GB를 넘고, 4GB를 넘고, 더 큰 파일을 상상하면 이 방식은 바로 위험해진다. 파일이 전송되기도 전에 브라우저가 먼저 지친다.

![브라우저 메모리 한계](__DIAGRAM__)

## 큰 파일은 모으면 안 됐다

PonsLink 시절에도 파일을 한 번에 읽지 않고 조각으로 다루는 쪽으로 바꾼 흔적이 있다. PonsWarp에서는 이 고민이 더 직접적이었다. 2GB 이상은 StreamSaver 같은 스트리밍 저장 경로를 강제로 쓰게 하고, 작은 파일과 큰 파일의 저장 전략을 나눠야 했다.

여기서 IndexedDB도 자연스럽게 떠올랐다. 브라우저 안에 중간 저장소가 필요했기 때문이다. 하지만 대용량 파일을 데이터베이스 record처럼 쌓는 방식은 파일 전송의 흐름과 잘 맞지 않았다. 필요한 건 record 저장소라기보다 파일시스템에 가까운 쓰기 경로였다.

## 문제는 전송보다 마지막 저장이었다

대용량 파일 전송은 네트워크만의 문제가 아니다. 어떻게 받았는지보다 어디에 어떻게 쓰는지가 더 큰 문제일 때가 많다. 수신이 끝났는데 마지막 Blob 생성에서 멈추면 사용자는 전송 전체가 실패했다고 느낀다.

그래서 PonsWarp는 파일을 메모리에 모으는 방식에서 벗어나야 했다. 브라우저가 제공하는 여러 저장 전략을 비교하고, 환경마다 다른 fallback을 가져가야 했다.'''
    },
    {
        'slug': '2026-06-29-ponswarp-05c-opfs-safety-net',
        'title': '[PonsWarp] OPFS는 만능키가 아니라 마지막 안전망이었다',
        'excerpt': 'OPFS는 대용량 전송의 모든 문제를 해결하지 않았다. 다만 브라우저 메모리 밖으로 파일을 밀어낼 수 있는 현실적인 안전망이었다.',
        'category': 'PonsWarp', 'tags': 'PonsWarp,Product Retrospective,OPFS,StreamSaver,File System Access API',
        'publishedAt': 1782711580000, 'accent': '#2563eb', 'secondary': '#172554',
        'cover_title': 'OPFS as safety net', 'cover_subtitle': '만능 해결책보다 브라우저별 탈출 경로가 필요했다', 'cover_nodes': ['FSA', 'Blob', 'OPFS', 'Stream'],
        'diagram_title': '브라우저별 저장 전략', 'diagram_caption': '환경에 따라 File System Access API, Blob, OPFS, StreamSaver를 다르게 고른다.', 'diagram_nodes': ['Browser', 'FSA', 'Small Blob', 'OPFS', 'StreamSaver'],
        'body': '''OPFS를 쓰면 모든 대용량 파일 문제가 해결되는 건 아니었다. 다만 브라우저 메모리 위에 파일을 올려놓는 방식에서 벗어날 수 있는 현실적인 안전망이었다.

브라우저마다 저장 전략은 다르게 깨진다. 어떤 환경은 File System Access API가 좋고, 어떤 환경은 StreamSaver가 더 낫고, 어떤 환경은 작은 파일만 Blob으로 처리하는 게 안전하다. Firefox처럼 특정 방식이 막히거나 불안정한 경우도 있다.

![브라우저 저장 전략](__DIAGRAM__)

## OPFS도 제약이 있다

OPFS는 브라우저가 제공하는 origin private storage다. 이름만 보면 파일시스템처럼 느껴지지만, 사용자의 디스크 전체를 마음대로 쓰는 통로는 아니다. quota가 있고, persistent storage 승인이 필요할 수 있고, 마지막에 사용자가 실제 파일로 꺼내는 UX도 신경 써야 한다.

그래서 PonsWarp에서 OPFS는 첫 번째 선택이라기보다 fallback의 한 축이었다. 작은 파일은 Blob도 괜찮다. Chromium 계열에서는 File System Access API가 좋을 수 있다. StreamSaver가 맞는 경우도 있다. OPFS는 큰 파일이 메모리에 갇히지 않게 도와주는 안전망이었다.

## 저장 전략은 제품 UX였다

처음에는 이걸 내부 구현이라고 생각했다. 하지만 대용량 파일에서는 저장 전략 자체가 제품 UX가 된다. 사용자에게 저장 위치를 고르게 할지, 자동으로 다운로드할지, 브라우저 저장소를 임시로 쓸지에 따라 신뢰가 달라진다.

PonsWarp가 배운 건 간단하다. 브라우저에서는 하나의 정답 저장 방식이 없다. 환경을 감지하고, 실패하면 다른 경로로 내려가고, 왜 실패했는지 사용자에게 숨기지 않아야 한다.'''
    },
    {
        'slug': '2026-06-29-ponswarp-06b-rust-wasm-memory-survival',
        'title': '[PonsWarp] Rust와 WASM은 속도 욕심보다 메모리 생존을 위한 선택이었다',
        'excerpt': 'ZIP64, 재정렬 버퍼, Zero-Copy, 암호화는 빠른 언어를 써보고 싶어서가 아니라 브라우저 전송의 생존 문제에서 나왔다.',
        'category': 'PonsWarp', 'tags': 'PonsWarp,Product Retrospective,Rust,WASM,ZIP64,Zero Copy',
        'publishedAt': 1782711630000, 'accent': '#4f46e5', 'secondary': '#1e1b4b',
        'cover_title': 'WASM for survival', 'cover_subtitle': '속도 자랑보다 메모리와 경계를 살리는 선택이었다', 'cover_nodes': ['ZIP64', 'Buffer', 'Zero-Copy', 'WASM'],
        'diagram_title': 'JS Worker와 WASM core의 역할 분담', 'diagram_caption': 'UI와 전송 제어는 JS가 맡고, 패킷/ZIP/버퍼 핵심은 WASM core가 맡는다.', 'diagram_nodes': ['UI', 'Worker', 'WASM core', 'Packet', 'Disk'],
        'body': '''Rust와 WASM은 빠른 언어를 써보고 싶어서 들어온 게 아니었다. ZIP이 깨지고, GC가 끊고, 버퍼가 뒤섞이고, 4GB 경계가 계속 문제를 만들었기 때문이다.

브라우저에서 큰 파일을 다루면 JS만의 편안함이 금방 줄어든다. 작은 단위로 자르고, 검증하고, 암호화하고, ZIP64로 묶고, 순서가 어긋난 패킷을 다시 맞추는 일은 메모리와 경계가 중요하다.

![WASM core 역할 분담](__DIAGRAM__)

## 4GB 경계는 상징적인 벽이었다

다중 파일을 묶으면 ZIP 포맷의 한계가 바로 보인다. 4GB를 넘는 아카이브를 안정적으로 만들려면 ZIP64가 필요하다. 단순히 라이브러리 하나를 바꾸는 문제가 아니라 스트리밍하면서 큰 파일 구조를 만들어야 했다.

재정렬 버퍼도 비슷했다. 수신한 조각을 순서대로 맞추고, 메모리 사용량을 안정화하고, GC로 끊기는 느낌을 줄여야 했다. Zero-Copy Pool과 암호화 경계도 같은 흐름에서 나왔다.

## 성능보다 먼저 안정성이었다

Rust/WASM을 쓰면 무조건 빨라진다고 말하고 싶지는 않다. 그런 말은 너무 쉽고 위험하다. PonsWarp에서 중요한 건 어떤 책임을 브라우저 JS 바깥의 더 엄격한 코어로 옮겼는지였다.

패킷 구조, ZIP64, 재정렬, 암호화, 메모리 경계. 이런 책임이 정리되어야 대용량 전송이 버틴다. 속도는 그 다음 문제였다. 먼저 살아남아야 빨라질 수도 있다.'''
    },
    {
        'slug': '2026-06-29-ponswarp-12b-flow-that-survives-failure',
        'title': '[PonsWarp] 결국 내가 만든 건 파일 전송 버튼이 아니라 실패를 견디는 흐름이었다',
        'excerpt': 'PonsWarp의 핵심은 큰 파일을 보내는 버튼이 아니라, 브라우저와 네트워크와 저장소의 실패를 견디는 전송 흐름이었다.',
        'category': 'PonsWarp', 'tags': 'PonsWarp,Product Retrospective,Direct,Cloud Drop,Failure Recovery',
        'publishedAt': 1782711990000, 'accent': '#0f172a', 'secondary': '#111827',
        'cover_title': 'A flow that survives', 'cover_subtitle': '버튼보다 중요한 건 실패를 견디는 흐름이었다', 'cover_nodes': ['Direct', 'Pause', 'Resume', 'Cloud'],
        'diagram_title': 'PonsWarp 1부의 결론', 'diagram_caption': '직접 전송과 Cloud Drop은 서로 대체가 아니라 실패 조건을 나눠 갖는 구조다.', 'diagram_nodes': ['Direct P2P', 'Backpressure', 'Resume', 'OPFS', 'Cloud Drop'],
        'body': '''처음엔 큰 파일을 보내는 버튼을 만들고 싶었다. 그런데 기록을 다시 보면 버튼보다 실패를 견디는 흐름을 만든 시간이 훨씬 길다.

P2P는 매력적이다. 파일 바이트를 서버에 올리지 않고, 브라우저끼리 직접 흘려보낼 수 있다. 하지만 상대가 온라인이어야 하고, 브라우저 저장소가 버텨야 하고, 네트워크가 끊겨도 어느 지점에서 다시 이어갈지 알아야 한다.

![실패를 견디는 전송 흐름](__DIAGRAM__)

## Direct와 Cloud Drop은 경쟁자가 아니었다

Direct mode는 파일을 직접 보내는 흐름이다. 빠르고 사적이지만 양쪽이 동시에 살아 있어야 한다. Cloud Drop은 그 조건이 맞지 않을 때의 보완재다. 파일을 잠시 맡기고 나중에 받게 하는 쪽이다.

이 둘을 나눈 건 기능을 늘리기 위해서가 아니었다. 실패 조건이 다르기 때문이다. 직접 연결이 실패할 때와, 상대가 나중에 받아야 할 때는 제품이 제공해야 할 경로가 다르다.

## PonsWarp가 남긴 질문

PonsWarp는 아직도 쉬운 제품이 아니다. 큰 파일, 브라우저, 저장소, 결제 권한, 임시 링크, 모바일 백그라운드가 한꺼번에 엮인다. 그래도 방향은 전보다 분명하다.

파일 전송 제품은 “보내기” 버튼으로 완성되지 않는다. 멈출 수 있고, 다시 시작할 수 있고, 브라우저 한계를 만나면 다른 길로 내려갈 수 있어야 한다. 결국 만든 건 파일 전송 버튼이 아니라 실패를 견디는 흐름이었다.'''
    },
]


def prepare_content(post: dict, diagram_path: str) -> str:
    return post['body'].replace('__DIAGRAM__', diagram_path).strip() + '\n'


def validate_post(post: dict, content: str) -> list[str]:
    errors: list[str] = []
    for label, text in [('title', post['title']), ('excerpt', post['excerpt']), ('content', content)]:
        if FORBIDDEN_HONORIFIC.search(text):
            errors.append(f"{post['slug']}: honorific in {label}")
        if COMMIT_HASH.search(text):
            errors.append(f"{post['slug']}: commit-like hash in {label}")
        if FUNCTION_LIKE.search(text):
            errors.append(f"{post['slug']}: function-like text in {label}")
    if 'TB급' in content and '목표' not in content and '실험' not in content:
        errors.append(f"{post['slug']}: TB wording lacks goal/experiment framing")
    return errors


def main() -> None:
    if not DB.exists():
        raise SystemExit(f'DB not found: {DB}')
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup = BACKUP_DIR / f"custom.db.before-expanded-pons-story-posts-{time.strftime('%Y%m%d%H%M%S')}"
    shutil.copy2(DB, backup)

    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    author = con.execute('select id, displayName from User where id=?', (AUTHOR_ID,)).fetchone()
    if not author:
        raise SystemExit(f'Author not found: {AUTHOR_ID}')

    errors: list[str] = []
    written = []
    now = int(time.time() * 1000)
    for index, post in enumerate(POSTS, start=1):
        featured = write_cover(post, index)
        diagram = write_diagram(post)
        content = prepare_content(post, diagram)
        errors.extend(validate_post(post, content))
        reading_time = estimate_reading_time(content)
        post_id = f"story-insert-{post['slug']}"
        con.execute(
            '''insert into Post (id, slug, title, excerpt, content, category, tags, coverColor, featuredImage, status, readingTime, views, authorId, authorName, publishedAt, createdAt, updatedAt)
               values (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, coalesce((select views from Post where slug=?), 0), ?, ?, ?, ?, ?)
               on conflict(slug) do update set
                 title=excluded.title,
                 excerpt=excluded.excerpt,
                 content=excluded.content,
                 category=excluded.category,
                 tags=excluded.tags,
                 coverColor=excluded.coverColor,
                 featuredImage=excluded.featuredImage,
                 status='published',
                 readingTime=excluded.readingTime,
                 authorId=excluded.authorId,
                 authorName=excluded.authorName,
                 publishedAt=excluded.publishedAt,
                 updatedAt=excluded.updatedAt''',
            (post_id, post['slug'], post['title'], post['excerpt'], content, post['category'], post['tags'], post['accent'], featured, reading_time, post['slug'], AUTHOR_ID, AUTHOR_NAME, post['publishedAt'], post['publishedAt'], now)
        )
        written.append((post['slug'], reading_time, featured, diagram))

    if errors:
        con.rollback()
        raise SystemExit('\n'.join(errors))
    con.commit()
    con.close()

    print(f'backup={backup}')
    print(f'inserted_or_updated={len(written)}')
    for slug, reading_time, featured, diagram in written:
        print(f'{slug}\t{reading_time}m\t{featured}\t{diagram}')

if __name__ == '__main__':
    main()
