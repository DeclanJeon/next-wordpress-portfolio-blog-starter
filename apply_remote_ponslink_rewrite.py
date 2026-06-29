import sqlite3
import subprocess
from pathlib import Path

LOCAL_DB = Path('/home/declan/Documents/Develop/Project/portfolio/v2/db/custom.db')
REMOTE_DB = '/opt/ponslink-blog-next/shared/db/custom.db'

def _quote(v: str) -> str:
    return "'" + str(v).replace("'", "''") + "'"

conn = sqlite3.connect(str(LOCAL_DB))
cur = conn.cursor()
cur.execute("SELECT slug, title, excerpt, content, readingTime FROM Post WHERE status='published' AND (slug LIKE '%ponslink%' OR title LIKE '%PonsLink%') ORDER BY publishedAt ASC")
rows = cur.fetchall()
conn.close()

sql_lines = ["BEGIN IMMEDIATE;"]
for slug, title, excerpt, content, readingTime in rows:
    sql_lines.append(
        f"UPDATE Post SET title={_quote(title)}, excerpt={_quote(excerpt)}, content={_quote(content)}, readingTime={readingTime}, updatedAt=datetime('now') WHERE slug={_quote(slug)};"
    )
sql_lines.append("COMMIT;")
sql_text = "\n".join(sql_lines)

proc = subprocess.run(
    ["ssh", "ponslink", f"sqlite3 {REMOTE_DB}"],
    input=sql_text,
    text=True,
    check=True,
    timeout=120,
)
print("remote_updated", len(rows))
