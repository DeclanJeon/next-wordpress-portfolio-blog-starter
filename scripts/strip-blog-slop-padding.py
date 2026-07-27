#!/usr/bin/env python3
"""Remove G001–G004 template padding / AI slop blocks from published posts.

Deterministic only. No LLM. Does not invent replacement prose.
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
from collections import Counter
from pathlib import Path

SLOP_H2 = re.compile(
    r"\n##[ \t]+(?:"
    r"이 판단이 제품 문장으로 남는 방식|"
    r"경계 표를? 다시 고정하기|"
    r"경계 표|"
    r"운영·학습 체크리스트|"
    r"운영 체크리스트|"
    r"현장 기준으로 다시 고정하는 원칙|"
    r"다음에 다시 만질 때|"
    r"추가 고정 문장"
    r")[^\n]*\n",
    re.MULTILINE,
)

# Standalone padded paragraphs (may appear without H2 if partially edited)
FIELD_BLOCK_STARTS = (
    "사용자 문장을 먼저 적고 내부 이름을 나중에",
    "측정은 자랑을 위한 것이 아니라 경계를 지키기",
    "장애 회고에서는 범인",
    "문서와 코드가 어긋나",
    "금지 목록을 짧게 남긴다",
    "금지 목록은 짧게",
    "현장에서는 같은 원칙을 다른 시간대",
    "다음 기여자를 위해 금지 목록",
)

PHRASE_LINE_PATTERNS = [
    re.compile(r"^이 원칙을 「.+」에 대입하면"),
    re.compile(r"^같은 문장을 다음 회고에서도 그대로 꺼낼 수 있어야 한다"),
    re.compile(r"^실무에서는 이 기준이 화면 카피"),
    re.compile(r"^실무 점검에서는 이 기준이"),
    re.compile(r"^빠른 우회보다 설명 가능한 경계가 우선이다"),
    re.compile(r"^우회는 데모를 살리고 경계를 죽인다"),
    re.compile(r"^기록이 남는 개선만 다음 주에 다시 쓸 수 있다"),
    re.compile(r"^배포 기준은 차갑고 짧을수록 좋다"),
    re.compile(r"^자격 없는 개선은 스테이징에 남"),
    re.compile(r"^순서와 책임만 고정되면"),
    re.compile(r"^줄이지 못하면 아직 원칙이 아니다"),
    re.compile(r"^「.+」 앞에서도 예외가 아니다"),
    re.compile(r"^「.+」 논의에서 반복해서 되돌아본 기준이다"),
    re.compile(r"^「.+」 기준으로 배포"),
    re.compile(r"^「.+」 기준으로 이 문단은"),
    re.compile(r"^「.+」 흐름에서도 예외가 아니다"),
    re.compile(r"^「.+」 주제에서도 같은 기준으로"),
    re.compile(r"^「.+」 장면에서도 같은 기준을"),
    re.compile(r"^이 지점은 「.+」 논의에서 반복해서"),
    re.compile(r"^이 원칙을 「"),
]


def kchars(s: str) -> int:
    return sum(1 for c in (s or "") if "\uac00" <= c <= "\ud7a3")


def bare_title(title: str) -> str:
    return re.sub(r"^\[[^\]]+\]\s*", "", title or "").strip()


def strip_slop_h2_sections(content: str) -> str:
    """Drop from first slop H2 through EOF (all padding was appended after core)."""
    m = SLOP_H2.search(content or "")
    if not m:
        return content or ""
    return (content or "")[: m.start()].rstrip() + "\n"


def drop_field_block_paragraphs(content: str) -> str:
    parts = re.split(r"\n\s*\n", content or "")
    kept = []
    for p in parts:
        s = p.strip()
        if not s:
            continue
        if any(s.startswith(prefix) for prefix in FIELD_BLOCK_STARTS):
            continue
        # whole paragraph is a known phrase line
        first = s.splitlines()[0].strip()
        if any(pat.search(first) for pat in PHRASE_LINE_PATTERNS):
            continue
        kept.append(s)
    return "\n\n".join(kept).rstrip() + "\n"


def drop_phrase_lines(content: str) -> str:
    out_lines = []
    for ln in (content or "").splitlines():
        s = ln.strip()
        if s and any(pat.search(s) for pat in PHRASE_LINE_PATTERNS):
            continue
        out_lines.append(ln)
    # collapse 3+ blank lines
    text = "\n".join(out_lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.rstrip() + "\n"


def reduce_title_echoes(content: str, title: str, max_echoes: int = 2) -> str:
    bare = bare_title(title)
    if not bare or len(bare) < 8:
        return content
    needle = f"「{bare}」"
    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        count += 1
        if count <= max_echoes:
            return m.group(0)
        return "그 판단"

    # only replace full-title echoes
    return re.sub(re.escape(needle), repl, content)


def collapse_exact_duplicate_lines(content: str, max_keep: int = 2) -> str:
    """If the same non-trivial line appears > max_keep times, keep first max_keep."""
    seen: Counter[str] = Counter()
    out = []
    for ln in (content or "").splitlines():
        key = ln.strip()
        if key and not key.startswith("#") and not key.startswith("|") and not key.startswith("!") and kchars(key) > 20:
            seen[key] += 1
            if seen[key] > max_keep:
                continue
        out.append(ln)
    text = "\n".join(out)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.rstrip() + "\n"


def clean_post(content: str, title: str) -> str:
    text = content or ""
    text = strip_slop_h2_sections(text)
    text = drop_field_block_paragraphs(text)
    text = drop_phrase_lines(text)
    text = reduce_title_echoes(text, title, max_echoes=2)
    text = collapse_exact_duplicate_lines(text, max_keep=2)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.rstrip() + "\n"


def still_has_slop(content: str) -> list[str]:
    hits = []
    for name, pat in [
        ("slop_h2", SLOP_H2),
        ("apply_phrase", re.compile(r"이 원칙을 「.+」에 대입하면")),
        ("field_user", re.compile(r"사용자 문장을 먼저 적고 내부 이름을 나중에")),
        ("field_site", re.compile(r"현장에서는 같은 원칙을 다른 시간대")),
    ]:
        if pat.search(content or ""):
            hits.append(name)
    return hits


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="db/custom.db")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--out", default="tmp/blog-slop-strip-report.json")
    args = ap.parse_args()

    con = sqlite3.connect(args.db)
    rows = con.execute(
        "select slug, title, content, readingTime from Post where status='published' order by slug"
    ).fetchall()

    report = {"updated": [], "unchanged": [], "residual_slop": [], "summary": {}}
    total_before = 0
    total_after = 0

    for slug, title, content, rt in rows:
        before = content or ""
        after = clean_post(before, title or "")
        kb, ka = kchars(before), kchars(after)
        total_before += kb
        total_after += ka
        changed = after != before
        entry = {
            "slug": slug,
            "kc_before": kb,
            "kc_after": ka,
            "removed": kb - ka,
            "readingTime_before": rt,
            "readingTime_after": max(1, round(ka / 350)) if ka else 1,
        }
        residual = still_has_slop(after)
        if residual:
            entry["residual"] = residual
            report["residual_slop"].append(entry)
        if changed:
            report["updated"].append(entry)
            if args.apply:
                con.execute(
                    "update Post set content=?, readingTime=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                    (after, entry["readingTime_after"], slug),
                )
        else:
            report["unchanged"].append(slug)

    if args.apply:
        con.commit()

    report["summary"] = {
        "published": len(rows),
        "updated": len(report["updated"]),
        "unchanged": len(report["unchanged"]),
        "residual_slop": len(report["residual_slop"]),
        "total_kc_before": total_before,
        "total_kc_after": total_after,
        "total_removed": total_before - total_after,
        "avg_kc_before": round(total_before / len(rows), 1) if rows else 0,
        "avg_kc_after": round(total_after / len(rows), 1) if rows else 0,
        "applied": bool(args.apply),
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    if report["residual_slop"]:
        print("RESIDUAL", len(report["residual_slop"]))
        for e in report["residual_slop"][:10]:
            print(" ", e["slug"], e.get("residual"))
    print("wrote", out)
    return 1 if report["residual_slop"] and args.apply else 0


if __name__ == "__main__":
    raise SystemExit(main())
