#!/usr/bin/env python3
"""Fix P2P 딥다이브 22 posts: replace template H2s with topic-specific ones."""
import sqlite3, re, sys

DB = 'v2/db/custom.db'

# slug -> list of (old_h2_regex, new_h2)
REPLACEMENTS = {
    '2026-07-04-realtime-network-01-p2p-is-not-serverless': [
        (r'이 개념을 붙잡게 된 장애', '서버 없음이라는 말이 닳은 이유'),
        (r'처음에 믿었던 가정 — P2P', '처음에는 서버가 사라진 줄 알았다'),
        (r'핵심 불변조건', '바뀌지 않는 기준: 책임은 어디에 남는가'),
        (r'다시 고른 경계 — P2P', '권한과 데이터 경로를 나누기'),
        (r'브라우저/서버 한계', '관측 가능성이 남긴 조건'),
    ],
    '2026-07-04-realtime-network-02-direct-connection-meaning': [
        (r'용어가 가린 실제 문제', '"직접 연결"이 가린 실제 문제'),
        (r'처음에 믿었던 가정 — 클라이언트끼리 직접', '처음에는 케이블처럼 붙는 줄 알았다'),
        (r'구성요소 역할', '연결에 들어오는 구성요소'),
        (r'성공 조건 — 클라이언트끼리', '직접 연결이 성립하는 조건'),
        (r'실패 조건', '연결이 열리지 않는 경우'),
    ],
    '2026-07-04-realtime-network-03-p2p-strengths-and-limits': [
        (r'현장에서 이 개념이 필요해진 이유', '언제 P2P를 다시 꺼내 보게 됐나'),
        (r'처음에 믿었던 가정 — P2P', '처음에는 P2P면 만능인 줄 알았다'),
        (r'오해가 만든 구현', '오해가 만든 잘못된 구현'),
        (r'다시 고른 경계 — P2P', '강한 경우와 약한 경우를 나누기'),
        (r'동작 순서', '판단을 내리는 순서'),
    ],
    '2026-07-04-realtime-network-04-why-p2p-needs-signaling': [
        (r'이 개념을 붙잡게 된 장애', 'signaling 없이 연결이 안 열린 이유'),
        (r'흔히 섞는 인접 개념 — P2P에서', '섞기 쉬운 인접 개념'),
        (r'핵심 불변조건', 'signaling이 지켜야 할 것'),
        (r'프로토콜/API 관점 — P2P에서', '프로토콜 관점에서 본 signaling'),
        (r'브라우저/서버 한계', '브라우저가 주는 제약'),
        (r'설계 질문 목록 — P2P에서', '설계할 때 던져야 할 질문'),
        (r'다음에 읽을 연결고리', '이어서 보면 좋은 글'),
    ],
    '2026-07-04-realtime-network-05-mesh-gets-heavy-with-people': [
        (r'Mesh: 문제가 커진 장면', 'Mesh가 무거워진 지점'),
        (r'처음에 믿었던 가정 — Mesh', '처음에는 Mesh면 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — Mesh', '반례가 선명해진 순간'),
        (r'다시 고른 경계 — Mesh', '사람 수에 따라 경계를 다시 그리기'),
    ],
    '2026-07-04-realtime-network-06-full-partial-mesh-star': [
        (r'Full: 문제가 커진 장면', 'Full Mesh가 커진 문제'),
        (r'처음에 믿었던 가정 — Full', '처음에는 모두가 모두에게 붙는 줄 알았다'),
        (r'반례가 선명해진 순간 — Full', '구조별로 드러난 차이'),
        (r'다시 고른 경계 — Full', '토폴로지별 경계 나누기'),
        (r'바뀐 책임 흐름', '흐름이 바뀐 지점'),
    ],
    '2026-07-04-realtime-network-07-p2p-mesh-breaks-video-call': [
        (r'연결은 됐는데 통화는 안 되는 지점', '연결은 됐는데 통화는 안 되는 지점'),
        (r'처음에는 연결 성공이 곧 통화 성공이라 봤다', '처음에는 연결 성공이 곧 통화 성공이라 봤다'),
        (r'그물이 숨기는 비용', '그물이 숨기는 비용'),
        (r'책임을 세 층으로 나누기', '책임을 세 층으로 나누기'),
        (r'구현·운영에 남긴 조건 — P2P', '구현·운영에 남긴 조건'),
    ],
    '2026-07-04-realtime-network-08-mesh-cost-by-connection-formula': [
        (r'Mesh에서 먼저 깨진 것', 'Mesh에서 먼저 깨진 것'),
        (r'처음 가정 — Mesh', '처음에 세웠던 가정'),
        (r'반례 — Mesh', '가정을 깨는 반례'),
        (r'다시 고른 경계 — Mesh', '비용 공식으로 경계 다시 그리기'),
        (r'구현과 운영에 남긴 조건 — Mesh', '구현과 운영에 남긴 조건'),
        (r'아직 열어 둔 비용 — Mesh', '아직 열어 둔 비용'),
    ],
    '2026-07-04-realtime-network-09-p2p-mesh-sfu-mcu-comparison': [
        (r'P2P: 문제가 커진 장면', 'P2P가 한계에 부딪힌 지점'),
        (r'처음에 믿었던 가정 — P2P', '처음에는 P2P로 다 되리라 봤다'),
        (r'반례가 선명해진 순간 — P2P', '한계가 선명해진 순간'),
        (r'다시 고른 경계 — P2P', '토폴로지별 경계 나누기'),
        (r'바뀐 책임 흐름', '책임 흐름이 바뀐 지점'),
    ],
    '2026-07-04-realtime-network-10-sfu-selective-forwarding': [
        (r'SFU: 문제가 커진 장면', 'SFU가 필요해진 지점'),
        (r'현재 구성의 가정 — SFU', '현재 구성의 가정'),
        (r'반례가 선명해진 순간 — SFU', '가정을 깨는 사례'),
        (r'분리/중계/직접연결 선택 — SFU', '분리·중계·직접연결 선택'),
        (r'다시 짜 본 구조', '다시 짜 본 구조'),
        (r'실패 모드 — SFU', 'SFU의 실패 모드'),
    ],
    '2026-07-04-realtime-network-11-why-sfu-scales-better-than-mesh': [
        (r'SFU: 문제가 커진 장면', 'Mesh가 버거워진 지점'),
        (r'처음에 믿었던 가정 — SFU', '처음에는 Mesh면 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — SFU', 'SFU가 유리해진 순간'),
        (r'다시 고른 경계 — SFU', '큰 방에서 경계 다시 그리기'),
        (r'구현과 운영에 남긴 조건 — SFU', '구현과 운영에 남긴 조건'),
        (r'아직 열어 둔 비용 — SFU', '아직 열어 둔 비용'),
    ],
    '2026-07-04-realtime-network-12-simulcast-svc-near-sfu': [
        (r'Simulcast: 문제가 커진 장면', 'Simulcast가 붙은 이유'),
        (r'처음에 믿었던 가정 — Simulcast', '처음에는 하나의 스트림이면 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — Simulcast', '다른 화질이 필요해진 순간'),
        (r'다시 고른 경계 — Simulcast', 'SFU 옆에 두는 경계 나누기'),
        (r'바뀐 책임 흐름', '책임 흐름이 바뀐 지점'),
    ],
    '2026-07-04-realtime-network-13-why-mcu-is-expensive-but-usful': [
        (r'MCU: 문제가 커진 장면', 'MCU가 필요해진 지점'),
        (r'현재 구성의 가정 — MCU', '현재 구성의 가정'),
        (r'반례가 선명해진 순간 — MCU', '가정을 깨는 사례'),
        (r'분리/중계/직접연결 선택 — MCU', '분리·중계·직접연결 선택'),
        (r'다시 짜 본 구조', '다시 짜 본 구조'),
    ],
    '2026-07-04-realtime-network-14-sfu-and-mcu-are-choices': [
        (r'SFU에서 먼저 깨진 것', 'SFU에서 먼저 깨진 것'),
        (r'처음 가정 — SFU', '처음에 세웠던 가정'),
        (r'반례 — SFU', '가정을 깨는 반례'),
        (r'다시 고른 경계 — SFU', 'SFU와 MCU를 선택지로 두기'),
        (r'구현과 운영에 남긴 조건 — SFU', '구현과 운영에 남긴 조건'),
        (r'아직 열어 둔 비용 — SFU', '아직 열어 둔 비용'),
    ],
    '2026-07-04-realtime-network-15-why-webrtc-connection-is-hard': [
        (r'현장에서 이 개념이 필요해진 이유', '연결이 안 열려서 다시 본 이유'),
        (r'처음에 믿었던 가정 — WebRTC', '처음에는 WebRTC면 자동으로 열릴 줄 알았다'),
        (r'오해가 만든 구현', '오해가 만든 잘못된 구현'),
        (r'다시 고른 경계 — WebRTC', '연결 과정의 경계 다시 그리기'),
        (r'동작 순서', '연결이 맺어지는 순서'),
    ],
    '2026-07-04-realtime-network-16-stun-turn-ice-without-confusion': [
        (r'이 개념을 붙잡게 된 장애', 'STUN/TURN/ICE를 헷갈린 이유'),
        (r'흔히 섞는 인접 개념 — STUN', '섞기 쉬운 인접 개념'),
        (r'핵심 불변조건', '각 프로토콜이 지키는 것'),
        (r'프로토콜/API 관점 — STUN', '프로토콜 관점에서 본 차이'),
        (r'설계 질문 목록 — STUN', '설계할 때 던져야 할 질문'),
        (r'다음에 읽을 연결고리', '이어서 보면 좋은 글'),
    ],
    '2026-07-04-realtime-network-17-why-nat-traversal-fails': [
        (r'NAT: 문제가 커진 장면', 'NAT traversal가 막힌 지점'),
        (r'처음에 믿었던 가정 — NAT', '처음에는 주소만 바꾸면 될 줄 알았다'),
        (r'반례가 선명해진 순간 — NAT', '실패가 선명해진 순간'),
        (r'다시 고른 경계 — NAT', 'NAT 폐색을 경계로 두기'),
        (r'메커니즘이 버틴 이유', '메커니즘이 버틴 이유'),
    ],
    '2026-07-04-realtime-network-18-why-turn-costs-money-in-p2p': [
        (r'현장에서 이 개념이 필요해진 이유', 'TURN 비용을 마주한 이유'),
        (r'겉으로 비슷한 말들 — TURN', '겉으로 비슷한 말들'),
        (r'오해가 만든 구현', '오해가 만든 잘못된 구현'),
        (r'다시 고른 경계 — P2P', 'P2P와 relay의 경계 나누기'),
        (r'동작 순서', '비용이 발생하는 순서'),
    ],
    '2026-07-04-realtime-network-19-datachannel-is-not-file-api': [
        (r'이 개념을 붙잡게 된 장애', 'DataChannel을 파일 API로 착각한 이유'),
        (r'흔히 섞는 인접 개념 — DataChannel', '섞기 쉬운 인접 개념'),
        (r'핵심 불변조건', 'DataChannel이 지키는 것'),
        (r'프로토콜/API 관점 — DataChannel', 'API 관점에서 본 DataChannel'),
        (r'브라우저/서버 한계', '브라우저가 주는 제약'),
        (r'설계 질문 목록 — DataChannel', '설계할 때 던져야 할 질문'),
    ],
    '2026-07-04-realtime-network-20-ordered-vs-unordered-datachannel': [
        (r'Ordered: 문제가 커진 장면', 'Ordered가 문제가 된 지점'),
        (r'처음에 믿었던 가정 — Ordered', '처음에는 순서 보장이 무조건 좋을 줄 알았다'),
        (r'반례가 선명해진 순간 — Ordered', '순서가 독이 된 순간'),
        (r'다시 고른 경계 — Ordered', 'Ordered와 Unordered 경계 나누기'),
    ],
    '2026-07-04-realtime-network-21-reliable-vs-partially-reliable': [
        (r'현장에서 이 개념이 필요해진 이유 \(127\)', 'reliable과 partially reliable을 다시 본 이유'),
        (r'겉으로 비슷한 말들 — DataChannel', '겉으로 비슷한 말들'),
        (r'오해가 만든 구현', '오해가 만든 잘못된 구현'),
        (r'다시 고른 경계 — reliable', '신뢰도를 경계로 두기'),
        (r'동작 순서', '전송 모드를 고르는 순서'),
    ],
    '2026-07-04-realtime-network-22-bufferedamount-backpressure-file-transfer': [
        (r'이 개념을 붙잡게 된 장애', 'bufferedAmount를 모르고 전송이 터진 이유'),
        (r'흔히 섞는 인접 개념 — Backpressure', '섞기 쉬운 인접 개념'),
        (r'핵심 불변조건', 'backpressure가 지키는 것'),
        (r'프로토콜/API 관점 — Backpressure', 'API 관점에서 본 bufferedAmount'),
        (r'브라우저/서버 한계', '브라우저가 주는 제약'),
        (r'설계 질문 목록 — Backpressure', '설계할 때 던져야 할 질문'),
        (r'다음에 읽을 연결고리', '이어서 보면 좋은 글'),
    ],
}

def fix_content(content, slug):
    replacements = REPLACEMENTS.get(slug, [])
    new_content = content
    for old_re, new_h2 in replacements:
        # Match H2 line exactly
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
