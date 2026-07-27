#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""G004: humanize deep-dive + algorithm cores. No length floor. Preserve images."""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BEATS_PATH = Path(__file__).with_name("humanize-deep-algo-beats.json")
DB_PATH = ROOT / "db" / "custom.db"
BAD = "thr" + "ash"

SKIP: set[str] = set()

# Already short/clean enough to leave body (optional excerpt refresh only)
SKIP = {
    "2026-06-18-ponslink-algorithm-01-negotiation",
    "2026-06-18-ponslink-deep-dive-08-request-first",
}


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


def entry(opening: str, sections: list[tuple[str, str]]) -> dict:
    d = {"opening": opening, "sections": [{"h2": h, "body": b} for h, b in sections]}
    blob = json.dumps(d, ensure_ascii=False)
    if BAD in blob:
        raise RuntimeError("forbidden placeholder in beats payload")
    forbidden_h2 = {
        "이 판단이 제품 문장으로 남는 방식",
        "경계 표를 다시 고정하기",
        "경계 표 다시 고정하기",
        "경계 표",
        "운영·학습 체크리스트",
        "운영 체크리스트",
        "현장 기준으로 다시 고정하는 원칙",
        "다음에 다시 만질 때",
        "추가 고정 문장",
    }
    for s in d["sections"]:
        if s["h2"] in forbidden_h2:
            raise RuntimeError("forbidden slop h2: " + s["h2"])
    return d


def beats() -> dict[str, dict]:
    B: dict[str, dict] = {}

    B["2026-06-18-ponslink-algorithm-02-realtime-queue"] = entry(
        """실시간 메시지를 한 줄에 세우면 구현이 단순해 보인다.
채팅, 신호, 상태, 파일이 같은 대기열을 공유한다.

같이 서면 급한 말이 느린 짐에 막힌다.""",
        [
            (
                "한 줄의 착각",
                """같은 채널에 넣으면 코드가 줄어든다.
문제는 우선순위가 사라지는 것이다.""",
            ),
            (
                "막히는 장면",
                """큰 조각이 앞에 있으면
짧은 제어 메시지가 뒤에 선다.

사용자는 말 끊김으로 먼저 느낀다.""",
            ),
            (
                "줄을 나눈 이유",
                """제어는 짧게, 데이터는 길게.
대기열을 목적별로 갈랐다.""",
            ),
            (
                "한 줄",
                """실시간은 처리량이 아니라 순서 설계다.
급한 말이 짐에 가리면 제품이  thrash""".replace(" thrash", " thrash"),
            ),
        ],
    )
    return B


def main() -> int:
    raise SystemExit("incomplete builder stub; replace full content")


if __name__ == "__main__":
    raise SystemExit(main())
