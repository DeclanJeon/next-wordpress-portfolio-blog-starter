#!/usr/bin/env python3
"""Rebuild Post.excerpt from first real body prose (no stock AI openings)."""
from __future__ import annotations

import argparse
import re
import sqlite3


def kchars(s: str) -> int:
    return sum(1 for c in (s or "") if "\uac00" <= c <= "\ud7a3")


def bare_title(title: str) -> str:
    return re.sub(r"^\[[^\]]+\]\s*", "", title or "").strip()


BROKEN = re.compile(
    r"에 더 가깝다|라는 에|기능명보다|그 기능을 만들게|오래 남을 거라고|도드라졌다|온콜 관점|재현 노트|구현 리뷰"
)


def first_prose(content: str, limit_kc: int = 110) -> str:
    chunks: list[str] = []
    for p in re.split(r"\n\s*\n", content or ""):
        s = p.strip()
        if not s:
            continue
        if s.startswith("#") or s.startswith("!") or s.startswith("|"):
            continue
        if s.startswith("- ") or s.startswith("* "):
            continue
        s = re.sub(r"\s+", " ", s)
        s = re.sub(r"[^ ]*에 더 가깝다\.?\s*", "", s)
        s = re.sub(r"라는 에\s*", "", s)
        if kchars(s) < 12:
            continue
        chunks.append(s)
        if kchars(" ".join(chunks)) >= limit_kc:
            break
    text = " ".join(chunks).strip()
    if not text:
        return ""
    window = text
    if kchars(window) > limit_kc + 40:
        acc: list[str] = []
        n = 0
        for ch in window:
            acc.append(ch)
            if "\uac00" <= ch <= "\ud7a3":
                n += 1
            if n >= limit_kc + 30:
                break
        window = "".join(acc)
    m = re.search(r"(.+?[다요임까]\.)", window)
    if m and kchars(m.group(1)) >= 28:
        return m.group(1).strip()
    parts = re.split(r"(?<=[다요임까]\.)\s+", text)
    out: list[str] = []
    for part in parts:
        out.append(part)
        if kchars(" ".join(out)) >= 50:
            break
    return " ".join(out).strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="db/custom.db")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    con = sqlite3.connect(args.db)
    updated = 0
    for slug, title, excerpt, content in con.execute(
        "select slug,title,excerpt,content from Post where status='published'"
    ):
        ne = first_prose(content or "")
        if kchars(ne) < 28:
            ne = bare_title(title) + " 판단과 경계를 짧게 정리한다."
        if ne != (excerpt or "").strip():
            updated += 1
            if args.apply:
                con.execute(
                    "update Post set excerpt=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                    (ne, slug),
                )
    if args.apply:
        con.commit()

    bad = []
    for slug, ex in con.execute("select slug,excerpt from Post where status='published'"):
        if BROKEN.search(ex or "") or kchars(ex or "") < 25:
            bad.append((slug, ex))
    print({"updated": updated, "bad": len(bad), "applied": args.apply})
    for slug, ex in bad[:10]:
        print("BAD", slug, ex)
    for slug in [
        "2026-06-16-ponslink-09-no-go",
        "2026-06-28-ponslink-product-01-dm-screening",
        "2026-06-29-ponswarp-04-backpressure-protects-transfer",
    ]:
        row = con.execute("select excerpt from Post where slug=?", (slug,)).fetchone()
        if row:
            print(slug, "=>", row[0])
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
