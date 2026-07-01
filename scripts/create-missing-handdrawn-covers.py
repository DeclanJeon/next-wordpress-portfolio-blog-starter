#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt
import sqlite3
from pathlib import Path

OUT=Path('public/tistory/story-handdrawn')
OUT.mkdir(parents=True,exist_ok=True)
POSTS={
 'bridges-between-disciplines':('분야 사이를 잇는 다리','bridge','#0f766e'),
 'writing-as-thinking':('쓰면서 생각하기','writing','#7c3aed'),
 'small-tools-long-projects':('작은 도구와 긴 프로젝트','tools','#ea580c'),
 'a-week-of-slow-internet':('느린 인터넷의 일주일','network','#2563eb'),
 'on-naming-things':('이름을 붙이는 일','name','#334155'),
}

def icon(kind):
    if kind=='bridge': return '<path d="M300 470 C420 360 540 360 660 470"/><path d="M340 470 L340 420 M420 470 L420 390 M500 470 L500 382 M580 470 L580 410 M660 470 L660 430"/><circle cx="250" cy="500" r="38"/><circle cx="710" cy="500" r="38"/>'
    if kind=='writing': return '<path d="M310 520 C420 420 520 370 650 310"/><path d="M640 300 L710 260 L685 335 Z"/><path d="M300 555 C390 575 540 565 690 535"/><rect x="250" y="245" width="250" height="300" rx="20"/>'
    if kind=='tools': return '<rect x="260" y="300" width="160" height="120" rx="18"/><rect x="520" y="260" width="150" height="170" rx="18"/><path d="M420 360 C470 320 510 315 545 340"/><path d="M320 500 L380 560 M380 500 L320 560"/><circle cx="595" cy="505" r="42"/>'
    if kind=='network': return '<circle cx="300" cy="310" r="45"/><circle cx="510" cy="260" r="45"/><circle cx="690" cy="370" r="45"/><circle cx="405" cy="535" r="45"/><circle cx="650" cy="560" r="45"/><path d="M335 335 L475 280 M545 280 L655 345 M325 345 L390 500 M435 525 L615 560 M670 410 L650 515 M505 305 L420 500"/>'
    return '<rect x="300" y="260" width="380" height="230" rx="28"/><path d="M340 330 H630 M340 385 H560 M340 440 H610"/><path d="M275 545 C390 500 520 500 705 545"/><circle cx="300" cy="260" r="20"/><circle cx="680" cy="490" r="20"/>'

def svg(title,kind,color):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="{title}">
  <rect width="1200" height="675" fill="#f7f0df"/>
  <path d="M0 90 C240 70 450 110 690 85 C880 65 1030 90 1200 70" fill="none" stroke="#e7dcc7" stroke-width="4"/>
  <g fill="none" stroke="#1f2937" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 0)">
    <rect x="155" y="115" width="890" height="470" rx="42" stroke-dasharray="18 18" opacity=".35"/>
    {icon(kind)}
  </g>
  <g fill="none" stroke="{color}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" opacity=".55">
    <path d="M205 195 C350 160 540 175 720 155"/>
    <path d="M260 605 C430 565 650 585 910 545"/>
  </g>
  <g fill="#1f2937" font-family="serif" font-size="54" opacity=".88">
    <text x="190" y="635">{title}</text>
  </g>
</svg>'''

def main():
    con=sqlite3.connect('db/custom.db')
    now=dt.datetime.now(dt.UTC).isoformat(timespec='milliseconds').replace('+00:00','Z')
    for slug,(title,kind,color) in POSTS.items():
        path=OUT/f'{slug}-cover.svg'
        path.write_text(svg(title,kind,color))
        con.execute('update Post set featuredImage=?, updatedAt=? where slug=?',(f'/tistory/story-handdrawn/{slug}-cover.svg',now,slug))
        print(slug,path)
    con.commit(); con.close()
if __name__=='__main__': main()
