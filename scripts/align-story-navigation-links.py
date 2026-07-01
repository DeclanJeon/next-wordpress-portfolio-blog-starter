#!/usr/bin/env python3
"""Align post tail navigation blocks with PostSeries sortOrder.

The public article UI now treats series order as the main story flow. This script
keeps the prose tail block consistent with that same flow, so the sentence inside
the article and the bottom navigation cards do not point to different posts.
"""
from __future__ import annotations

import datetime as dt
import os
import re
import shutil
import sqlite3
from pathlib import Path

DB_PATH = Path("db/custom.db")
REPORT_PATH = Path("tmp/story-navigation-link-align-report-2026-06-30.md")

TAIL_RE = re.compile(
    r"\n{2,}(?:---\n\n)?## (?:다음에 읽을 글|이어지는 글|글 흐름 이어가기|다음 이야기는[^\n]*|여기서 남는 질문)\n[\s\S]*$",
    re.MULTILINE,
)

GROUP_COPY = [
    ("ponslink-origin", "이 흐름은 PonsLink가 왜 방에서 시작했는지 계속 좁혀 간다."),
    ("ponslink-product", "이 흐름은 좋은 방을 실제 운영으로 옮기며 생긴 질문을 따라간다."),
    ("ponslink-technical", "이 흐름은 방을 방답게 굴리기 위해 뒤쪽에서 버틴 기술 선택을 따라간다."),
    ("ponswarp-origin", "이 흐름은 PonsLink 안에서 고장난 파일 전송이 어떻게 PonsWarp로 분리됐는지 따라간다."),
    ("ponswarp-transfer", "이 흐름은 브라우저끼리 파일을 직접 보내면서 부딪힌 전송 엔진의 벽을 따라간다."),
    ("ponswarp-storage", "이 흐름은 큰 파일이 브라우저 메모리에서 무너지지 않게 저장 경계를 다시 잡는 과정이다."),
    ("p2p", "이 흐름은 P2P를 배운 이유가 단순 파일 전송이 아니라 그리드 컴퓨팅으로 가는 첫 계단이었다는 데서 출발한다."),
]


def clean_title(title: str) -> str:
    return title.replace("커밋", "작업 기록").replace("함수", "구현 단위")


def group_line(series_slug: str) -> str:
    for key, line in GROUP_COPY:
        if key in series_slug:
            return line
    return "이 흐름은 앞 글에서 생긴 질문이 다음 선택으로 어떻게 갈라졌는지 따라간다."


def strip_tail(content: str) -> str:
    return TAIL_RE.sub("", content.rstrip()).rstrip()


def tail_block(series_slug: str, next_post: sqlite3.Row | None) -> str:
    if next_post:
        title = clean_title(next_post["title"])
        slug = next_post["slug"]
        return (
            "\n\n## 다음에 읽을 글\n\n"
            f"{group_line(series_slug)} "
            f"다음 글에서는 [{title}](/writing/{slug})로 이어진다. "
            "같은 질문이 어디서 다시 갈라지는지 그대로 따라가면 된다.\n"
        )
    return (
        "\n\n## 여기서 남는 질문\n\n"
        f"{group_line(series_slug)} 이 글은 이 시리즈의 한 매듭이다. "
        "다음에는 이 선택이 다른 제품 흐름이나 운영 판단으로 어떻게 번지는지 보면 된다.\n"
    )


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit(f"missing DB: {DB_PATH}")

    stamp = dt.datetime.now().strftime("%Y%m%d%H%M%S")
    backup = DB_PATH.with_suffix(DB_PATH.suffix + f".bak-navlinks-{stamp}")
    shutil.copy2(DB_PATH, backup)

    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    entries = con.execute(
        """
        select ps.postId, ps.seriesId, ps.sortOrder, s.slug as seriesSlug, p.slug, p.title, p.content
        from PostSeries ps
        join Series s on s.id = ps.seriesId
        join Post p on p.id = ps.postId
        where p.status = 'published'
        order by s.sortOrder asc, s.slug asc, ps.sortOrder asc, p.publishedAt asc
        """
    ).fetchall()

    by_series: dict[str, list[sqlite3.Row]] = {}
    first_membership: dict[str, sqlite3.Row] = {}
    for entry in entries:
        by_series.setdefault(entry["seriesId"], []).append(entry)
        first_membership.setdefault(entry["postId"], entry)

    changes = []
    for series_id, members in by_series.items():
        members = sorted(members, key=lambda row: (row["sortOrder"], row["slug"]))
        for index, row in enumerate(members):
            # If a post belongs to several series, only rewrite from its first series
            # membership to avoid one post fighting two story tails.
            if first_membership[row["postId"]]["seriesId"] != series_id:
                continue
            next_post = members[index + 1] if index + 1 < len(members) else None
            old = row["content"] or ""
            new = strip_tail(old) + tail_block(row["seriesSlug"], next_post)
            if new != old:
                con.execute(
                    "update Post set content = ?, updatedAt = ? where id = ?",
                    (new, dt.datetime.utcnow().isoformat(timespec="milliseconds") + "Z", row["postId"]),
                )
                changes.append((row["seriesSlug"], row["slug"], next_post["slug"] if next_post else "END"))

    con.commit()
    con.close()

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Story Navigation Link Align Report",
        "",
        f"- 실행시각: {dt.datetime.now().isoformat(timespec='seconds')}",
        f"- DB 백업: `{backup}`",
        f"- 변경 글 수: {len(changes)}",
        "",
        "## 변경 목록",
        "",
        "| series | slug | tail target |",
        "| --- | --- | --- |",
    ]
    for series_slug, slug, target in changes:
        lines.append(f"| `{series_slug}` | `{slug}` | `{target}` |")
    REPORT_PATH.write_text("\n".join(lines) + "\n")
    print(f"backup={backup}")
    print(f"changed={len(changes)}")
    print(f"report={REPORT_PATH}")


if __name__ == "__main__":
    main()
