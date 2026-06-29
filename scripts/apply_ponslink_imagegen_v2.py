from pathlib import Path
import sqlite3, shutil, time, re, html

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / 'db/custom.db'
PUBLIC = ROOT / 'public/tistory/ponslink'
FEATURED = PUBLIC / 'imagegen-v2'
BODY = PUBLIC / 'body-diagrams'
BODY.mkdir(parents=True, exist_ok=True)

backup = ROOT / 'db/backups' / f'custom.db.before-imagegen-v2-apply-{time.strftime("%Y%m%d%H%M%S")}'
backup.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(DB, backup)

# Retire bad forced-featured diagram assets from the new release tree.
for stale in [PUBLIC / 'diagrams']:
    if stale.exists():
        retired = ROOT / 'db/backups' / f'{stale.name}-retired-before-imagegen-v2-{time.strftime("%Y%m%d%H%M%S")}'
        shutil.copytree(stale, retired)
        shutil.rmtree(stale)

# Body diagrams only for posts where the algorithm is hard to understand from prose alone.
diagrams = {
'2026-06-18-ponslink-algorithm-01-negotiation': dict(title='Offer 충돌 상태 흐름', nodes=['Stable', 'Offer 생성', '충돌 감지', '되돌림/재시도'], caption='동시에 offer가 생길 때 상태를 되돌리고 재시도하는 흐름'),
'2026-06-18-ponslink-algorithm-02-realtime-queue': dict(title='메시지 등급 분리', nodes=['제어', '실시간', '대용량', '역압'], caption='같은 큐가 아니라 성격별 줄을 나눠 지연을 막는 구조'),
'2026-06-18-ponslink-algorithm-03-file-transfer': dict(title='P2P 파일 전송 흐름 제어', nodes=['파일 조각', '속도 조절', '전송 채널', '로컬 저장'], caption='파일을 조각내고 속도를 조절해 통화 흐름과 충돌을 줄이는 구조'),
'2026-06-18-ponslink-algorithm-04-replay-idempotency': dict(title='재전송과 중복 방지', nodes=['이벤트', '재전송', '중복 키', '안전 반영'], caption='놓친 이벤트는 다시 받고, 이미 처리한 요청은 한 번만 반영한다'),
'2026-06-18-ponslink-algorithm-05-request-state': dict(title='내부 상태를 사용자 문장으로 접기', nodes=['대기', '보류', '승인', '사용자 안내'], caption='여러 내부 상태를 사용자가 이해할 수 있는 한 문장으로 줄인다'),
'2026-06-18-ponslink-algorithm-06-ponscast-protocol': dict(title='PonsCast 프레임 계약', nodes=['미디어 파일', '헤더', '프레임 조각', '재생'], caption='화면 공유 대신 파일을 작은 프레임 계약으로 전달한다'),
'2026-06-18-ponslink-algorithm-07-ponscast-backpressure': dict(title='백프레셔와 지터 버퍼', nodes=['토큰 버킷', '상·하한선', '지터 큐', '부드러운 재생'], caption='빨리 보내는 것보다 재생 가능한 속도로 맞춘다'),
'2026-06-18-ponslink-algorithm-08-ponscast-cache': dict(title='파일 감지와 캐시 기준', nodes=['형식 검사', '캐시 가능', '용량 한계', '다음 행동'], caption='파일 형식과 저장 한계를 보고 재사용 가능성을 판단한다'),
'2026-06-18-ponslink-algorithm-09-ponscast-audio': dict(title='마이크와 자료 소리 라우팅', nodes=['마이크', '자료 소리', '오디오 믹서', '함께 송출'], caption='설명 음성과 자료 소리를 분리해 다루고 마지막에 합친다'),
'2026-06-18-ponslink-algorithm-10-ponscast-tradeoff': dict(title='화면공유와 DataChannel 선택', nodes=['화면공유', '서버/트랙', '전송 채널', '감당할 한계'], caption='쉬운 답과 제어 가능한 답 사이에서 운영 가능한 쪽을 고른다'),
}

def svg_for(spec):
    title = html.escape(spec['title'])
    caption = html.escape(spec['caption'])
    nodes = [html.escape(n) for n in spec['nodes']]
    colors = ['#2563eb', '#0f766e', '#c2410c', '#6d28d9']
    node_svg = []
    arrow_svg = []
    xs = [155, 430, 705, 980]
    y = 250
    for i, (x, label) in enumerate(zip(xs, nodes)):
        node_svg.append(f'<rect x="{x-90}" y="{y-44}" width="180" height="88" rx="22" fill="{colors[i]}"/>')
        node_svg.append(f'<text x="{x}" y="{y+8}" text-anchor="middle" font-size="28" font-weight="700" fill="white">{label}</text>')
        if i < 3:
            arrow_svg.append(f'<path d="M {x+102} {y} C {x+155} {y}, {xs[i+1]-155} {y}, {xs[i+1]-102} {y}" stroke="#334155" stroke-width="7" fill="none" marker-end="url(#arrow)"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520" role="img" aria-label="{title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#eef2ff"/></linearGradient>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 z" fill="#334155"/></marker>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.16"/></filter>
  </defs>
  <rect width="1200" height="520" rx="34" fill="url(#bg)"/>
  <text x="70" y="78" font-size="38" font-weight="800" fill="#0f172a" font-family="Noto Sans CJK KR, Apple SD Gothic Neo, sans-serif">{title}</text>
  <text x="70" y="122" font-size="22" fill="#475569" font-family="Noto Sans CJK KR, Apple SD Gothic Neo, sans-serif">{caption}</text>
  <g filter="url(#shadow)">
    {''.join(arrow_svg)}
    {''.join(node_svg)}
  </g>
  <rect x="70" y="400" width="1060" height="64" rx="22" fill="#0f172a" opacity="0.9"/>
  <text x="100" y="441" font-size="24" font-weight="700" fill="white" font-family="Noto Sans CJK KR, Apple SD Gothic Neo, sans-serif">본문에서 확인할 핵심 흐름만 압축한 보조 다이어그램</text>
</svg>'''

for slug, spec in diagrams.items():
    (BODY / f'{slug}.svg').write_text(svg_for(spec), encoding='utf-8')

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
rows = con.execute("select id, slug, content from Post where status='published' and tags like '%PonsLink%'").fetchall()
missing = []
updated = 0
for r in rows:
    feature = FEATURED / f"{r['slug']}.webp"
    if not feature.exists():
        missing.append(r['slug'])
        continue
    content = r['content'] or ''
    # Remove previous PonsLink body image markdown/html references to prevent duplicates.
    content = re.sub(r'\n?\s*!\[[^\]]*\]\(/tistory/ponslink/(?:body-diagrams|diagrams|covers|imagegen-v2)[^)]+\)\s*\n?', '\n\n', content)
    content = re.sub(r'\n?\s*<img[^>]+/tistory/ponslink/[^>]+>\s*\n?', '\n\n', content, flags=re.I)
    if r['slug'] in diagrams:
        spec = diagrams[r['slug']]
        md = f"\n\n![{spec['title']}](/tistory/ponslink/body-diagrams/{r['slug']}.svg)\n\n"
        marker = '\n### 1.'
        if marker in content:
            content = content.replace(marker, md + marker, 1)
        else:
            parts = content.split('\n\n', 2)
            content = ('\n\n'.join(parts[:2]) + md + ('\n\n' + parts[2] if len(parts) > 2 else ''))
    con.execute('update Post set featuredImage=?, content=? where id=?', (f"/tistory/ponslink/imagegen-v2/{r['slug']}.webp", content, r['id']))
    updated += 1
con.commit()
print('db_backup', backup)
print('updated_posts', updated)
print('missing_featured', missing)
print('body_diagrams', len(list(BODY.glob('*.svg'))))
