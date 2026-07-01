#!/usr/bin/env python3
import json, re, statistics
from pathlib import Path
from collections import Counter, defaultdict

RAW=Path('tmp/live-posts-raw-2026-06-30.json')
OUT=Path('tmp/live-posts-storytelling-rewrite-design-2026-06-30.md')
rows=json.load(open(RAW, encoding='utf-8'))

def split_csv(v):
    return [x for x in (v or '').split(',') if x]

def classify(row):
    title=row['title'] or ''
    tax=' '.join(split_csv(row.get('taxSlugs'))).lower()
    cat=(row.get('category') or '').lower()
    if '[p2p]' in title.lower() or 'p2p-foundations' in tax: return 'P2P Foundations'
    if '[ponslink]' in title.lower() or 'ponslink' in tax: return 'PonsLink'
    if '[ponswarp]' in title.lower() or 'ponswarp' in tax: return 'PonsWarp'
    if 'essay' in tax or 'essays' in cat: return 'Essay'
    if 'operation-note' in tax or 'field notes' in cat or 'notes' == cat: return 'Operation Note'
    if 'document-automation' in tax: return 'Document Automation'
    if 'domain-ai' in tax or 'ruminate' in cat or 'fatemirror' in cat: return 'Domain AI'
    return 'Other'

REPORT_PATTERNS=[
    r'^#{2,3}\s*\d+\.', r'무슨 문제를 해결했나\?', r'어떻게 나눴나\?', r'어디를 조심해야 하나\?',
    r'왜 이 문제가 어려웠나\?', r'어떤 선택지를 비교했나\?', r'어디까지 믿어도 되나\?',
    r'문제:', r'선택:', r'남은 것:', r'지금 돌아보면'
]
TEXTBOOK_PATTERNS=[r'필요했다$', r'중요했다$', r'문제였다$', r'일이었다$', r'방식이다$', r'구조다$']
EMOTION_PATTERNS=[r'나는 ', r'내가 ', r'그때', r'처음', r'솔직히', r'막막', r'답답', r'피로', r'무서', r'궁금', r'하고 싶', r'느꼈', r'기억', r'여자친구', r'같은 시간을']
STORY_PATTERNS=[r'처음', r'그런데', r'하지만', r'그래서', r'결국', r'그때', r'나중', r'다시', r'이후', r'그러다']
FAIL_PATTERNS=[r'고장', r'실패', r'무너', r'막혔', r'깨졌', r'어긋', r'한계', r'피로', r'놓친', r'버티지', r'멈추']
WHY_PATTERNS=[r'왜', r'위해', r'때문', r'하려고', r'하고 싶', r'필요', r'선택', r'도입', r'분리']
TECH_PATTERNS=[r'WebRTC', r'P2P', r'DataChannel', r'signaling', r'ICE', r'TURN', r'NAT', r'ACK', r'backpressure', r'백프', r'OPFS', r'IndexedDB', r'WASM', r'Rust', r'ZIP64', r'Mesh', r'queue', r'replay', r'BFF', r'SQLite', r'Prisma']

def count_patterns(patterns, text, flags=0):
    return sum(len(re.findall(p, text, flags)) for p in patterns)

def sentence_end_stats(text):
    sentences=re.split(r'(?<=[.!?다])\s+', text.replace('\n',' '))
    endings=Counter()
    for s in sentences:
        s=s.strip()
        if not s: continue
        m=re.search(r'([가-힣]+(?:다|했다|였다|됐다|된다|있다|없다|같다|않다))$', s)
        if m: endings[m.group(1)] += 1
    return endings

def score(row):
    c=row.get('content') or ''
    title=row.get('title') or ''
    headings=re.findall(r'^#{2,3}\s+(.+)$', c, re.M)
    internal=len(re.findall(r'\]\(/writing/', c))
    imgs=len(re.findall(r'!\[[^\]]*\]\(', c))
    chars=len(c)
    report=count_patterns(REPORT_PATTERNS,c,re.M|re.I)
    emotion=count_patterns(EMOTION_PATTERNS,c,re.I)
    story=count_patterns(STORY_PATTERNS,c,re.I)
    fail=count_patterns(FAIL_PATTERNS,c,re.I)
    why=count_patterns(WHY_PATTERNS,c,re.I)
    tech=count_patterns(TECH_PATTERNS,c,re.I)
    endings=sentence_end_stats(c)
    repeated_end=sum(v for _,v in endings.most_common(3))
    # scores 0-10, higher is better
    emotional=min(10, emotion*2 + (2 if '내가' in c or '나는' in c else 0) + (2 if fail else 0))
    flow=min(10, story + (2 if internal else 0) + (1 if len(headings)>=3 else 0))
    specificity=min(10, (2 if fail else 0)+(2 if why else 0)+(2 if tech else 0)+(2 if chars>=2200 else 0)+(1 if imgs<=2 else 0)+(1 if headings else 0))
    anti_report=max(0, 10 - min(10, report*2 + (2 if repeated_end>8 else 0)))
    total=round(emotional*0.28+flow*0.27+specificity*0.25+anti_report*0.20,1)
    issues=[]
    if emotional < 5: issues.append('감정선/개인적 동기가 약함')
    if report >= 2: issues.append('보고서식/템플릿형 제목 구조가 강함')
    if chars < 1800: issues.append('본문이 짧아 장면 전환과 고민의 밀도가 부족함')
    if flow < 6: issues.append('이야기 흐름 또는 다음 글 연결이 약함')
    if fail == 0 and classify(row) in ('PonsLink','PonsWarp','P2P Foundations'): issues.append('고장/실패/갈등 장면이 부족함')
    if why == 0 and classify(row) in ('PonsLink','PonsWarp','P2P Foundations'): issues.append('기술/제품 선택의 이유가 약함')
    if repeated_end > 10: issues.append('문장 종결이 반복되어 국어책 읽는 느낌이 남')
    if not issues: issues.append('큰 구조 문제는 작음. 문장 리듬과 사례만 보강')
    return dict(chars=chars, headings=headings, internal=internal, images=imgs, report=report, emotion=emotion, story=story, fail=fail, why=why, tech=tech, repeatedEnd=repeated_end, emotionalScore=emotional, flowScore=flow, specificityScore=specificity, antiReportScore=anti_report, total=total, issues=issues)


def specific_rewrite(row, product):
    title=row.get('title') or ''
    slug=row.get('slug') or ''
    low=title.lower()
    def pack(opening, conflict, headings, ending):
        return dict(opening=opening, conflict=conflict, headings=headings, ending=ending)
    if '계정 없이' in title or 'link-only-room' in slug:
        return pack('누군가에게 “가입하지 말고 이 링크로 들어와”라고 보내고 싶었던 순간에서 시작한다.', '링크 진입은 쉬운데 내부에서는 게스트 식별, 권한, 방 상태를 모두 책임져야 했다는 대비를 세운다.', ['링크 하나면 충분하다고 생각했던 순간', '가입을 없애자 제품이 대신 떠안은 것들', '방은 기능이 아니라 부담을 줄이는 약속이었다'], '다음 글로 “왜 그런 방이 필요했는지” 감정적 출발점을 넘긴다.')
    if 'PonsCast' in title or 'ponscast' in slug:
        return pack('언어가 잘 통하지 않는 사람과 같은 파일을 같은 시간에 보고 싶었던 개인적 장면에서 시작한다.', '화면 공유와 파일 동기화는 비슷해 보이지만 “같은 시간을 공유한다”는 요구는 완전히 달랐다는 갈등을 보여준다.', ['같은 화면보다 같은 시간이 필요했다', '파일은 내 손에 있고 시간은 함께 흘러야 했다', '개인적인 장면이 기능의 요구사항이 됐다'], 'PonsCast가 방의 기능 확장과 파일 전송 분리 사이의 다리였음을 연결한다.')
    if '파일 전송은 PonsLink 안에서 먼저 고장' in title or 'file-transfer-broke' in slug:
        return pack('PonsLink 방 안에서 파일을 보내려다 진행률, 메모리, 연결 상태가 먼저 흔들린 장면으로 시작한다.', '회의방은 사람의 맥락을 담아야 하는데 파일 전송은 자체 프로토콜을 요구했다는 충돌을 세운다.', ['처음엔 방 안의 작은 부가기능이었다', '파일이 커지자 방의 리듬이 깨졌다', '그래서 PonsWarp라는 별도 질문이 필요했다'], '다음 글로 서버가 파일을 갖지 않는다는 첫 원칙을 넘긴다.')
    if 'ACK' in title or 'backpressure' in low or '백프' in title:
        return pack('전송이 빠른데도 수신 쪽이 밀리면서 멈추거나 불안해졌던 장면으로 시작한다.', '속도를 올리는 욕심과 브라우저 버퍼를 보호해야 하는 현실을 충돌시킨다.', ['빠르게 보내면 더 빨리 깨졌다', 'ACK는 확인 버튼이 아니라 흐름의 브레이크였다', '백프레셔는 느리게 하는 장치가 아니라 살리는 장치였다'], '다음 글로 메모리/저장 경계 문제를 넘긴다.')
    if '2GB' in title or 'memory' in low or '메모리' in title:
        return pack('작은 파일에서는 멀쩡하던 전송이 큰 파일에서 브라우저 메모리에 그대로 쌓이던 발견으로 시작한다.', '전송 성공과 저장 성공은 다르며, 브라우저가 파일을 어디에 들고 있는지가 제품의 생존 문제였다는 갈등을 세운다.', ['전송은 됐는데 브라우저가 먼저 무너졌다', '파일을 모으는 순간 제품은 실패했다', '저장은 UX가 아니라 생존 조건이었다'], '다음 글로 OPFS/저장 안전망 판단을 연결한다.')
    if 'OPFS' in title:
        return pack('IndexedDB를 떠올렸다가 브라우저가 제공하는 파일 시스템 경계를 다시 살펴보게 된 흐름으로 시작한다.', 'OPFS는 만능 해결책이 아니라 브라우저 제약 안에서 선택한 마지막 안전망이라는 긴장을 보여준다.', ['IndexedDB를 먼저 떠올렸던 이유', 'OPFS가 열어준 길과 닫아둔 문', '저장 전략은 기술 선택이 아니라 실패 경로 설계였다'], '다음 글로 Rust/WASM의 메모리 생존 문제를 넘긴다.')
    if '브라우저' in title or 'download' in low or '저장 방식' in title or 'download-strategy' in slug:
        return pack('내 브라우저에서는 됐는데 다른 브라우저에서는 저장 순간이 다르게 깨졌던 장면으로 시작한다.', '전송 프로토콜이 같아도 마지막 저장 UX는 브라우저마다 다르고, 그 차이가 “전송 성공” 판단을 흔들었다는 갈등을 세운다.', ['전송은 끝났는데 저장은 브라우저마다 달랐다', '다운로드 전략은 호환성 싸움이었다', '사용자에게는 성공/실패 한 문장만 남는다'], '다음 글로 OPFS, ZIP64, 메모리 경계 중 실제 저장 안정화 질문을 넘긴다.')
    if 'Rust' in title or 'WASM' in title or 'Zero-Copy' in title or 'ZIP64' in title:
        return pack('속도를 더 내고 싶어서가 아니라 브라우저 메모리와 큰 파일 경계가 무서워진 순간에서 시작한다.', '멋진 네이티브 기술 도입처럼 보이지만 실제 이유는 복사, GC, 파일 크기 경계에서 살아남기 위함이었다고 밝힌다.', ['속도보다 먼저 무서웠던 건 메모리였다', '브라우저 안에서 네이티브의 규율을 빌리는 일', '기술 욕심과 제품 생존선을 구분해야 했다'], '다음 글로 실패를 견디는 전체 흐름으로 연결한다.')
    if 'WebRTC' in title or 'Mesh' in title or 'signaling' in low or 'Signal' in title or 'DataChannel' in title:
        return pack('“브라우저끼리 붙이면 되겠지”라고 생각했다가 연결 순서, 신호, 상태가 꼬인 장면으로 시작한다.', 'WebRTC는 연결의 일부만 열어줄 뿐 제품이 책임질 상태, 순서, 실패 복구는 남는다는 갈등을 세운다.', ['직접 연결은 마법이 아니었다', '서버가 사라진 자리에 남은 책임', '연결보다 어려웠던 것은 연결의 질서였다'], '다음 글로 메시지/파일/상태 흐름 중 어디가 다시 갈라졌는지 안내한다.')
    if '결제' in title or '권한' in title or '토큰' in title or 'OTP' in title or 'Polar' in title or 'pricing' in low or 'paid' in low:
        return pack('기능은 준비됐는데 사용자가 실제로 돈을 내고 들어오는 순간 무엇을 믿어야 하는지 막혔던 장면으로 시작한다.', '결제 성공, 권한 부여, 세션 입장은 같은 사건처럼 보이지만 운영상 분리되어야 했다는 갈등을 세운다.', ['돈을 받는 순간 제품의 책임이 바뀌었다', '결제 성공과 입장 권한은 같은 말이 아니었다', '운영 게이트는 사용자를 막기 위한 게 아니었다'], '다음 글로 요청 품질/세션 흐름/운영 기준 중 하나를 연결한다.')
    if 'Request' in title or '요청' in title or 'Public Desk' in title or '상담' in title or '멘토링' in title or '코칭' in title:
        return pack('DM이나 문의가 흩어져 들어오고, 정작 회의 전에 맥락이 사라지던 장면에서 시작한다.', '방을 잘 만들어도 요청의 질과 상태를 관리하지 못하면 실제 약속이 굴러가지 않는다는 갈등을 보여준다.', ['회의는 방에 들어오기 전에 이미 시작됐다', '요청을 받는 일은 사람을 거르는 일이 아니었다', '상태를 보여주는 화면이 침묵을 줄였다'], '다음 글로 세션 입장/결제/회의록 중 이어지는 운영 문제를 넘긴다.')
    if 'room' in low or re.search(r'(^|\s)방(을|은|이|에|과|보다|$)', title) or '회의' in title or '연결' in title:
        return pack('화상회의 기능을 붙이는 문제가 아니라 사람이 같은 맥락에 들어오는 장면에서 시작한다.', '연결은 성공했지만 신뢰, 상태, 맥락, 기능 무게가 계속 흔들렸다는 갈등을 세운다.', ['연결이 붙었다고 방이 된 것은 아니었다', '사람이 신경 쓰지 않아도 제품이 기억해야 하는 것들', '회의 앱보다 연결 방식에 가까워진 이유'], '다음 글로 방 밖 운영 또는 파일 전송 분리로 이어지는 질문을 정리한다.')
    if product in ('Essay','Operation Note'):
        return pack('추상 주장을 바로 말하지 말고, 그 생각을 하게 된 하루의 장면이나 작업 중 막힌 순간에서 시작한다.', '좋은 문장/도구/인터넷/이름이 왜 실제 작업의 방향을 바꾸는지 구체 사례로 보여준다.', ['그 생각을 하게 된 한 장면', '처음엔 사소해 보였지만 계속 남은 문제', '작은 습관이 긴 프로젝트를 바꾸는 방식'], '메인 프로젝트와 억지로 연결하지 말고 사이드 노트로 닫는다.')
    return pack('글의 결론을 먼저 말하지 말고, 해당 기능을 만들게 된 실제 사용/개발 장면에서 시작한다.', '처음 기대와 실제 제약을 한 번 충돌시킨 뒤 선택 이유를 설명한다.', ['처음엔 쉽게 보였던 문제', '직접 만들자 달라진 기준', '지금 돌아보면 남는 판단'], '다음 읽을 글이나 남은 질문을 한 문장으로 닫는다.')

def design(row, sc):
    product=classify(row)
    title=row['title']
    slug=row['slug']
    issues=sc['issues']
    # Determine rewrite type
    if '보고서식/템플릿형 제목 구조가 강함' in issues:
        mode='보고서형 구조를 에피소드형 회고로 전환'
    elif '감정선/개인적 동기가 약함' in issues:
        mode='개인적 문제의식과 당시 장면을 앞에 배치'
    elif '이야기 흐름 또는 다음 글 연결이 약함' in issues:
        mode='전후 글과 이어지는 질문을 명시'
    else:
        mode='문장 리듬과 사례 밀도 보강'
    if product=='PonsLink':
        angle='계정 없는 연결, room-first 판단, 기능이 늘어난 이유를 “사용자가 부담을 덜 느끼게 하려던 과정”으로 묶는다.'
    elif product=='PonsWarp':
        angle='PonsLink 안에서 파일 전송이 고장난 장면에서 출발해, 브라우저 한계와 흐름 제어를 겪은 과정으로 묶는다.'
    elif product=='P2P Foundations':
        angle='그리드 컴퓨팅을 꿈꾸며 P2P를 먼저 공부해야 했던 이유를 프롤로그로 유지한다.'
    elif product in ('Essay','Operation Note'):
        angle='추상 주장을 줄이고 실제 경험 장면 하나를 앞에 둔다.'
    else:
        angle='사이드 프로젝트는 메인 서사와 구분하고, 문제를 만난 실제 업무 장면에서 시작한다.'
    # Create section plan
    sections=[
        '첫 문단: 기능 설명이 아니라 그 기능을 만들게 된 당시 장면/불편/욕심으로 시작',
        '중반 1: 처음 생각했던 단순한 해법과 실제로 부딪힌 문제를 대비',
        '중반 2: 선택한 구조나 기술을 “왜 이 선택이 필요했는지”로 설명',
        '후반: 지금 돌아보며 남은 판단, 다음 글로 갈라지는 질문 정리'
    ]
    # image recommendation
    if product in ('PonsLink','PonsWarp','P2P Foundations'):
        image='대표 이미지는 유지. 본문 다이어그램은 리라이트 후 구조 이해가 막히는 글에만 1장 추가.'
    else:
        image='번외 글은 이미지보다 도입 장면 보강 우선. 필요 시 대표 이미지만 유지.'
    specific=specific_rewrite(row, product)
    return dict(slug=slug,title=title,product=product,mode=mode,angle=angle,sections=sections,image=image,specific=specific)

items=[]
for row in rows:
    sc=score(row)
    de=design(row, sc)
    items.append({**{k:row.get(k) for k in ['slug','title','category','readingTime','featuredImage','taxSlugs','seriesSlugs','seriesOrder']}, 'product':classify(row), **sc, 'design':de})

# Sort: worst first, but group main products before essays for action
priority_product={'P2P Foundations':0,'PonsLink':1,'PonsWarp':2,'Document Automation':3,'Domain AI':4,'Operation Note':5,'Essay':6,'Other':7}
items_sorted=sorted(items, key=lambda x:(x['total'], priority_product.get(x['product'],9), x['chars']))

out=[]
out.append('# 라이브 블로그 전체 스토리텔링 QA 및 게시글별 리라이트 설계')
out.append('')
out.append('- 작성일: 2026-06-30')
out.append('- 기준: 운영 DB `/opt/ponslink-blog-next/shared/db/custom.db`')
out.append(f'- 대상: 라이브 published {len(rows)}편')
out.append('- 목적: 일기/보고서/국어책식 글을 찾아 감정이 실린 스토리텔링형 글로 바꾸는 설계')
out.append('')
out.append('## 전체 판정')
out.append('')
out.append('현재 블로그의 가장 큰 문제는 “글의 소재는 좋은데, 다수 글이 사건이 아니라 정리문처럼 읽힌다”는 점이다. 특히 짧은 PonsLink/PonsWarp 보강 글과 일부 기술 회고 글은 제목은 좋지만 본문이 1,000~1,700자에 머물러 있어, 독자가 개발자의 고민을 따라가기 전에 결론이 끝난다.')
out.append('')
out.append('수정 방향은 글마다 다르지만 원칙은 같다.')
out.append('')
out.append('1. 첫 문단을 기능 설명이 아니라 당시 장면으로 시작한다.')
out.append('2. “문제/선택/남은 것” 같은 보고서형 소제목은 가능하면 사건형 문장으로 바꾼다.')
out.append('3. 기술 이름은 뒤에 두고, 그 기술을 선택할 수밖에 없었던 실패나 제약을 먼저 보여준다.')
out.append('4. 각 글 마지막에는 다음 질문이 어디로 갈라지는지 연결한다.')
out.append('')

byprod=defaultdict(list)
for it in items: byprod[it['product']].append(it)
out.append('## 그룹별 요약')
out.append('')
out.append('| 그룹 | 글 수 | 평균 점수 | 평균 글자 수 | 1차 수정 필요 |')
out.append('|---|---:|---:|---:|---:|')
for prod in sorted(byprod, key=lambda p:priority_product.get(p,9)):
    arr=byprod[prod]
    need=sum(1 for x in arr if x['total']<7.0 or '큰 구조 문제는 작음. 문장 리듬과 사례만 보강' not in x['issues'])
    out.append(f"| {prod} | {len(arr)} | {statistics.mean(x['total'] for x in arr):.1f} | {sum(x['chars'] for x in arr)//len(arr)} | {need} |")
out.append('')

out.append('## 우선순위 Top 30')
out.append('')
out.append('| 우선 | 점수 | 제목 | slug | 문제 | 수정 방향 |')
out.append('|---:|---:|---|---|---|---|')
for i,it in enumerate(items_sorted[:30],1):
    out.append(f"| {i} | {it['total']} | {it['title']} | `{it['slug']}` | {'; '.join(it['issues'][:2])} | {it['design']['mode']} |")
out.append('')

out.append('## 리라이트 운영 로드맵')
out.append('')
out.append('### 1차: 점수 5.5 미만')
out.append('- 목표: 일기/보고서/국어책 느낌이 가장 강한 글을 먼저 사건형 글로 바꾼다.')
out.append('- 대상: Top 30 대부분. 특히 PonsLink 요청/결제/권한 글과 번외 에세이 5편.')
out.append('- 수정 폭: 도입부 전면 교체, 소제목 3개 재설계, 마지막 다음 글 연결 추가.')
out.append('')
out.append('### 2차: 점수 5.5 이상 7.0 미만')
out.append('- 목표: 소재는 좋은데 글이 짧거나 흐름이 끊기는 글을 보강한다.')
out.append('- 대상: PonsLink/PonsWarp 보강 글 중 본문 1,000~1,700자 구간.')
out.append('- 수정 폭: 실패 장면 1개, 선택 이유 1개, 지금 돌아보는 판단 1개를 추가한다.')
out.append('')
out.append('### 3차: 점수 7.0 이상')
out.append('- 목표: 이미 스토리텔링 골격이 있는 글은 과하게 고치지 않고 연결성만 맞춘다.')
out.append('- 대상: P2P 프롤로그, PonsLink/PonsWarp 핵심 서사 글 일부.')
out.append('- 수정 폭: 다음 글 안내, 대표 이미지/본문 이미지 중복 여부, 문장 리듬만 점검한다.')
out.append('')
out.append('### 이미지 원칙')
out.append('- 대표 이미지는 글의 한 문장 요약이 보여야 한다.')
out.append('- 본문 이미지는 구조가 복잡한 글에만 1장 넣는다. 모든 글에 다이어그램을 넣지 않는다.')
out.append('- 같은 컨셉 반복 금지. PonsLink는 사람/방/운영 장면, PonsWarp는 전송/버퍼/저장 장면, P2P는 네트워크/그리드 학습 장면으로 분리한다.')
out.append('')
out.append('## 게시글별 수정 설계')
out.append('')
for i,it in enumerate(items_sorted,1):
    d=it['design']
    out.append(f"### {i}. {it['title']}")
    out.append('')
    out.append(f"- slug: `{it['slug']}`")
    out.append(f"- 그룹: {it['product']}")
    out.append(f"- QA 점수: {it['total']} / 10")
    out.append(f"- 현재 글자 수: {it['chars']}")
    out.append(f"- 현재 문제: {'; '.join(it['issues'])}")
    out.append(f"- 수정 타입: {d['mode']}")
    out.append(f"- 새 이야기 축: {d['angle']}")
    out.append('- 권장 구조:')
    for s in d['sections']:
        out.append(f"  - {s}")
    out.append(f"- 이미지/다이어그램: {d['image']}")
    sp=d['specific']
    out.append(f"- 권장 도입 장면: {sp['opening']}")
    out.append(f"- 중심 갈등: {sp['conflict']}")
    out.append('- 바꿀 소제목 방향:')
    for h in sp['headings']:
        out.append(f"  - {h}")
    out.append(f"- 마지막 연결: {sp['ending']}")
    out.append('- 리라이트 메모:')
    if it['product']=='PonsLink':
        out.append('  - 독자가 “왜 회의 앱이 아니라 연결 방식인가”를 느끼게 해야 한다.')
        out.append('  - 개인정보를 덜 요구하고도 연결하려던 감정선을 앞에 둔다.')
    elif it['product']=='PonsWarp':
        out.append('  - 독자가 “왜 파일 전송이 별도 제품으로 분리됐는가”를 이해하게 해야 한다.')
        out.append('  - ACK, backpressure, OPFS, Rust/WASM은 이름보다 고장 장면 뒤에 배치한다.')
    elif it['product']=='P2P Foundations':
        out.append('  - 현재 기준 글에 가깝다. 다음 갈래 안내와 감정선을 유지한다.')
    else:
        out.append('  - 추상 주장을 줄이고 실제 사용/개발 장면 한 개를 구체화한다.')
    out.append('')

out.append('## 실행 순서 제안')
out.append('')
out.append('1. Top 30부터 리라이트한다. 대부분 짧고 보고서식이라 체감 품질 개선이 크다.')
out.append('2. PonsLink/PonsWarp 핵심 서사는 한 편씩 고치되, 다음 글 링크가 깨지지 않게 유지한다.')
out.append('3. 리라이트 후 본문 다이어그램이 꼭 필요한 글만 `$imagegen`으로 1장 생성한다.')
out.append('4. 번외 프로젝트와 영어 에세이는 메인 서사 이후에 정리한다.')

OUT.write_text('\n'.join(out), encoding='utf-8')
Path('tmp/live-posts-storytelling-audit-2026-06-30.json').write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding='utf-8')
print(OUT)
print('items', len(items))
print('top5')
for it in items_sorted[:5]: print(it['total'], it['title'], it['slug'], it['issues'])
