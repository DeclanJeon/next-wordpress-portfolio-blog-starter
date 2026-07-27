#!/usr/bin/env python3
"""Fix PonsWarp 미니시리즈 16 posts."""
import sqlite3, re

DB = 'v2/db/custom.db'

REPLACEMENTS = {
    '2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink': [
        (r'PonsLink: 문제가 커진 장면', 'PonsLink 안에서 고장난 지점'),
        (r'처음에 믿었던 가정 — PonsLink', '처음에는 방 안 기능이면 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — PonsLink', '분리해야 한다는 게 선명해진 순간'),
        (r'무엇을 제품 밖으로 뺐나', '제품 밖으로 뺀 것'),
        (r'내부 계약이 바뀐 부분', '내부 계약이 바뀐 부분'),
        (r'방에 남겨도 되는 것과 안 되는 것', '방에 남길 것과 뺄 것'),
    ],
    '2026-06-29-ponswarp-01-browser-direct-transfer': [
        (r'용어가 가린 실제 문제', '대용량 직접 전송이 가린 문제'),
        (r'처음에 믿었던 가정 — 브라우저끼리 대용량 파일을 직접', '처음에는 브라우저가 다 할 줄 알았다'),
        (r'구성요소 역할', '전송에 들어오는 구성요소'),
        (r'성공 조건 — 브라우저끼리', '직접 전송이 성립하는 조건'),
        (r'실패 조건', '전송이 실패하는 경우'),
        (r'측정 가능한 신호 — 브라우저끼리', '측정 가능한 신호'),
    ],
    '2026-06-29-ponswarp-01b-data-grid-tb-experiment': [
        (r'TB 전송을 꿈꾸자 데이터 — 문제가 커진 장면', 'TB급 전송이 커진 문제'),
        (r'처음에 믿었던 가정 — TB', '처음에는 기존 방식으로 커버될 줄 알았다'),
        (r'반례가 선명해진 순간 — TB', '데이터 그리드가 필요해진 순간'),
        (r'제품 문장을 다시 쓴 순간 — TB급', '제품 문장을 다시 쓴 순간'),
        (r'구현과 운영에 남긴 조건 — TB', '구현과 운영에 남긴 조건'),
    ],
    '2026-06-29-ponswarp-02b-desktop-testing-fatigue': [
        (r'데스크탑 앱까지 갔지만 테스트할 — 문제가 커진 장면', '데스크탑까지 갔지만 테스트가 막힌 지점'),
        (r'처음에 믿었던 가정 — 데스크탑 앱까지 갔지만 테스트할', '처음에는 앱만 만들면 될 줄 알았다'),
        (r'반례가 선명해진 순간 — 데스크탑 앱까지 갔지만 테스트할', '기기 부족이 선명해진 순간'),
        (r'다시 고른 경계 — 데스크탑 앱까지 갔지만 테스트할', '테스트 경계 나누기'),
        (r'회고에서 고정한 원칙', '회고에서 고정한 원칙'),
    ],
    '2026-06-29-ponswarp-03-webrtc-opens-the-road': [
        (r'WebRTC: 문제가 커진 장면', 'WebRTC가 필요해진 지점'),
        (r'처음에 믿었던 가정 — WebRTC', '처음에는 WebRTC가 파일을 보낼 줄 알았다'),
        (r'반례가 선명해진 순간 — WebRTC', '길만 열림이 선명해진 순간'),
        (r'다시 고른 경계 — WebRTC', 'WebRTC 경계 나누기'),
        (r'바뀐 책임 흐름', '책임 흐름이 바뀐 지점'),
    ],
    '2026-06-29-ponswarp-04-backpressure-protects-transfer': [
        (r'받는 쪽이 터지는 순간', '받는 쪽이 터지는 순간'),
        (r'처음에는 최대 처리량이 목표였다', '처음에는 최대 처리량이 목표였다'),
        (r'실패 신호가 남긴 반례', '실패 신호가 남긴 반례'),
        (r'경계를 다시 그은 방식', '경계를 다시 그은 방식'),
        (r'구현·운영에 남긴 조건 — 백프레셔는 기다림', '구현·운영에 남긴 조건'),
    ],
    '2026-06-29-ponswarp-05b-browser-memory-2gb': [
        (r'2GB 넘기자 브라우저 메모리가 — 문제가 커진 장면', '2GB를 넘기자 메모리가 무너진 지점'),
        (r'처음에 믿었던 가정 — GB', '처음에는 메모리가 무한할 줄 알았다'),
        (r'반례가 선명해진 순간 — GB', '2GB 벽이 선명해진 순간'),
        (r'다시 고른 경계 — GB', '메모리 경계 나누기'),
        (r'회고에서 고정한 원칙', '회고에서 고정한 원칙'),
    ],
    '2026-06-29-ponswarp-05c-opfs-safety-net': [
        (r'OPFS: 문제가 커진 장면', 'OPFS가 필요해진 지점'),
        (r'처음에 믿었던 가정 — OPFS', '처음에는 OPFS가 만능일 줄 알았다'),
        (r'반례가 선명해진 순간 — OPFS', '안전망임이 선명해진 순간'),
        (r'다시 고른 경계 — OPFS', 'OPFS 경계 나누기'),
    ],
    '2026-06-29-ponswarp-06-cloud-drop-complement': [
        (r'Cloud: 문제가 커진 장면', 'Cloud Drop이 필요해진 지점'),
        (r'처음에 믿었던 가정 — Cloud', '처음에는 P2P만으로 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — Cloud', '보완재임이 선명해진 순간'),
        (r'다시 고른 경계 — Cloud', 'Cloud 경계 나누기'),
        (r'구현과 운영에 남긴 조건 — Cloud', '구현과 운영에 남긴 조건'),
        (r'관측 포인트 — Cloud', '관측 포인트'),
    ],
    '2026-06-29-ponswarp-06b-rust-wasm-memory-survival': [
        (r'Rust: 문제가 커진 장면', 'Rust/WASM이 필요해진 지점'),
        (r'처음에 믿었던 가정 — Rust', '처음에는 JS로 충분할 줄 알았다'),
        (r'반례가 선명해진 순간 — Rust', '메모리 생존이 선명해진 순간'),
        (r'다시 고른 경계 — Rust', 'Rust 경계 나누기'),
    ],
    '2026-06-29-ponswarp-07-incomplete-transfer-recovery': [
        (r'처음부터 다시가 비싼 이유', '처음부터 다시가 비싼 이유'),
        (r'처음 선택한 단순 재시작', '처음 선택한 단순 재시작'),
        (r'반례가 선명해진 순간 — partial', 'partial 파일이 선명해진 순간'),
        (r'부분 파일을 남기지 않는다는 말', '부분 파일을 남기지 않는다는 말'),
        (r'모바일과 백그라운드', '모바일과 백그라운드'),
    ],
    '2026-06-29-ponswarp-08-mobile-background-resume': [
        (r'현장에서 이 개념이 필요해진 이유', '모바일 백그라운드를 다시 본 이유'),
        (r'겉으로 비슷한 말들 — 모바일', '겉으로 비슷한 말들'),
        (r'오해가 만든 구현', '오해가 만든 잘못된 구현'),
        (r'실무에서 틀리기 쉬운 지점 — 모바일', '실무에서 틀리기 쉬운 지점'),
        (r'선택 기준', '선택 기준'),
    ],
    '2026-06-29-ponswarp-09-browser-download-strategy': [
        (r'이 개념을 붙잡게 된 장애', '브라우저별 저장 차이를 만난 이유'),
        (r'흔히 섞는 인접 개념 — 브라우저마다', '섞기 쉬운 인접 개념'),
        (r'핵심 불변조건', '브라우저 저장이 지키는 것'),
        (r'프로토콜/API 관점 — 브라우저마다', 'API 관점에서 본 차이'),
        (r'브라우저/서버 한계', '브라우저가 주는 제약'),
        (r'다음에 읽을 연결고리', '이어서 보면 좋은 글'),
    ],
    '2026-06-29-ponswarp-10-pipeline-limits-before-speed': [
        (r'속도를 올리기 전에 파이프라인의 — 문제가 커진 장면', '파이프라인 한계가 커진 문제'),
        (r'처음에 믿었던 가정 — 속도를 올리기', '처음에는 속도부터 올리려 했다'),
        (r'반례가 선명해진 순간 — 속도를 올리기', '한계가 먼저임이 선명해진 순간'),
        (r'다시 고른 경계 — 속도를 올리기', '속도보다 한계 경계 나누기'),
    ],
    '2026-06-29-main-ponswarp-01-server-does-not-own-file': [
        (r'서버가 파일을 갖지 않는 — 문제가 커진 장면', '서버가 파일을 갖지 않는 게 커진 문제'),
        (r'처음에 믿었던 가정 — 서버가 파일', '처음에는 서버가 파일을 들고 있어야 할 줄 알았다'),
        (r'반례가 선명해진 순간 — 서버가 파일', '서버 비소유가 선명해진 순간'),
        (r'다시 고른 경계 — 서버가 파일', '서버 경계 나누기'),
        (r'구현·운영에 남긴 조건 — 서버가 파일', '구현과 운영에 남긴 조건'),
        (r'아직 열어 둔 비용 — 서버가 파일', '아직 열어 둔 비용'),
    ],
    '2026-06-29-main-ponswarp-02-signaling-is-matchmaker': [
        (r'Signaling: 문제가 커진 장면', 'Signaling이 필요해진 지점'),
        (r'현재 구성의 가정 — Signaling', '현재 구성의 가정'),
        (r'반례가 선명해진 순간 — Signaling', '가정을 깨는 사례'),
        (r'분리/중계/직접연결 선택 — Signaling', '분리·중계·직접연결 선택'),
        (r'실패 모드 — Signaling', '실패 모드'),
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
