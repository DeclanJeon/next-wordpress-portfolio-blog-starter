from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import textwrap, time, shutil, hashlib

ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = ROOT / 'output/imagegen/ponslink-originals'
OUT = ROOT / 'public/tistory/ponslink/diagrams'
OUT.mkdir(parents=True, exist_ok=True)
BACKUP = ROOT / 'db/backups' / f'diagram-covers-before-regenerate-{time.strftime("%Y%m%d%H%M%S")}'
if any(OUT.glob('*.webp')):
    BACKUP.mkdir(parents=True, exist_ok=True)
    for p in OUT.glob('*.webp'):
        shutil.copy2(p, BACKUP / p.name)

FONT_R = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
FONT_M = '/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc'
FONT_B = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'

def font(path, size): return ImageFont.truetype(path, size)
F_TITLE = font(FONT_B, 31)
F_SUB = font(FONT_M, 21)
F_NODE = font(FONT_B, 24)
F_SMALL = font(FONT_M, 18)
F_TINY = font(FONT_M, 14)

specs = {
'2026-06-16-ponslink-01-why-i-came-back-to-connection': dict(kind='flow', title='놓친 연결 → 세션 데스크', subtitle='연락 단계를 줄이는 제품 출발점', nodes=['연락처 저장', '메신저 이동', '타이밍 상실', '바로 만나는 링크'], emphasis='기능보다 “놓치지 않음”'),
'2026-06-16-ponslink-02-webrtc-first-hell': dict(kind='flow', title='방 하나가 첫 얼굴', subtitle='빠른 연결보다 도착 경험이 먼저', nodes=['QR/링크', '입장 조건', '장치 점검', '방 입장'], emphasis='첫 화면은 기능 목록이 아니다'),
'2026-06-16-ponslink-03-beyond-calls': dict(kind='repair', title='연결 성공 ≠ 신뢰', subtitle='장치 전환과 화면공유가 신뢰를 시험', nodes=['연결됨', '장치 변경', '화면공유', '상태 복구'], emphasis='깨질 때의 복구가 품질'),
'2026-06-16-ponslink-04-feature-sprawl': dict(kind='layers', title='통화방 → 협업 공간', subtitle='말로 흩어지는 맥락을 방 안에 붙임', nodes=['통화', '채팅', '화이트보드', '파일/동시보기'], emphasis='기능은 맥락을 보존해야 함'),
'2026-06-16-ponslink-05-winter-rebuild': dict(kind='compare', title='기능은 있는데 문장이 없음', subtitle='만들 수 있음과 설명할 수 있음의 간격', nodes=['기능 증가', '설명 흐림', '출시 보류', '제품 문장'], emphasis='멈춤은 기준을 바꾸는 시간'),
'2026-06-16-ponslink-06-audio-pivot': dict(kind='scale', title='큰 방 욕심의 무게', subtitle='Mesh는 선명하지만 인원 앞에서 약함', nodes=['1:1 연결', '참가자 증가', '서버 중계', '운영 부담'], emphasis='확장은 책임도 키운다'),
'2026-06-16-ponslink-07-requests-payments-ops': dict(kind='trim', title='분산 구조보다 운영 흐름', subtitle='멋진 구조를 덜어내고 감당 가능한 제품으로', nodes=['접근 격자', '데이터 격자', '복구 부담', '요청·결제'], emphasis='빼는 결정도 제품 선택'),
'2026-06-16-ponslink-08-the-big-pivot': dict(kind='fork', title='다시 P2P로 복귀', subtitle='큰 방보다 처음의 연결 문제로 돌아감', nodes=['중계 서버', '분산 구조', 'P2P 연결', '작은 MVP'], emphasis='핵심에 맞지 않는 무게를 제거'),
'2026-06-16-ponslink-09-no-go': dict(kind='gate', title='파일 전송 때문에 NO-GO', subtitle='통화와 파일이 같은 대역폭을 나눠 쓰는 문제', nodes=['통화 품질', '큰 파일', '대역폭 경쟁', '출시 보류'], emphasis='가능함보다 흐름이 우선'),
'2026-06-16-ponslink-10-request-first-desk': dict(kind='flow', title='덜 부담스러운 입장', subtitle='보여 줄 것만 보여 주고 요청부터 받음', nodes=['공개 데스크', '요청 작성', '호스트 검토', '예약/세션'], emphasis='방보다 맥락이 먼저'),
'2026-06-16-ponslink-11-ponswarp-split': dict(kind='split', title='방 밖의 운영을 먼저 분리', subtitle='회의방 기능보다 요청/운영 혼란이 더 커짐', nodes=['데스크', '회의방', '운영', 'PonsWarp'], emphasis='제품은 방 하나가 아니다'),
'2026-06-16-ponslink-12-reading-the-commit-log': dict(kind='timeline', title='커밋 로그가 남긴 증거', subtitle='진행형 제품의 남은 경계를 읽음', nodes=['수정', '릴리스', '출시문', '증거'], emphasis='기능 부족보다 증명할 경계'),
'2026-06-18-ponslink-tech-retrospective': dict(kind='map', title='33편을 읽는 지도', subtitle='역사·구조·알고리즘을 하나의 흐름으로', nodes=['회고', '구조 분석', '알고리즘', '운영 판단'], emphasis='기술 이름보다 선택의 지도'),
'2026-06-18-ponslink-deep-dive-01-map': dict(kind='map', title='저장소에서 경계 읽기', subtitle='낯선 코드에서 제품 구조를 먼저 찾음', nodes=['프론트', 'API/BFF', '런타임', '제품 경계'], emphasis='디렉터리는 제품의 흔적'),
'2026-06-18-ponslink-algorithm-01-negotiation': dict(kind='state', title='Offer 충돌 방지', subtitle='동시에 말 걸 때 누가 양보할지 정함', nodes=['안정 상태', 'Offer 생성', '충돌 감지', '되돌림/재시도'], emphasis='상태머신이 연결 품질을 만듦'),
'2026-06-18-ponslink-deep-dive-02-entry-runtime': dict(kind='gate', title='입장 버튼 뒤의 조건', subtitle='단순 이동이 아니라 권한·장치·세션 검사', nodes=['토큰', '방 권한', '장치 준비', '입장'], emphasis='입장은 런타임 계약'),
'2026-06-18-ponslink-algorithm-02-realtime-queue': dict(kind='lanes', title='메시지는 같은 줄에 서면 안 됨', subtitle='제어·미디어·파일의 우선순위가 다름', nodes=['제어', '실시간', '대용량', '역압'], emphasis='줄 세우기보다 차선 분리'),
'2026-06-18-ponslink-deep-dive-03-zustand-runtime': dict(kind='bus', title='전역 상태가 아니라 런타임 버스', subtitle='Store가 UI와 WebRTC 효과를 연결', nodes=['UI 상태', '런타임 버스', 'Peer 효과', '정리'], emphasis='상태보다 수명 관리'),
'2026-06-18-ponslink-algorithm-03-file-transfer': dict(kind='pipeline', title='P2P 파일 전송의 작은 TCP', subtitle='조각·속도조절·저장까지 하나의 계약', nodes=['조각', '속도 조절', '전송 채널', '로컬 저장'], emphasis='보내기보다 완성 보장'),
'2026-06-18-ponslink-deep-dive-04-bff-control-plane': dict(kind='control', title='미디어를 안 나르는 서버의 책임', subtitle='서버는 권한·쿼터·원본 검증을 맡음', nodes=['API 키', '출처/쿼터', '권한 부여', '브라우저 연결'], emphasis='미디어 밖의 Control Plane'),
'2026-06-18-ponslink-algorithm-04-replay-idempotency': dict(kind='loop', title='놓친 이벤트와 중복 요청', subtitle='Replay와 Idempotency로 운영 흔들림 완화', nodes=['이벤트', '재전송', '중복 키', '안전 반영'], emphasis='다시 와도 한 번만 반영'),
'2026-06-18-ponslink-deep-dive-05-signaling-broker': dict(kind='gate', title='WebRTC 전의 신호 출입문', subtitle='Socket 신호가 권한·순서·재전송을 지킴', nodes=['신호 소켓', '권한/방', '재전송', '연결 후보'], emphasis='연결 전에 문지기가 필요'),
'2026-06-18-ponslink-algorithm-05-request-state': dict(kind='fold', title='내부 상태를 사용자 문장으로', subtitle='복잡한 요청 상태를 이해 가능한 안내로 접음', nodes=['대기', '보류', '승인', '사용자 문장'], emphasis='상태값보다 다음 행동'),
'2026-06-18-ponslink-deep-dive-06-webrtc-mesh': dict(kind='mesh', title='Mesh는 순서가 품질', subtitle='직접 연결은 간단해 보여도 순서에 민감', nodes=['참가자 A', '연결 후보', '참가자 B', '재연결'], emphasis='상대가 안 보임은 작은 순서 문제'),
'2026-06-18-ponslink-algorithm-06-ponscast-protocol': dict(kind='packet', title='DataChannel 위의 PonsCast 프레임', subtitle='화면공유 대신 제어 가능한 미디어 계약', nodes=['미디어 파일', '13B 헤더', '프레임 조각', 'MSE 재생'], emphasis='품질보다 제어권'),
'2026-06-18-ponslink-deep-dive-07-data-channel-file-transfer': dict(kind='lanes', title='한 DataChannel의 위험', subtitle='채팅·화이트보드·파일은 생존 등급이 다름', nodes=['채팅', '화이트보드', '파일 조각', '작업자'], emphasis='모든 메시지는 같은 규칙이 아님'),
'2026-06-18-ponslink-algorithm-07-ponscast-backpressure': dict(kind='buffer', title='백프레셔와 지터 버퍼', subtitle='보내는 속도와 재생 속도를 맞춤', nodes=['토큰 버킷', '상·하한선', '지터 큐', '부드러운 재생'], emphasis='기다림에도 한계가 필요'),
'2026-06-18-ponslink-deep-dive-08-request-first': dict(kind='flow', title='방보다 요청이 먼저', subtitle='상담형 세션은 맥락·검토·예약 뒤 입장', nodes=['요청 접수', '검토', '예약', '세션 입장'], emphasis='Room은 시작이 아니라 실행 지점'),
'2026-06-18-ponslink-algorithm-08-ponscast-cache': dict(kind='storage', title='파일 감지와 캐시 기준', subtitle='MIME만 믿지 않고 저장 한계를 안내', nodes=['형식 검사', '캐시 가능', '용량 초과', '다음 행동'], emphasis='캐시는 흐름 보호 장치'),
'2026-06-18-ponslink-deep-dive-09-payment-access': dict(kind='gate', title='결제보다 입장 권한', subtitle='결제 성공과 세션 접근 상태를 맞춤', nodes=['결제', '웹훅', '입장 상태', '세션 입장'], emphasis='돈을 냈으면 들어갈 수 있어야 함'),
'2026-06-18-ponslink-algorithm-09-ponscast-audio': dict(kind='mix', title='마이크와 PonsCast 오디오', subtitle='자료 소리와 설명 음성을 동시에 살림', nodes=['마이크', 'PonsCast', '오디오 믹서', '함께 송출'], emphasis='기술보다 회의 행동 기준'),
'2026-06-18-ponslink-deep-dive-10-patterns-tests': dict(kind='stack', title='제품을 버티게 한 작은 경계', subtitle='Facade·Repository·Policy·Worker가 실패 확산을 막음', nodes=['Facade', '저장소', '정책', '작업/테스트'], emphasis='큰 설계도보다 작은 경계들의 합'),
'2026-06-18-ponslink-algorithm-10-ponscast-tradeoff': dict(kind='compare', title='화면공유 대신 DataChannel', subtitle='권한·비용·제어권을 비교해 선택', nodes=['화면공유', '서버/트랙', '전송 채널', '감당할 한계'], emphasis='선택은 포기한 것까지 설명해야 함'),
}

COLORS = {
    'paper': (250,247,239,238), 'ink': (26,27,29,255), 'muted': (94,96,99,255),
    'line': (58,87,102,255), 'blue': (38,116,170,255), 'teal': (35,145,134,255),
    'orange': (204,105,55,255), 'violet': (107,83,185,255), 'green': (65,137,87,255),
    'red': (184,76,65,255), 'gold': (214,157,58,255), 'dark': (20,27,35,220)
}
ACCENTS = [COLORS['blue'], COLORS['teal'], COLORS['orange'], COLORS['violet'], COLORS['green'], COLORS['gold']]

def wrap_text(draw, text, font, width):
    lines=[]
    for para in text.split('\n'):
        cur=''
        for ch in para:
            test=cur+ch
            if draw.textbbox((0,0), test, font=font)[2] > width and cur:
                lines.append(cur); cur=ch
            else:
                cur=test
        if cur: lines.append(cur)
    return lines

def draw_round(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def arrow(draw, a, b, color, width=5):
    x1,y1=a; x2,y2=b
    draw.line((x1,y1,x2,y2), fill=color, width=width)
    import math
    ang=math.atan2(y2-y1,x2-x1)
    l=15
    pts=[(x2,y2),(x2-l*math.cos(ang-.45), y2-l*math.sin(ang-.45)),(x2-l*math.cos(ang+.45), y2-l*math.sin(ang+.45))]
    draw.polygon(pts, fill=color)

def text_center(draw, box, txt, fnt, fill):
    x1,y1,x2,y2=box
    lines=wrap_text(draw, txt, fnt, x2-x1-18)
    total=sum(draw.textbbox((0,0),l,font=fnt)[3]-draw.textbbox((0,0),l,font=fnt)[1] for l in lines)+max(0,len(lines)-1)*4
    y=y1+(y2-y1-total)/2
    for l in lines:
        bb=draw.textbbox((0,0),l,font=fnt)
        draw.text((x1+(x2-x1-(bb[2]-bb[0]))/2,y),l,font=fnt,fill=fill)
        y += (bb[3]-bb[1])+4

def node(draw, cx, cy, w, h, label, fill, text_fill=(255,255,255,255), outline=None):
    box=(cx-w/2, cy-h/2, cx+w/2, cy+h/2)
    draw_round(draw, box, 18, fill, outline or (255,255,255,90), 2)
    text_center(draw, box, label, F_SMALL if len(label)>10 else F_NODE, text_fill)
    return box

def add_header(draw, spec):
    x,y,w=72,58,500
    draw_round(draw, (x-22,y-22,x+w+28,y+138), 26, COLORS['paper'], (255,255,255,170), 2)
    for i,line in enumerate(wrap_text(draw, spec['title'], F_TITLE, w)):
        draw.text((x,y+i*38), line, font=F_TITLE, fill=COLORS['ink'])
    yy=y+82
    for line in wrap_text(draw, spec['subtitle'], F_SUB, w):
        draw.text((x,yy), line, font=F_SUB, fill=COLORS['muted']); yy+=27

def add_emphasis(draw, spec):
    text='핵심: '+spec['emphasis']
    x,y=72,596
    draw_round(draw, (x-16,y-12,630,y+40), 22, (20,27,35,215), (255,255,255,95), 1)
    draw.text((x,y), text, font=F_SUB, fill=(255,255,255,255))

def panel(draw):
    x1,y1,x2,y2=610,78,1148,575
    draw_round(draw,(x1,y1,x2,y2),32,(250,247,239,230),(255,255,255,180),2)
    draw.text((x1+28,y1+24),'본문 이해 다이어그램',font=F_SUB,fill=COLORS['muted'])
    return x1,y1,x2,y2

def diagram(draw, spec):
    x1,y1,x2,y2=panel(draw)
    nodes=spec['nodes']; kind=spec['kind']
    if kind in ('flow','pipeline','packet'):
        xs=[x1+85,x1+205,x1+330,x1+455]
        y=y1+255
        for i,n in enumerate(nodes[:4]):
            node(draw,xs[i],y,108,76,n,ACCENTS[i%len(ACCENTS)])
            if i<min(3,len(nodes)-1): arrow(draw,(xs[i]+56,y),(xs[i+1]-58,y),COLORS['line'],4)
    elif kind in ('compare','fork'):
        left=node(draw,x1+135,y1+230,170,86,nodes[0],COLORS['red'])
        right=node(draw,x1+360,y1+230,170,86,nodes[2] if len(nodes)>2 else nodes[-1],COLORS['teal'])
        node(draw,x1+245,y1+370,210,74,nodes[-1],COLORS['gold'],(35,35,35,255))
        arrow(draw,(x1+135,y1+275),(x1+245,y1+332),COLORS['line'],4)
        arrow(draw,(x1+360,y1+275),(x1+245,y1+332),COLORS['line'],4)
        if len(nodes)>3: node(draw,x1+245,y1+135,210,62,nodes[1],COLORS['violet'])
    elif kind in ('split','lanes'):
        node(draw,x1+245,y1+155,180,72,nodes[0],COLORS['blue'])
        ys=[y1+285,y1+380,y1+475]
        for i,n in enumerate(nodes[1:4]):
            node(draw,x1+245,ys[i],250,62,n,ACCENTS[i+1])
            arrow(draw,(x1+245,y1+192),(x1+245,ys[i]-35),COLORS['line'],3)
    elif kind in ('gate','repair'):
        xs=[x1+82,x1+205,x1+330,x1+455]
        y=y1+290
        for i,n in enumerate(nodes[:4]):
            shape=node(draw,xs[i],y,106,68,n,ACCENTS[i])
            if i<3: arrow(draw,(xs[i]+55,y),(xs[i+1]-56,y),COLORS['line'],4)
        draw_round(draw,(x1+205,y1+135,x1+327,y1+205),18,(255,255,255,230),COLORS['orange'],4)
        draw.text((x1+235,y1+153),'검사',font=F_NODE,fill=COLORS['orange'])
        arrow(draw,(x1+267,y1+205),(x1+267,y-42),COLORS['orange'],4)
    elif kind in ('state','loop'):
        pts=[(x1+245,y1+150),(x1+380,y1+275),(x1+245,y1+420),(x1+110,y1+275)]
        for i,p in enumerate(pts):
            node(draw,p[0],p[1],132,64,nodes[i],ACCENTS[i])
            arrow(draw,(p[0]+(40 if i==0 else 0),p[1]+(32 if i==0 else 0)),pts[(i+1)%4],COLORS['line'],3)
    elif kind == 'mesh':
        pts=[(x1+170,y1+190),(x1+330,y1+190),(x1+110,y1+360),(x1+390,y1+360)]
        for i,a in enumerate(pts):
            for b in pts[i+1:]: draw.line((a,b), fill=(58,87,102,100), width=3)
        for i,p in enumerate(pts): node(draw,p[0],p[1],116,62,nodes[i],ACCENTS[i])
    elif kind in ('buffer','mix','bus','control','storage','stack','scale','trim','map','timeline','fold','layers'):
        # vertical explanatory stack with central metaphor ring
        cx=x1+245; cy=y1+305
        draw.ellipse((cx-125,cy-125,cx+125,cy+125), outline=COLORS['line'], width=8, fill=(255,255,255,80))
        for i,n in enumerate(nodes[:4]):
            angle=[-90,0,90,180][i]
            import math
            px=cx+math.cos(math.radians(angle))*160
            py=cy+math.sin(math.radians(angle))*135
            node(draw,px,py,132,64,n,ACCENTS[i])
            arrow(draw,(px,py),(cx+math.cos(math.radians(angle))*78,cy+math.sin(math.radians(angle))*65),COLORS['line'],3)
        draw.ellipse((cx-46,cy-46,cx+46,cy+46), fill=COLORS['dark'], outline=(255,255,255,120), width=2)
        text_center(draw,(cx-45,cy-35,cx+45,cy+35),'제품\n경계',F_SMALL,(255,255,255,255))
    else:
        for i,n in enumerate(nodes[:4]): node(draw,x1+245,y1+145+i*92,250,62,n,ACCENTS[i])

def make_cover(src_path, out_path, spec):
    bg=Image.open(src_path).convert('RGB').resize((1200,675), Image.Resampling.LANCZOS)
    # subtle dark-to-clear gradient for readability
    overlay=Image.new('RGBA',bg.size,(0,0,0,0))
    od=ImageDraw.Draw(overlay)
    for x in range(1200):
        alpha=int(max(0, 118-(x/1200)*90))
        od.line((x,0,x,675), fill=(0,0,0,alpha))
    bg=Image.alpha_composite(bg.convert('RGBA'), overlay)
    draw=ImageDraw.Draw(bg)
    add_header(draw,spec)
    diagram(draw,spec)
    add_emphasis(draw,spec)
    # bottom badge
    draw_round(draw,(976,600,1142,642),20,(250,247,239,225),(255,255,255,150),1)
    draw.text((1000,611),'PonsLink',font=F_SMALL,fill=COLORS['muted'])
    bg.convert('RGB').save(out_path,'WEBP',quality=90,method=6)

missing=[]
for slug,spec in specs.items():
    src=ORIGINALS/(slug+'.png')
    out=OUT/(slug+'-diagram.webp')
    if not src.exists(): missing.append(slug); continue
    make_cover(src,out,spec)
print('updated', len(specs)-len(missing), 'missing', missing)
print('out', OUT)
print('backup', BACKUP if BACKUP.exists() else 'none')
print('unique', len({hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.glob('*.webp')}))
