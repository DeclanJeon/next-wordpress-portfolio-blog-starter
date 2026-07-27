#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""G004 apply: humanize deep-dive + algorithm cores. No length floor. Preserve images."""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BEATS_PATH = Path(__file__).with_name("humanize-deep-algo-beats.json")
BAD = "thr" + "ash"

SKIP = {
    "2026-06-18-ponslink-algorithm-01-negotiation",
    "2026-06-18-ponslink-deep-dive-04-bff-control-plane",
    "2026-06-18-ponslink-deep-dive-07-data-channel-file-transfer",
    "2026-06-18-ponslink-deep-dive-08-request-first",
}

SMELLS = [
    "그런데 방 안으로 사람이 들어오는 순간",
    "다음 작업자가 그대로 복사",
    "이 판단이 제품 문장",
    "온콜 관점",
    "이번 정리에서 확인한 핵심은 하나다",
    "배포 전에 괜찮다고 느낀 가정",
    "[[Pons",
    BAD,
]

SERIES_SQL = """
select slug, title, content, excerpt from Post
where status='published'
  and (slug like '%algorithm%' or slug like '%deep-dive%')
order by slug
"""

RESIDUAL_SQL = """
select slug, content from Post
where status='published'
  and (slug like '%algorithm%' or slug like '%deep-dive%')
order by slug
"""


def kchars(s: str) -> int:
    return sum(1 for c in (s or "") if "\uac00" <= c <= "\ud7a3")


def bare_title(title: str) -> str:
    return re.sub(r"^\[[^\]]+\]\s*", "", title or "").strip()


def img_block(path: str, bare: str, kind: str) -> str:
    label = {"p": "문제 장면", "f": "실패 신호", "b": "경계 변경"}[kind]
    return f"![{bare} — {label}]({path})"


def build(bare: str, imgs: list[str], opening: str, sections: list[tuple[str, str]]) -> str:
    parts = [opening.strip()]
    kinds = ["p", "f", "b"]
    for i, (h2, body) in enumerate(sections):
        if i < len(imgs):
            parts.append(img_block(imgs[i], bare, kinds[min(i, 2)]))
        parts.append(f"## {h2}\n\n{body.strip()}")
    text = "\n\n".join(parts).strip() + "\n"
    for j, p in enumerate(imgs):
        if p not in text:
            text += f"\n{img_block(p, bare, kinds[min(j, 2)])}\n"
    text = re.sub(r" {2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def first_excerpt(content: str, bare: str) -> str:
    chunks: list[str] = []
    for p in re.split(r"\n\s*\n", content or ""):
        s = p.strip()
        if not s or s.startswith("#") or s.startswith("!"):
            continue
        chunks.append(re.sub(r"\s+", " ", s))
        if kchars(" ".join(chunks)) >= 90:
            break
    text = " ".join(chunks).strip()
    if kchars(text) < 28:
        return bare + " 판단과 경계를 짧게 정리한다."
    sents = re.findall(r".+?[다요임까]\.", text)
    if not sents:
        return text[:160]
    out = sents[0]
    if len(sents) > 1 and kchars(out + " " + sents[1]) <= 170:
        out = out + " " + sents[1]
    return out.strip()


def load_beats() -> dict[str, dict]:
    raw = json.loads(BEATS_PATH.read_text(encoding="utf-8"))
    if BAD in json.dumps(raw, ensure_ascii=False):
        raise RuntimeError("forbidden placeholder in beats JSON")
    return raw


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=str(ROOT / "db" / "custom.db"))
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--out", default=str(ROOT / "tmp" / "humanize-deep-algo-report.json"))
    args = ap.parse_args()

    beats = load_beats()
    con = sqlite3.connect(args.db)
    rows = con.execute(SERIES_SQL).fetchall()

    report: dict = {"updated": [], "skipped": [], "missing": []}
    for slug, title, content, excerpt in rows:
        bare = bare_title(title)
        imgs = re.findall(r"!\[[^\]]*\]\((/tistory/[^)]+)\)", content or "")
        if slug in SKIP:
            ne = first_excerpt(content or "", bare)
            if args.apply and ne != (excerpt or "").strip():
                con.execute(
                    "update Post set excerpt=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                    (ne, slug),
                )
            report["skipped"].append({"slug": slug, "kc": kchars(content or ""), "imgs": len(imgs)})
            continue
        if slug not in beats:
            report["missing"].append(slug)
            continue
        payload = beats[slug]
        sections = [(s["h2"], s["body"]) for s in payload["sections"]]
        body = build(bare, imgs, payload["opening"], sections)
        if BAD in body:
            raise RuntimeError("bad word in body for " + slug)
        kc = kchars(body)
        ne = first_excerpt(body, bare)
        rt = max(1, round(kc / 350))
        report["updated"].append(
            {"slug": slug, "kc": kc, "imgs": len(imgs), "excerpt": ne[:120]}
        )
        if args.apply:
            con.execute(
                "update Post set content=?, excerpt=?, readingTime=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                (body, ne, rt, slug),
            )

    if args.apply:
        con.commit()

    residual = []
    for slug, content in con.execute(RESIDUAL_SQL):
        hit = [s for s in SMELLS if s in (content or "")]
        if hit:
            residual.append({"slug": slug, "hit": hit})
    report["residual"] = residual
    report["summary"] = {
        "updated": len(report["updated"]),
        "skipped": len(report["skipped"]),
        "missing": report["missing"],
        "residual": len(residual),
        "applied": args.apply,
        "avg_kc": round(
            sum(x["kc"] for x in report["updated"]) / max(1, len(report["updated"])), 1
        )
        if report["updated"]
        else 0,
        "kc_range": [
            min((x["kc"] for x in report["updated"]), default=0),
            max((x["kc"] for x in report["updated"]), default=0),
        ],
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    if residual:
        print("RESIDUAL", residual[:20])
    if report["missing"]:
        print("MISSING", report["missing"])
    return 1 if report["missing"] or residual else 0


if __name__ == "__main__":
    raise SystemExit(main())
