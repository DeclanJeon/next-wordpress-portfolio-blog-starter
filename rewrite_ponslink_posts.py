import sqlite3
import re
import math
from pathlib import Path

DB = Path('/home/declan/Documents/Develop/Project/portfolio/v2/db/custom.db')

BANNED = [
    '한 줄 요약',
    '먼저 핵심만 보자',
    '바로 본론으로',
    '시사하는 바가 크다',
    '결론적으로',
]

EXCERPT_MAP = {
    '01': 'PonsLink가 회의툴이 아니라 바로 닿는 개인 세션 데스크로 출발한 이유를 복원합니다.',
    '02': '방 하나를 만드는 일이 왜 제품의 첫인상을 정하는 일이었는지 정리합니다.',
    '03': '연결은 붙었지만 사용자 신뢰가 왜 쉽게 깨졌는지 제품 경계 관점에서 다룹니다.',
    '04': '채팅과 화이트보드, 파일과 협업이 하나로 뭉치면 왜 위험한지 살펴봅니다.',
    '05': '기능이 늘어난 뒤에도 왜 제품 설명 문장이 먼저 필요했는지 확인합니다.',
    '06': '더 큰 방을 꿈꾸면서 왜 오히려 무게와 책임이 먼저 커졌는지 정리합니다.',
    '07': '멋진 분산 구조보다 먼저 감당할 수 있는 제품 기준이 왜 먼저였는지 다룹니다.',
    '08': 'SFU와 분산 구조 고민 뒤에 다시 P2P로 돌아오면서 중심이 왜 선명해졌는지 봅니다.',
    '09': 'P2P 전환 뒤 파일 전송이 왜 부가 기능이 아니라 제품 균형 문제였는지 확인합니다.',
    '10': '요청·검토·예약·세션이 어떤 순서로 제품 신뢰를 만드는지 정리합니다.',
    '11': '방 안 기능이 늘어날수록 밖의 운영 문제가 왜 더 크게 보였는지 다룹니다.',
    '12': '기능 부족만이 아니라 왜 증명해야 할 경계가 남아 있었는지 확인합니다.',
    'tech': 'PonsLink 기술 회고 33편을 읽기 위한 흐름 지도를 정리합니다.',
    'deep-01': '낯선 저장소에서 제품의 경계를 어떤 기준으로 읽기 시작했는지 다룹니다.',
    'deep-02': '입장이 단순 이동이 아니라 어떤 조건을 통과하는 문제였는지 정리합니다.',
    'deep-03': '전역 상태처럼 보였던 저장소가 실제로는 어떤 런타임 경계였는지 확인합니다.',
    'deep-04': '서버가 미디어를 직접 나르지 않을 때 어떤 책임이 남는지 살펴봅니다.',
    'deep-05': 'WebRTC 전에 신호 계층이 어떤 출입문 역할을 하는지 정리합니다.',
    'deep-06': 'Mesh 연결은 단순해 보여도 어떤 순서가 제품 품질을 만드는지 다룹니다.',
    'deep-07': 'DataChannel을 하나로 쓸 때 왜 메시지 등급을 나눠야 하는지 확인합니다.',
    'deep-08': 'request-first 구조가 어떤 맥락에서 방보다 먼저 등장하는지 정리합니다.',
    'deep-09': '결제 버튼보다 입장 권한이 왜 더 어려운 제품 문제인지 살펴봅니다.',
    'deep-10': '마지막에 남은 것이 왜 작은 경계와 테스트였는지 확인합니다.',
    'algo-01': 'WebRTC offer 충돌을 어떤 상태 머신으로 다뤘는지 정리합니다.',
    'algo-02': '실시간 메시지를 왜 모두 같은 줄에 세우면 위험한지 다룹니다.',
    'algo-03': 'P2P 파일 전송에서 왜 작은 TCP가 필요했는지 확인합니다.',
    'algo-04': '놓친 이벤트와 중복 요청을 동시에 줄이는 장치가 왜 필요했는지 살펴봅니다.',
    'algo-05': '여러 내부 상태를 왜 하나의 사용자 문장으로 접어야 하는지 정리합니다.',
    'algo-06': 'PonsCast가 왜 화면 공유가 아니라 DataChannel 위에 프로토콜을 올렸는지 다룹니다.',
    'algo-07': 'DataChannel 재생을 왜 백프레셔와 지터 버퍼로 보호해야 하는지 확인합니다.',
    'algo-08': 'PonsCast 파일 감지와 캐시가 어떤 기준으로 움직이는지 정리합니다.',
    'algo-09': '마이크와 PonsCast 오디오가 동시에 존재할 때 어떤 라우팅이 필요한지 살펴봅니다.',
    'algo-10': 'PonsCast가 화면 공유 대신 DataChannel을 택한 이유와 한계를 다룹니다.',
}



def estimate_reading_time(content: str) -> int:
    code_line_count = 0

    def replace_code_block(match: re.Match[str]) -> str:
        nonlocal code_line_count
        code_line_count += max(0, len(match.group(0).splitlines()) - 2)
        return ' '

    text = re.sub(r'```[\s\S]*?```', replace_code_block, content)
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'[`*_~>#|\-\[\]()!]', ' ', text)
    korean_cjk_chars = len(re.findall(r'[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7af\ud7b0-\ud7ff\u3040-\u30ff\u4e00-\u9fff]', text))
    latin_words = len(re.findall(r"\b[A-Za-z][A-Za-z0-9'’.-]*\b", text))
    minutes = korean_cjk_chars / 550 + latin_words / 220 + code_line_count / 20
    return max(1, math.ceil(minutes))

def theme_for(title: str, content: str) -> tuple[str, str, str]:
    s = f"{title} {content}"
    if any(k in s for k in ['요청', 'request', 'public desk', '문진', '승인', '거절']):
        return ('처음 믿었던 문장을', '요청과 승인이 왜 방보다 먼저 등장했는지를', '요청이 만든 제품 신뢰의 바닥을')
    if any(k in s for k in ['WebRTC', 'mesh', 'ICE', 'offer', 'answer', 'TURN', '연결']):
        return ('연결이 붙은 순간을', '연결 뒤에 남은 불안과 운영 비용을', '연결 실패를 설명하는 제품 언어를')
    if any(k in s for k in ['DataChannel', 'PonsCast', '백프레셔', '지터', '파일 전송', '파일']):
        return ('데이터가 실제로 흐르는 순간을', '전송과 재생 사이의 충돌을', '전송이 제품 신뢰로 바뀌는 조건을')
    if any(k in s for k in ['상태', 'zustand', '런타임', '이벤트', 'replay', 'idempotency']):
        return ('상태가 흩어지기 시작한 순간을', '화면 편의가 아니라 런타임 경계로 읽어야 했던 이유를', '상태 접기가 제품 품질을 어떻게 바꾸는지를')
    if any(k in s for k in ['서버', 'signaling', '제어', '권한', 'cleanup', 'Broker']):
        return ('서버가 어떤 책임을 맡기 시작한 순간을', '파일 전송과 연결 질서가 왜 다른 문제인지', '서버가 숨긴 운영 책임을')
    if any(k in s for k in ['방', 'room', '도착', '입장', '첫 화면']):
        return ('사용자가 도착할 자리를 먼저 만들었던 순간을', '빠른 연결보다 안전한 도착이 먼저였던 이유를', '도착 경험이 제품 신뢰를 만든 방법을')
    return ('당시의 제품 장면을', '기능 설명 뒤에 숨어 있던 운영 책임을', '지금 다시 남겨야 할 설계 판단을')


def make_flow(title: str, content: str) -> str:
    a, b, c = theme_for(title, content)
    return f"""
> **🧭 이 글의 흐름**
>
> 1. **당시 장면** — {a} 먼저 복원합니다.
> 2. **실패 지점** — {b} 코드와 기록으로 확인합니다.
> 3. **지금의 판단** — {c} 회고의 결론으로 둡니다.
"""


def make_closing(title: str, content: str) -> str:
    a, b, c = theme_for(title, content)
    return f"""
---

**📝 회고로 다시 쓴 기준**

이 글은 “무엇을 만들었는가”보다 “왜 그 구조가 필요해졌는가”에 맞춰 있습니다. 그래서 마지막 판단은 {c} 둡니다. 독자가 세부 코드를 몰라도, 당시 제품이 어떤 압력 때문에 그 구조로 이동했는지 따라올 수 있어야 합니다.
"""


def rewrite_content(title: str, content: str, slug: str) -> tuple[str, str, int]:
    # remove banned phrases
    for b in BANNED:
        content = content.replace(b, {'결론적으로': '지금 돌아보면', '시사하는 바가 크다': '다시 볼 필요가 있습니다'}.get(b, b))

    flow = make_flow(title, content).strip()
    closing = make_closing(title, content).strip()

    # insert flow after first figure or after first 3 paragraphs
    m = re.search(r'(!\[.*?\]\(.*?\)\s*\n*(?:<출처:.*?>\s*\n*)?)', content)
    if m:
        content = content[:m.end()] + '\n' + flow + '\n' + content[m.end():]
    else:
        paras = list(re.finditer(r'\n\n', content))
        if len(paras) >= 2:
            pos = paras[1].end()
            content = content[:pos] + '\n' + flow + '\n' + content[pos:]
        else:
            content = content + '\n\n' + flow

    # append closing before last code-ref section or at tail
    code_ref = re.search(r'\n\*\*📚 읽은 코드.*?\n[\s\S]*$', content, flags=re.I)
    if code_ref:
        content = content[:code_ref.start()] + '\n\n' + closing + content[code_ref.start():]
    else:
        content = content.rstrip() + '\n\n' + closing

    # choose excerpt
    key = None
    if slug.startswith('2026-06-16-ponslink-'):
        num = slug.split('ponslink-')[-1].split('-')[0]
        key = num
    elif slug.startswith('2026-06-18-ponslink-tech-retrospective'):
        key = 'tech'
    elif slug.startswith('2026-06-18-ponslink-deep-dive-'):
        num = slug.split('deep-dive-')[-1].split('-')[0]
        key = f'deep-{num}'
    elif slug.startswith('2026-06-18-ponslink-algorithm-'):
        num = slug.split('algorithm-')[-1].split('-')[0]
        key = f'algo-{num}'
    excerpt = EXCERPT_MAP.get(key, '')

    reading_time = estimate_reading_time(content)

    return content, excerpt, reading_time


conn = sqlite3.connect(str(DB))
cur = conn.cursor()
cur.execute("SELECT id, slug, title, content FROM Post WHERE status='published' AND (slug LIKE '%ponslink%' OR title LIKE '%PonsLink%') ORDER BY publishedAt ASC, id ASC")
rows = cur.fetchall()
updated = 0
for id_, slug, title, content in rows:
    new_content, new_excerpt, reading_time = rewrite_content(title, content or '', slug)
    cur.execute("UPDATE Post SET content=?, excerpt=?, readingTime=?, updatedAt=datetime('now') WHERE id=?", (new_content, new_excerpt, reading_time, id_))
    updated += 1
conn.commit()
conn.close()
print('updated', updated)
