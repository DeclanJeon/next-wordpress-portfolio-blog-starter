#!/usr/bin/env python3
"""Rewrite live blog posts from the storytelling QA design into local SQLite.

The script intentionally avoids function/commit identifiers in public copy and
keeps one narrative shape per post based on docs/live-posts-storytelling-*.md +
tmp/live-posts-storytelling-audit-*.json.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

ALLOW_LEGACY_ENV = "ALLOW_LEGACY_STORY_REWRITE"
ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "db/custom.db"
AUDIT = ROOT / "tmp/live-posts-storytelling-audit-2026-06-30.json"
REPORT = ROOT / "docs/storytelling-rewrite-apply-report-2026-06-30.md"
BACKUP = ROOT / f"db/custom.db.bak-storytelling-{datetime.now().strftime('%Y%m%d%H%M%S')}"

BANNED = ["합니다", "습니다", "주세요", "십시오", "안 됩니다", "커밋 번호", "함수명"]
AI_PATTERNS = ["한 줄 요약", "먼저 핵심만 보자", "바로 본론으로", "무슨 문제를 해결했나", "어떻게 나눴나", "어디를 조심해야 하나"]

TITLE_REPLACEMENTS = {
    "on-naming-things": "이름은 약속이라서 함부로 붙이면 안 된다",
    "small-tools-long-projects": "작은 도구가 긴 프로젝트를 버티게 했다",
    "writing-as-thinking": "글쓰기는 기록이 아니라 생각을 다시 짜는 일이었다",
    "bridges-between-disciplines": "서로 다른 분야를 건너다 보면 제품의 빈틈이 보인다",
    "a-week-of-slow-internet": "느린 인터넷 일주일이 실시간 제품을 다시 보게 했다",
    "2026-06-16-ponslink-12-reading-the-commit-log": "[PonsLink] 작업 기록을 따라가니 아직 진행형인 이유가 보였다",
    "2026-06-18-ponslink-algorithm-02-realtime-queue": "[PonsLink] 실시간 메시지는 모두 같은 줄에 서면 안 된다",
}

@dataclass
class PostPlan:
    slug: str
    title: str
    product: str
    total: float
    chars: int
    issues: list[str]
    design: dict


def clean_title(slug: str, title: str) -> str:
    title = TITLE_REPLACEMENTS.get(slug, title)
    title = title.replace("안 됩니다", "안 된다")
    title = title.replace("커밋 로그", "작업 기록")
    title = title.replace("커밋", "작업 기록")
    return title


def normalize_plain(text: str) -> str:
    replacements = {
        "합니다": "한다",
        "했습니다": "했다",
        "됩니다": "된다",
        "됩니다.": "된다.",
        "입니다": "이다",
        "였습니다": "였다",
        "아닙니다": "아니다",
        "없습니다": "없다",
        "있습니다": "있다",
        "했습니다": "했다",
        "되겠습니다": "되겠다",
        "안 됩니다": "안 된다",
    }
    for a, b in replacements.items():
        text = text.replace(a, b)
    return text


def strip_old_images(content: str) -> list[str]:
    return re.findall(r"!\[[^\]]*\]\(([^)]+)\)", content or "")




def prose_from_instruction(text: str, kind: str) -> str:
    text = (text or '').strip()
    replacements = {
        '글의 결론을 먼저 말하지 말고, 해당 기능을 만들게 된 실제 사용/개발 장면에서 시작한다.': '그 기능을 만들게 된 실제 사용 장면이 먼저 떠오른다.',
        '추상 주장을 바로 말하지 말고, 그 생각을 하게 된 하루의 장면이나 작업 중 막힌 순간에서 시작한다.': '어느 날 작업 중 막힌 순간이 있었다.',
        '메인 프로젝트와 억지로 연결하지 말고 사이드 노트로 닫는다.': '메인 프로젝트와 억지로 묶지 않아도 된다. 이 글은 사이드 노트로 남겨두는 편이 더 자연스럽다.',
        '다음 읽을 글이나 남은 질문을 한 문장으로 닫는다.': '다음에 남는 질문은 한 문장으로 충분하다.',
    }
    text = replacements.get(text, text)
    text = text.replace('라는 대비를 세운다', '는 문제가 남았다')
    text = text.replace('라는 갈등을 보여준다', '는 문제가 남았다')
    text = text.replace('라는 갈등을 세운다', '는 문제가 남았다')
    text = text.replace('갈등을 보여준다', '문제가 있었다')
    text = text.replace('갈등을 세운다', '문제가 있었다')
    text = text.replace('충돌시킨다', '부딪혔다')
    text = text.replace('설명한다', '드러났다')
    text = text.replace('보여준다', '드러났다')
    text = text.replace('안내한다', '이어졌다')
    text = text.replace('넘긴다', '넘어간다')
    text = text.replace('연결한다', '이어진다')
    if kind == 'opening':
        text = text.replace('장면에서 시작한다', '일이 있었다')
        text = text.replace('장면으로 시작한다', '장면이 있었다')
        text = text.replace('흐름으로 시작한다', '흐름이 있었다')
        text = text.replace('순간에서 시작한다', '순간이 있었다')
        text = text.replace('에서 시작한다', '에서 문제가 시작됐다')
        text = text.replace('으로 시작한다', '이 먼저 떠오른다')
    if kind == 'ending':
        text = text.replace('다음 글로 ', '다음 글에서는 ')
        text = text.replace('다음 글에서는 “', '다음 글에서는 “')
    return normalize_plain(text)

def product_context(product: str) -> dict[str, str]:
    if product == "PonsLink":
        return {
            "place": "PonsLink",
            "origin": "처음에는 회의방 하나면 충분할 줄 알았다. 링크를 만들고, 상대에게 보내고, 같은 화면 안에서 말하고 파일을 주고받으면 된다고 봤다.",
            "pressure": "그런데 방 안으로 사람이 들어오는 순간 제품이 떠안는 책임이 늘어났다. 누가 들어왔는지, 무엇을 하러 왔는지, 지금 들어와도 되는지, 방 밖에서 이미 놓친 맥락은 없는지 계속 문제가 생겼다.",
            "principle": "그래서 PonsLink의 기준은 기능을 더 붙이는 게 아니라 부담을 줄이는 쪽으로 기울었다. 개인정보를 덜 요구하고, 링크 하나로 시작하되, 내부에서는 상태와 권한과 요청 흐름을 더 꼼꼼히 잡는 방식이었다.",
            "measure": "정량적으로는 글마다 요청, 입장, 결제, 세션, 방 기능 같은 경계를 나눠 확인할 수 있게 만들었다. 정성적으로는 사용자가 설명하지 않아도 지금 무엇을 기다리는지 알게 만드는 쪽이 목표였다.",
        }
    if product == "PonsWarp":
        return {
            "place": "PonsWarp",
            "origin": "처음에는 PonsLink 안에 있는 파일 전송 기능이었다. 방 안에서 파일을 보내면 충분할 줄 알았는데, 파일 크기가 커질수록 회의방의 리듬까지 흔들렸다.",
            "pressure": "전송은 단순히 빨리 보내는 문제가 아니었다. 브라우저 메모리, 수신 속도, 저장 방식, ACK, 백프레셔가 한꺼번에 걸렸다. 특히 큰 파일에서는 마지막 몇 퍼센트에서 실패하는 순간이 제일 잔인했다.",
            "principle": "그래서 PonsWarp는 별도 제품처럼 분리됐다. 서버가 파일을 들고 있지 않는다는 원칙을 유지하면서도 브라우저가 버틸 수 있는 흐름 제어와 저장 전략을 먼저 세워야 했다.",
            "measure": "정량적으로는 전송 조각, 확인 응답, 저장 경로, 재시도 기준을 나눠 볼 수 있게 만들었다. 정성적으로는 사용자가 '거의 다 됐는데 왜 깨졌지'라는 불신을 덜 느끼게 하는 게 목표였다.",
        }
    if product == "P2P Foundations":
        return {
            "place": "P2P",
            "origin": "처음 관심은 파일 전송보다 더 컸다. 여러 기기가 힘을 나눠 쓰는 그리드 컴퓨팅을 만들고 싶었고, 그 첫 관문이 P2P였다.",
            "pressure": "하지만 P2P는 멋진 분산 그림이 아니라 연결 실패, NAT, 신호 교환, 신뢰 경계의 묶음이었다. 공부하지 않고 제품으로 밀어붙이면 바로 티가 나는 영역이었다.",
            "principle": "그래서 이 글은 제품 홍보가 아니라 학습의 출발점을 남긴다. 왜 WebRTC와 데이터 채널을 파야 했는지, 왜 PonsLink와 PonsWarp가 그 공부의 실험장이 됐는지를 이어준다.",
            "measure": "정량적 성과보다 중요한 건 질문이 분리됐다는 점이었다. 연결의 문제, 전송의 문제, 저장의 문제, 사용자 신뢰의 문제가 각자 다른 글로 갈라졌다.",
        }
    return {
        "place": "사이드 노트",
        "origin": "처음에는 사소한 생각처럼 보였다. 이름 하나, 작은 도구 하나, 느린 인터넷 하루가 프로젝트 전체의 방향을 바꾸리라고는 생각하지 못했다.",
        "pressure": "그런데 긴 프로젝트에서는 사소한 습관이 계속 돌아온다. 이름이 흐리면 판단도 흐려지고, 기록이 약하면 다음 선택의 이유도 금방 사라진다.",
        "principle": "그래서 이 글은 메인 프로젝트 밖에 둔다. 제품 설명이 아니라, PonsLink와 PonsWarp를 만들면서 같이 쌓인 작업 습관과 생각의 흔적에 가깝다.",
        "measure": "정량 지표보다 중요한 건 반복해서 남는 감각이었다. 어떤 표현은 오래 버티고, 어떤 표현은 다음 날 바로 버려졌다.",
    }


def keyword_detail(title: str, slug: str, product: str) -> tuple[str, str, str]:
    t = f"{title} {slug}".lower()
    if "ponscast" in t:
        return (
            "PonsCast는 기능표에서 나온 아이디어가 아니었다. 언어가 잘 통하지 않는 사람과 같은 파일을 같은 시간에 보고 싶다는 꽤 개인적인 욕심에서 시작됐다.",
            "화면 공유는 쉬운 답처럼 보였지만 내가 가진 파일을 상대의 언어와 시간에 맞춰 함께 본다는 문제는 달랐다. 같은 화면보다 같은 시간이 더 중요했다.",
            "그래서 PonsCast는 방 안에 붙은 미디어 기능이 아니라, 연결된 두 사람이 같은 리듬을 공유하게 만드는 실험으로 남았다.",
        )
    if "ack" in t or "backpressure" in t or "백프" in t:
        return (
            "처음에는 빨리 보내는 쪽이 이기는 줄 알았다. 그런데 속도를 올릴수록 받는 쪽 버퍼가 먼저 비명을 질렀다.",
            "ACK는 확인 표시가 아니라 브레이크였다. 보내는 쪽이 자기 속도만 믿고 달리면 전송은 빠르게 보이지만 실제로는 더 빨리 깨졌다.",
            "이때부터 PonsWarp의 기준은 최고 속도가 아니라 끝까지 살아남는 흐름이 됐다.",
        )
    if "opfs" in t or "indexeddb" in t:
        return (
            "큰 파일이 브라우저 메모리에 그대로 쌓이는 걸 보고 나서 저장소를 다시 봤다. 처음에는 IndexedDB를 떠올렸지만, 파일을 다루는 감각과는 조금 달랐다.",
            "OPFS는 만능 도구가 아니었다. 그래도 브라우저 안에서 파일을 파일답게 다룰 수 있는 몇 안 되는 길이었다.",
            "결국 저장 전략은 편의 기능이 아니라 전송이 끝까지 살아남기 위한 생존선이 됐다.",
        )
    if "2gb" in t or "memory" in t or "메모리" in t:
        return (
            "작은 파일에서는 아무 일도 없어 보였다. 문제는 파일이 커진 뒤에야 드러났다. 브라우저가 조각을 얌전히 흘려보내는 게 아니라 메모리 위에 쌓아두고 있었다.",
            "전송 성공과 저장 성공은 같은 말이 아니었다. 2GB 근처에서 깨지는 문제는 속도 문제가 아니라 제품이 파일을 어디에 들고 있느냐의 문제였다.",
            "그래서 이 글은 대용량 전송을 '더 빠르게'가 아니라 '덜 무너지게' 만드는 과정으로 다시 써야 한다.",
        )
    if "rust" in t or "wasm" in t or "zip64" in t or "zero" in t:
        return (
            "Rust와 WASM은 멋있어서 붙인 장식이 아니었다. 브라우저 안에서 큰 파일을 다루다 보니 복사와 메모리 경계가 계속 무서워졌다.",
            "네이티브의 규율을 빌리고 싶었지만, 웹 제품이라는 제약도 버릴 수 없었다. 그래서 기술 선택은 욕심과 생존선 사이의 타협이었다.",
            "이 선택은 아직도 실험의 흔적을 남긴다. 빠른 코드보다 중요한 건 사용자가 실패를 덜 만나게 하는 구조였다.",
        )
    if "webrtc" in t or "mesh" in t or "signal" in t or "datachannel" in t:
        return (
            "브라우저끼리 직접 붙이면 서버 부담이 줄고 구조도 단순해질 줄 알았다. 그런데 WebRTC는 연결의 문만 열어줬고, 질서는 제품이 직접 만들어야 했다.",
            "신호 교환, 입장 순서, 메시지 채널, 파일 채널이 조금만 어긋나도 사용자는 '연결됐다'가 아니라 '불안하다'고 느꼈다.",
            "그래서 이 글은 P2P 기술 설명이 아니라, 직접 연결 뒤에 남는 제품 책임을 보여주는 글이 돼야 한다.",
        )
    if "결제" in t or "권한" in t or "token" in t or "otp" in t or "polar" in t or "pricing" in t or "paid" in t or "pro" in t:
        return (
            "돈을 받는 순간 제품의 무게가 달라졌다. 버튼 하나를 붙이면 끝날 줄 알았지만, 실제로는 누가 어떤 권한으로 언제 들어올 수 있는지가 더 어려웠다.",
            "결제 성공, 권한 부여, 세션 입장은 서로 닮았지만 같은 사건이 아니었다. 이 경계를 섞으면 운영자는 편해져도 사용자는 쉽게 막힌다.",
            "그래서 결제 글은 수익화 이야기가 아니라 신뢰와 입장 권한을 분리한 기록으로 다시 잡아야 한다.",
        )
    if "request" in t or "요청" in t or "상담" in t or "desk" in t or "status" in t or "세션" in t:
        return (
            "회의는 방에 들어온 뒤 시작되는 줄 알았다. 하지만 실제로는 그보다 훨씬 앞에서 시작됐다. 누가, 왜, 언제 만나고 싶은지 모르면 좋은 방도 금방 비어 보였다.",
            "요청을 먼저 받는 일은 사람을 거르는 장치가 아니었다. 서로의 시간을 덜 낭비하게 만드는 완충지대였다.",
            "그래서 요청 흐름은 PonsLink가 회의 앱보다 연결 방식에 가까워진 이유를 보여준다.",
        )
    if "파일" in t or "download" in t or "browser" in t or "브라우저" in t or "전송" in t:
        return (
            "파일 전송은 처음엔 방 안의 작은 부가기능처럼 보였다. 그런데 파일이 커질수록 이 기능은 방 전체를 흔드는 별도 제품이 됐다.",
            "보내는 일, 받는 일, 저장하는 일은 같은 줄에 서 있지 않았다. 하나라도 밀리면 사용자는 전체 전송이 실패했다고 느꼈다.",
            "그래서 이 글은 기술 조각보다 전송이 깨진 장면을 앞에 두고 읽혀야 한다.",
        )
    if "room" in t or "방" in t or "입장" in t or "연결" in t or "회의" in t:
        return (
            "처음에는 방 하나를 잘 만들면 된다고 생각했다. 그런데 사람은 링크만 타고 들어오는 게 아니라 기대와 불안도 같이 들고 들어왔다.",
            "연결이 붙었다고 방이 된 것은 아니었다. 상태, 권한, 기능의 무게를 제품이 대신 기억해야 비로소 방처럼 느껴졌다.",
            "그래서 PonsLink의 방은 기능 묶음이 아니라 사용자의 부담을 줄이는 약속에 가까웠다.",
        )
    return (
        "처음에는 쉽게 정리할 수 있는 문제처럼 보였다. 그런데 직접 만들고 운영해보니 문장 하나로 접히지 않는 갈등이 남았다.",
        "겉으로 보이는 선택은 단순했지만, 안쪽에는 실패를 줄이려는 기준이 있었다. 그 기준을 보여주지 않으면 글은 금방 보고서처럼 마른다.",
        "그래서 이 글은 결론보다 그 결론까지 밀려간 과정을 먼저 보여주는 쪽으로 다시 잡는다.",
    )


def next_link(slug: str, product: str, ordered: list[dict]) -> str:
    group = [r for r in ordered if r["product"] == product]
    for i, r in enumerate(group):
        if r["slug"] == slug and i + 1 < len(group):
            n = group[i + 1]
            return f"\n\n## 다음에 읽을 글\n\n이 질문은 여기서 끝나지 않는다. 다음 글에서는 [{clean_title(n['slug'], n['title'])}](/writing/{n['slug']})로 이어진다. 같은 문제에서 갈라진 다음 선택을 따라가면 된다.\n"
    return "\n\n## 여기서 남는 질문\n\n이 글은 하나의 결론보다 다음 판단을 남긴다. 지금까지의 선택이 왜 필요했는지, 그리고 어디서 다시 흔들릴 수 있는지를 계속 확인해야 한다.\n"


def make_excerpt(content: str) -> str:
    plain = re.sub(r"[#>*_`\[\]()!-]", "", content)
    plain = re.sub(r"\s+", " ", plain).strip()
    return plain[:155]


def make_content(row: sqlite3.Row, plan: PostPlan, ordered: list[dict]) -> str:
    title = clean_title(plan.slug, plan.title)
    product = plan.product
    spec = plan.design["specific"]
    ctx = product_context(product)
    d1, d2, d3 = keyword_detail(title, plan.slug, product)
    headings = spec.get("headings") or ["처음엔 쉽게 보였던 문제", "직접 만들자 달라진 기준", "지금 돌아보면 남는 판단"]
    while len(headings) < 3:
        headings.append("지금 돌아보면 남는 판단")

    opening = prose_from_instruction(spec["opening"], 'opening')
    conflict = prose_from_instruction(spec["conflict"], 'conflict')
    ending = prose_from_instruction(spec["ending"], 'ending')

    display_title = title.replace('[PonsLink] ', '').replace('[PonsWarp] ', '').replace('[P2P] ', '')
    body = f"# {display_title}\n\n"
    body += f"{opening} 그때는 이 문제가 이렇게 오래 따라올 줄 몰랐다. {display_title}라는 제목은 기능 이름보다, 내가 그때 붙잡고 있던 질문에 더 가깝다.\n\n"
    body += f"{ctx['origin']} {d1}\n\n"
    body += f"## {headings[0]}\n\n"
    body += f"처음에는 답이 단순해 보였다. 만들고, 연결하고, 버튼을 하나 더 두면 될 것 같았다. 하지만 실제 사용 흐름 안으로 넣어보면 이야기가 달라졌다. {conflict}\n\n"
    body += f"{ctx['pressure']} {d2}\n\n"
    body += f"여기서 내가 놓치기 쉬웠던 건 작은 실패가 사용자에게는 전체 경험으로 보인다는 점이었다. 내부에서는 한 단계가 삐끗한 것처럼 보여도, 바깥에서는 기다림과 불신으로 남는다. 그래서 단순한 구현보다 실패했을 때의 흐름을 먼저 잡아야 했다.\n\n"
    body += f"## {headings[1]}\n\n"
    body += f"그래서 기준을 바꿨다. 빠르게 끝나는 구조보다, 실패했을 때 어디서 멈췄는지 설명할 수 있는 구조가 더 필요했다. {ctx['principle']}\n\n"
    body += f"{d3}\n\n"
    body += "이 선택은 화려하지 않았다. 오히려 화면 뒤쪽에 작은 조건과 상태가 늘어나는 쪽에 가까웠다. 그래도 그 복잡함을 제품 안쪽으로 숨겨야 사용자는 덜 불안해진다. 내가 만들고 싶었던 건 기술 시연이 아니라, 상대에게 링크를 보냈을 때 덜 민망한 경험이었다.\n\n"
    body += f"## {headings[2]}\n\n"
    body += f"지금 돌아보면 이 글의 핵심은 한 문장으로 줄어든다. {ctx['measure']} 숫자만으로는 전부 설명할 수 없지만, 나뉜 경계가 많아질수록 어디가 흔들렸는지는 더 잘 보였다.\n\n"
    body += f"그래서 이 글은 기술 이름보다 순서를 먼저 따라가야 한다. 어떤 불편이 있었고, 그 불편이 어떤 실패로 커졌고, 그 실패를 줄이기 위해 어떤 경계를 만들었는지 보면 된다. {ending}\n"
    body += next_link(plan.slug, product, ordered)
    return normalize_plain(body).strip() + "\n"


def reading_time(content: str) -> int:
    # Korean technical writing on this blog usually lands near 700-850 chars/min.
    return max(2, min(12, round(len(content) / 780)))


def main() -> None:
    import shutil
    if os.environ.get(ALLOW_LEGACY_ENV) != "1":
        raise SystemExit(
            "rewrite_storytelling_posts.py is quarantined because it generated duplicated titles, "
            "boilerplate phrases, and repeated heading templates. Use the batch expansion workflow "
            f"and quality gate instead, or set {ALLOW_LEGACY_ENV}=1 for historical reproduction only."
        )
    if not DB.exists():
        raise SystemExit(f"DB not found: {DB}")
    shutil.copy2(DB, BACKUP)
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    plans = [PostPlan(slug=i["slug"], title=i["title"], product=i["product"], total=i["total"], chars=i["chars"], issues=i["issues"], design=i["design"]) for i in audit]
    # Keep the existing product/published chronology for next-link selection.
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    ordered_rows = [dict(r) for r in con.execute("select slug,title,publishedAt from Post where status='published' order by publishedAt asc, createdAt asc").fetchall()]
    product_by_slug = {p.slug: p.product for p in plans}
    for r in ordered_rows:
        r["product"] = product_by_slug.get(r["slug"], "Other")
    changed = []
    skipped = []
    now = datetime.now().isoformat(timespec="seconds")
    for plan in plans:
        row = con.execute("select * from Post where slug=?", (plan.slug,)).fetchone()
        if not row:
            skipped.append(plan.slug)
            continue
        new_title = clean_title(plan.slug, plan.title)
        content = make_content(row, plan, ordered_rows)
        excerpt = make_excerpt(content)
        rt = reading_time(content)
        con.execute(
            "update Post set title=?, excerpt=?, content=?, readingTime=?, updatedAt=? where slug=?",
            (new_title, excerpt, content, rt, now, plan.slug),
        )
        changed.append((plan.slug, new_title, plan.product, plan.total, len(content), rt))
    con.commit()

    # QA on changed rows.
    qa_rows = []
    bad = []
    for slug, title, product, old_score, chars, rt in changed:
        row = con.execute("select title,content,featuredImage from Post where slug=?", (slug,)).fetchone()
        content = row["content"]
        found_banned = [b for b in BANNED + AI_PATTERNS if b in content or b in row["title"]]
        img_paths = strip_old_images(content)
        duplicate_inline = len(img_paths) != len(set(img_paths))
        if found_banned or duplicate_inline or not content.startswith("# "):
            bad.append((slug, found_banned, duplicate_inline))
        qa_rows.append((slug, title, product, old_score, chars, rt, len(img_paths), found_banned, duplicate_inline))
    con.close()

    lines = []
    lines.append("# 스토리텔링 리라이트 DB 반영 보고서")
    lines.append("")
    lines.append(f"- 작성일: 2026-06-30")
    lines.append(f"- 로컬 DB: `{DB.relative_to(ROOT)}`")
    lines.append(f"- 백업: `{BACKUP.relative_to(ROOT)}`")
    lines.append(f"- 설계 기준: `docs/live-posts-storytelling-rewrite-design-2026-06-30.md`")
    lines.append(f"- 변경 글 수: {len(changed)}")
    lines.append(f"- 누락 글 수: {len(skipped)}")
    lines.append("")
    lines.append("## QA 요약")
    lines.append("")
    lines.append(f"- 금지 표현/중복 이미지/마크다운 구조 문제: {len(bad)}건")
    lines.append("- 모든 변경 글은 `# 제목`, 사건형 도입, 중심 갈등, 선택 이유, 다음 글 안내 구조를 갖는다.")
    lines.append("- 본문 안에 새 이미지를 억지로 추가하지 않았다. 대표 이미지는 기존 DB 값을 유지했다.")
    lines.append("")
    if bad:
        lines.append("## 확인 필요")
        for slug, found, dup in bad[:50]:
            lines.append(f"- `{slug}`: banned={found}, duplicateInline={dup}")
        lines.append("")
    lines.append("## 변경 목록")
    lines.append("")
    lines.append("| slug | 그룹 | 이전 QA | 글자 수 | Read | 본문 이미지 |")
    lines.append("|---|---|---:|---:|---:|---:|")
    for slug, title, product, old_score, chars, rt, imgs, found, dup in qa_rows:
        lines.append(f"| `{slug}` | {product} | {old_score} | {chars} | {rt} | {imgs} |")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"changed={len(changed)} skipped={len(skipped)} bad={len(bad)}")
    print(f"backup={BACKUP}")
    print(f"report={REPORT}")
    if bad:
        raise SystemExit(2)

if __name__ == "__main__":
    main()
