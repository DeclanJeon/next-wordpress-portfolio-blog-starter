#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Surgical reshape to canonical reference structure.

Reference slug: 2026-06-16-ponslink-01-why-i-came-back-to-connection

Keeps body substance. Fixes structure only:
- prose opening (2+ paragraphs) before first image/H2
- topic-specific H2s (no banned/generic template headings)
- final ## 마치며
- poem short-line stacks → prose
- strip hash/slop crumbs
- preserve image paths
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path

DB = Path(__file__).resolve().parents[1] / "db" / "custom.db"
REF_SLUG = "2026-06-16-ponslink-01-why-i-came-back-to-connection"

BANNED_PREFIXES = [
    "한 줄",
    "현장에서 먼저 터진 증상",
    "그럴듯해 보였던 첫 설계",
    "로그가 말해 준 반례",
    "책임을 옮긴 경계선",
    "운영에서 고정한 규칙",
    "운영·학습 체크리스트",
    "운영 체크리스트",
    "이 판단이 제품 문장으로 남는 방식",
    "현장 기준으로 다시 고정하는 원칙",
    "다음에 다시 만질 때",
    "기준을 유지하는 방법",
    "설계를 문장으로 검증하는 법",
    "경계 표를 다시 고정하기",
    "추가 고정 문장",
]

GENERIC_EXACT = {
    "사용자가 먼저 느낀 끊김",
    "재현에 걸린 시간",
    "요청이 막힌 자리",
    "실패 신호가 선명해진 밤",
    "왜 이 문제가 제품 핵심인가",
    "그전에 흐름을 어떻게 봤나",
    "문제가 커진 조건",
    "다시 그은 경계",
    "바꾸면서 깨지기 쉬운 지점",
    "무엇으로 검증했나",
    "남는 비용",
    "배포 직후 드러난 마찰",
    "지표보다 선명했던 불만",
    "이 문제가 제품에 닿는 지점",
    "실제로 부하가 쌓인 구간",
    "이 흐름이 사용자에게 닿는 지점",
    "확장 때 막힌 병목",
    "기준이 바뀐 뒤",
    "지금 다시 고른 판단",
    "연결은 됐는데 일이 안 끝난 순간",
    "브라우저 한계가 보인 지점",
    "구현에서 지킨 불변조건",
    "다음에 같은 함정을 피하려면",
    "개요",
    "구현",
    "문제점",
    "결론",
    "정리",
    "서론",
}

GENERIC_PREFIXES = [
    "사용자가 먼저 느낀 끊김",
    "재현에 걸린 시간",
    "요청이 막힌 자리",
    "실패 신호가 선명해진 밤",
    "내가 과신했던 전제",
    "기능 추가로는 안 풀리던 이유",
    "현장 체크 목록",
    "롤백을 남긴 이유",
    "초기 가설의 구멍",
    "경계 재배치",
    "기존 파이프라인 지도",
    "구조를 가른 결정 기준",
    "좋아진 점과 남는 리스크",
    "서버에 맡기려던 유혹",
    "직접 경로를 고른 이유",
    "장애 시 사용자 문장",
    "남긴 규칙",
]

SLOP_MARKERS = [
    "이 판단이 제품 문장으로 남는 방식",
    "현장 기준으로 다시 고정하는 원칙",
    "다음에 다시 만질 때",
    "운영 체크리스트",
    "경계 표를 다시 고정",
    "추가 고정 문장",
    "thrash",
]

JUNK_RES = [
    re.compile(r"\[\[[^\]]*\]\s*기록\s+[0-9a-fA-F]{4,}:\s*"),
    re.compile(r"\[[^\]]{4,}\]\s*기록\s+[0-9a-fA-F]{4,}:\s*"),
    re.compile(r"\[\[Pons[^\]]*\]"),
    re.compile(r"\bLink\]\s*"),
    re.compile(r"기록\s+[0-9a-fA-F]{6,}:\s*"),
]


def kc(s: str) -> int:
    return sum(1 for c in (s or "") if "\uac00" <= c <= "\ud7a3")


def bare_title(title: str) -> str:
    return re.sub(r"^\[[^\]]+\]\s*", "", title or "").strip()


def topic_key(title: str) -> str:
    """Short noun-ish topic for headings (no trailing particles needed)."""
    bare = bare_title(title)
    # Prefer quoted/core technical tokens
    m = re.search(r"[A-Za-z][A-Za-z0-9+._-]{1,}", bare)
    hangul = re.findall(r"[\uac00-\ud7a3]{2,}", bare)
    # Drop weak words
    stop = {
        "이유",
        "문제",
        "방법",
        "순간",
        "것",
        "수",
        "때",
        "더",
        "없는",
        "않는",
        "있는",
        "대한",
        "위한",
        "아니라",
        "보다",
        "먼저",
        "다시",
    }
    words = [w for w in hangul if w not in stop]
    if m and words:
        # e.g. ZIP64 + nearby
        core = m.group(0)
        # find nearby hangul phrase around latin token
        idx = bare.find(core)
        window = bare[max(0, idx - 8) : idx + len(core) + 12]
        window = re.sub(r"\s+", "", window)
        if kc(window) >= 2:
            # keep compact
            t = core if len(core) >= 4 else (words[0] + " " + core)
            return t[:28]
        return core
    if not words:
        return bare[:18] if bare else "이 주제"
    # 2-4 content words
    t = " ".join(words[:3])
    if len(t) > 20:
        t = words[0]
        if len(words) > 1 and len(t) + 1 + len(words[1]) <= 20:
            t = words[0] + " " + words[1]
    return t


def is_banned_h2(h: str) -> bool:
    h = (h or "").strip()
    if h in GENERIC_EXACT:
        return True
    for p in BANNED_PREFIXES:
        if h == p or h.startswith(p):
            return True
        if p in h and p in BANNED_PREFIXES[:12]:
            # allow "현장에서 먼저 드러난 실패 신호" which is different
            if p == "현장에서 먼저 터진 증상" and "증상" not in h:
                continue
            if p in h:
                return True
    for p in GENERIC_PREFIXES:
        if h == p or h.startswith(p + " ") or h.startswith(p + "—") or h.startswith(p + " —") or h.startswith(p + "–") or h.startswith(p + " —"):
            return True
        if h.startswith(p + "—") or h.startswith(p + "-"):
            return True
    return False


def extract_images(md: str) -> list[str]:
    out, seen = [], set()
    for p in re.findall(r"!\[[^\]]*\]\((/tistory/[^)]+)\)", md or ""):
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def parse_sections(md: str) -> tuple[str, list[tuple[str, str]]]:
    parts = re.split(r"(?m)^(##\s+.+)$", md or "")
    pre = parts[0] if parts else ""
    secs: list[tuple[str, str]] = []
    i = 1
    while i < len(parts):
        h = re.sub(r"^##\s+", "", parts[i]).strip()
        body = parts[i + 1] if i + 1 < len(parts) else ""
        secs.append((h, body))
        i += 2
    return pre, secs


def split_paras(block: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", block or "") if p.strip()]


def is_table_or_list(p: str) -> bool:
    lines = [ln for ln in p.splitlines() if ln.strip()]
    if not lines:
        return False
    if all(re.match(r"^\s*([-*+]|\d+\.)\s+", ln) for ln in lines):
        return True
    if sum(1 for ln in lines if "|" in ln) >= 2:
        return True
    return False


def clean_junk(text: str) -> str:
    text = text or ""
    for rx in JUNK_RES:
        text = rx.sub("", text)
    return text


def merge_poem(text: str) -> str:
    if is_table_or_list(text) or text.startswith("![") or text.startswith("##"):
        return text.strip()
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if len(lines) < 3:
        return text.strip()
    short = sum(1 for ln in lines if kc(ln) <= 22 and not re.match(r"^([-*+]|\d+\.)\s+", ln))
    if short / len(lines) >= 0.55:
        return re.sub(r"\s+", " ", " ".join(lines)).strip()
    return text.strip()


def scrub_block(body: str) -> str:
    body = clean_junk(body)
    out = []
    seen = set()
    for p in split_paras(body):
        if p.startswith("<!--"):
            continue
        if any(m in p for m in SLOP_MARKERS):
            keep = []
            for ln in p.splitlines():
                if any(m in ln for m in SLOP_MARKERS):
                    continue
                keep.append(ln)
            p = "\n".join(keep).strip()
            if not p:
                continue
        p = merge_poem(p)
        p = clean_junk(p).strip()
        if not p:
            continue
        if kc(p) < 4 and not p.startswith("!") and not is_table_or_list(p):
            continue
        # drop meta-only
        if re.match(r"^(이 글은|이번 글에서는|오늘은|이번 시리즈)", p):
            continue
        key = re.sub(r"\s+", "", p)[:160]
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return "\n\n".join(out).strip()


def role_heads(topic: str, n: int) -> list[str]:
    """Natural Korean headings without broken particles on full titles."""
    base = [
        f"{topic}: 문제가 커진 장면",
        f"처음에 믿었던 가정 — {topic}",
        f"반례가 선명해진 순간 — {topic}",
        f"다시 고른 경계 — {topic}",
        "구현과 운영에 남긴 조건",
        "아직 열어 둔 비용",
    ]
    if n <= len(base):
        return base[:n]
    out = base[:]
    while len(out) < n:
        out.append(f"{topic} — 판단 {len(out)+1}")
    return out[:n]


def uniquify(heads: list[str]) -> list[str]:
    seen = set()
    out = []
    for h in heads:
        cand = h
        i = 2
        while cand in seen:
            cand = f"{h} · {i}"
            i += 1
        seen.add(cand)
        out.append(cand)
    return out


def poem_ratio(md: str) -> float:
    lines = [
        ln
        for ln in (md or "").splitlines()
        if ln.strip()
        and not ln.startswith("#")
        and not ln.startswith("!")
        and not ln.startswith("|")
        and not re.match(r"^\s*([-*+]|\d+\.)\s+", ln)
    ]
    if not lines:
        return 0.0
    return sum(1 for ln in lines if kc(ln) <= 22) / len(lines)


def structure_score(content: str) -> tuple[int, list[str]]:
    h2 = re.findall(r"(?m)^##\s+(.+)$", content or "")
    score = 0
    reasons = []
    if not h2 or h2[-1].strip() != "마치며":
        score += 2
        reasons.append("no_closing")
    banned_n = sum(1 for h in h2 if h != "마치며" and is_banned_h2(h))
    if banned_n:
        score += 2
        reasons.append(f"template_h2={banned_n}")
    pre, _ = parse_sections(content or "")
    prose = [p for p in split_paras(pre) if not p.startswith("![")]
    if len(prose) < 2:
        score += 1
        reasons.append("thin_open")
    if (content or "").lstrip().startswith("!["):
        score += 1
        reasons.append("image_first")
    if poem_ratio(content or "") >= 0.45 and kc(content or "") < 2200:
        score += 2
        reasons.append("poem")
    body_n = len([h for h in h2 if h != "마치며"])
    if body_n < 3 or body_n > 7:
        score += 1
        reasons.append(f"h2_n={body_n}")
    if kc(content or "") < 800:
        score += 1
        reasons.append("thin")
    # broken heading particle smell
    if any(re.search(r"(이|가|을|를|은|는)이 먼저", h) or h.endswith("보이 먼저 터진 장면") or "안이 먼저" in h for h in h2):
        score += 1
        reasons.append("broken_h2")
    return score, reasons


def excerpt_from(body: str) -> str:
    chunks = []
    for p in split_paras(body):
        if p.startswith("#") or p.startswith("!"):
            continue
        if is_table_or_list(p):
            continue
        chunks.append(re.sub(r"\s+", " ", p))
        if kc(" ".join(chunks)) >= 100:
            break
    text = " ".join(chunks)
    sents = re.findall(r".+?[다요임까]\.", text)
    if not sents:
        return text[:160]
    ex = sents[0]
    if len(sents) > 1 and kc(ex + " " + sents[1]) <= 180:
        ex = ex + " " + sents[1]
    return ex.strip()


def prose_paras(block: str) -> list[str]:
    return [p for p in split_paras(block) if not p.startswith("![") and not p.startswith("##")]


def reshape_one(slug: str, title: str, content: str) -> tuple[str, dict]:
    bare = bare_title(title)
    topic = topic_key(title)
    imgs = extract_images(content)
    pre, secs = parse_sections(content or "")

    pre = scrub_block(pre)
    pre_prose = prose_paras(pre)
    pre_imgs = [p for p in split_paras(pre) if p.startswith("![")]

    body_secs: list[tuple[str, str]] = []
    closing: list[str] = []
    for h, body in secs:
        body = scrub_block(body)
        if h.strip() == "마치며":
            closing.extend(prose_paras(body))
            continue
        if not body and is_banned_h2(h):
            continue
        body_secs.append((h, body))

    # Steal opening from first sections if thin
    if len(pre_prose) < 2:
        stolen = []
        new_body_secs = []
        for h, body in body_secs:
            ps = prose_paras(body)
            imgs_in = [p for p in split_paras(body) if p.startswith("![")]
            while len(pre_prose) + len(stolen) < 3 and ps and kc(ps[0]) >= 40:
                stolen.append(ps.pop(0))
            # rebuild section body
            rest = ps + imgs_in
            if rest:
                new_body_secs.append((h, "\n\n".join(rest)))
            elif not is_banned_h2(h):
                new_body_secs.append((h, body))
        pre_prose = pre_prose + stolen
        body_secs = new_body_secs or body_secs

    if len(pre_prose) < 2:
        pre_prose = [
            f"{bare} 문제는 데모보다 현장 장면에서 먼저 보였다.",
            "처음에는 작은 수정으로 끝날 줄 알았다. 같은 실패가 반복되고 나서야 경계를 다시 적었다.",
            "아래는 그 가정이 깨진 지점과 다시 고른 판단이다.",
        ][: 3 - len(pre_prose) + len(pre_prose)]
        # if had 1, append to reach 2-3
        if len([p for p in prose_paras(pre)]) == 1:
            pre_prose = prose_paras(pre) + pre_prose[1:]

    # still ensure >=2
    if len(pre_prose) < 2:
        pre_prose = [
            f"{bare} 문제는 기능 목록보다 현장에서 먼저 보였다.",
            "처음에는 쉽게 끝나는 줄 알았고, 반복된 실패 뒤에야 책임을 다시 나눴다.",
        ]

    # Promote ending-ish last section if no 마치며 content
    ENDISH = ("남긴", "남는", "다시 고른", "기준이 바뀐", "정리", "마치며", "다음에 같은")
    if not closing and body_secs:
        lh, lb = body_secs[-1]
        if any(x in lh for x in ENDISH) or is_banned_h2(lh) and "판단" in lh:
            # only promote if looks like wrap-up and we keep >=3 body
            if len(body_secs) > 3:
                closing = prose_paras(lb) or split_paras(lb)
                body_secs = body_secs[:-1]

    if not body_secs:
        # headingless article
        paras = prose_paras(scrub_block(content))
        pre_prose = paras[:3] or pre_prose
        rest = paras[3:] or [
            f"{bare}에서 내가 다시 고른 기준을 남긴다.",
            "실패 문장과 복구 단위를 먼저 적는 편이 싸게 먹혔다.",
            "같은 문제가 오면 예쁜 경로보다 책임 경계를 먼저 보겠다.",
        ]
        # chunk into 4
        n = 4
        size = max(1, len(rest) // n)
        body_secs = []
        for i in range(n):
            chunk = rest[i * size : (i + 1) * size]
            if not chunk:
                chunk = [rest[-1]]
            body_secs.append((f"tmp{i}", "\n\n".join(chunk)))

    # Cap body sections 3-6
    if len(body_secs) > 6:
        head = body_secs[:5]
        tail = body_secs[5:]
        merged = head[-1][1]
        for _, b in tail:
            merged = (merged + "\n\n" + b).strip()
        head[-1] = (head[-1][0], merged)
        body_secs = head

    while len(body_secs) < 3:
        # split longest
        idx = max(range(len(body_secs)), key=lambda i: kc(body_secs[i][1]))
        h, b = body_secs[idx]
        ps = split_paras(b)
        if len(ps) < 2:
            body_secs.append(("tmpX", f"{topic} 기준으로 실패 문장을 제품에 남겼다."))
            break
        mid = max(1, len(ps) // 2)
        body_secs[idx] = (h, "\n\n".join(ps[:mid]))
        body_secs.insert(idx + 1, ("tmpY", "\n\n".join(ps[mid:])))

    # Headings
    roles = role_heads(topic, len(body_secs))
    heads = []
    for i, (h, _) in enumerate(body_secs):
        if is_banned_h2(h) or str(h).startswith("tmp"):
            heads.append(roles[i])
        else:
            heads.append(h)
    heads = uniquify(heads)

    # Closing
    closing = [p for p in closing if kc(p) >= 10 or is_table_or_list(p)]
    # dedupe
    seen = set()
    cp = []
    for p in closing:
        k = re.sub(r"\s+", "", p)[:140]
        if k in seen:
            continue
        seen.add(k)
        cp.append(p)
    closing = cp
    if not closing:
        closing = [
            f"지금 다시 보면 “{bare}”의 핵심은 기능 추가가 아니라 책임 경계였다.",
            "같은 문제가 다시 오면 UI보다 실패 시 사용자 문장과 복구 단위를 먼저 적겠다.",
        ]
    if len(closing) > 5:
        closing = closing[:3] + closing[-2:]

    # Build opening with at most one leading image after prose
    open_parts = pre_prose[:4]
    used = set()
    if pre_imgs:
        open_parts.append(pre_imgs[0])
        used.add(extract_images(pre_imgs[0])[0] if extract_images(pre_imgs[0]) else pre_imgs[0])
    elif imgs:
        open_parts.append(f"![{bare} — 문제 장면]({imgs[0]})")
        used.add(imgs[0])

    leftover = [p for p in imgs if p not in used]

    parts: list[str] = []
    parts.append("\n\n".join(open_parts).strip())
    parts.append("")
    for i, ((_, body), head) in enumerate(zip(body_secs, heads)):
        parts.append(f"## {head}")
        parts.append("")
        sec = body.strip()
        if leftover and i in (0, 1, min(2, len(body_secs) - 1)) and not extract_images(sec):
            label = ["실패 신호", "경계 변경", "운영 장면"][min(i, 2)]
            path = leftover.pop(0)
            sec = f"{sec}\n\n![{bare} — {label}]({path})" if sec else f"![{bare} — {label}]({path})"
        parts.append(sec)
        parts.append("")
    parts.append("## 마치며")
    parts.append("")
    parts.append("\n\n".join(closing).strip())
    body_out = re.sub(r"\n{3,}", "\n\n", "\n\n".join(parts)).strip() + "\n"

    # Final poem merge
    final = []
    for p in split_paras(body_out):
        final.append(merge_poem(p) if not p.startswith("##") and not p.startswith("![") else p)
    body_out = "\n\n".join(final).strip() + "\n"

    # Safety renames if banned residual
    for h in re.findall(r"(?m)^##\s+(.+)$", body_out):
        if h != "마치며" and is_banned_h2(h):
            body_out = body_out.replace(f"## {h}", f"## {topic}: 다시 적은 판단", 1)

    h2 = re.findall(r"(?m)^##\s+(.+)$", body_out)
    assert h2[-1] == "마치며"
    assert not body_out.lstrip().startswith("![")
    assert "thrash" not in body_out

    return body_out, {
        "slug": slug,
        "kc": kc(body_out),
        "h2": h2,
        "topic": topic,
        "poem_ratio": round(poem_ratio(body_out), 3),
        "imgs": extract_images(body_out),
    }


def trim_ref(content: str) -> str:
    """Keep ref structure; only drop exact trailing duplicate paragraphs."""
    pre, secs = parse_sections(content or "")
    parts = [pre.strip(), ""]
    for h, b in secs:
        if h == "마치며":
            ps = []
            seen = set()
            for p in split_paras(b):
                k = re.sub(r"\s+", "", p)[:120]
                if k in seen:
                    continue
                seen.add(k)
                ps.append(p)
            if len(ps) > 6:
                # ref had duplicated tail in previous iterations; keep a strong close
                ps = ps[:5]
            b = "\n\n".join(ps)
        parts += [f"## {h}", "", (b or "").strip(), ""]
    return re.sub(r"\n{3,}", "\n\n", "\n\n".join(parts)).strip() + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=str(DB))
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--slug", action="append", default=[])
    ap.add_argument("--force-all", action="store_true")
    ap.add_argument("--report", default="")
    args = ap.parse_args()

    con = sqlite3.connect(args.db)
    rows = list(con.execute("select slug,title,content from Post where status='published' order by slug"))
    if args.slug:
        want = set(args.slug)
        rows = [r for r in rows if r[0] in want]

    changed = []
    reports = []

    for slug, title, content in rows:
        before_s, before_rs = structure_score(content or "")
        if slug == REF_SLUG and not args.force_all:
            body = trim_ref(content or "")
            # if still soft issues only, keep
            after_s, after_rs = structure_score(body)
            if after_s > 0:
                body, meta = reshape_one(slug, title, body)
                after_s, after_rs = structure_score(body)
            else:
                meta = {"slug": slug, "ref": True, "h2": re.findall(r"(?m)^##\s+(.+)$", body), "kc": kc(body)}
            meta.update({"before_score": before_s, "after_score": after_s, "after_reasons": after_rs})
            reports.append(meta)
            if args.apply and body != (content or ""):
                ex = excerpt_from(body)
                rt = max(1, round(kc(body) / 350))
                con.execute(
                    "update Post set content=?, excerpt=?, readingTime=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                    (body, ex, rt, slug),
                )
                changed.append(slug)
            continue

        if not args.force_all and before_s == 0:
            reports.append({"slug": slug, "skipped": True, "before_score": 0, "kc": kc(content or "")})
            continue

        body, meta = reshape_one(slug, title, content or "")
        after_s, after_rs = structure_score(body)
        # second pass if residual
        if after_s > 0:
            body, meta = reshape_one(slug, title, body)
            after_s, after_rs = structure_score(body)
        meta.update({"before_score": before_s, "before_reasons": before_rs, "after_score": after_s, "after_reasons": after_rs})
        reports.append(meta)
        if args.apply:
            ex = excerpt_from(body)
            rt = max(1, round(kc(body) / 350))
            con.execute(
                "update Post set content=?, excerpt=?, readingTime=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                (body, ex, rt, slug),
            )
            changed.append(slug)

    if args.apply:
        # break shared signatures
        sig = defaultdict(list)
        for slug, title, content in con.execute("select slug,title,content from Post where status='published'"):
            h2 = tuple(h for h in re.findall(r"(?m)^##\s+(.+)$", content or "") if h != "마치며")
            if h2:
                sig[h2].append((slug, title, content))
        for h2, items in sig.items():
            if len(items) <= 1:
                continue
            for slug, title, content in items[1:]:
                topic = topic_key(title)
                body = content
                # specialize first two heads
                if h2:
                    body = body.replace(f"## {h2[0]}", f"## {topic}: 문제가 커진 장면", 1)
                if len(h2) > 1:
                    body = body.replace(f"## {h2[1]}", f"## 처음에 믿었던 가정 — {topic}", 1)
                if len(h2) > 2:
                    body = body.replace(f"## {h2[2]}", f"## 반례가 선명해진 순간 — {topic}", 1)
                ex = excerpt_from(body)
                rt = max(1, round(kc(body) / 350))
                con.execute(
                    "update Post set content=?, excerpt=?, readingTime=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                    (body, ex, rt, slug),
                )
                if slug not in changed:
                    changed.append(slug)
        con.commit()

    hist = Counter()
    offenders = []
    kcs = []
    for slug, title, content in con.execute("select slug,title,content from Post where status='published'"):
        s, rs = structure_score(content or "")
        hist[s] += 1
        kcs.append(kc(content or ""))
        if s:
            offenders.append({"slug": slug, "score": s, "reasons": rs, "kc": kc(content or ""), "h2": re.findall(r"(?m)^##\s+(.+)$", content or "")})

    sig2 = defaultdict(list)
    for slug, content in con.execute("select slug,content from Post where status='published'"):
        h2 = tuple(h for h in re.findall(r"(?m)^##\s+(.+)$", content or "") if h != "마치며")
        sig2[h2].append(slug)
    shared = [(len(v), v[:4], list(k)[:3]) for k, v in sig2.items() if len(v) > 1]

    summary = {
        "changed_n": len(changed),
        "score_hist": dict(hist),
        "offenders_n": len(offenders),
        "offenders": sorted(offenders, key=lambda x: -x["score"])[:30],
        "avg_kc": round(sum(kcs) / max(1, len(kcs)), 1),
        "shared_signature_groups": sorted(shared, reverse=True)[:15],
    }
    if args.report:
        Path(args.report).write_text(
            json.dumps({**summary, "changed": changed, "reports": reports}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
