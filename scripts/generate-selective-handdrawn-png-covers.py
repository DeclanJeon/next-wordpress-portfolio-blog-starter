#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import hashlib
import math
import random
import re
import shutil
import sqlite3
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

DB=Path('db/custom.db')
OUT=Path('public/tistory/story-handdrawn')
REPORT=Path('tmp/selective-handdrawn-cover-report-2026-06-30.md')
PRESERVE_MARKERS=('story-handdrawn','core-story/imagegen-covers','p2p-foundations')
W,H=1200,675

PALETTES={
 'ponslink':('#dbeafe','#2563eb','#0f172a'),
 'ponswarp':('#ffedd5','#ea580c','#431407'),
 'p2p':('#dcfce7','#16a34a','#14532d'),
 'doc':('#fef3c7','#d97706','#451a03'),
 'ai':('#ede9fe','#7c3aed','#2e1065'),
 'tool':('#e0f2fe','#0284c7','#082f49'),
 'essay':('#f5f5f4','#78716c','#1c1917'),
}

def font(size:int):
    candidates=[
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p,size)
    return ImageFont.load_default()

F_TITLE=font(42); F_SMALL=font(22)

def seed(slug:str): return int(hashlib.sha256(slug.encode()).hexdigest()[:12],16)
def jitter(rng, n=5): return rng.uniform(-n,n)
def line(draw,rng,pts,fill,width=4):
    pts=[(x+jitter(rng),y+jitter(rng)) for x,y in pts]
    draw.line(pts,fill=fill,width=width,joint='curve')
def rect(draw,rng,xy,outline,width=4,fill=None):
    x1,y1,x2,y2=xy
    for off in range(max(1,width//2)):
        draw.rounded_rectangle((x1+jitter(rng,2)+off,y1+jitter(rng,2)+off,x2+jitter(rng,2)-off,y2+jitter(rng,2)-off),radius=18,outline=outline,fill=fill if off==0 else None,width=2)
def circle(draw,rng,xy,outline,width=4,fill=None):
    x,y,r=xy
    for off in range(max(1,width//2)):
        draw.ellipse((x-r+jitter(rng,2)+off,y-r+jitter(rng,2)+off,x+r+jitter(rng,2)-off,y+r+jitter(rng,2)-off),outline=outline,fill=fill if off==0 else None,width=2)
def arrow(draw,rng,a,b,fill,width=4):
    line(draw,rng,[a,b],fill,width)
    ang=math.atan2(b[1]-a[1],b[0]-a[0])
    for da in (2.55,-2.55):
        p=(b[0]-24*math.cos(ang+da), b[1]-24*math.sin(ang+da))
        line(draw,rng,[b,p],fill,width)

def palette(slug,title,tags):
    text=(slug+' '+title+' '+tags).lower()
    if 'ponswarp' in text: return PALETTES['ponswarp']
    if 'ponslink' in text: return PALETTES['ponslink']
    if 'p2p' in text or 'grid' in text or 'webrtc' in text: return PALETTES['p2p']
    if 'docu' in text or 'document' in text or 'hwp' in text: return PALETTES['doc']
    if 'ruminate' in text or 'fate' in text or 'ai' in text: return PALETTES['ai']
    if 'tool' in text or 'small' in text: return PALETTES['tool']
    return PALETTES['essay']

def kind(slug,title,tags):
    t=(slug+' '+title+' '+tags).lower()
    if any(x in t for x in ['pricing','free-pro']): return 'pricing'
    if any(x in t for x in ['polar','paid-launch','payment']): return 'checkout'
    if any(x in t for x in ['entitlement','permission','token']): return 'permission'
    if any(x in t for x in ['limit','plan-enforcement','plan']): return 'limits'
    if 'webhook' in t: return 'webhook'
    if any(x in t for x in ['admin','otp']): return 'otp'
    if any(x in t for x in ['calendly','calendar','schedule']): return 'calendar'
    if any(x in t for x in ['direct-sales','customer','first-customer']): return 'customer'
    if any(x in t for x in ['landing','product-hunt','launch']): return 'landing'
    if any(x in t for x in ['dm','screening']): return 'dm'
    if any(x in t for x in ['approve','hold','decline']): return 'approval'
    if any(x in t for x in ['request-status','status']): return 'status_board'
    if any(x in t for x in ['form','public-request-link','public-desk','request-first','desk']): return 'request_form'
    if any(x in t for x in ['meeting-record','records']): return 'records'
    if any(x in t for x in ['session','room-not-call']): return 'session'
    if any(x in t for x in ['payment','paid','entitlement','limit','plan','free','pro']): return 'payment'
    if any(x in t for x in ['admin','otp','webhook','token','permission','security','access','gate']): return 'security'
    if any(x in t for x in ['sales','customer','landing','product-hunt','launch','dm','screening']): return 'growth'
    if any(x in t for x in ['request','status','approve','hold','decline','desk','form']): return 'request'
    if any(x in t for x in ['meeting','record','session','room-not-call']): return 'meeting'
    if 'ponscast-cache' in t or 'cache' in t: return 'media_cache'
    if 'ponscast-audio' in t or 'audio' in t: return 'media_audio'
    if 'ponscast-protocol' in t or 'protocol' in t: return 'media_protocol'
    if 'ponscast-tradeoff' in t or 'tradeoff' in t: return 'media_tradeoff'
    if any(x in t for x in ['audio','ponscast','cast','media','cache']): return 'media'
    if 'zero-copy' in t: return 'zero_copy'
    if 'zip64' in t or 'zip' in t: return 'zip_stream'
    if 'browser-download' in t or 'download' in t: return 'browser_download'
    if 'mobile-background' in t or 'mobile' in t: return 'mobile_resume'
    if 'incomplete' in t or 'partial' in t: return 'recovery'
    if 'cloud-drop' in t or 'direct-cloud' in t: return 'cloud_drop'
    if 'rust-wasm' in t or 'wasm' in t or 'memory' in t: return 'rust_wasm'
    if 'backpressure' in t or 'pipeline' in t or 'ack' in t: return 'backpressure'
    if any(x in t for x in ['transfer','file','opfs','browser']): return 'transfer'
    if any(x in t for x in ['webrtc','mesh','signal','p2p','grid','network','connection']): return 'network'
    if any(x in t for x in ['state','resync','queue','replay','idempotency','runtime','bff','control','map','test','pattern']): return 'system'
    if any(x in t for x in ['document','docu','hwp','ocr','pdf']): return 'document'
    if any(x in t for x in ['ruminate','fate','mirror','classic','ai']): return 'ai'
    if any(x in t for x in ['tool','naming','writing','internet','discipline','bridge']): return 'essay'
    if any(x in t for x in ['room','link']): return 'room'
    return 'system'

def draw_laptop(draw,rng,x,y,accent,ink):
    rect(draw,rng,(x,y,x+170,y+105),ink,4,fill=(255,255,255,210)); rect(draw,rng,(x+25,y+20,x+145,y+80),accent,2)
    line(draw,rng,[(x-20,y+118),(x+190,y+118)],ink,5)
def draw_file(draw,rng,x,y,accent,ink):
    rect(draw,rng,(x,y,x+92,y+120),ink,4,fill=(255,255,255,220))
    line(draw,rng,[(x+65,y),(x+92,y+28),(x+92,y+120)],ink,3)
    for yy in [y+42,y+64,y+86]: line(draw,rng,[(x+18,yy),(x+70,yy)],accent,3)
def draw_person(draw,rng,x,y,accent,ink):
    circle(draw,rng,(x,y,22),ink,3,fill=(255,255,255,200)); line(draw,rng,[(x,y+24),(x,y+82)],ink,4); line(draw,rng,[(x-35,y+50),(x+35,y+50)],accent,4); line(draw,rng,[(x,y+82),(x-30,y+120)],ink,4); line(draw,rng,[(x,y+82),(x+30,y+120)],ink,4)

def draw_calendar(draw,rng,x,y,accent,ink):
    rect(draw,rng,(x,y,x+170,y+135),ink,4,fill=(255,255,255,210))
    line(draw,rng,[(x,y+35),(x+170,y+35)],ink,3)
    for ix in range(4):
        for iy in range(3):
            circle(draw,rng,(x+35+ix*34,y+58+iy*28,8),accent,2)

def draw_lock(draw,rng,x,y,accent,ink):
    rect(draw,rng,(x,y+45,x+115,y+135),ink,4,fill=(255,255,255,220))
    draw.arc((x+25,y,x+90,y+80),180,360,fill=ink,width=5)
    circle(draw,rng,(x+58,y+88,10),accent,3)

def draw_coin(draw,rng,x,y,accent,ink):
    circle(draw,rng,(x,y,32),ink,3,fill=(255,255,255,220)); circle(draw,rng,(x,y,18),accent,3)

def draw_stamp(draw,rng,x,y,accent,ink,label='OK'):
    rect(draw,rng,(x,y,x+150,y+90),accent,4,fill=(255,255,255,160))
    draw.text((x+35,y+24),label,font=F_SMALL,fill=ink)

def draw_message(draw,rng,x,y,accent,ink):
    rect(draw,rng,(x,y,x+170,y+105),ink,4,fill=(255,255,255,210))
    line(draw,rng,[(x+15,y+20),(x+85,y+65),(x+155,y+20)],accent,4)
    line(draw,rng,[(x+15,y+85),(x+60,y+55)],ink,3); line(draw,rng,[(x+155,y+85),(x+110,y+55)],ink,3)

def draw_scale(draw,rng,x,y,accent,ink):
    line(draw,rng,[(x,y),(x,y+150)],ink,5); line(draw,rng,[(x-135,y+38),(x+135,y+38)],ink,4)
    for dx,h in [(-105,70),(105,105)]:
        line(draw,rng,[(x+dx,y+38),(x+dx,y+h)],accent,3)
        rect(draw,rng,(x+dx-55,y+h,x+dx+55,y+h+45),ink,3,fill=(255,255,255,180))

def draw_status_board(draw,rng,x,y,accent,ink):
    rect(draw,rng,(x,y,x+420,y+250),ink,4,fill=(255,255,255,185))
    for i,label in enumerate(['NEW','HOLD','GO']):
        yy=y+45+i*62
        circle(draw,rng,(x+45,yy,18),accent if i != 1 else ink,3)
        line(draw,rng,[(x+82,yy),(x+235,yy+rng.randint(-4,4))],ink,3)
        draw.text((x+260,yy-14),label,font=F_SMALL,fill=ink)

def draw_scene(draw,rng,k,accent,ink):
    if k=='backpressure':
        draw_laptop(draw,rng,145,235,accent,ink); draw_laptop(draw,rng,865,235,accent,ink)
        for i,x in enumerate(range(375,780,70)):
            h=35 + (i % 3) * 18
            rect(draw,rng,(x,365-h,x+40,365),accent,3,fill=accent+(70,))
        line(draw,rng,[(350,270),(850,270)],ink,4); line(draw,rng,[(350,420),(850,420)],ink,3)
        arrow(draw,rng,(360,270),(850,270),accent,5); arrow(draw,rng,(850,420),(360,420),ink,3)
        draw.text((500,455),'ACK / pause / resume',font=F_SMALL,fill=ink)
    elif k=='zero_copy':
        draw_laptop(draw,rng,170,250,accent,ink); draw_file(draw,rng,435,185,accent,ink); rect(draw,rng,(640,220,820,445),ink,4,fill=(255,255,255,180)); draw_laptop(draw,rng,900,265,accent,ink)
        for x in [635,690,745,800]: circle(draw,rng,(x,500,20),accent,3)
        arrow(draw,rng,(340,320),(435,300),accent,4); arrow(draw,rng,(525,300),(640,320),ink,4); arrow(draw,rng,(820,320),(900,325),accent,4)
    elif k=='zip_stream':
        draw_file(draw,rng,180,205,accent,ink); rect(draw,rng,(420,190,690,480),ink,4,fill=(255,255,255,180)); draw_file(draw,rng,840,190,accent,ink); draw_file(draw,rng,950,235,accent,ink)
        for y in range(230,440,38): line(draw,rng,[(485,y),(625,y+rng.randint(-5,5))],accent if y % 2 else ink,3)
        arrow(draw,rng,(272,310),(420,310),accent,5); arrow(draw,rng,(690,310),(840,300),ink,4)
    elif k=='browser_download':
        draw_laptop(draw,rng,155,235,accent,ink); rect(draw,rng,(440,210,760,455),ink,4,fill=(255,255,255,180)); draw_file(draw,rng,900,210,accent,ink)
        for x in [500,565,630,695]: arrow(draw,rng,(x,250),(x,390),accent,3)
        arrow(draw,rng,(325,315),(440,315),ink,4); arrow(draw,rng,(760,315),(900,300),accent,4)
    elif k=='mobile_resume':
        rect(draw,rng,(195,190,380,480),ink,4,fill=(255,255,255,190)); draw_file(draw,rng,520,210,accent,ink); rect(draw,rng,(760,205,945,495),ink,4,fill=(255,255,255,190))
        for x,y in [(435,320),(480,350),(690,350),(735,320)]: circle(draw,rng,(x,y,22),accent,3)
        arrow(draw,rng,(380,320),(520,300),accent,4); arrow(draw,rng,(612,300),(760,320),ink,4); draw.text((470,455),'sleep → resume',font=F_SMALL,fill=ink)
    elif k=='recovery':
        draw_laptop(draw,rng,145,245,accent,ink); draw_file(draw,rng,400,210,accent,ink); draw_file(draw,rng,560,250,accent,ink); draw_laptop(draw,rng,865,245,accent,ink)
        line(draw,rng,[(335,325),(770,325)],ink,3); line(draw,rng,[(335,390),(770,390)],accent,5)
        rect(draw,rng,(630,355,735,425),accent,4,fill=(255,255,255,190)); draw.text((646,374),'retry',font=F_SMALL,fill=ink)
        arrow(draw,rng,(770,325),(865,325),ink,4); arrow(draw,rng,(865,390),(335,390),accent,3)
    elif k=='cloud_drop':
        draw_laptop(draw,rng,130,260,accent,ink); draw_file(draw,rng,345,210,accent,ink); circle(draw,rng,(610,300,85),accent,5,fill=(255,255,255,145)); draw_file(draw,rng,735,220,accent,ink); draw_laptop(draw,rng,900,265,accent,ink)
        arrow(draw,rng,(300,325),(345,305),ink,4); arrow(draw,rng,(435,305),(525,300),accent,4); arrow(draw,rng,(695,300),(735,305),accent,4); arrow(draw,rng,(825,305),(900,330),ink,4)
    elif k=='rust_wasm':
        rect(draw,rng,(165,205,410,465),ink,4,fill=(255,255,255,170)); circle(draw,rng,(565,325,80),accent,5); rect(draw,rng,(720,205,1010,465),ink,4,fill=(255,255,255,185))
        for i,x in enumerate([220,270,320,370]): line(draw,rng,[(x,250),(x,420)],accent if i % 2 else ink,3)
        draw.text((515,305),'WASM',font=F_SMALL,fill=ink); arrow(draw,rng,(410,325),(485,325),accent,4); arrow(draw,rng,(645,325),(720,325),ink,4)
    elif k=='media_cache':
        draw_laptop(draw,rng,145,245,accent,ink); circle(draw,rng,(500,320,78),accent,5); rect(draw,rng,(650,215,850,440),ink,4,fill=(255,255,255,180)); draw_laptop(draw,rng,900,265,accent,ink)
        for y in [265,320,375]: line(draw,rng,[(685,y),(815,y+rng.randint(-4,4))],accent,3)
        arrow(draw,rng,(315,320),(425,320),ink,4); arrow(draw,rng,(575,320),(650,320),accent,4); arrow(draw,rng,(850,320),(900,325),ink,4)
    elif k=='media_audio':
        draw_laptop(draw,rng,145,245,accent,ink); circle(draw,rng,(520,320,68),accent,5); draw_laptop(draw,rng,880,245,accent,ink)
        for r in [95,130,165]: draw.arc((520-r,320-r,520+r,320+r),-35,35,fill=ink,width=3); draw.arc((520-r,320-r,520+r,320+r),145,215,fill=ink,width=3)
        arrow(draw,rng,(315,320),(452,320),accent,4); arrow(draw,rng,(588,320),(880,320),ink,4)
    elif k=='media_protocol':
        draw_laptop(draw,rng,145,250,accent,ink); draw_file(draw,rng,430,195,accent,ink); rect(draw,rng,(630,230,790,410),ink,4,fill=(255,255,255,180)); draw_laptop(draw,rng,900,260,accent,ink)
        for y in [270,315,360]: arrow(draw,rng,(320,y),(430,y-20),accent,3); arrow(draw,rng,(520,y-20),(630,y),ink,3); arrow(draw,rng,(790,y),(900,y+10),accent,3)
    elif k=='media_tradeoff':
        draw_scale(draw,rng,330,215,accent,ink); circle(draw,rng,(655,320,70),accent,5); draw_laptop(draw,rng,820,255,accent,ink)
        draw.text((245,435),'sync',font=F_SMALL,fill=ink); draw.text((430,450),'delay',font=F_SMALL,fill=ink); arrow(draw,rng,(470,320),(585,320),accent,4); arrow(draw,rng,(725,320),(820,320),ink,4)
    elif k=='pricing':
        rect(draw,rng,(170,205,435,475),ink,4,fill=(255,255,255,190)); rect(draw,rng,(520,170,850,510),accent,4,fill=(255,255,255,210)); rect(draw,rng,(900,225,1030,455),ink,4,fill=(255,255,255,175))
        draw.text((230,235),'FREE',font=F_SMALL,fill=ink); draw.text((650,205),'PRO',font=F_SMALL,fill=ink)
        for y in [300,350,400]: line(draw,rng,[(215,y),(390,y+rng.randint(-4,4))],accent,3); line(draw,rng,[(575,y),(790,y+rng.randint(-4,4))],ink,3)
        arrow(draw,rng,(435,335),(520,335),accent,4); arrow(draw,rng,(850,335),(900,335),ink,3)
    elif k=='checkout':
        draw_laptop(draw,rng,150,235,accent,ink); draw_file(draw,rng,440,210,accent,ink); draw_lock(draw,rng,680,215,accent,ink)
        rect(draw,rng,(875,215,1035,445),ink,4,fill=(255,255,255,190)); draw.text((910,250),'PAID',font=F_SMALL,fill=ink)
        for y in [310,355,400]: line(draw,rng,[(910,y),(1000,y+rng.randint(-5,5))],accent,3)
        arrow(draw,rng,(330,305),(440,305),accent,4); arrow(draw,rng,(535,305),(680,305),ink,4); arrow(draw,rng,(795,305),(875,305),accent,4)
    elif k=='permission':
        draw_person(draw,rng,180,255,accent,ink); draw_lock(draw,rng,400,210,accent,ink); draw_stamp(draw,rng,610,245,accent,ink,'ALLOW'); rect(draw,rng,(830,220,1010,430),ink,4,fill=(255,255,255,180))
        arrow(draw,rng,(270,340),(400,315),accent,4); arrow(draw,rng,(515,315),(610,315),ink,4); arrow(draw,rng,(760,315),(830,315),accent,4)
    elif k=='limits':
        draw_scale(draw,rng,330,210,accent,ink); draw_laptop(draw,rng,610,250,accent,ink); draw_lock(draw,rng,850,225,accent,ink)
        for x in [570,620,670,930,980]: draw_coin(draw,rng,x,430+rng.randint(-12,12),accent,ink)
        arrow(draw,rng,(465,320),(610,320),accent,4); arrow(draw,rng,(780,320),(850,320),ink,4)
    elif k=='webhook':
        draw_laptop(draw,rng,155,245,accent,ink); rect(draw,rng,(465,190,735,470),ink,4,fill=(255,255,255,185)); draw_status_board(draw,rng,805,210,accent,ink)
        for y in [245,315,385]: arrow(draw,rng,(325,y),(465,y),accent,3)
        arrow(draw,rng,(735,330),(805,330),ink,4)
    elif k=='otp':
        draw_lock(draw,rng,180,230,accent,ink); rect(draw,rng,(430,230,760,430),ink,4,fill=(255,255,255,190))
        for i in range(6): rect(draw,rng,(465+i*45,305,495+i*45,350),accent,3,fill=(255,255,255,220))
        draw_person(draw,rng,950,270,accent,ink); arrow(draw,rng,(295,320),(430,320),accent,4); arrow(draw,rng,(760,320),(930,340),ink,4)
    elif k=='customer':
        draw_person(draw,rng,180,265,accent,ink); draw_message(draw,rng,380,230,accent,ink); draw_laptop(draw,rng,660,245,accent,ink); circle(draw,rng,(950,325,70),accent,4)
        arrow(draw,rng,(255,335),(380,315),ink,4); arrow(draw,rng,(550,315),(660,315),accent,4); arrow(draw,rng,(830,315),(885,315),ink,4)
    elif k=='landing':
        rect(draw,rng,(150,185,520,505),ink,4,fill=(255,255,255,185)); rect(draw,rng,(195,235,475,305),accent,3); line(draw,rng,[(195,350),(455,350)],ink,4); line(draw,rng,[(195,400),(395,400)],ink,3)
        for x,h in [(650,90),(745,150),(840,235),(935,300)]: rect(draw,rng,(x,500-h,x+55,500),accent,3,fill=accent+(60,))
        arrow(draw,rng,(520,350),(945,190),ink,4)
    elif k=='dm':
        draw_message(draw,rng,155,230,accent,ink); draw_message(draw,rng,380,285,accent,ink); draw_status_board(draw,rng,675,210,accent,ink)
        arrow(draw,rng,(325,290),(380,330),accent,4); arrow(draw,rng,(550,340),(675,335),ink,4)
    elif k=='approval':
        draw_file(draw,rng,170,210,accent,ink); draw_stamp(draw,rng,390,235,accent,ink,'HOLD'); draw_stamp(draw,rng,590,235,accent,ink,'GO'); draw_stamp(draw,rng,790,235,accent,ink,'NO')
        arrow(draw,rng,(265,305),(390,305),ink,4); arrow(draw,rng,(540,305),(590,305),accent,3); arrow(draw,rng,(740,305),(790,305),accent,3)
        draw_person(draw,rng,980,300,accent,ink)
    elif k=='status_board':
        draw_status_board(draw,rng,210,205,accent,ink); draw_person(draw,rng,780,270,accent,ink); draw_laptop(draw,rng,900,285,accent,ink)
        arrow(draw,rng,(635,330),(780,340),accent,4)
    elif k=='request_form':
        rect(draw,rng,(170,185,520,500),ink,4,fill=(255,255,255,200))
        for y in [250,310,370,430]: circle(draw,rng,(225,y,16),accent,3); line(draw,rng,[(260,y),(470,y+rng.randint(-5,5))],ink,3)
        draw_laptop(draw,rng,720,250,accent,ink); arrow(draw,rng,(520,340),(720,320),accent,5)
    elif k=='records':
        rect(draw,rng,(160,205,390,470),ink,4,fill=(255,255,255,185)); draw_laptop(draw,rng,485,250,accent,ink); draw_file(draw,rng,800,205,accent,ink); draw_file(draw,rng,920,245,accent,ink)
        for y in [260,315,370,425]: line(draw,rng,[(200,y),(350,y+rng.randint(-4,4))],accent,3)
        arrow(draw,rng,(390,330),(485,330),ink,4); arrow(draw,rng,(655,330),(800,310),accent,4)
    elif k=='session':
        rect(draw,rng,(170,180,1030,495),ink,5,fill=(255,255,255,160)); draw_laptop(draw,rng,230,270,accent,ink); draw_calendar(draw,rng,505,240,accent,ink); draw_person(draw,rng,850,300,accent,ink)
        arrow(draw,rng,(400,335),(505,315),accent,4); arrow(draw,rng,(675,315),(850,340),ink,4)
    elif k=='transfer':
        draw_laptop(draw,rng,150,230,accent,ink); draw_laptop(draw,rng,855,230,accent,ink)
        for i,x in enumerate(range(370,800,80)):
            draw.rounded_rectangle((x,300+rng.randint(-20,20),x+38,338+rng.randint(-20,20)),radius=8,outline=ink,fill=accent+(95,),width=3)
        arrow(draw,rng,(330,295),(850,295),accent,5); arrow(draw,rng,(850,390),(330,390),ink,3)
        for x in [470,570,670]: circle(draw,rng,(x,390,20),accent,3)
        draw_file(draw,rng,540,160,accent,ink)
    elif k=='payment':
        draw_laptop(draw,rng,160,250,accent,ink); draw_lock(draw,rng,520,220,accent,ink)
        for x in [390,440,490,690,740,790]: draw_coin(draw,rng,x,380+rng.randint(-20,20),accent,ink)
        arrow(draw,rng,(330,320),(520,305),accent,5); arrow(draw,rng,(640,305),(860,315),ink,4)
        rect(draw,rng,(860,245,1010,390),ink,4,fill=(255,255,255,210))
    elif k=='calendar':
        draw_calendar(draw,rng,180,230,accent,ink); draw_calendar(draw,rng,500,210,accent,ink); draw_calendar(draw,rng,820,250,accent,ink)
        arrow(draw,rng,(350,300),(500,285),accent,4); arrow(draw,rng,(670,285),(820,320),accent,4)
        draw_person(draw,rng,585,420,accent,ink)
    elif k=='security':
        for x in [220,470,720]: draw_lock(draw,rng,x,225+rng.randint(-18,18),accent,ink)
        arrow(draw,rng,(340,315),(470,315),accent,4); arrow(draw,rng,(590,315),(720,315),accent,4)
        draw_laptop(draw,rng,890,260,accent,ink)
    elif k=='growth':
        rect(draw,rng,(180,230,360,430),ink,4,fill=(255,255,255,210)); draw_person(draw,rng,270,280,accent,ink)
        for x,h in [(500,120),(600,180),(700,245),(800,310)]:
            rect(draw,rng,(x,460-h,x+70,460),accent,3,fill=accent+(70,))
        arrow(draw,rng,(380,355),(840,165),ink,4); circle(draw,rng,(900,150,42),accent,4)
    elif k=='request':
        rect(draw,rng,(170,190,500,480),ink,4,fill=(255,255,255,210))
        for y,c in [(245,accent),(310,ink),(375,accent),(440,ink)]:
            circle(draw,rng,(230,y,18),c,3); line(draw,rng,[(270,y),(450,y+rng.randint(-5,5))],ink,3)
        rect(draw,rng,(700,220,990,450),ink,4,fill=(255,255,255,180)); arrow(draw,rng,(510,330),(700,330),accent,5)
    elif k=='meeting' or k=='room':
        rect(draw,rng,(210,170,990,500),ink,5,fill=(255,255,255,150))
        rect(draw,rng,(250,210,950,470),ink,3)
        for x in [360,480,600,720,840]: draw_person(draw,rng,x,310,accent,ink)
        for x,y in [(295,245),(405,245),(515,245),(625,245),(735,245),(845,245)]: rect(draw,rng,(x,y,x+64,y+48),accent,2)
        arrow(draw,rng,(110,340),(210,340),accent,5); circle(draw,rng,(90,340,36),ink,4)
    elif k=='media':
        draw_laptop(draw,rng,150,240,accent,ink); draw_laptop(draw,rng,850,240,accent,ink)
        circle(draw,rng,(540,315,78),accent,5); line(draw,rng,[(505,270),(505,360),(595,315),(505,270)],ink,4)
        arrow(draw,rng,(320,315),(460,315),ink,4); arrow(draw,rng,(620,315),(850,315),ink,4)
        for x in [385,705,765]: circle(draw,rng,(x,420,24),accent,3)
    elif k=='network':
        pts=[(250,230),(470,180),(720,220),(920,350),(620,500),(330,450)]
        for a in pts:
            for b in rng.sample(pts,2):
                if a!=b: line(draw,rng,[a,b],accent,2)
        for x,y in pts:
            circle(draw,rng,(x,y,48),ink,4,fill=(255,255,255,210)); draw_laptop(draw,rng,x-45,y-25,accent,ink)
    elif k=='document':
        for i,x in enumerate([210,360,510,660]): draw_file(draw,rng,x,210+rng.randint(-20,20),accent,ink)
        rect(draw,rng,(820,230,1010,440),ink,4,fill=(255,255,255,210)); arrow(draw,rng,(760,330),(820,330),accent,5)
        for y in [270,320,370]: line(draw,rng,[(850,y),(970,y)],accent,4)
    elif k=='ai':
        rect(draw,rng,(230,190,520,470),ink,4,fill=(255,255,255,180)); rect(draw,rng,(690,190,970,470),ink,4,fill=(255,255,255,180))
        circle(draw,rng,(375,320,70),accent,5); circle(draw,rng,(830,320,70),accent,5)
        arrow(draw,rng,(520,320),(690,320),ink,4); arrow(draw,rng,(690,380),(520,380),accent,4)
        for x in [325,375,425,780,830,880]: circle(draw,rng,(x,320,10),ink,2)
    elif k=='essay':
        rect(draw,rng,(220,170,560,500),ink,4,fill=(255,255,255,190)); rect(draw,rng,(640,200,960,460),ink,4,fill=(255,255,255,160))
        for y in [230,275,320,365,410]: line(draw,rng,[(260,y),(520,y+rng.randint(-8,8))],accent,3)
        arrow(draw,rng,(560,320),(640,320),ink,4); circle(draw,rng,(790,330,75),accent,4)
    else:
        for x in [230,420,610,800]: rect(draw,rng,(x,230+rng.randint(-15,15),x+120,360+rng.randint(-15,15)),ink,4,fill=(255,255,255,190))
        for x in [350,540,730]: arrow(draw,rng,(x,295),(x+80,295),accent,4)
        circle(draw,rng,(985,305,50),accent,4)

def short_title(title):
    t=re.sub(r'^\[[^\]]+\]\s*','',title).strip()
    return t[:34]+'…' if len(t)>35 else t

def make_cover(slug,title,tags,out):
    rng=random.Random(seed(slug))
    bg,accent,ink=palette(slug,title,tags)
    accent_rgba=tuple(int(accent[i:i+2],16) for i in (1,3,5))
    img=Image.new('RGB',(W,H),bg)
    draw=ImageDraw.Draw(img,'RGBA')
    # paper grain
    for _ in range(4500):
        x=rng.randrange(W); y=rng.randrange(H); c=rng.randrange(220,255); draw.point((x,y),fill=(c,c,c,45))
    # notebook frame and loose sketch lines
    rect(draw,rng,(80,70,1120,590),'#1f2937',3,fill=(255,255,255,95))
    for y in range(135,560,64): line(draw,rng,[(120,y),(1080,y+rng.randint(-6,6))],'#d6cfc2',1)
    draw_scene(draw,rng,kind(slug,title,tags),accent_rgba,'#1f2937')
    # subtle title label
    label=short_title(title)
    draw.rounded_rectangle((95,600,1105,660),radius=22,fill=(255,255,255,185),outline='#1f2937',width=2)
    draw.text((125,612),label,font=F_TITLE,fill='#1f2937')
    draw.text((125,82),'hand-drawn field note',font=F_SMALL,fill=accent_rgba+(190,))
    img=img.filter(ImageFilter.UnsharpMask(radius=1,percent=105,threshold=4))
    img.save(out,quality=92,optimize=True)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    stamp=dt.datetime.now().strftime('%Y%m%d%H%M%S')
    backup=DB.with_suffix(DB.suffix+f'.bak-selective-covers-{stamp}')
    shutil.copy2(DB,backup)
    con=sqlite3.connect(DB); con.row_factory=sqlite3.Row
    posts=con.execute("select slug,title,tags,featuredImage from Post where status='published' order by datetime(publishedAt) desc,id desc").fetchall()
    changed=[]
    now=dt.datetime.now(dt.UTC).isoformat(timespec='milliseconds').replace('+00:00','Z')
    for p in posts:
        src=(p['featuredImage'] or '').lower()
        if any(m in src for m in ('core-story/imagegen-covers','p2p-foundations')):
            continue
        if src.endswith('2026-06-16-ponslink-00-link-only-room-cover.png') or src.endswith('2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink-cover.png') or src.endswith('2026-06-16-p2p-00-grid-computing-first-step-cover.png'):
            continue
        out=OUT/f"{p['slug']}-cover.png"
        make_cover(p['slug'],p['title'],p['tags'] or '',out)
        rel=f"/tistory/story-handdrawn/{out.name}"
        con.execute('update Post set featuredImage=?, updatedAt=? where slug=?',(rel,now,p['slug']))
        changed.append((p['slug'],p['featuredImage'],rel))
    con.commit(); con.close()
    lines=['# Selective Handdrawn Cover Report','',f'- DB 백업: `{backup}`',f'- 교체한 대표 이미지: {len(changed)}','', '| slug | before | after |','| --- | --- | --- |']
    for slug,b,a in changed:
        lines.append(f'| `{slug}` | `{b}` | `{a}` |')
    REPORT.write_text('\n'.join(lines)+'\n')
    print(f'backup={backup}')
    print(f'changed={len(changed)}')
    print(f'report={REPORT}')
if __name__=='__main__': main()
