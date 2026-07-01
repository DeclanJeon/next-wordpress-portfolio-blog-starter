#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import re
import shutil
import sqlite3
from pathlib import Path

DB=Path('db/custom.db')
REPORT=Path('tmp/keep-reading-tail-link-report-2026-06-30.md')
LINK_RE=re.compile(r'\(/writing/[^\)]+\)')
TAIL_RE=re.compile(r"\n{2,}(?:---\n\n)?## (?:같이 읽을 글|다음에 읽을 글|이어지는 글|글 흐름 이어가기|다음 이야기는[^\n]*|여기서 남는 질문)\n[\s\S]*$", re.M)

CONTEXT_FALLBACKS=[
    ('ponswarp','2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink','PonsWarp가 어디서 갈라졌는지 다시 보기'),
    ('ponslink','2026-06-16-ponslink-00-link-only-room','PonsLink의 첫 질문으로 돌아가기'),
    ('p2p','2026-06-16-p2p-00-grid-computing-first-step','P2P를 왜 공부했는지 먼저 보기'),
    ('docuflow','2026-06-29-main-docuflow-01-tools-to-flow','문서 자동화 흐름의 첫 장면 보기'),
    ('ruminate','2026-06-29-main-ruminate-01-ai-should-not-answer-too-fast','도메인 AI 실험의 첫 장면 보기'),
    ('fatemirror','2026-06-29-main-fatemirror-01-mirror-not-fortune','거울 같은 AI 실험의 첫 장면 보기'),
]

def clean(content:str)->str:
    return TAIL_RE.sub('', content.rstrip()).rstrip()

def primary_scope(con, post_id):
    row=con.execute("select n.slug from PostTaxonomy pt join TaxonomyNode n on n.id=pt.nodeId where pt.postId=? and pt.role='primary' limit 1",(post_id,)).fetchone()
    return row['slug'] if row else ''

def pick_candidate(con, post):
    slug=post['slug']
    scope=primary_scope(con, post['id'])
    # same taxonomy published nearby
    ids=[]
    if scope:
        root=con.execute('select id from TaxonomyNode where slug=?',(scope,)).fetchone()
        if root:
            descendants={root['id']}; changed=True
            while changed:
                changed=False
                for r in con.execute('select id,parentId from TaxonomyNode').fetchall():
                    if r['parentId'] in descendants and r['id'] not in descendants:
                        descendants.add(r['id']); changed=True
            q='select distinct postId from PostTaxonomy where nodeId in (%s)'%(','.join('?'*len(descendants)))
            ids=[r['postId'] for r in con.execute(q,tuple(descendants)).fetchall()]
    if ids:
        ph=','.join('?'*len(ids))
        for op,order in [('<','desc'),('>','asc')]:
            cand=con.execute(f"select slug,title from Post where status='published' and id in ({ph}) and slug != ? and datetime(publishedAt) {op} datetime(?) order by datetime(publishedAt) {order}, id {order} limit 1",(*ids,slug,post['publishedAt'])).fetchone()
            if cand: return cand['slug'], cand['title'], '같은 흐름에서 이어서 볼 글'
    lower=(slug+' '+post['title']+' '+post['category']+' '+post['tags']).lower()
    for key,target,reason in CONTEXT_FALLBACKS:
        if key in lower and target != slug:
            cand=con.execute('select slug,title from Post where slug=?',(target,)).fetchone()
            if cand: return cand['slug'], cand['title'], reason
    cand=con.execute('select slug,title from Post where status="published" and slug != ? order by datetime(publishedAt) desc, id desc limit 1',(slug,)).fetchone()
    return (cand['slug'], cand['title'], '최근에 이어서 볼 만한 글') if cand else None

def main():
    stamp=dt.datetime.now().strftime('%Y%m%d%H%M%S')
    backup=DB.with_suffix(DB.suffix+f'.bak-keeptails-{stamp}')
    shutil.copy2(DB, backup)
    con=sqlite3.connect(DB); con.row_factory=sqlite3.Row
    posts=con.execute("select * from Post where status='published' order by datetime(publishedAt) desc, id desc").fetchall()
    changed=[]
    now=dt.datetime.now(dt.UTC).isoformat(timespec='milliseconds').replace('+00:00','Z')
    for p in posts:
        tail=(p['content'] or '')[-1800:]
        if LINK_RE.search(tail):
            continue
        cand=pick_candidate(con,p)
        if not cand:
            continue
        slug,title,reason=cand
        block=("\n\n## 같이 읽을 글\n\n"
               f"이 글에서 멈추면 흐름이 끊긴다. [{title}](/writing/{slug})를 같이 보면 좋다. "
               f"{reason}.\n")
        new=clean(p['content'] or '')+block
        con.execute('update Post set content=?, updatedAt=? where id=?',(new,now,p['id']))
        changed.append((p['slug'],slug,reason))
    con.commit(); con.close()
    REPORT.parent.mkdir(exist_ok=True)
    lines=['# Keep Reading Tail Link Report','',f'- DB 백업: `{backup}`',f'- 변경 글 수: {len(changed)}','','| slug | linked | reason |','| --- | --- | --- |']
    for a,b,r in changed: lines.append(f'| `{a}` | `{b}` | {r} |')
    REPORT.write_text('\n'.join(lines)+'\n')
    print(f'backup={backup}')
    print(f'changed={len(changed)}')
    print(f'report={REPORT}')

if __name__=='__main__': main()
