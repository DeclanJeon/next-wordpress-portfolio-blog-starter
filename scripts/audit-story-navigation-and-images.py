#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path

DB=Path('db/custom.db')
OUT=Path('tmp/story-navigation-image-qa-2026-06-30.json')
REPORT=Path('tmp/story-navigation-image-qa-report-2026-06-30.md')
LINK_RE=re.compile(r'\(/writing/([^\)]+)\)')
IMG_MD=re.compile(r'!\[[^\]]*\]\(([^\)]+)\)')
IMG_HTML=re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)

def asset_exists(src:str)->bool:
    if not src: return False
    if src.startswith('http://') or src.startswith('https://'): return True
    path=Path('public')/src.lstrip('/')
    return path.exists()

def classify_image(src:str):
    lower=src.lower()
    if not src:
        return 'replace','대표 이미지 없음'
    if 'story-handdrawn' in lower or 'p2p-foundations' in lower or 'core-story' in lower:
        return 'preserve','손그림/펜그림 계열 경로'
    if any(x in lower for x in ['diagram','handdrawn','sketch','pencil','pen']):
        return 'preserve','파일명상 손그림/다이어그램 계열'
    if lower.endswith('.svg'):
        return 'revise','벡터/도식 이미지라 보존 가능하지만 손그림 톤 QA 필요'
    return 'replace','손그림/펜그림 기준 충족 근거 부족'

def main():
    con=sqlite3.connect(DB); con.row_factory=sqlite3.Row
    posts=[dict(r) for r in con.execute("select * from Post where status='published' order by datetime(publishedAt) desc, id desc")]
    byid={p['id']:p for p in posts}; byslug={p['slug']:p for p in posts}
    series_rows=con.execute('''select ps.*, s.slug as seriesSlug, s.title as seriesTitle from PostSeries ps join Series s on s.id=ps.seriesId order by s.sortOrder asc, s.slug asc, ps.sortOrder asc''').fetchall()
    series=defaultdict(list)
    membership=defaultdict(list)
    for r in series_rows:
        d=dict(r)
        if d['postId'] in byid:
            series[d['seriesId']].append(d); membership[d['postId']].append(d)
    for sid in series: series[sid].sort(key=lambda r:(r['sortOrder'], byid[r['postId']]['slug']))
    first_membership={pid:sorted(ms,key=lambda m:(m['seriesSlug'],m['sortOrder']))[0] for pid,ms in membership.items()}

    issues=[]; image_rows=[]
    duplicate_featured=defaultdict(list)
    for p in posts:
        content=p['content'] or ''
        tail=content[-2200:]
        links=LINK_RE.findall(tail)
        mem=first_membership.get(p['id'])
        expected_next=None; expected_prev=None; series_slug=None; pos=None; total=None
        if mem:
            arr=series[mem['seriesId']]
            idx=[i for i,x in enumerate(arr) if x['postId']==p['id']][0]
            series_slug=mem['seriesSlug']; pos=idx+1; total=len(arr)
            if idx>0: expected_prev=byid[arr[idx-1]['postId']]['slug']
            if idx+1<len(arr): expected_next=byid[arr[idx+1]['postId']]['slug']
        if expected_next and expected_next not in links:
            issues.append({'slug':p['slug'],'kind':'tail_missing_expected_series_next','expected':expected_next,'actual':links[:3]})
        if links and expected_next and links[0] != expected_next:
            issues.append({'slug':p['slug'],'kind':'tail_first_link_not_expected_series_next','expected':expected_next,'actual':links[0]})
        if not links:
            issues.append({'slug':p['slug'],'kind':'tail_has_no_reading_link','expected':expected_next,'actual':None})
        if p['featuredImage']:
            duplicate_featured[p['featuredImage']].append(p['slug'])
        status,reason=classify_image(p['featuredImage'])
        exists=asset_exists(p['featuredImage'])
        if not exists:
            issues.append({'slug':p['slug'],'kind':'featured_image_missing_file','expected':p['featuredImage'],'actual':None})
        inline=IMG_MD.findall(content)+IMG_HTML.findall(content)
        if p['featuredImage'] and p['featuredImage'] in inline:
            issues.append({'slug':p['slug'],'kind':'featured_repeated_inline','expected':'no duplicate','actual':p['featuredImage']})
        for src in inline:
            if not asset_exists(src):
                issues.append({'slug':p['slug'],'kind':'inline_image_missing_file','expected':src,'actual':None})
        image_rows.append({'slug':p['slug'],'featuredImage':p['featuredImage'],'imageStatus':status,'imageReason':reason,'exists':exists,'inlineImages':inline,'series':series_slug,'seriesPosition':pos,'seriesTotal':total})
    dup={k:v for k,v in duplicate_featured.items() if len(v)>1}
    for src,slugs in dup.items():
        issues.append({'slug':','.join(slugs[:4]),'kind':'duplicate_featured_image','expected':'unique representative image','actual':src})
    counts=Counter(i['kind'] for i in issues)
    img_counts=Counter(r['imageStatus'] for r in image_rows)
    result={'summary':{'published':len(posts),'issues':len(issues),'issueCounts':dict(counts),'imageStatusCounts':dict(img_counts),'duplicateFeaturedGroups':len(dup)},'issues':issues,'images':image_rows}
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2))
    REPORT.parent.mkdir(exist_ok=True)
    lines=['# Story Navigation / Image QA Report','',f'- 공개 글: {len(posts)}',f'- 총 이슈: {len(issues)}',f'- 중복 대표 이미지 그룹: {len(dup)}','', '## Issue Counts','']
    for k,v in counts.most_common(): lines.append(f'- `{k}`: {v}')
    lines += ['', '## Image Status Counts','']
    for k,v in img_counts.most_common(): lines.append(f'- `{k}`: {v}')
    lines += ['', '## 남은 이슈','', '| kind | slug | expected | actual |','| --- | --- | --- | --- |']
    for i in issues[:120]: lines.append(f"| `{i['kind']}` | `{i['slug']}` | `{i.get('expected')}` | `{i.get('actual')}` |")
    REPORT.write_text('\n'.join(lines)+'\n')
    print(json.dumps(result['summary'],ensure_ascii=False,indent=2))
    print(f'out={OUT}')
    print(f'report={REPORT}')

if __name__=='__main__': main()
