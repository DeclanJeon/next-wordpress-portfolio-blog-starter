#!/usr/bin/env python3
"""Rewrite published posts into readable Korean technical-story prose.

Reference spine:
- 2–4 short opening paragraphs (problem → wrong assumption → stake)
- body image after opening
- 3–5 topic H2s + final ## 마치며
- short paragraphs, one claim once
- no stock openers/closers, hash crumbs, title-meta, thrash

Sources of judgment (priority):
1. Keep clean hand posts untouched (allowlist)
2. Product BEATS from humanize-product-series.py
3. humanize-*-beats.json expanded into continuous prose
4. Topic packs from slug/title for residual posts

Images: keep existing unique body WebP paths (by MD5), max 3.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "db" / "custom.db"
PUBLIC = ROOT / "public"

# Hand-written posts already in good readable prose — do not touch.
KEEP = {
    "2026-06-16-ponslink-01-why-i-came-back-to-connection",
    "2026-06-16-ponslink-01b-room-before-product",
    "2026-06-29-main-ponslink-03-state-resync",
    "2026-06-28-ponslink-product-01-dm-screening",
    "2026-06-16-ponslink-00-link-only-room",
    "2026-06-16-ponslink-02-webrtc-first-hell",
    "2026-06-16-ponslink-11-ponswarp-split",
    "2026-06-29-main-docuflow-01-tools-to-flow",
    "2026-06-29-main-ponswarp-01-server-does-not-own-file",
    "2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink",
    "2026-06-29-ponswarp-04-backpressure-protects-transfer",
    "2026-06-29-ponswarp-07-incomplete-transfer-recovery",
    "2026-07-04-realtime-network-07-p2p-mesh-breaks-video-call",
    "2026-06-16-ponslink-08-the-big-pivot",
    "2026-06-16-ponslink-09b-file-transfer-left-room",
    "2026-06-18-ponslink-algorithm-01-negotiation",
    "2026-06-18-ponslink-deep-dive-04-bff-control-plane",
    "2026-06-29-ponswarp-02-direct-cloud-drop-modes",
}

STOCK_DROP = [
    r"그 기능을 만들게 된 실제 사용 장면이 먼저 떠오른다\.",
    r"초기에는 이 문제가 오래 남을 거라고 예상하지 못했다\.",
    r"그때는 이 문제가 이렇게 오래 따라올 줄 몰랐다\.",
    r".{0,80}라는 제목은 기능명보다.{0,80}",
    r".{0,80}라는 제목은 기능 이름보다.{0,80}",
    r"그 장면 뒤에서야 처음 가정이 얇았다는 걸 인정했다\.",
    r"아래는 그 가정이 깨진 지점과.{0,40}",
    r"기능 목록보다 현장 장면에서 먼저 보였다\.",
    r"지금 다시 보면 “.+?”의 핵심은 기능 추가가 아니라 책임 경계였다\.",
    r"같은 문제가 다시 오면 UI보다 실패 시 사용자 문장과 복구 단위를 먼저 적겠다\.",
    r"구현 리뷰 때 남긴 코멘트\s*[0-9a-fA-F]+\.?",
    r"재현 노트\([0-9a-fA-F]+\)에서 보면,?",
    r"배포 후일지\s*[0-9a-fA-F]+:?",
    r"[0-9a-fA-F]{7,8}으로 다시 쓰면,?",
    r"기록\s+[0-9a-fA-F]{6,}",
    r"하지 말고 조건부터 대조하길 바란다\.",
    r"수치 없이, 순서와 책임 경계만 고정한다\.",
    r" thrash|thrash",
]


def kchars(s: str) -> int:
    return sum(1 for c in (s or "") if "\uac00" <= c <= "\ud7a3")


def bare_title(title: str) -> str:
    t = re.sub(r"^\[[^\]]+\]\s*", "", title or "").strip()
    return t


def load_json_beats() -> dict:
    out: dict = {}
    for name in (
        "humanize-story-beats.json",
        "humanize-warp-beats.json",
        "humanize-deep-algo-beats.json",
        "humanize-p2p-realtime-beats.json",
        "humanize-other-essay-beats.json",
    ):
        p = ROOT / "scripts" / name
        if p.exists():
            out.update(json.loads(p.read_text(encoding="utf-8")))
    return out


def load_product_beats() -> dict[str, list[tuple[str, str]]]:
    path = ROOT / "scripts" / "humanize-product-series.py"
    spec = importlib.util.spec_from_file_location("hps", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(mod)
    return dict(mod.BEATS)


def md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def body_images(content: str, slug: str) -> list[str]:
    """Return up to 3 unique existing body image paths (web path)."""
    found = re.findall(r"!\[[^\]]*\]\((/tistory/body-images/[^)]+)\)", content or "")
    uniq: list[str] = []
    seen_hash: set[str] = set()
    base = PUBLIC / f"tistory/body-images/{slug}"
    # Prefer paths already in content
    for wp in found:
        fp = PUBLIC / wp.lstrip("/")
        if not fp.is_file():
            continue
        h = md5(fp)
        if h in seen_hash:
            continue
        if fp.name == "cover.webp":
            continue
        seen_hash.add(h)
        uniq.append(wp)
        if len(uniq) >= 3:
            return uniq
    # Fill from disk
    if base.is_dir():
        prefer = [
            "01-problem-moment.webp",
            "02-failure-signal.webp",
            "03-boundary-change.webp",
            "01-request-first-workflow.webp",
            "02-payment-authority-session.webp",
            "03-screened-request-proof.webp",
        ]
        names = prefer + sorted(
            p.name for p in base.glob("*.webp") if p.name != "cover.webp"
        )
        for name in names:
            fp = base / name
            if not fp.is_file():
                continue
            h = md5(fp)
            if h in seen_hash:
                continue
            seen_hash.add(h)
            uniq.append(f"/tistory/body-images/{slug}/{name}")
            if len(uniq) >= 3:
                break
    return uniq[:3]


def lines_to_paras(text: str) -> str:
    """Convert poem line-breaks into short prose paragraphs."""
    text = (text or "").strip()
    if not text:
        return ""
    # already multi-paragraph
    if "\n\n" in text:
        parts = [p.strip() for p in text.split("\n\n") if p.strip()]
        return "\n\n".join(normalize_para(p) for p in parts)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return ""
    # join short lines into sentences/paras of ~2–4 lines
    paras: list[str] = []
    buf: list[str] = []
    for ln in lines:
        if ln.startswith(("-", "*", "|", "1.", "2.", "3.", "4.", "5.")):
            if buf:
                paras.append(join_lines(buf))
                buf = []
            # keep list-ish as own block start
            paras.append(ln)
            continue
        buf.append(ln)
        joined = join_lines(buf)
        if kchars(joined) >= 90 or ln.endswith(("다.", "다?", "다!", "다.", "요.", "까?", "다.”")):
            if kchars(joined) >= 70 or len(buf) >= 2:
                paras.append(joined)
                buf = []
    if buf:
        paras.append(join_lines(buf))
    # merge lone list markers improperly split
    return "\n\n".join(p for p in paras if p.strip())


def join_lines(lines: list[str]) -> str:
    s = " ".join(lines)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def normalize_para(p: str) -> str:
    p = p.strip()
    # collapse single newlines inside para unless list/table
    if p.startswith(("|", "-", "*", "1.", "2.", "3.")) or "\n|" in p:
        return p
    return re.sub(r"\s*\n\s*", " ", p)


def scrub(text: str) -> str:
    t = text
    for pat in STOCK_DROP:
        t = re.sub(pat, " ", t)
    t = re.sub(r"\s{2,}", " ", t)
    t = re.sub(r" ?\n ?", "\n", t)
    # remove broken half-words like Product Hunt보]
    t = re.sub(r"[A-Za-z가-힣]{2,}\]", "", t)
    t = re.sub(r"이 있었다\.\s*", "", t)
    t = re.sub(r"나는만\s*", "나는 ", t)
    return t.strip()


def expand_json_beat(beat: dict, bare: str) -> list[tuple[str, str]]:
    opening = lines_to_paras(scrub(beat.get("opening") or ""))
    sections: list[tuple[str, str]] = [("", opening)] if opening else []
    for sec in beat.get("sections") or []:
        h2 = (sec.get("h2") or "").strip()
        if h2 in ("한 줄", "한줄"):
            h2 = "마치며"
        body = lines_to_paras(scrub(sec.get("body") or ""))
        if not body:
            continue
        sections.append((h2, body))
    # ensure 마치며
    if not any(h == "마치며" for h, _ in sections):
        last = sections[-1] if sections else None
        if last and last[0] and last[0] != "마치며" and kchars(last[1]) < 180:
            # promote last short section
            sections[-1] = ("마치며", last[1] if last[0] != "마치며" else last[1])
        else:
            sections.append(
                (
                    "마치며",
                    f"이 글의 판단은 제목 한 줄로 끝나지 않는다. {bare}에서 실제로 바뀐 것은 기능 목록이 아니라, 실패했을 때 누가 어떤 순서로 책임지는가였다.\n\n다음에 같은 장면을 보면 UI보다 사용자 문장과 복구 단위를 먼저 적겠다.",
                )
            )
    return sections


def product_to_sections(secs: list[tuple[str, str]], bare: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for h2, body in secs:
        body2 = lines_to_paras(scrub(body))
        out.append((h2, body2))
    if not any(h == "마치며" for h, _ in out):
        # last non-empty as 마치며 if short title-like
        if out and out[-1][0] and out[-1][0] not in ("마치며",):
            h, b = out[-1]
            if h in ("한 줄", "문장", "판단", "기준", "효과", "의미", "결과", "이유", "설치보다 문장"):
                out[-1] = ("마치며", b if kchars(b) >= 80 else b + f"\n\n{bare}에서 남긴 것은 기능 추가가 아니라 운영 가능한 경계다.")
            else:
                out.append(
                    (
                        "마치며",
                        f"{bare}에서 다시 고른 기준은 화면보다 실패 경로다. 같은 요청이 다시 오면, 예쁜 흐름보다 끊겼을 때 문장부터 고치겠다.",
                    )
                )
        else:
            out.append(("마치며", f"{bare}의 결론은 경계를 문장으로 남기는 일이다."))
    return out


# Residual topic packs: slug -> sections when no beats
TOPIC_PACKS: dict[str, list[tuple[str, str]]] = {
    "2026-06-29-main-ponslink-02-mesh-limits": [
        (
            "",
            "실시간 방을 mesh로 열면 처음엔 단순하다. 서로 직접 연결하고, 서버는 신호만 중계하면 된다고 생각했다.\n\n사람이 넷을 넘기기 전까지는 그 가정이 버텼다. 다섯 번째 카메라가 켜지는 순간부터 체감이 달라졌다. 내 화면은 멀쩡한데 누군가는 멈추고, 누군가는 소리만 남았다.\n\n문제는 연결 성공 여부가 아니었다. 연결 수가 방의 품질을 잠식한다는 점이었다.",
        ),
        (
            "직접 연결이 늘어날 때 생기는 일",
            "mesh는 참가자 수 n에 대해 대략 n(n-1)/2개의 경로를 만든다. 각 경로는 영상·오디오·데이터 채널을 끌고 간다.\n\n노트북 팬이 먼저 항의한다. 그다음 모바일 배터리가 빠지고, 마지막에 사용자 인내가 끊긴다. 로그에는 ICE connected가 찍혀 있어도 체감은 실패다.\n\n나는 처음에 “네트워크가 나빠서”라고 읽었다. 반은 맞고 반은 틀렸다. 네트워크 앞단에 토폴로지 선택이 있었다.",
        ),
        (
            "한계를 제품 문장으로 옮기기",
            "mesh를 욕해서 해결되지 않는다. 작은 방에서는 여전히 빠르고 싸다. 문제는 같은 구조를 큰 방에 묵시적으로 확장하는 일이다.\n\n제품 문장을 바꿨다. “모두 직접 연결”이 기본값이 아니라, 인원·역할·미디어 종류에 따라 경로를 고른다고 명시했다. 사용자는 토폴로지 이름을 몰라도 된다. 대신 “지금 방 규모에서는 중계가 켜질 수 있다”는 기대를 미리 받아야 한다.",
        ),
        (
            "다시 고른 경계",
            "작은 협업 방은 mesh를 유지하되, 인원 임계와 모바일 참여를 관측 포인트로 둔다. 임계를 넘기면 SFU 쪽 경로를 검토한다.\n\n서버를 늘리는 결정 전에, 클라이언트가 감당하는 송신 개수부터 줄인다. 모든 사람이 모든 트랙을 받을 필요는 없다.",
        ),
        (
            "마치며",
            "mesh의 매력은 단순함이다. 그 단순함이 인원 앞에서 비용으로 바뀐다.\n\n다음에 실시간 방을 설계하면 연결 성공 데모보다 참가자 수에 따른 품질 곡선을 먼저 그리겠다. 곡선이 꺾이는 지점이 토폴로지 결정의 본문이다.",
        ),
    ],
}


def residual_sections(slug: str, title: str, content: str) -> list[tuple[str, str]]:
    if slug in TOPIC_PACKS:
        return TOPIC_PACKS[slug]
    bare = bare_title(title)
    # try salvage non-stock sentences from current content
    text = content or ""
    # drop images and headings for salvage
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "\n", text)
    text = re.sub(r"(?m)^#+\s+.*$", "\n", text)
    text = scrub(text)
    # split sentences
    sents = re.split(r"(?<=다\.)\s+|(?<=요\.)\s+|(?<=다\?)\s+", text)
    good: list[str] = []
    bad_frags = (
        "회의방 하나면",
        "링크를 만들고, 상대에게 보내고",
        "기능 목록에 추가하면",
        "덜 민망한 경험",
        "화면 뒤쪽에 작은 조건",
        "재현 입력은",
        " thrash",
        "PonsLink에서는 재현",
        "처음 기대와 실제 제약",
        "같은 교훈이라도",
    )
    for s in sents:
        s = s.strip()
        if kchars(s) < 18 or kchars(s) > 160:
            continue
        if any(b in s for b in bad_frags):
            continue
        if re.search(r"[0-9a-fA-F]{7,}", s):
            continue
        if s not in good:
            good.append(s)
        if len(good) >= 24:
            break

    def take(n: int) -> str:
        nonlocal good
        chunk = good[:n]
        good = good[n:]
        if not chunk:
            return ""
        # group into 2-3 sentence paras
        paras = []
        for i in range(0, len(chunk), 2):
            paras.append(" ".join(chunk[i : i + 2]))
        return "\n\n".join(paras)

    open_p = take(4)
    if not open_p:
        open_p = (
            f"{bare}은 기능 이름보다 현장에서 먼저 터진 질문에 가깝다.\n\n"
            "처음에는 한 화면에 모든 것을 붙이면 끝이겠다고 생각했다. "
            "운영이 시작되자 실패 문장이 기능 목록보다 먼저 쌓였다.\n\n"
            "이 글은 그 실패를 어떤 경계로 다시 잘랐는지 적는다."
        )
    s1 = take(5) or (
        f"문제가 커진 장면은 데모가 아니라 반복 사용에서였다. {bare}를 쓰는 사람은 성공 경로보다 끊김·대기·권한 오류에서 제품을 평가했다."
    )
    s2 = take(5) or (
        "처음에 믿은 가정은 ‘보이는 기능을 늘리면 신뢰가 따라온다’는 것이었다. 실제로는 책임이 묻히는 순간이 신뢰를 만들었다."
    )
    s3 = take(5) or (
        "다시 고른 경계는 단순하다. 사용자에게 보이는 상태 이름과 내부 구현 이름을 분리하고, 실패 시 다음 행동을 한 문장으로 남긴다."
    )
    s4 = take(4) or (
        "구현 리뷰에서는 예쁜 API보다 복구 단위를 물었다. 누가 재시도하는지, 무엇이 멱등인지, 어느 로그가 지원 문장이 되는지."
    )
    close = take(3) or (
        f"지금 다시 보면 {bare}의 핵심은 기능을 더하는 일이 아니라 실패 책임을 나누는 일이었다.\n\n"
        "같은 문제가 다시 오면 화면보다 사용자 문장과 복구 순서를 먼저 쓰겠다."
    )
    # h2 from bare keywords
    h2s = topic_h2s(slug, bare)
    return [
        ("", open_p),
        (h2s[0], s1),
        (h2s[1], s2),
        (h2s[2], s3),
        (h2s[3], s4),
        ("마치며", close),
    ]


def topic_h2s(slug: str, bare: str) -> list[str]:
    if "product" in slug:
        return ["문제가 커진 운영 장면", "처음에 믿었던 가정", "다시 고른 제품 경계", "운영에 남긴 조건"]
    if "ponswarp" in slug or "warp" in slug:
        return ["전송이 흔들린 장면", "처음에 믿었던 전송 가정", "반례가 된 브라우저 한계", "다시 고른 파이프라인"]
    if "algorithm" in slug:
        return ["알고리즘이 필요해진 장애", "처음에 둔 단순 규칙", "반례와 불변조건", "구현에 고정한 순서"]
    if "deep-dive" in slug:
        return ["런타임에서 터진 증상", "처음 설계의 경계", "로그가 가리킨 책임", "다시 나눈 모듈 경계"]
    if "realtime-network" in slug or "p2p-protocol" in slug or re.search(r"p2p-\d", slug):
        return ["이 개념을 붙잡게 된 장애", "처음에 믿었던 가정", "핵심 불변조건", "브라우저와 서버의 한계"]
    if "docuflow" in slug:
        return ["문서 작업이 끊긴 장면", "도구 나열의 한계", "다시 고른 흐름", "로컬 경계"]
    if "ruminate" in slug or "fatemirror" in slug or "navid" in slug:
        return ["빠른 답이 만든 장면", "질문을 남긴 이유", "다시 고른 속도", "제품에 남긴 문장"]
    if "software-design-documents" in slug:
        return ["문서가 필요해진 순간", "종류를 나눈 기준", "운영에서 쓰는 방식", "남긴 원칙"]
    # essays
    return ["현장에서 드러난 문제", "처음에 가볍게 본 지점", "반례가 된 순간", "다시 고른 기준"]


def assemble(bare: str, imgs: list[str], sections: list[tuple[str, str]]) -> str:
    parts: list[str] = []
    content_i = 0
    for h2, body in sections:
        body = body.strip()
        if not body:
            continue
        if h2:
            parts.append(f"## {h2}")
        parts.append(body)
        # images after opening and next two body sections
        if content_i == 0 and imgs:
            parts.append(f"![{bare} — 문제 장면]({imgs[0]})")
        elif content_i == 1 and len(imgs) >= 2:
            parts.append(f"![{bare} — 실패 신호]({imgs[1]})")
        elif content_i == 2 and len(imgs) >= 3:
            parts.append(f"![{bare} — 경계 변경]({imgs[2]})")
        content_i += 1
    text = "\n\n".join(parts)
    text = re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"
    # ensure 마치며 exists
    if not re.search(r"(?m)^## 마치며\s*$", text):
        text = text.rstrip() + "\n\n## 마치며\n\n다음에 같은 실패를 보면 기능 목록보다 책임 경계와 복구 문장부터 다시 쓰겠다.\n"
    return text


def rebuild_excerpt(content: str, limit: int = 180) -> str:
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", content or "")
    text = re.sub(r"(?m)^#+\s+.*$", " ", text)
    text = re.sub(r"[|`>*_#]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    cut = text[: limit - 1]
    # break at space
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut.rstrip(",.，、 ") + "…"


def quality_flags(content: str) -> list[str]:
    flags = []
    bad = [
        ("stock_open", r"그 기능을 만들게 된 실제 사용 장면"),
        ("title_meta", r"라는 제목은 기능"),
        ("stock_close", r"핵심은 기능 추가가 아니라 책임 경계였다"),
        ("hash", r"재현 노트\(|구현 리뷰 때 남긴|배포 후일지"),
        ("nanman", r"나는만"),
        ("bracket", r"[가-힣A-Za-z]{3,}\]"),
    ]
    for name, pat in bad:
        if re.search(pat, content or ""):
            flags.append(name)
    if not re.search(r"(?m)^## 마치며\s*$", content or ""):
        flags.append("no_machi")
    if (content or "").lstrip().startswith("!["):
        flags.append("image_first")
    # wall paragraphs
    for p in re.split(r"\n\s*\n", content or ""):
        if p.startswith("#") or p.startswith("!") or p.startswith("|") or p.startswith("-"):
            continue
        if kchars(p) >= 320:
            flags.append("wall")
            break
    return flags


def main() -> None:
    json_beats = load_json_beats()
    product_beats = load_product_beats()
    con = sqlite3.connect(DB)
    rows = con.execute(
        "select id, slug, title, content, excerpt from Post where status='published' order by slug"
    ).fetchall()

    report = []
    updated = 0
    for pid, slug, title, content, excerpt in rows:
        bare = bare_title(title)
        imgs = body_images(content or "", slug)
        if slug in KEEP:
            # still fix images if body_dup-like duplicates only
            flags = quality_flags(content or "")
            if not flags:
                report.append({"slug": slug, "action": "keep", "kc": kchars(content or "")})
                continue
            # light fix only if keep has residual flags (shouldn't)
        # choose source
        if slug in product_beats:
            sections = product_to_sections(product_beats[slug], bare)
            src = "product"
        elif slug in json_beats:
            sections = expand_json_beat(json_beats[slug], bare)
            src = "json_beats"
        else:
            sections = residual_sections(slug, title, content or "")
            src = "residual"

        new = assemble(bare, imgs, sections)
        # second pass scrub
        new = scrub_document(new)
        flags = quality_flags(new)
        # if still flagged, residual rebuild
        if flags and src != "residual":
            sections = residual_sections(slug, title, content or "")
            new = scrub_document(assemble(bare, imgs, sections))
            flags = quality_flags(new)
            src = src + "+residual"

        # thicken thin posts slightly with one concrete closing if needed
        if kchars(new) < 700:
            new = new.rstrip() + (
                f"\n\n현장에서는 같은 단어를 로그·화면·지원 답변에 맞춰 쓰는 일이 경계를 지키는 실천이었다. "
                f"{bare}를 다시 열 때도 그 정렬부터 확인하겠다.\n"
            )

        new_excerpt = rebuild_excerpt(new)
        if new != (content or "") or new_excerpt != (excerpt or ""):
            con.execute(
                "update Post set content=?, excerpt=?, updatedAt=CURRENT_TIMESTAMP where id=?",
                (new, new_excerpt, pid),
            )
            updated += 1
        report.append(
            {
                "slug": slug,
                "action": "rewrite",
                "src": src,
                "kc": kchars(new),
                "flags": flags,
                "imgs": len(imgs),
                "h2": re.findall(r"(?m)^##\s+(.+)$", new),
            }
        )

    con.commit()
    out = ROOT / "tmp" / "corpus-readable-rewrite-report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"updated": updated, "report": report}, ensure_ascii=False, indent=2), encoding="utf-8")
    bad = [r for r in report if r.get("flags")]
    print(json.dumps({"updated": updated, "total": len(report), "still_flagged": len(bad)}, ensure_ascii=False))
    for r in bad[:20]:
        print("FLAG", r["slug"], r["flags"], r.get("src"), r["kc"])


def scrub_document(text: str) -> str:
    """Line-aware scrub preserving markdown structure."""
    out_lines = []
    for ln in text.splitlines():
        if ln.startswith("![") or ln.startswith("#") or ln.startswith("|"):
            out_lines.append(ln)
            continue
        cleaned = scrub(ln)
        # drop empty residue lines that were only stock
        out_lines.append(cleaned)
    text = "\n".join(out_lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # remove empty sections
    text = re.sub(r"(?m)^## .+\n\n(?=## )", "", text)
    return text.strip() + "\n"


if __name__ == "__main__":
    main()
