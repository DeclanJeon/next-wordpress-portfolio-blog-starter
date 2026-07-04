#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "db" / "custom.db"

HEADING_REPLACEMENTS = {
    "2026-06-16-ponslink-01-why-i-came-back-to-connection": {
        "## 1. 그때 풀려고 한 문제": "## 1. 다시 잡아야 했던 연결",
        "## 2. 처음 선택한 구조": "## 2. 방 중심 설계가 놓친 맥락",
        "## 3. 구현하면서 깨진 지점": "## 3. 연결 실패를 사용자 탓으로 보지 않기",
        "## 4. 다시 설계한 방식": "## 4. 요청이 방을 여는 구조",
        "## 5. 지금 보면 남은 판단": "## 5. 남은 판단: 맥락을 보관하는 제품",
    },
    "2026-06-16-ponslink-02-webrtc-first-hell": {
        "## 1. 그때 풀려고 한 문제": "## 1. 영상 통화가 아니라 방 runtime이었다",
        "## 2. 처음 선택한 구조": "## 2. 처음 고른 browser mesh 구조",
        "## 3. 구현하면서 깨진 지점": "## 3. WebRTC가 대신 해주지 않은 일",
        "## 4. 다시 설계한 방식": "## 4. control plane과 media plane을 나누기",
        "## 5. 지금 보면 남은 판단": "## 5. 남은 판단: 연결보다 복구 설명",
    },
    "2026-06-16-ponslink-02b-signal-behind-link": {
        "## 1. 그때 풀려고 한 문제": "## 1. 링크 뒤에 숨어 있던 신호들",
        "## 2. 처음 선택한 구조": "## 2. 직선처럼 보였던 signaling 흐름",
        "## 3. 구현하면서 깨진 지점": "## 3. 순서와 재시도가 먼저 깨진 곳",
        "## 4. 다시 설계한 방식": "## 4. signaling을 상태 머신으로 다시 보기",
        "## 5. 지금 보면 남은 판단": "## 5. 남은 판단: 기술 이벤트를 사용자 말로 바꾸기",
    },
}

TAIL_SECTIONS = {
    "2026-06-16-ponslink-01-why-i-came-back-to-connection": """## 놓친 연결을 기록으로 남기는 이유

이 글을 다시 고치면서 가장 먼저 덜어낸 것은 같은 문장을 여러 번 붙여 분량을 채우던 습관이었다. 놓친 연결 이야기는 반복 문장보다 구체적인 상태가 필요했다. 요청이 들어왔는지, host가 확인했는지, 방이 열렸는지, 세션 기록이 남았는지를 나눠 적어야 사용자가 어디에서 다시 시작할 수 있는지 보인다.

놓친 연결은 대개 한 가지 원인으로 남지 않는다. 상대가 늦게 들어온 것인지, 권한 허용이 막힌 것인지, 예약 시간이 어긋난 것인지, host가 아직 승인하지 않은 것인지가 서로 섞인다. 그래서 제품은 “다시 시도하세요”만 말하면 안 된다. 사용자가 이미 남긴 요청과 다음에 이어갈 수 있는 행동을 같이 보여줘야 한다.

## 방보다 요청 맥락이 먼저였던 순간

PonsLink의 방은 화면에서 가장 크게 보이지만, 실제 제품 판단은 방 밖에서 먼저 일어난다. 사용자가 왜 들어오려 했는지, 어떤 권한을 받아야 하는지, 결제나 예약이 붙어 있는지 같은 맥락이 방을 열 권한을 만든다. 그래서 room UI를 예쁘게 다듬는 것보다 request context를 안정적으로 남기는 일이 더 중요했다.

이 기준을 늦게 잡았기 때문에 초반 화면은 방을 너무 빨리 보여줬다. 링크를 누르면 바로 통화 화면으로 가는 흐름은 시원하지만, 실패했을 때 돌아갈 곳이 약하다. 요청 목록, 승인 상태, 세션 기록, follow-up note가 있어야 연결이 끊겨도 사용자가 다시 같은 대화로 돌아올 수 있다.

## 나중에 다시 고칠 운영 메모

다시 만든다면 연결 실패 로그를 사용자 행동과 같이 저장하겠다. 단순히 `failed` 하나만 남기는 대신 권한 거절, signaling 지연, 상대 미입장, 세션 만료를 구분하고, 각 경우에 사용자가 눌러야 할 다음 행동을 같이 적는다. 놓친 연결을 회복하려면 기술 로그와 사용자의 다음 문장이 같은 방향을 봐야 한다.

운영 화면에서도 같은 기준을 쓰고 싶다. 실패 횟수만 세는 대시보드는 원인을 고치기 어렵다. 어느 단계에서 사용자가 멈췄는지, host가 무엇을 확인해야 하는지, 다음 초대 링크를 다시 보내야 하는지까지 보여줘야 한다. 연결 제품의 품질은 성공한 방보다 실패 후 복귀율에서 더 잘 드러난다.

그래서 이 글의 결론은 “방을 잘 만들자”에서 멈추지 않는다. 방이 열리기 전의 요청, 열리는 동안의 연결, 끝난 뒤의 기록이 서로 이어져야 한다. 이 세 조각이 끊기면 링크는 살아 있어도 사용자는 같은 맥락으로 돌아오지 못한다.""",
    "2026-06-16-ponslink-02-webrtc-first-hell": """## 연결 성공보다 상태 설명이 먼저였다

WebRTC를 붙였다는 사실보다 어려웠던 것은 연결이 아직 진행 중일 때 무엇을 보여줄지였다. 카메라 권한을 기다리는 상태와 상대의 answer를 기다리는 상태와 TURN fallback을 타는 상태는 내부적으로 다르다. 그런데 사용자는 모두 ‘왜 아직 안 되지?’로 받아들인다. 그래서 상태 이름은 개발 편의가 아니라 사용자 불안을 줄이는 문장이어야 했다.

이 지점을 늦게 깨달으면 UI는 연결 성공 뒤에만 친절하고, 실패 직전에는 갑자기 조용해진다. 작은 제품일수록 이 침묵이 더 크게 느껴진다. 사용자는 콘솔 로그를 보지 않고, 방 안에서 보이는 문구만 믿는다. 그래서 `connecting` 하나로 뭉개지 말고 권한, signaling, peer 연결, media 수신을 나눠 보여줘야 했다.

## media와 data channel을 분리해 본 이유

초기에는 방 안의 모든 실시간 기능을 하나의 성공 경험으로 묶고 싶었다. 하지만 영상 stream, 채팅 메시지, 파일 업로드, 화이트보드는 실패 조건이 서로 달랐다. 영상은 살아 있는데 파일만 막힐 수 있고, signaling은 살아 있는데 data channel은 닫힐 수 있다. 이 차이를 인정해야 제품이 한꺼번에 무너지는 느낌을 줄일 수 있었다.

특히 파일 전송은 영상 통화와 같은 리듬으로 다루면 안 됐다. media는 조금 낮은 화질로 버틸 수 있지만 파일은 조각이 빠지면 복구해야 한다. 채팅은 순서가 중요하고, presence는 빠른 갱신이 중요하다. 같은 WebRTC라는 이름 안에 있어도 데이터의 가치와 실패 처리 방식은 달랐다.

## 다음 WebRTC 구현 전에 남긴 체크

다시 구현한다면 데모 happy path보다 실패 표를 먼저 만들겠다. offer/answer 교환, ICE candidate queue, device permission, TURN relay, reconnect, room authority를 각각 한 줄씩 놓고, 사용자가 보는 문구와 운영자가 보는 로그를 같이 적는다. WebRTC 제품은 연결이 되는 순간보다 연결이 흔들릴 때 더 솔직해야 한다.

그 표가 있으면 기능 욕심도 조금 줄어든다. 새 패널을 붙이기 전에 그 패널이 어떤 연결 상태에서 열릴 수 있는지, 실패하면 무엇을 잃는지, 다시 들어오면 어디서 복구할지를 먼저 묻게 된다. PonsLink에서 얻은 교훈은 WebRTC가 어렵다는 말보다, 실시간 기능은 상태 설명 없이는 제품이 될 수 없다는 쪽에 더 가깝다.""",
    "2026-06-16-ponslink-02b-signal-behind-link": """## candidate queue가 제품 문구로 바뀌는 순간

ICE candidate queue는 처음에는 아주 내부적인 구현 세부사항처럼 보였다. 하지만 remote description이 준비되기 전에 candidate가 도착하면 사용자는 결국 ‘상대가 안 보인다’는 문제로 경험한다. 그래서 queue는 개발자만 보는 배열이 아니라, 연결 준비 중인지 복구 중인지 설명하는 제품 문구의 근거가 된다.

이 queue를 느슨하게 다루면 실패가 늦게 드러난다. candidate를 버렸는지, 너무 오래된 candidate를 적용했는지, peer가 이미 바뀌었는지를 모른 채 “연결 실패”만 남는다. 반대로 queue의 수명과 소유자를 명확히 두면 사용자에게도 더 정확하게 말할 수 있다. “상대 연결 정보를 다시 맞추는 중”이라는 문장은 이런 내부 구분이 있어야 나온다.

## 링크 하나를 지키는 내부 식별자

사용자는 같은 링크를 다시 눌렀다고 생각하지만 제품 안에서는 이전 peer와 새 peer를 구분해야 한다. roomId만으로 부족하고 peer identity, session token, generation 같은 값이 필요하다. 이 식별자가 느슨하면 오래된 이벤트가 새 연결에 섞인다. 링크가 단순해 보일수록 내부 식별자는 더 엄격해야 했다.

PonsLink에서 이 문제는 새로고침 때 자주 보였다. 화면은 같은 방처럼 보이지만 내부 연결은 새로 시작된다. 이전 offer가 늦게 도착하거나 예전 ICE candidate가 다시 적용되면 사용자는 아무것도 하지 않았는데 방이 이상해진다. 그래서 링크의 단순함은 URL을 짧게 만드는 일이 아니라, 뒤쪽 식별자를 충분히 촘촘하게 잡는 일에 가깝다.

## 다시 만들면 먼저 그릴 signaling 표

다음에는 코드보다 표를 먼저 만들겠다. `joining`, `negotiating`, `connected`, `recovering`, `closed`를 왼쪽에 쓰고, 각 행에 받을 수 있는 message, 허용할 transition, 사용자 문구, 운영 로그를 같이 넣는다. signaling은 메시지를 전달하는 통로가 아니라 시간 순서를 다루는 제품 계약이기 때문이다.

이 표를 먼저 만들면 예외 처리가 부끄럽지 않다. glare, reconnect, tab sleep, duplicate message, stale peer 같은 경우를 문서의 끝에 숨기지 않고 처음부터 제품 상태로 인정하게 된다. 사용자는 여전히 링크 하나만 보지만, 제품은 그 링크 뒤에서 어떤 신호를 버리고 어떤 신호를 기다릴지 더 분명하게 판단할 수 있다.""",
}


def plain_text(markdown: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"!\[[^\]]*\]\([^)]*\)|\[([^\]]+)\]\([^)]*\)|[#>*_`~|\-]+", " ", markdown)).strip()


def reading_time(content: str) -> int:
    return max(2, round(len(plain_text(content)) / 760))


def replace_tail_sections(content: str, replacement: str) -> str:
    marker = "\n## 덧붙이면\n"
    index = content.find(marker)
    if index == -1:
        return content.rstrip() + "\n\n" + replacement.strip() + "\n"
    return content[:index].rstrip() + "\n\n" + replacement.strip() + "\n"


def patch_content(slug: str, content: str) -> str:
    patched = content
    for before, after in HEADING_REPLACEMENTS[slug].items():
        patched = patched.replace(before, after, 1)
    patched = replace_tail_sections(patched, TAIL_SECTIONS[slug])
    return patched


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=str(DB_PATH))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    try:
        updated: list[dict[str, object]] = []
        for slug in HEADING_REPLACEMENTS:
            row = conn.execute("SELECT id, slug, content FROM Post WHERE slug = ?", (slug,)).fetchone()
            if row is None:
                raise SystemExit(f"missing post: {slug}")
            patched = patch_content(slug, row["content"])
            headings = re.findall(r"^##\s+(.+)$", patched, re.MULTILINE)
            if headings.count("덧붙이면") > 0:
                raise SystemExit(f"leftover duplicate filler heading in {slug}")
            chars = len(plain_text(patched))
            if chars < 4500:
                raise SystemExit(f"patched post too short: {slug} ({chars})")
            updated.append({"slug": slug, "chars": chars, "readingTime": reading_time(patched), "h2": headings})
            if not args.dry_run:
                conn.execute(
                    "UPDATE Post SET content = ?, readingTime = ?, updatedAt = ? WHERE id = ?",
                    (patched, reading_time(patched), dt.datetime.now(dt.UTC).isoformat(timespec="seconds").replace("+00:00", "Z"), row["id"]),
                )
        if not args.dry_run:
            conn.commit()
        print({"dryRun": args.dry_run, "updated": updated})
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
