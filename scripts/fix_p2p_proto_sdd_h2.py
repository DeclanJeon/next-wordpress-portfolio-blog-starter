#!/usr/bin/env python3
"""Fix P2P 프로토콜 9 + 소프트웨어 설계문서 6 = 15 posts."""
import sqlite3, re

DB = 'v2/db/custom.db'

REPLACEMENTS = {
    # === P2P 프로토콜 ===
    '2026-07-04-p2p-protocol-01-dht-bittorrent-peer-discovery': [
        (r'용어가 가린 실제 문제', 'peer discovery가 가린 실제 문제'),
        (r'처음에 믿었던 가정 — DHT', '처음에는 중앙 서버 없이 다 될 줄 알았다'),
        (r'구성요소 역할', 'DHT의 구성요소'),
        (r'성공 조건 — 프로토콜', 'peer를 찾을 수 있는 조건'),
        (r'실패 조건', 'discovery가 실패하는 경우'),
        (r'측정 가능한 신호 — 프로토콜', '측정 가능한 신호'),
        (r'적용 체크', '적용할 때 체크할 것'),
    ],
    '2026-07-04-p2p-protocol-02-libp2p-stack-boundaries': [
        (r'현장에서 이 개념이 필요해진 이유', 'libp2p를 다시 본 이유'),
        (r'겉으로 비슷한 말들 — 프로토콜', '겉으로 비슷한 말들'),
        (r'오해가 만든 구현', '오해가 만든 잘못된 구현'),
        (r'다시 고른 경계 — libp2p', '경계를 묶음으로 보기'),
        (r'동작 순서', '스택이 동작하는 순서'),
    ],
    '2026-07-04-p2p-protocol-03-webtransport-quic-vs-webrtc': [
        (r'이 개념을 붙잡게 된 장애', 'WebTransport를 다시 보게 된 이유'),
        (r'흔히 섞는 인접 개념 — 프로토콜', '섞기 쉬운 인접 개념'),
        (r'핵심 불변조건', '각 전송이 지키는 것'),
        (r'프로토콜/API 관점 — 프로토콜', '프로토콜 관점에서 본 차이'),
        (r'브라우저/서버 한계', '브라우저가 주는 제약'),
        (r'설계 질문 목록 — 프로토콜', '설계할 때 던져야 할 질문'),
        (r'다음에 읽을 연결고리', '이어서 보면 좋은 글'),
    ],
    '2026-07-04-p2p-protocol-04-crdt-p2p-collaboration': [
        (r'CRDT: 문제가 커진 장면', 'CRDT가 필요해진 지점'),
        (r'처음에 믿었던 가정 — CRDT', '처음에는 lock으로 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — CRDT', '충돌이 선명해진 순간'),
        (r'다시 고른 경계 — CRDT', '협업 경계 나누기'),
        (r'구현과 운영에 남긴 조건 — CRDT', '구현과 운영에 남긴 조건'),
        (r'아직 열어 둔 비용 — CRDT', '아직 열어 둔 비용'),
    ],
    '2026-07-04-p2p-protocol-05-p2p-security-trust-boundary': [
        (r'P2P: 문제가 커진 장면', 'P2P 보안이 커진 문제'),
        (r'처음에 믿었던 가정 — P2P', '처음에는 피어를 다 믿으려 했다'),
        (r'반례가 선명해진 순간 — P2P', '신뢰 붕괴가 선명해진 순간'),
        (r'다시 고른 경계 — P2P', 'trust boundary 그리기'),
        (r'메커니즘이 버틴 이유', '메커니즘이 버틴 이유'),
        (r'아직 열어 둔 비용 — P2P', '아직 열어 둔 비용'),
    ],
    '2026-07-04-p2p-protocol-06-turn-server-cost-model': [
        (r'TURN: 문제가 커진 장면', 'TURN 비용이 커진 지점'),
        (r'처음에 믿었던 가정 — TURN', '처음에는 relay는 드물 줄 알았다'),
        (r'반례가 선명해진 순간 — TURN', '비용 폭증이 선명해진 순간'),
        (r'다시 고른 경계 — TURN', '비용 모델 경계 나누기'),
        (r'흐름 제어 디테일', '흐름 제어 디테일'),
    ],
    '2026-07-04-p2p-protocol-07-merkle-chunk-integrity': [
        (r'chunk: 문제가 커진 장면', 'chunk 무결성이 커진 문제'),
        (r'처음에 믿었던 가정 — chunk', '처음에는 전체 해시로 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — chunk', '손상 지점이 선명해진 순간'),
        (r'무엇을 제품 밖으로 뺐나 — 무결성', '제품 밖으로 뺀 것'),
        (r'내부 계약이 바뀐 부분', '내부 계약이 바뀐 부분'),
        (r'아직 열어 둔 비용 — chunk', '아직 열어 둔 비용'),
    ],
    '2026-07-04-p2p-protocol-08-mobile-browser-background-limits': [
        (r'P2P: 문제가 커진 장면', '모바일 백그라운드가 커진 문제'),
        (r'처음에 믿었던 가정 — P2P', '처음에는 연결만 맺으면 끝날 줄 알았다'),
        (r'반례가 선명해진 순간 — P2P', '전송 끊김이 선명해진 순간'),
        (r'다시 고른 경계 — P2P', '백그라운드 경계 나누기'),
        (r'구현과 운영에 남긴 조건 — P2P', '구현과 운영에 남긴 조건'),
        (r'관측 포인트 — 브라우저', '관측 포인트'),
    ],
    '2026-07-04-p2p-protocol-09-edge-serverless-hybrid-p2p': [
        (r'edge: 문제가 커진 장면', 'edge와 serverless가 붙은 지점'),
        (r'현재 구성의 가정 — edge와', '현재 구성의 가정'),
        (r'반례가 선명해진 순간 — edge', '가정을 깨는 사례'),
        (r'분리/중계/직접연결 선택 — edge와', '분리·중계·직접연결 선택'),
        (r'다시 짜 본 구조', '다시 짜 본 구조'),
        (r'실패 모드 — edge와', '실패 모드'),
    ],
    # === 소프트웨어 설계문서 ===
    '2026-07-07-software-design-documents-map': [
        (r'개발 설계문서 지도 문서 — 문제가 커진 장면', '문서 지도가 커진 문제'),
        (r'처음에 믿었던 가정 — 개발 설계문서 지도 문서', '처음에는 이름만 맞추면 될 줄 알았다'),
        (r'반례가 선명해진 순간 — 개발 설계문서 지도 문서', '질문이 먼저임이 선명해진 순간'),
        (r'다시 고른 경계 — 개발 설계문서 지도 문서', '문서 종류별 경계 나누기'),
        (r'메커니즘이 버틴 이유', '지도가 버틴 이유'),
    ],
    '2026-07-07-software-design-documents-product-docs': [
        (r'PRD: 문제가 커진 장면', 'PRD가 커진 문제'),
        (r'처음에 믿었던 가정 — PRD', '처음에는 PRD를 명세로 봤다'),
        (r'반례가 선명해진 순간 — PRD', '구현 지시서가 아닌 게 선명해진 순간'),
        (r'다시 고른 경계 — PRD', '판단 문서 경계 나누기'),
        (r'구현과 운영에 남긴 조건 — PRD', '구현과 운영에 남긴 조건'),
        (r'아직 열어 둔 비용 — PRD', '아직 열어 둔 비용'),
    ],
    '2026-07-07-software-design-documents-requirements': [
        (r'요구사항문서:“빠르게”를검: 문제가 커진 장면', '요구사항이 커진 문제'),
        (r'처음에 믿었던 가정 — 요구사항 문서 빠르게 검증', '처음에는 "빠르게"로 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — 요구사항 문서 빠르게 검증', '검증 불가가 선명해진 순간'),
        (r'다시 고른 경계 — 요구사항 문서 빠르게 검증', '검증 가능한 문장으로 경계 나누기'),
        (r'구현과 운영에 남긴 조건 — 요구사항 문서 빠르게 검증', '구현과 운영에 남긴 조건'),
        (r'관측 포인트 — 요구사항', '관측 포인트'),
    ],
    '2026-07-07-software-design-documents-architecture': [
        (r'SDD: 문제가 커진 장면', 'SDD가 커진 문제'),
        (r'처음에 믿었던 가정 — SDD', '처음에는 박스 그림이면 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — SDD', '그림만으로 부족함이 선명해진 순간'),
        (r'다시 고른 경계 — SDD', '구조 문서 경계 나누기'),
        (r'바뀐 책임 흐름', '책임 흐름이 바뀐 지점'),
    ],
    '2026-07-07-software-design-documents-decisions': [
        (r'ADR: 문제가 커진 장면', 'ADR이 커진 문제'),
        (r'처음에 믿었던 가정 — ADR', '처음에는 결정을 머리에만 뒀다'),
        (r'반례가 선명해진 순간 — ADR', '나중 개발자를 살리는 게 선명해진 순간'),
        (r'다시 고른 경계 — ADR', '결정 기록 경계 나누기'),
        (r'구현과 운영에 남긴 조건 — ADR', '구현과 운영에 남긴 조건'),
    ],
    '2026-07-07-software-design-documents-operations': [
        (r'API: 문제가 커진 장면', '운영 문서가 커진 문제'),
        (r'현재 구성의 가정 — 계약과', '현재 구성의 가정'),
        (r'반례가 선명해진 순간 — API', '계약 누락이 선명해진 순간'),
        (r'분리/중계/직접연결 선택 — 계약과', '분리·중계·직접연결 선택'),
        (r'다시 짜 본 구조', '다시 짜 본 구조'),
    ],
}

def fix_content(content, slug):
    replacements = REPLACEMENTS.get(slug, [])
    new_content = content
    for old_re, new_h2 in replacements:
        pattern = r'^## ' + old_re + r'$'
        new_content = re.sub(pattern, f'## {new_h2}', new_content, flags=re.M)
    return new_content

def main():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    updated = 0
    for slug, reps in REPLACEMENTS.items():
        row = con.execute("SELECT content FROM Post WHERE slug=?", (slug,)).fetchone()
        if not row:
            print(f"SKIP (not found): {slug}")
            continue
        old = row['content']
        new = fix_content(old, slug)
        if old != new:
            con.execute("UPDATE Post SET content=? WHERE slug=?", (new, slug))
            updated += 1
            print(f"UPDATED: {slug} ({len(reps)} H2s)")
        else:
            print(f"NO CHANGE: {slug}")
    con.commit()
    con.close()
    print(f"\nTotal updated: {updated}/{len(REPLACEMENTS)}")

if __name__ == '__main__':
    main()
