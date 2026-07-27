#!/usr/bin/env python3
"""Fix 기타 3 posts: DocuFlow, FateMirror, Essays."""
import sqlite3, re

DB = 'v2/db/custom.db'

REPLACEMENTS = {
    '2026-06-29-main-docuflow-01-tools-to-flow': [
        (r'PDF: 문제가 커진 장면', 'PDF 도구가 커진 문제'),
        (r'처음에 믿었던 가정 — PDF', '처음에는 도구가 답일 줄 알았다'),
        (r'반례가 선명해진 순간 — PDF', '흐름이 선명해진 순간'),
        (r'경계를 다시 배치하다', '경계를 다시 배치하기'),
        (r'구현과 운영에 남긴 조건 — PDF', '구현과 운영에 남긴 조건'),
        (r'흐름 제품으로 넘어갈 때의 실무 기준', '흐름 제품으로 넘어갈 때의 실무 기준'),
    ],
    '2026-07-06-navid-fatemirror-failed-prototype': [
        (r'Navid: 문제가 커진 장면', 'Navid가 막힌 지점'),
        (r'처음에 믿었던 가정 — Navid', '처음에는 기능이 답일 줄 알았다'),
        (r'반례가 선명해진 순간 — Navid', 'FateMirror로 남은 순간'),
        (r'다시 고른 경계 — Navid', '실패와 남음 경계 나누기'),
        (r'구현과 운영에 남긴 조건 — Navid', '구현과 운영에 남긴 조건'),
    ],
    'writing-as-thinking': [
        (r'글쓰기가 사고를 다시 짜는 순간', '글쓰기가 생각을 다시 짜는 순간'),
        (r'기록이라고 믿었던 가정', '기록이라고 믿었던 가정'),
        (r'반례가 된 빈 문장', '반례가 된 빈 문장'),
        (r'다시 고른 글쓰기 용도', '다시 고른 글쓰기 용도'),
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
