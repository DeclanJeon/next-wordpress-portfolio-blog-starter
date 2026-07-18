#!/usr/bin/env python3
"""Reassign body image slots to unique WebP files when duplicates share MD5."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sqlite3
from pathlib import Path

MD_IMG = re.compile(r"!\[([^\]]*)\]\((/tistory/[^)\s]+)\)")

SLOT_ORDER = [
    "01-problem-moment.webp",
    "02-failure-signal.webp",
    "03-boundary-change.webp",
    "04-technical-principle.webp",
    "05-operating-flow.webp",
]


def md5_file(path: Path) -> str | None:
    if not path.exists() or not path.is_file():
        return None
    return hashlib.md5(path.read_bytes()).hexdigest()


def unique_candidates(dir_path: Path, preferred_names: list[str]) -> list[Path]:
    files = [p for p in dir_path.glob("*.webp") if p.is_file()]
    # stable preference: existing slot names first, then others by name
    def rank(p: Path) -> tuple[int, str]:
        try:
            return (preferred_names.index(p.name), p.name)
        except ValueError:
            return (100 + len(p.name), p.name)

    files.sort(key=rank)
    out: list[Path] = []
    seen: set[str] = set()
    for p in files:
        if p.name == "cover.webp":
            continue
        h = md5_file(p)
        if not h or h in seen:
            continue
        seen.add(h)
        out.append(p)
    return out


def rewrite_markdown(content: str, replacements: dict[str, str]) -> str:
    def repl(match: re.Match[str]) -> str:
        alt, path = match.group(1), match.group(2)
        new_path = replacements.get(path, path)
        return f"![{alt}]({new_path})"

    return MD_IMG.sub(repl, content)


def repair_post(
    slug: str,
    content: str,
    featured: str | None,
    public_root: Path,
    dry_run: bool,
) -> dict:
    dir_path = public_root / "tistory" / "body-images" / slug
    md = MD_IMG.findall(content or "")
    body_paths = [p for _, p in md]
    result = {
        "slug": slug,
        "status": "skip",
        "reason": "",
        "before": body_paths,
        "after": body_paths,
        "actions": [],
    }
    if not body_paths:
        result["reason"] = "no-body-images"
        return result
    if not dir_path.exists():
        result["reason"] = "missing-dir"
        return result

    body_files = []
    hashes = []
    for p in body_paths:
        fp = public_root / p.lstrip("/")
        h = md5_file(fp)
        body_files.append(fp)
        hashes.append(h)
    if any(h is None for h in hashes):
        result["reason"] = "missing-file"
        return result
    if len(set(hashes)) == len(hashes):
        result["reason"] = "already-unique"
        return result

    needed = len(body_paths)
    cands = unique_candidates(dir_path, SLOT_ORDER + [Path(p).name for p in body_paths])
    if len(cands) < needed:
        result["status"] = "needs-regen"
        result["reason"] = f"only-{len(cands)}-unique-of-{needed}"
        result["unique_available"] = [p.name for p in cands]
        return result

    chosen = cands[:needed]
    replacements: dict[str, str] = {}
    actions = []
    for idx, old_path in enumerate(body_paths):
        target_name = SLOT_ORDER[idx] if idx < len(SLOT_ORDER) else Path(old_path).name
        target = dir_path / target_name
        src = chosen[idx]
        if src.resolve() != target.resolve():
            if not dry_run:
                if target.exists() and target.resolve() != src.resolve():
                    # keep overwritten duplicate under .dedupe-bak once
                    bak = dir_path / f".bak-{target_name}"
                    if not bak.exists():
                        shutil.copy2(target, bak)
                shutil.copy2(src, target)
            actions.append(f"copy {src.name} -> {target_name}")
        new_public = f"/tistory/body-images/{slug}/{target_name}"
        replacements[old_path] = new_public

    new_content = rewrite_markdown(content or "", replacements)
    # ensure featured stays cover if present
    cover = dir_path / "cover.webp"
    new_featured = featured
    if cover.exists():
        new_featured = f"/tistory/body-images/{slug}/cover.webp"

    result.update(
        {
            "status": "repaired" if not dry_run else "would-repair",
            "reason": "deduped-from-local-unique",
            "after": [replacements[p] for p in body_paths],
            "actions": actions,
            "new_content": new_content,
            "new_featuredImage": new_featured,
            "content_changed": new_content != content,
        }
    )
    return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", type=Path, default=Path("db/custom.db"))
    ap.add_argument("--public", type=Path, default=Path("public"))
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--slug", action="append", default=[])
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--out", type=Path, default=Path("tmp/body-image-dedupe-report.json"))
    args = ap.parse_args()
    dry = not args.apply

    con = sqlite3.connect(args.db)
    con.row_factory = sqlite3.Row
    if args.slug:
        q = "SELECT slug, content, featuredImage FROM Post WHERE slug IN (%s)" % ",".join(
            "?" for _ in args.slug
        )
        rows = con.execute(q, args.slug).fetchall()
    else:
        rows = con.execute(
            "SELECT slug, content, featuredImage FROM Post WHERE status='published' ORDER BY slug"
        ).fetchall()

    reports = []
    changed = 0
    for row in rows:
        rep = repair_post(row["slug"], row["content"], row["featuredImage"], args.public, dry)
        # strip bulky content unless changed apply
        store = {k: v for k, v in rep.items() if k != "new_content"}
        if rep.get("status") in {"repaired", "would-repair"} and rep.get("content_changed"):
            if args.apply:
                con.execute(
                    "UPDATE Post SET content = ?, featuredImage = COALESCE(?, featuredImage), updatedAt = CURRENT_TIMESTAMP WHERE slug = ?",
                    (rep["new_content"], rep.get("new_featuredImage"), row["slug"]),
                )
                changed += 1
        reports.append(store)
        if args.limit and len(reports) >= args.limit and not args.slug:
            # limit only for exploratory runs without explicit slugs
            break

    if args.apply:
        con.commit()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        "dry_run": dry,
        "posts_scanned": len(reports),
        "would_or_repaired": sum(1 for r in reports if r["status"] in {"repaired", "would-repair"}),
        "needs_regen": sum(1 for r in reports if r["status"] == "needs-regen"),
        "skipped": sum(1 for r in reports if r["status"] == "skip"),
        "db_content_updates": changed,
    }
    args.out.write_text(json.dumps({"summary": summary, "posts": reports}, ensure_ascii=False, indent=2))
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
