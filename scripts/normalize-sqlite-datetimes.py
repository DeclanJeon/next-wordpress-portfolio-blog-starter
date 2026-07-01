#!/usr/bin/env python3
from __future__ import annotations
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
import shutil

ROOT=Path(__file__).resolve().parents[1]
DB=ROOT/'db/custom.db'
BACKUP=ROOT/f"db/custom.db.bak-datetime-normalize-{datetime.now().strftime('%Y%m%d%H%M%S')}"
TABLE_COLS={
    'Post':['publishedAt','createdAt','updatedAt'],
    'User':['createdAt','updatedAt'],
    'Series':['createdAt','updatedAt'],
    'TaxonomyNode':['createdAt','updatedAt'],
}

def norm(v):
    if v is None:
        return v, False
    if isinstance(v, (int, float)) or (isinstance(v, str) and v.isdigit()):
        n = int(v)
        # millisecond epoch when large, second epoch otherwise
        ts = n / 1000 if n > 10_000_000_000 else n
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        return dt.isoformat(timespec='milliseconds').replace('+00:00', 'Z'), True
    if isinstance(v, str):
        raw = v.strip()
        candidate = raw.replace('Z', '+00:00')
        try:
            dt = datetime.fromisoformat(candidate)
        except ValueError:
            return v, False
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        normalized = dt.isoformat(timespec='milliseconds').replace('+00:00', 'Z')
        return normalized, normalized != v
    return v, False

shutil.copy2(DB,BACKUP)
con=sqlite3.connect(DB)
con.row_factory=sqlite3.Row
changed=[]
for table, cols in TABLE_COLS.items():
    existing={r[1] for r in con.execute(f'pragma table_info({table})')}
    cols=[c for c in cols if c in existing]
    for row in con.execute(f"select rowid,* from {table}").fetchall():
        sets=[]; vals=[]
        for c in cols:
            nv, did=norm(row[c])
            if did:
                sets.append(f'{c}=?'); vals.append(nv); changed.append((table,row['rowid'],c,row[c],nv))
        if sets:
            vals.append(row['rowid'])
            con.execute(f"update {table} set {', '.join(sets)} where rowid=?", vals)
con.commit(); con.close()
print(f'backup={BACKUP}')
print(f'normalized={len(changed)}')
for item in changed[:20]: print(item)
