#!/usr/bin/env python3
"""Audit published blog posts for structure, title fit, and image health."""

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
    if row["short"]:
        s += 5
    if row["body_dup"]:
        s += 4
    if row["few_img"]:
        s += 3
    if row["title_weak"]:
        s += 2
    if row["few_h2"]:
        s += 2
    if row["meta_open"]:
        s += 2
    if row["cover_body_dup"]:
        s += 3
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
            "short": kc < 5000,
            "few_h2": len(h2) < 5,
            "few_img": len(md_paths) < 2,
            "no_fi": not bool(fi),
        }
        row["score"] = score(row)
        out.append(row)
    out.sort(key=lambda r: (-r["score"], r["slug"]))
    return out


def summarize(rows: list[dict]) -> dict:
    keys = [
        "short",
        "few_h2",
        "few_img",
        "body_dup",
        "cover_body_dup",
        "title_weak",
        "meta_open",
        "no_fi",
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
