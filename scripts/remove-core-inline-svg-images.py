#!/usr/bin/env python3
import sqlite3, re, time
from pathlib import Path
core=[
'2026-06-16-ponslink-00-link-only-room','2026-06-16-ponslink-01b-room-before-product','2026-06-16-ponslink-02b-signal-behind-link','2026-06-16-ponslink-04b-room-grew-with-context','2026-06-16-ponslink-04c-ponscast-same-time','2026-06-16-ponslink-07b-good-room-not-enough','2026-06-16-ponslink-09b-file-transfer-left-room','2026-06-16-ponslink-12b-connection-method','2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink','2026-06-29-main-ponswarp-01-server-does-not-own-file','2026-06-29-ponswarp-01b-data-grid-tb-experiment','2026-06-29-ponswarp-02b-desktop-testing-fatigue','2026-06-29-ponswarp-03-webrtc-opens-the-road','2026-06-29-ponswarp-04b-ack-backpressure-battle','2026-06-29-ponswarp-05b-browser-memory-2gb','2026-06-29-ponswarp-05c-opfs-safety-net','2026-06-29-ponswarp-06b-rust-wasm-memory-survival','2026-06-29-ponswarp-12b-flow-that-survives-failure']
img_line=re.compile(r'^!\[[^\]]*\]\([^)]*\.svg\)\s*\n+', re.M)
con=sqlite3.connect('db/custom.db')
now=int(time.time()*1000)
removed={}
for slug in core:
    row=con.execute('select content from Post where slug=?',(slug,)).fetchone()
    if not row: raise SystemExit(f'missing {slug}')
    content=row[0]
    matches=img_line.findall(content)
    new=img_line.sub('', content)
    new=re.sub(r'\n{4,}', '\n\n\n', new).strip()+'\n'
    if matches:
        con.execute('update Post set content=?, updatedAt=? where slug=?',(new,now,slug))
        removed[slug]=len(matches)
con.commit()
print(removed)
