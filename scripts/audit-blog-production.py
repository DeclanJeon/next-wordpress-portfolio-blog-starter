#!/usr/bin/env python3
"""Audit published blog posts for structure, title fit, slop, and image health."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

MD_IMG = re.compile(r"!\[([^\]]*)\]\((/tistory/[^)\s]+)\)")
H2 = re.compile(r"^##\s+(.+)$", re.M)
META_OPEN = re.compile(r"^(이 글은|이번 글에서는|오늘은|이번 시리즈)")
HANGUL = re.compile(r"[\uac00-\ud7a3]")
SLOP_H2 = re.compile(
    r"^##\s+(이 판단이 제품 문장으로 남는 방식|경계 표를? 다시 고정하기|경계 표|"
    r"운영·학습 체크리스트|운영 체크리스트|현장 기준으로 다시 고정하는 원칙|"
    r"다음에 다시 만질 때|추가 고정 문장)\s*$",
    re.M,
)
SLOP_PHRASE = re.compile(
    r"이 원칙을 「.+」에 대입하면|같은 문장을 다음 회고에서도 그대로 꺼낼 수 있어야 한다|"
    r"실무에서는 이 기준이 화면 카피|사용자 문장을 먼저 적고 내부 이름을 나중에|"
    r"현장에서는 같은 원칙을 다른 시간대"
)


def kchars(text: str) -> int:
    return sum(1 for c in text if "\uac00" <= c <= "\ud7a3")


def md5_file(path: Path) -> str | None:
    if not path.exists() or not path.is_file():
        return None
    return hashlib.md5(path.read_bytes()).hexdigest()


def score(row: dict) -> int:
    s = 0
    if row["missing"]:
        s += 5
    if row["slop"]:
        s += 5
    if row["exact_dup"]:
        s += 4
    if row["body_dup"]:
        s += 4
    if row["few_img"]:
        s += 3
    if row["title_echo"]:
        s += 3
    if row["title_weak"]:
        s += 2
    if row["few_h2"]:
        s += 2
    if row["meta_open"]:
        s += 2
    if row["cover_body_dup"]:
        s += 3
    if row["thin"]:
        s += 1  # soft signal only — not a length floor
    return s


def audit(db_path: Path, public_root: Path) -> list[dict]:
    con = sqlite3.connect(db_path)
    rows = con.execute(
        """
        SELECT slug, title, excerpt, featuredImage, content, category, tags, status
        FROM Post
        WHERE status = 'published'
        ORDER BY publishedAt
        """
    ).fetchall()
    out: list[dict] = []
    for slug, title, excerpt, fi, content, category, tags, status in rows:
        content = content or ""
        md = MD_IMG.findall(content)
        md_paths = [p for _, p in md]
        h2 = H2.findall(content)
        kc = kchars(content)
        missing: list[str] = []
        body_hashes: list[str] = []
        cover_hash = None
        if fi:
            cover_hash = md5_file(public_root / fi.lstrip("/"))
            if cover_hash is None:
                missing.append(fi)
        for path in md_paths:
            h = md5_file(public_root / path.lstrip("/"))
            if h is None:
                missing.append(path)
            else:
                body_hashes.append(h)
        body_dup = len(body_hashes) >= 2 and len(set(body_hashes)) < len(body_hashes)
        cover_body_dup = bool(cover_hash and cover_hash in body_hashes)
        bare = re.sub(r"^\[[^\]]+\]\s*", "", title or "")
        words = re.findall(r"[\uac00-\ud7a3]{2,}", bare)
        hit = sum(1 for w in words if w in content)
        ratio = (hit / len(words)) if words else 1.0
        title_weak = len(words) >= 2 and ratio < 0.3
        first = content.lstrip()[:100]
        lines = [
            ln.strip()
            for ln in content.splitlines()
            if ln.strip()
            and not ln.strip().startswith("#")
            and not ln.strip().startswith("|")
            and not ln.strip().startswith("!")
            and kchars(ln) > 20
        ]
        line_counts = Counter(lines)
        exact_dup = any(n >= 3 for n in line_counts.values())
        title_echo_n = content.count(f"「{bare}」") if bare else 0
        slop = bool(SLOP_H2.search(content) or SLOP_PHRASE.search(content))
        row = {
            "slug": slug,
            "title": title,
            "category": category,
            "kc": kc,
            "h2": len(h2),
            "h2_titles": h2,
            "imgs": len(md_paths),
            "featuredImage": fi,
            "body_paths": md_paths,
            "missing": missing,
            "body_dup": body_dup,
            "cover_body_dup": cover_body_dup,
            "title_weak": title_weak,
            "title_hit_ratio": round(ratio, 3),
            "meta_open": bool(META_OPEN.search(first)),
            "slop": slop,
            "exact_dup": exact_dup,
            "title_echo": title_echo_n > 2,
            "title_echo_n": title_echo_n,
            "thin": kc < 800,
            "few_h2": len(h2) < 3,
            "few_img": len(md_paths) < 2,
            "no_fi": not bool(fi),
        }
        row["score"] = score(row)
        out.append(row)
    out.sort(key=lambda r: (-r["score"], r["slug"]))
    return out


def summarize(rows: list[dict]) -> dict:
    keys = [
        "slop",
        "exact_dup",
        "title_echo",
        "few_h2",
        "few_img",
        "body_dup",
        "cover_body_dup",
        "title_weak",
        "meta_open",
        "no_fi",
        "thin",
    ]
    summary = {k: sum(1 for r in rows if r[k]) for k in keys}
    summary["published"] = len(rows)
    summary["missing_posts"] = sum(1 for r in rows if r["missing"])
    summary["avg_kc"] = round(sum(r["kc"] for r in rows) / max(1, len(rows)), 1)
    summary["score_gt0"] = sum(1 for r in rows if r["score"] > 0)
    summary["h2_dist"] = dict(sorted(Counter(r["h2"] for r in rows).items()))
    summary["img_dist"] = dict(sorted(Counter(r["imgs"] for r in rows).items()))
    return summary


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", type=Path, default=Path("db/custom.db"))
    ap.add_argument("--public", type=Path, default=Path("public"))
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()
    rows = audit(args.db, args.public)
    summary = summarize(rows)
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "db": str(args.db),
        "public": str(args.public),
        "summary": summary,
        "posts": rows,
    }
    out = args.out or Path("tmp") / f"blog-audit-{datetime.now().strftime('%Y-%m-%d')}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
