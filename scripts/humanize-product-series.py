#!/usr/bin/env python3
"""Rewrite PonsLink product/main-ponslink posts into short human prose.

Preserves existing body image paths. No length floor. No template padding.
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
from pathlib import Path


def kchars(s: str) -> int:
    return sum(1 for c in (s or "") if "\uac00" <= c <= "\ud7a3")


def bare_title(title: str) -> str:
    return re.sub(r"^\[[^\]]+\]\s*", "", title or "").strip()


def img_block(path: str, bare: str, kind: str) -> str:
    label = {"problem": "문제 장면", "fail": "실패 신호", "boundary": "경계 변경"}.get(kind, "장면")
    return f"![{bare} — {label}]({path})"


def assemble(bare: str, imgs: list[str], sections: list[tuple[str, str]]) -> str:
    """sections: list of (h2 or '', body paragraphs joined by blank lines)."""
    parts: list[str] = []
    # opening is first section with empty h2
    for i, (h2, body) in enumerate(sections):
        if h2:
            parts.append(f"## {h2}")
        parts.append(body.strip())
        # place images after first three content blocks when available
        if i == 0 and len(imgs) >= 1:
            parts.append(img_block(imgs[0], bare, "problem"))
        elif i == 1 and len(imgs) >= 2:
            parts.append(img_block(imgs[1], bare, "fail"))
        elif i == 2 and len(imgs) >= 3:
            parts.append(img_block(imgs[2], bare, "boundary"))
    text = "\n\n".join(parts).strip() + "\n"
    # append unused images at end
    for p in imgs:
        if p not in text:
            text += f"\n{img_block(p, bare, 'boundary')}\n"
    return text


# Unique judgment beats per slug: (sections...)
# Each body uses short paragraphs, concrete scene, one claim once.
BEATS: dict[str, list[tuple[str, str]]] = {
    "2026-06-28-ponslink-product-02-public-desk-gate": [
        (
            "",
            """Public Desk를 처음 붙일 때는 문의 폼이라고 불렀다.
이름부터 틀렸다.

폼은 수집이다.
Desk는 운영 게이트다.
누가 들어와도 되는 입구가 아니라, 요청이 제품 안으로 들어오는 첫 검문소다.""",
        ),
        (
            "폼으로 두면 생기는 일",
            """폼이면 제출이 끝이다.
운영자는 메일함에서 다시 읽고, 캘린더를 열고, 링크를 따로 보낸다.

그 순간 맥락이 제품 밖으로 샌다.
방문자는 "보냈으니 됐겠지" 하고 기다리고,
안에서는 아직 분류도 안 된 상태다.""",
        ),
        (
            "게이트로 다시 정의",
            """Desk의 일은 세 가지로 줄였다.

- 용건을 구조화해 받기
- 수락·보류·거절을 같은 화면에서 결정하기
- 결정 이후에만 다음 단계(일정/방)를 열기

문의 수집과 운영 결정을 한 면에 두면,
"접수됨"과 "진행 중"이 같은 말로 뭉개지지 않는다.""",
        ),
        (
            "남긴 기준",
            """Public이 열려 있다고 해서 방이 열려 있는 것은 아니다.
열려 있는 것은 요청 창구다.

창구 문장과 내부 상태 이름을 같게 맞춰 두니
운영 대화가 짧아졌다.""",
        ),
    ],
    "2026-06-28-ponslink-product-03-public-request-link-setup": [
        (
            "",
            """공개 요청 링크를 어디에 붙일지 한참 고민했다.
프로필 바이오, 카톡 자동응답, 이메일 서명.

나중에 보니 위치보다 앞 문장이 더 중요했다.""",
        ),
        (
            "링크만 던지면 생기는 요청",
            """링크만 덩그러니 있으면 사람들은 자기 방식으로 쓴다.
긴 하소연, 한 줄 영업, 의미 불명 테스트 제출.

운영자는 읽느라 시간을 쓰고,
정작 만날 사람은 뒤섞여 있다.""",
        ),
        (
            "앞에 두는 한두 문장",
            """링크 앞에 기대 행동을 적었다.

무엇을 남기면 좋은지,
언제 답을 주는지,
어떤 요청은 받지 않는지.

거절을 미리 쓰는 일이 불편했지만,
그 문장이 필터 역할의 절반을 했다.""",
        ),
        (
            "설치보다 문장",
            """기술 설치는 한 번이면 끝난다.
문장은 매주 다듬는다.

공개 링크의 품질은 URL이 아니라
그 앞 문장의 정직함으로 결정됐다.""",
        ),
    ],
    "2026-06-28-ponslink-product-04-approve-hold-decline": [
        (
            "",
            """요청 화면의 버튼 세 개가 상담 품질을 갈랐다.
수락, 보류, 거절.

처음에는 편의를 위한 상태값처럼 보였다.
실제로는 문장 몇 줄로 사람을 나누는 운영 도구였다.""",
        ),
        (
            "애매함이 가장 비싸다",
            """전부 수락하면 일정이 터진다.
전부 거절하면 문이 닫힌다.

문제는 중간이다.
정보가 부족한 요청을 수락해 버리면
방 안에서 다시 질문부터 시작한다.""",
        ),
        (
            "보류를 정식 상태로",
            """보류를 "나중에"가 아니라 제품 상태로 올렸다.

무엇을 더 알아야 하는지,
상대에게 어떤 한 줄을 돌려줄지
보류 사유를 남기게 했다.

거절도 차갑지 않게, 분명하게.
모호한 침묵이 가장 불친절했다.""",
        ),
        (
            "문장이 곧 정책",
            """좋은 요청 / 보류할 요청 / 거절할 요청은
긴 가이드보다 예시 문장 몇 줄에서 갈렸다.

그 문장을 화면에 가깝게 둘수록
결정 속도가 올라갔다.""",
        ),
    ],
    "2026-06-28-ponslink-product-05-request-status": [
        (
            "",
            """요청을 보내고 나면 방문자는 조용한 화면에 남는다.
접수됐는지, 읽었는지, 거절인지 모른다.

Request Status는 그 침묵을 줄이려고 만든 화면이다.""",
        ),
        (
            "침묵이 만드는 불신",
            """내부에서는 한 단계만 밀린 것일 수 있다.
바깥에서는 무시당한 느낌이 된다.

같은 지연인데 해석이 다르다.
해석이 갈리면 다음 행동이 사라진다.""",
        ),
        (
            "상태를 밖으로",
            """제출됨, 검토 중, 보류, 수락, 거절.
이름을 화면에 그대로 노출했다.

완벽한 추정이 아니라
지금 어디인지 보여주는 것이 먼저였다.""",
        ),
        (
            "효과",
            """문의 DM이 줄었다.
"확인됐나요?" 대신 상태 링크를 보게 됐다.

상태 화면은 기능 자랑이 아니라
대기 구간의 설명서다.""",
        ),
    ],
    "2026-06-28-ponslink-product-06-session-access": [
        (
            "",
            """요청을 수락했다고 바로 방에 들여보내면 편하다.
한동안 그렇게 했다.

그러다 승인과 입장을 같은 순간으로 두지 않기로 했다.""",
        ),
        (
            "같은 순간으로 두면",
            """승인은 "이 사람과 일해볼 만하다"는 결정이다.
입장은 "지금 이 세션에 들어와도 된다"는 결정이다.

둘을 묶으면 일정 전 링크 유출, 재입장 혼선,
결제 전 입장 같은 예외를 설명하기 어려워진다.""",
        ),
        (
            "분리",
            """승인 후에도 입장 토큰은 따로 발급한다.
시간창, 세션 상태, 결제 조건을 통과해야 문이 열린다.

사용자는 단계가 늘어 보이지만,
막혔을 때 이유가 분리되어 보인다.""",
        ),
        (
            "기준",
            """신뢰 결정과 접속 결정을 한 버튼에 담지 않는다.
닮아 보여도 같은 사건이 아니다.""",
        ),
    ],
    "2026-06-28-ponslink-product-07-meeting-records": [
        (
            "",
            """Meeting Records를 회의록 기능으로 만들기 쉬웠다.
녹취, 요약, 공유.

내가 필요했던 건 그전에 있었다.
요청 맥락이 회의 뒤로 이어지는 자리.""",
        ),
        (
            "회의록만 있으면",
            """방에 들어가기 전 용건이 비면
회의록은 빈 대화를 예쁘게 정리할 뿐이다.

요청에 적힌 목표, 제약, 기대가
기록의 뼈대가 되어야 한다.""",
        ),
        (
            "연장으로 설계",
            """기록 화면 상단에 요청 요약을 고정했다.
회의 중 메모는 그 아래에 쌓인다.

끝난 뒤에도 "왜 만났는지"가 먼저 보인다.
요약 문장보다 원인 문장이 오래 남는다.""",
        ),
        (
            "한 줄",
            """Meeting Records는 회의 산출물이 아니라
요청의 연장 메모장이다.""",
        ),
    ],
    "2026-06-28-ponslink-product-08-paid-consultation-quality": [
        (
            "",
            """유료 상담을 붙이면 결제 연동부터 보고 싶어진다.
체크아웃, 영수증, 웹훅.

현장에서는 결제가 되어도
요청 질이 낮으면 상담이 망가졌다.""",
        ),
        (
            "결제가 가리는 것",
            """돈은 들어왔는데 준비가 안 된 만남.
운영자는 미안하고, 상대는 돈이 아까워진다.

유료일수록 첫 질문이 더 중요해진다.""",
        ),
        (
            "질을 앞에",
            """결제 버튼 앞에 요청 완결 조건을 두었다.
목표, 현재 상태, 원하는 결과.

미완 요청은 결제까지 가지 못하게 하거나
보류로 돌린다.""",
        ),
        (
            "기준",
            """유료 상담의 첫 게이트는 결제가 아니라 요청의 질이다.
돈은 그 다음이다.""",
        ),
    ],
    "2026-06-28-ponslink-product-09-mentoring-coaching-template": [
        (
            "",
            """멘토링 요청과 코칭 요청을 같은 폼에 넣었다가 후회했다.
둘 다 대화인데, 필요한 재료가 달랐다.""",
        ),
        (
            "같은 질문의 한계",
            """멘토링은 경험 공유와 방향 제안이 중심이다.
코칭은 상대의 목표·장애물·다음 행동이 중심이다.

같은 "고민을 적어 주세요"는
둘 중 어디에도 충분히 닿지 않았다.""",
        ),
        (
            "폼을 나눔",
            """템플릿을 둘로 나눴다.
멘토링: 맥락, 이미 시도한 것, 기대하는 조언 범위.
코칭: 목표, 성공 기준, 지금 막힌 한 지점.

질문이 달라지니 수락 판단이 빨라졌다.""",
        ),
        (
            "결과",
            """폼 분리는 디자인 취향이 아니다.
대화 종류를 제품이 미리 인정하는 일이다.""",
        ),
    ],
    "2026-06-28-ponslink-product-10-calendly-sequence": [
        (
            "",
            """Calendly와 비교 질문을 자주 받았다.
일정 잡는 도구 아니냐는 뜻이다.

나는 경쟁으로 보지 않았다.
순서가 다르다.""",
        ),
        (
            "일정 먼저의 함정",
            """일정만 먼저 열면 빈 슬롯이 채워진다.
용건은 나중이다.

상담 제품에서는 그 순서가 뒤집혀야 했다.""",
        ),
        (
            "PonsLink 순서",
            """요청 → 선별 → 승인 → 일정/입장.
Calendly 구간은 승인 뒤에 온다.

일정 도구를 없애는 게 아니라
앞에 두던 습관을 끊는 것이다.""",
        ),
        (
            "한 줄",
            """Calendly는 시간을 모은다.
PonsLink는 만나도 되는 요청을 먼저 모은다.""",
        ),
    ],
    "2026-06-28-ponslink-product-11-google-form-flow": [
        (
            "",
            """Google Form은 수집에 강하다.
배포도 쉽고, 응답도 쌓인다.

부족했던 건 그다음 흐름이었다.""",
        ),
        (
            "수집 후 단절",
            """응답은 스프레드시트에 남고,
일정은 다른 탭에 있고,
방은 또 다른 링크다.

사람이 풀을 붙인다.
사람이 바쁘면 풀이 끊긴다.""",
        ),
        (
            "역할 분담",
            """Form은 필요할 때 앞단 수집으로 남길 수 있다.
다만 승인·상태·입장 같은 흐름은 PonsLink가 잇는다.

데이터를 모으는 도구와
관계를 진행하는 도구를 같게 만들지 않는다.""",
        ),
        (
            "기준",
            """수집과 진행을 한 도구에 억지로 욱여넣지 않는다.
이음새가 제품이다.""",
        ),
    ],
    "2026-06-28-ponslink-product-12-pricing-free-pro": [
        (
            "",
            """Free 10건과 Pro를 나눌 때
숫자보다 먼저 정한 것이 있다.

무료에서 무엇을 끝까지 경험하게 할 것인가.""",
        ),
        (
            "기능 잠금의 유혹",
            """핵심을 잠그면 전환은 늘지 몰라도
제품 이해가 안 생긴다.

반대로 전부 열어 두면
운영 부담만 커진다.""",
        ),
        (
            "나눈 방식",
            """Free는 요청-선별-방의 한 사이클을 끝까지 돌리게 했다.
건수 한도로 속도를 조절한다.

Pro는 한도와 운영 편의, 기록 유지 쪽을 연다.
기능을 호사품처럼 잠그지 않는다.""",
        ),
        (
            "이유",
            """가격 표는 매출 장치가 아니라
어떤 약속을 기본으로 지킬지 정하는 표다.""",
        ),
    ],
    "2026-06-28-ponslink-product-13-limit-without-dropping-requests": [
        (
            "",
            """한도에 닿으면 요청을 막아 버리기 쉽다.
구현도 단순하다.

나는 한도를 넘겨도 방문자 요청은 버리지 않기로 했다.""",
        ),
        (
            "막으면 생기는 신호",
            """방문자는 문이 닫힌 줄 안다.
운영자는 기회를 못 본다.

한도는 내 용량이지
상대 용건의 가치가 아니다.""",
        ),
        (
            "받기만 하고 자동 진행은 멈춤",
            """초과 요청은 접수한다.
자동 일정/자동 승인은 멈춘다.

업그레이드나 여유 회복 후
대기열에서 다시 본다.""",
        ),
        (
            "기준",
            """한도는 처리 속도를 늦출 수 있어도
사람의 말을 휴지통에 넣으면 안 된다.""",
        ),
    ],
    "2026-06-28-ponslink-product-14-plan-enforcement-trust": [
        (
            "",
            """플랜 집행을 버튼 비활성화로만 처리하면
화면은 조용해 보인다.

신뢰는 오히려 거기서 깨졌다.""",
        ),
        (
            "조용한 차단의 문제",
            """왜 안 되는지 설명이 없으면
사용자는 버그로 느낀다.

또는 자기가 거절당했다고 느낀다.
둘 다 제품 탓이 된다.""",
        ),
        (
            "집행을 문장으로",
            """한도 도달, 결제 필요, 권한 부족을
상태 문장과 다음 행동으로 보여 준다.

막을 때는 이유를 같이 막는다.""",
        ),
        (
            "한 줄",
            """플랜 집행은 UI 잠금이 아니라
약속한 경계를 설명 가능하게 지키는 일이다.""",
        ),
    ],
    "2026-06-28-ponslink-product-15-polar-paid-launch": [
        (
            "",
            """Polar 결제 런칭을 앞두고 체크아웃 버튼에 눈이 갔다.
눌러지는 순간이 런칭처럼 느껴진다.

준비 게이트가 더 중요했다.""",
        ),
        (
            "버튼만 살리면",
            """결제 페이지는 열려도
요청 질, 환불 정책 문장, 실패 시 상태,
관리자 확인 경로가 비면 사고가 된다.""",
        ),
        (
            "런칭 체크",
            """체크아웃 전에 확인했다.

- 미완 요청의 결제 차단 여부
- 성공/실패/대기 화면 문장
- 운영자가 멈추는 스위치

버튼은 마지막이다.""",
        ),
        (
            "기준",
            """결제 런칭은 돈이 움직임의 시작이 아니라
사고가 설명 가능해지는 시점이다.""",
        ),
    ],
    "2026-06-28-ponslink-product-16-webhook-pending-access": [
        (
            "",
            """결제 성공 화면은 기분 좋은 초록색이다.
그 화면만 보고 세션을 열면 안 됐다.""",
        ),
        (
            "화면과 사실의 간극",
            """브라우저는 성공을 먼저 보여줄 수 있다.
웹훅은 늦게 올 수 있다.
중복 이벤트도 온다.

화면을 진실로 믿으면
권한 없는 입장이 열린다.""",
        ),
        (
            "pending 입장",
            """성공 UI 뒤에는 pending access를 둔다.
서버가 결제 확정을 먹기 전까지
방은 열리지 않는다.

기다림 문장을 분명히 쓴다.
"결제 확인 중"과 "입장 가능"을 섞지 않는다.""",
        ),
        (
            "기준",
            """입장 권한의 기준은 웹훅/서버 상태다.
성공 화면은 안내일 뿐이다.""",
        ),
    ],
    "2026-06-28-ponslink-product-17-admin-otp-ops": [
        (
            "",
            """관리자 OTP 대시보드는 보안 기능처럼 보이지만
본질은 운영 책임을 화면으로 옮기는 일이었다.""",
        ),
        (
            "채팅으로 하던 운영",
            """예전에 코드 발급, 예외 승인, 긴급 입장이
메신저에 흩어져 있었다.

기록이 안 남고, 누가 했는지 흐려진다.""",
        ),
        (
            "화면으로 이전",
            """발급, 만료, 사용 여부, 액터를 한곳에 모았다.
편법 경로를 없애기보다
정식 경로를 더 빠르게 만들었다.""",
        ),
        (
            "효과",
            """운영이 사람 기억에 의존하지 않게 됐다.
권한이 보일 때 실수도 보인다.""",
        ),
    ],
    "2026-06-28-ponslink-product-18-meeting-flow-simplification": [
        (
            "",
            """요청에서 룸까지 가는 길을 줄이는 일이
기능 추가보다 어려웠다.""",
        ),
        (
            "길이 길어지는 이유",
            """예외를 붙일 때마다 단계가 는다.
결제, 보류, 재요청, 일정 변경.

각 단계는 옳아 보이는데
합치면 사용자가 길을 잃는다.""",
        ),
        (
            "줄인 방법",
            """기본 경로를 다시 그렸다.
요청 → 결정 → 입장.
나머지는 곁가지로 내린다.

한 화면에서 다음 행동 하나만 강조한다.""",
        ),
        (
            "기준",
            """짧은 경로는 기능이 적어서가 아니라
결정 순서가 선명해서 생긴다.""",
        ),
    ],
    "2026-06-28-ponslink-product-19-token-permission-boundaries": [
        (
            "",
            """요청 상태를 보는 토큰과
세션에 입장하는 토큰을 처음엔 비슷하게 취급했다.

같은 것으로 둘 수 없었다.""",
        ),
        (
            "섞이면",
            """상태 링크가 유출되면 입장까지 열린다.
입장 토큰이 길게 살아 있으면
끝난 방에 다시 들어온다.""",
        ),
        (
            "경계",
            """상태 토큰: 읽기, 짧은 수명, 좁은 스코프.
입장 토큰: 세션 단위, 승인·결제 이후, 폐기 명확.

이름이 비슷해도 권한이 다르다.""",
        ),
        (
            "한 줄",
            """토큰을 아끼려다 경계를 잃으면
절약한 코드보다 비싼 사고가 난다.""",
        ),
    ],
    "2026-06-28-ponslink-product-20-landing-repositioning": [
        (
            "",
            """랜딩을 미팅 앱 소개로 쓰고 있었다.
기능 목록, 화면 캡처, 연결 안정성.

실제 쓰는 이유는 달랐다.
요청을 선별해 덜 민망하게 만나기.""",
        ),
        (
            "잘못된 첫인상",
            """미팅 앱으로 보이면 Zoom과 비교된다.
이길 수 없는 비교다.

우리가 푸는 문제는 통화 품질 이전에
만남 앞단의 혼란이다.""",
        ),
        (
            "문구 교체",
            """헤드라인을 요청 선별·운영 흐름 쪽으로 바꿨다.
기능 bullet 대신
"DM 이후가 정리된다"는 장면을 앞에 뒀다.""",
        ),
        (
            "결과",
            """유입 질이 바뀌었다.
데모 요청 대신 실제 상담 운영 질문이 늘었다.""",
        ),
    ],
    "2026-06-28-ponslink-product-21-no-go-paid-launch": [
        (
            "",
            """정식 유료 출시 앞에서 No-Go를 적었다.
기능이 모자라서가 아니었다.""",
        ),
        (
            "Go처럼 보였던 것들",
            """결제는 붙었다.
방은 열린다.
랜딩도 있다.

그런데 실패 시 운영 문장,
환불/보류 경계,
첫 고객 정의가 흔들렸다.""",
        ),
        (
            "No-Go 기준",
            """돈이 움직였을 때
당황하지 않고 설명할 수 있는가.
재현 가능한가.
한 사람이 자면서도 사고 대응이 되는가.

아니면에 출시하지 않는다.""",
        ),
        (
            "의미",
            """No-Go는 후퇴가 아니라
신뢰를 가격보다 앞에 둔 결정이다.""",
        ),
    ],
    "2026-06-28-ponslink-product-22-first-customer-definition": [
        (
            "",
            """첫 고객을 넓은 미팅 시장으로 잡으면
메시지가 즉시 흐려진다.

나는 DM 상담을 받는 1인 전문가로 좁혔다.""",
        ),
        (
            "넓은 시장의 비용",
            """모두가 고객이면
아무것도 뾰족하지 않다.

랜딩, 폼, 가격, 사례가
서로 다른 사람을 부른다.""",
        ),
        (
            "좁힌 상",
            """혼자 상담하고,
채널은 DM이며,
일정과 사전 질문을 정리하고 싶은 사람.

그 한 명에게 필요한 순서만 남겼다.""",
        ),
        (
            "효과",
            """거절할 기능이 분명해졌다.
첫 고객 문장이 제품 백로그 필터가 된다.""",
        ),
    ],
    "2026-06-28-ponslink-product-23-dm-is-not-workflow": [
        (
            "",
            """DM은 시작점으로는 훌륭하다.
워크플로로 쓰면 무너진다.""",
        ),
        (
            "DM이 하는 일",
            """가벼운 첫 접촉, 온도 확인, 링크 전달.
여기는 사람이 편하다.""",
        ),
        (
            "DM이 못 하는 일",
            """상태, 권한, 기록, 한도, 결제, 재방문.
채팅창에 쌓이면 유실된다.

운영이 기억력 게임이 된다.""",
        ),
        (
            "문장",
            """DM은 문이어도 복도는 아니다.
복도 역할은 제품이 맡는다.""",
        ),
    ],
    "2026-06-28-ponslink-product-24-direct-sales-before-product-hunt": [
        (
            "",
            """Product Hunt에 올리고 싶은 마음은 있었다.
먼저 직접 판매를 보기로 했다.""",
        ),
        (
            "런치의 착시",
            """런치 데이는 박수와 트래픽을 준다.
가격 저항, 실제 거절 사유, 운영 마찰은
잘 안 준다.""",
        ),
        (
            "직접 판매에서 얻는 것",
            """한 사람씩 받고,
얼마를 주는지,
어디서 멈추는지 본다.

그 대화가 랜딩 문장과 가격표를 고친다.""",
        ),
        (
            "판단",
            """사냥터에 나가기 전에
내 가게 앞에서 먼저 판다.
학습 속도가 채널 과시보다 앞선다.""",
        ),
    ],
    "2026-06-29-main-ponslink-01-room-not-call": [
        (
            "",
            """처음에는 화상회의 앱을 만들면 된다고 생각했다.
카메라, 마이크, 링크.

만들다 보니 협업 방이 되고 있었다.""",
        ),
        (
            "통화만으로 부족했던 점",
            """사람은 말만 하러 오지 않는다.
자료, 맥락, 다음 약속이 붙는다.

통화가 끝나면 남는 것이 없으면
만남이 증발한다.""",
        ),
        (
            "방으로 이동",
            """실시간 대화는 유지하되
요청, 상태, 짧은 공유를 방의 일부로 봤다.

통화 품질 경쟁 대신
만남 전후를 붙잡는 쪽으로 기울었다.""",
        ),
        (
            "한 줄",
            """화상회의 앱을 만들려다
협업 가능한 연결 방을 만들게 됐다.""",
        ),
    ],
    "2026-06-29-main-ponslink-03-state-resync": [
        (
            "",
            """실시간 방에서 가장 무서운 순간은
연결이 끊기는 순간이 아니었다.

돌아왔을 때 상태가 어긋나는 순간이었다.""",
        ),
        (
            "어긋남의 얼굴",
            """한 사람은 새 화면을 보고
다른 사람은 옛 파일을 본다.
권한은 바뀌었는데 UI는 예전이다.

사용자는 버그 하나로 기억한다.""",
        ),
        (
            "먼저 본 것",
            """재연결 성공률보다
재동기화 규칙을 먼저 정했다.

무엇을 서버 권위로 둘지,
무엇을 세션 임시값으로 버릴지.""",
        ),
        (
            "기준",
            """연결 복구는 통신 문제가 아니라
공유 진실 복구 문제다.""",
        ),
    ],
}

# Already good short rewrites — leave content, only ensure excerpt ok
SKIP_REWRITE = {
    "2026-06-28-ponslink-product-01-dm-screening",
    "2026-06-29-main-ponslink-02-mesh-limits",
}


def first_excerpt(content: str, bare: str) -> str:
    chunks = []
    for p in re.split(r"\n\s*\n", content or ""):
        s = p.strip()
        if not s or s.startswith("#") or s.startswith("!"):
            continue
        s = re.sub(r"\s+", " ", s)
        chunks.append(s)
        if kchars(" ".join(chunks)) >= 80:
            break
    text = " ".join(chunks).strip()
    if kchars(text) < 28:
        return bare + " 판단과 경계를 짧게 정리한다."
    m = re.search(r"(.+?[다요임까]\.)", text)
    if m and kchars(m.group(1)) >= 24:
        # take up to 2 sentences
        rest = text[m.end() :].lstrip()
        m2 = re.search(r"(.+?[다요임까]\.)", rest)
        if m2 and kchars(m.group(1) + " " + m2.group(1)) <= 160:
            return (m.group(1) + " " + m2.group(1)).strip()
        return m.group(1).strip()
    return text[:180].rsplit(" ", 1)[0]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="db/custom.db")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--out", default="tmp/humanize-product-report.json")
    args = ap.parse_args()

    con = sqlite3.connect(args.db)
    rows = con.execute(
        """
        select slug, title, content, excerpt from Post
        where status='published'
          and (slug like '%ponslink-product%' or slug like '%main-ponslink%')
        order by slug
        """
    ).fetchall()

    report = {"updated": [], "skipped": [], "missing_beats": []}
    for slug, title, content, excerpt in rows:
        bare = bare_title(title)
        imgs = re.findall(r"!\[[^\]]*\]\((/tistory/[^)]+)\)", content or "")
        if slug in SKIP_REWRITE:
            ne = first_excerpt(content or "", bare)
            if args.apply and ne != (excerpt or "").strip():
                con.execute(
                    "update Post set excerpt=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                    (ne, slug),
                )
            report["skipped"].append({"slug": slug, "kc": kchars(content or "")})
            continue
        if slug not in BEATS:
            report["missing_beats"].append(slug)
            continue
        body = assemble(bare, imgs, BEATS[slug])
        kc = kchars(body)
        rt = max(1, round(kc / 350))
        ne = first_excerpt(body, bare)
        report["updated"].append({"slug": slug, "kc": kc, "imgs": len(imgs)})
        if args.apply:
            con.execute(
                "update Post set content=?, excerpt=?, readingTime=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                (body, ne, rt, slug),
            )
    if args.apply:
        con.commit()

    # series residual smells
    smells = [
        "그런데 방 안으로 사람이 들어오는 순간",
        "다음 작업자가 그대로 복사",
        "빠르게 끝나는 구조보다",
        "이 판단이 제품 문장",
        "현장 기준으로 다시 고정",
        "제목은 기능명",
        "온콜 관점",
    ]
    residual = []
    for slug, content in con.execute(
        """
        select slug, content from Post where status='published'
        and (slug like '%ponslink-product%' or slug like '%main-ponslink%')
        """
    ):
        c = content or ""
        hit = [s for s in smells if s in c]
        if hit:
            residual.append({"slug": slug, "hit": hit})
    report["residual"] = residual
    report["summary"] = {
        "updated": len(report["updated"]),
        "skipped": len(report["skipped"]),
        "missing": report["missing_beats"],
        "residual": len(residual),
        "applied": args.apply,
        "avg_kc_updated": round(
            sum(x["kc"] for x in report["updated"]) / max(1, len(report["updated"])), 1
        ),
    }
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    if residual:
        print("RESIDUAL", residual[:10])
    return 1 if report["missing_beats"] or residual else 0


if __name__ == "__main__":
    raise SystemExit(main())
