#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build thrash-free G003 PonsWarp humanize beats JSON and apply to DB."""
from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BEATS_PATH = Path(__file__).with_name("humanize-warp-beats.json")
DB_PATH = ROOT / "db" / "custom.db"
BAD = "thr" + "ash"

SKIP = {
    "2026-06-16-ponslink-11-ponswarp-split",
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
    return d


def beats() -> dict[str, dict]:
    B: dict[str, dict] = {}

    B["2026-06-29-main-ponswarp-01-server-does-not-own-file"] = entry(
        """큰 파일을 보낼 때 사람들은 보통 클라우드를 떠올린다.
올리면 링크가 생기고, 상대가 받는다.

익숙하지만 대가는 분명하다.
서버가 파일을 소유하는 순간, 비용과 책임이 서버로 몰린다.
PonsWarp는 그 소유를 기본값에서 빼고 시작했다.""",
        [
            (
                "서버 소유의 대가",
                """저장, 대역폭, 보존 기간, 유출 책임.
파일이 클수록 청구서가 제품 결정을 흔든다.

전송 제품이 클라우드 복제가 되면
가격표가 기능보다 먼저 자란다.""",
            ),
            (
                "직접 전달의 기본값",
                """가능한 한 브라우저 사이에서 바로 보낸다.
서버는 중매와 신호, 실패 복구 쪽을 맡는다.

파일이 서버 디스크에 앉지 않으면
소유 문제가 절반 이상 사라진다.""",
            ),
            (
                "남는 역할",
                """서버를 없애는 이야기가 아니다.
서버가 파일을 소유하지 않게 역할을 줄이는 이야기다.

그 한 줄이 PonsWarp의 출발점이었다.""",
            ),
            (
                "한 줄",
                """전송 제품의 본진은 저장이 아니라 전달이다.
소유를 기본값으로 두지 않기로 했다.""",
            ),
        ],
    )

    B["2026-06-29-main-ponswarp-02-signaling-is-matchmaker"] = entry(
        """Signaling 서버를 중계 서버처럼 부르면 설계가 흔들린다.
중계는 데이터를 들고, 중매는 서로를 만나게만 한다.

PonsWarp에서 시그널의 일은 후자다.""",
        [
            (
                "중계로 오해하면",
                """시그널이 페이로드까지 만지면
서버 없는 전송이라는 약속이 망가진다.

이름 하나가 권한 경계를 밀어 올린다.""",
            ),
            (
                "중매로 고정",
                """후보자 교환, 연결 상태, 재시도 신호.
여기까지만 서버가 본다.

파일 바이트는 데이터 채널로 간다.
역할 이름이 권한 경계가 된다.""",
            ),
            (
                "실패 시에도",
                """연결이 막히면 시그널은 재매칭을 돕는다.
파일을 대신 받지는 않는다.

중매는 실패 복구의 입구이지 창고가 아니다.""",
            ),
            (
                "기준",
                """시그널은 만남만 주선한다.
데이터를 드는 순간 제품 약속이 망가진다.""",
            ),
        ],
    )

    B["2026-06-29-main-ponswarp-03-backpressure-before-speed"] = entry(
        """빠르게 보내면 좋은 전송이라고 생각했다.
채널이 받아줄 수 있는 만큼만 보내는 구조는 답답해 보였다.

실제로는 속도보다 배압이 먼저였다.""",
        [
            (
                "속도 먼저의 실패",
                """보내기만 빠르면 수신 버퍼가 넘친다.
브라우저는 멈추고, 사용자는 진행률만 바라본다.

빠른 전송이 느린 실패보다 더 자주 신뢰를 망가뜨린다.""",
            ),
            (
                "배압을 앞에",
                """상대가 소화하는 속도를 기준으로 보낸다.
여유 창이 줄면 송신도 줄인다.

답답해 보여도 끝까지 가는 쪽이 제품이다.""",
            ),
            (
                "지표",
                """최고 속도 숫자보다 완료율을 본다.
중간에 죽는 전송은 광고 문구가 될 수 없다.""",
            ),
            (
                "한 줄",
                """속도는 욕심이고 배압은 약속이다.
약속이 먼저다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink"] = entry(
        """파일 전송을 처음부터 별도 제품으로 생각한 건 아니었다.
PonsLink 방에 사람이 붙어 있으니, 파일 버튼 하나면 될 줄 알았다.

쓰다 보니 방 안에서 전송이 깨졌다.""",
        [
            (
                "방에 붙인 이유",
                """이미 연결이 있다.
같은 화면에 두면 이동이 줄어든다.

데모에서는 완결처럼 보였다.""",
            ),
            (
                "깨진 지점",
                """큰 파일과 불안정한 망에서
통화 품질과 전송 품질이 서로 자원을 뺏는다.

말이 끊기면 전송을 탓한다.
전송이 막히면 방 전체를 의심한다.""",
            ),
            (
                "분리 결정",
                """전송을 방의 부가가 아니라 별도 본진으로 넘겼다.
PonsWarp라는 이름이 그 결정의 기록이다.""",
            ),
            (
                "한 줄",
                """같은 연결 위에 올려도 같은 제품은 아니다.
자원 경쟁이 생기면 경계를 갈라야 한다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-01-browser-direct-transfer"] = entry(
        """브라우저끼리 대용량을 직접 보내는 일은
기능 목록에 한 줄 적는 일로 끝나지 않았다.

사용자 문장은 기능 이름이 아니라 장면으로 왔다.""",
        [
            (
                "직접 전송의 장면",
                """올리지 않고 보낸다.
서버 폴더를 거치지 않는다.

그 한 장면이 제품의 중심이다.""",
            ),
            (
                "쉬운 문장, 어려운 현실",
                """NAT, 방화벽, 탭 절전, 메모리 한도.
직접이라는 말이 단순해 보일수록 예외가 생긴다.""",
            ),
            (
                "제품으로 남기려면",
                """연결 실패 문장, 재시도, 진행률, 중단 후 복구.
직접 경로를 자랑하기 전에 실패 경로를 먼저 둔다.""",
            ),
            (
                "한 줄",
                """브라우저 직접 전송은 마법이 아니다.
실패를 설명 가능하게 만드는 제품이다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-01b-data-grid-tb-experiment"] = entry(
        """TB 단위 전송을 실험하며 배운 것은
숫자 자랑이 아니라 파이프라인 한계였다.

큰 숫자 앞에서 작은 가정이 먼저 깨졌다.""",
        [
            (
                "큰 숫자의 유혹",
                """TB를 보내면 제품이 커 보인다.
데모 문장도 강해진다.

문제는 그 숫자가 일상 경로를 가린다는 점이다.""",
            ),
            (
                "먼저 보이는 한계",
                """메모리, 디스크 임시 공간, 탭 수명, 재시작.
TB는 이 한계를 한꺼번에 드러낸다.""",
            ),
            (
                "실험의 쓸모",
                """한계를 제품 문장으로 옮겼다.
어디부터 느려지고 어디서 죽는지 기록했다.""",
            ),
            (
                "한 줄",
                """큰 전송 실험은 자랑이 아니다.
작은 가정이 어디서 깨지는지 보는 스트레스 테스트다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-02-direct-cloud-drop-modes"] = entry(
        """처음에는 클라우드로 보낸다면 동작이 하나일 거라고 생각했다.
파일을 집어서 올리면 끝.

직접 전송이 어려울 때 쓰는 보조 레일까지 설계해야 했다.""",
        [
            (
                "하나의 동작이라는 착각",
                """올리기, 링크 받기, 만료, 권한, 실패 재시도.
클라우드 드롭은 버튼 하나가 아니다.""",
            ),
            (
                "직접과 보조의 역할",
                """직접 경로가 기본이다.
클라우드 경로는 보완이다.

둘을 같은 성공 화면으로 섞지 않는다.""",
            ),
            (
                "모드 분리",
                """사용자가 지금 어느 레일인지 보인다.
막혔을 때 이유도 레일마다 갈렸다.""",
            ),
            (
                "한 줄",
                """보조 레일은 실패 보험이지 기본 경로가 아니다.
기본이 흔들리면 보조도 믿을 수 없다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-02b-desktop-testing-fatigue"] = entry(
        """데스크톱에서만 잘 되면 끝난 줄 알았다.
같은 빌드를 여러 환경에 올려 보니 피로가 먼저 왔다.

테스트 피로가 품질을 갉아먹기 시작했다.""",
        [
            (
                "한 환경의 착각",
                """내 노트북의 와이파이는 관대하다.
회사망, 게스트망, 모바일 핫스팟은 그렇지 않다.""",
            ),
            (
                "피로의 신호",
                """같은 시나리오를 반복하다가 예외를 넘긴다.
재현이 어려운 실패를 일시 현상이라 부른다.""",
            ),
            (
                "줄인 것",
                """핵심 경로만 자동으로 돌리고
나머지는 실패 로그를 남기게 했다.

완벽한 커버리지보다 반복 가능한 최소 세트다.""",
            ),
            (
                "한 줄",
                """테스트 피로는 게으름이 아니라 설계 신호다.
사람이 지치면 자동화가 들어온다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-03-webrtc-opens-the-road"] = entry(
        """직접 전송의 길을 열 때 WebRTC를 골랐다.
브라우저가 이미 들고 있는 연결 도구였기 때문이다.

길을 연다는 말과 길을 지킨다는 말은 달랐다.""",
        [
            (
                "고른 이유",
                """플러그인 없이 브라우저끼리 말할 수 있다.
미디어만이 아니라 데이터 채널도 있다.""",
            ),
            (
                "연 뒤에 온 일",
                """후보 수집, ICE, 방화벽, 재협상.
길이 열려도 유지 비용이 남는다.""",
            ),
            (
                "제품 경계",
                """WebRTC는 수단이다.
사용자에게 보이는 약속은 파일이 도착한다는 것이다.""",
            ),
            (
                "한 줄",
                """길을 연 기술 이름보다
그 길로 무엇이 안전하게 가는지가 제품이다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-04-backpressure-protects-transfer"] = entry(
        """전송을 지키는 장치는 암호화만이 아니었다.
상대가 받을 수 있는 속도를 넘는 순간, 보호가 필요했다.

배압이 그 보호막이었다.""",
        [
            (
                "보호가 필요한 순간",
                """송신만 달리면 수신 탭이 죽는다.
죽은 탭 위의 진행률은 거짓이다.""",
            ),
            (
                "배압의 역할",
                """창을 보고 속도를 줄인다.
멈춤은 실패가 아니라 보호 동작이다.""",
            ),
            (
                "사용자 문장",
                """잠시 느려짐과 완전 실패를 구분한다.
보호 중인지 죽었는지 보여줘야 한다.""",
            ),
            (
                "한 줄",
                """배압은 속도를 깎는 장치가 아니라
전송을 끝까지 살아남게 하는 장치다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-04b-ack-backpressure-battle"] = entry(
        """ACK와 배압을 동시에 다루면 둘 다 옳아 보인다.
하나는 도착 확인이고, 하나는 속도 조절이다.

둘이 싸울 때 제품이 흔들렸다.""",
        [
            (
                "충돌 장면",
                """ACK가 늦으면 송신은 더 조심한다.
배압이 줄라고 해도 ACK 공백이 겹치면 거의 멈춘다.""",
            ),
            (
                "우선순위",
                """유실 방지와 과부하 방지 중
무엇을 먼저 믿을지 정해야 했다.""",
            ),
            (
                "정리",
                """배압으로 속도를 정하고
ACK로 구간 확정을 남긴다.

역할이 겹치면 로그부터 헷갈린다.""",
            ),
            (
                "한 줄",
                """확인과 조절을 한 스위치로 묶지 않는다.
각자 시계를 갖게 했다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-05-zip64-streaming"] = entry(
        """여러 파일을 묶어 보내려니 ZIP이 자연스러웠다.
그런데 큰 묶음에서 일반 ZIP 가정이 먼저 금이 갔다.

Zip64와 스트리밍이 그 금 위에 올라왔다.""",
        [
            (
                "묶음의 함정",
                """파일을 하나씩 보내면 단순하다.
묶는 순간 오프셋과 크기 한도가 드러난다.

작은 ZIP 가정은 큰 묶음에서 바로 깨진다.""",
            ),
            (
                "Zip64로 확장",
                """4GB 경계를 넘는 순간 포맷이 달라진다.
확장 필드를 빼먹으면 받는 쪽이 열지 못한다.""",
            ),
            (
                "스트리밍",
                """전부 만든 뒤에 보내지 않는다.
만들면서 흘려보낸다.

임시 공간과 대기 시간이 함께 줄어든다.""",
            ),
            (
                "한 줄",
                """묶음 전송은 압축 기능이 아니라
크기 한도와 메모리 한도를 넘는 설계 문제다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-05b-browser-memory-2gb"] = entry(
        """브라우저 탭의 메모리는 관대하지 않았다.
2GB 근처에서 갑자기 조용해지는 경우가 많았다.

큰 파일을 통째로 올리려던 습관이 먼저 죽었다.""",
        [
            (
                "조용한 죽음",
                """에러 문장 없이 탭이 새로고침된다.
사용자는 네트워크를 의심하고 우리는 힙을 본다.""",
            ),
            (
                "통째로 읽기의 대가",
                """File을 한 번에 ArrayBuffer로 읽으면
여유가 없어 보인다.

청크로 나누기 전까지는 같은 실패가 반복됐다.""",
            ),
            (
                "나눈 뒤",
                """읽는 단위를 줄이고 사용이 끝나면 놓는다.
속도 숫자보다 생존이 먼저다.""",
            ),
            (
                "한 줄",
                """브라우저 메모리는 서버 메모리가 아니다.
한 탭의 한도를 제품 한도로 인정해야 한다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-05c-opfs-safety-net"] = entry(
        """메모리만으로 버티다 보니 큰 수신이 불안했다.
탭이 죽으면 받은 조각도 함께 사라졌다.

OPFS를 안전망으로 붙였다.""",
        [
            (
                "메모리만의 한계",
                """진행률이 높아도 확정이 아니다.
새로고침 한 번에 처음으로 돌아간다.""",
            ),
            (
                "디스크 쪽 임시 공간",
                """Origin private file system에 조각을 쌓는다.
탭이 흔들려도 받은 구간이 남는다.""",
            ),
            (
                "안전망의 위치",
                """기본 경로를 느리게 만들면 안 된다.
위험 구간에만 깔아 두는 그물이다.""",
            ),
            (
                "한 줄",
                """OPFS는 저장 제품이 아니다.
브라우저 수명을 넘는 임시 버팀목이다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-06-cloud-drop-complement"] = entry(
        """직접 전송이 막히는 환경을 무시할 수 없었다.
그때 클라우드 드롭을 대체가 아니라 보완으로 두었다.

순서가 바뀌면 제품 약속이 바뀐다.""",
        [
            (
                "보완인 이유",
                """직접이 되면 서버가 파일을 갖지 않는다.
그 약속을 기본값으로 지키고 싶었다.""",
            ),
            (
                "대체로 두면",
                """편한 경로가 기본이 된다.
비용과 소유 문제가 다시 중심이 된다.""",
            ),
            (
                "전환 문장",
                """지금은 직접이 어렵다.
잠시 다른 길로 보낸다는 말이 필요하다.""",
            ),
            (
                "한 줄",
                """클라우드 드롭은 실패 시의 다리이지
제품의 본정이 아니다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-06b-rust-wasm-memory-survival"] = entry(
        """브라우저 안에서 무거운 처리를 맡길 곳이 필요했다.
JavaScript 힙만으로는 큰 변환이 자주 죽었다.

Rust와 Wasm 쪽으로 일부를 옮겼다.""",
        [
            (
                "옮긴 이유",
                """메모리 통제와 속도가 동시에 필요했다.
같은 일을 JS에서 반복하면 탭이 먼저 지친다.""",
            ),
            (
                "경계",
                """모든 로직을 Wasm으로 옮기진 않았다.
비용이 큰 구간만 넘겼다.

경계가 흐리면 디버깅이 먼저 무너진다.""",
            ),
            (
                "생존 기준",
                """변환이 끝나도 탭이 살아 있어야 한다.
결과 숫자보다 과정이 제품을 죽이는지 본다.""",
            ),
            (
                "한 줄",
                """Wasm은 만능 이전이 아니다.
브라우저 생존을 위한 선택적 이관이다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-07-incomplete-transfer-recovery"] = entry(
        """전송이 중간에 끊기는 건 예외가 아니라 일상이다.
끊긴 뒤 처음부터 다시 하게 두면 사용자가 먼저 떠난다.

미완료 복구를 본 경로에 넣었다.""",
        [
            (
                "끊김의 얼굴",
                """탭 종료, 망 전환, 노트북 절전.
이유는 달라도 결과는 같은 구멍이다.""",
            ),
            (
                "처음부터의 비용",
                """큰 파일일수록 재시작 비용이 커진다.
신뢰는 완료율에서 나온다.""",
            ),
            (
                "남긴 것",
                """어디까지 확정됐는지 기록한다.
이어서 받을 수 있는 지점을 노출한다.""",
            ),
            (
                "한 줄",
                """미완료 복구는 부가 기능이 아니다.
불안정한 현실에 맞춘 기본 동작이다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-08-mobile-background-resume"] = entry(
        """모바일에서 전송 중 화면을 바꾸면 브라우저가 잠을 잔다.
잠든 탭 위의 전송은 살아 있다고 말하기 어렵다.

백그라운드와 재개가 문제가 됐다.""",
        [
            (
                "화면 밖의 현실",
                """문자가 오고, 전화가 오고, 다른 앱이 열린다.
전송만 전면에 둘 수 없다.""",
            ),
            (
                "죽은 것처럼 보이는 진행",
                """진행률이 멈춘 채 남아 있으면
사용자는 실패로 읽는다.""",
            ),
            (
                "재개 문장",
                """돌아왔을 때 이어서 할지
다시 할지 분명해야 한다.""",
            ),
            (
                "한 줄",
                """모바일 전송은 전면 유지 가정이 아니라
중단과 재개 가정으로 짜야 한다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-09-browser-download-strategy"] = entry(
        """받는 쪽 저장도 브라우저마다 달랐다.
같은 파일이 어떤 환경에서는 다운로드로,
어떤 환경에서는 메모리 한계로 막혔다.

다운로드 전략을 하나로 우기지 않았다.""",
        [
            (
                "한 전략의 실패",
                """큰 블롭을 만들어 저장 버튼을 누르면
어떤 브라우저는 바로 포기한다.""",
            ),
            (
                "환경별 경로",
                """스트림이 되면 스트림으로,
아니면 조각 후 병합으로 간다.""",
            ),
            (
                "사용자에게 보이는 것",
                """기술 경로 이름보다
파일이 어디에 생겼는지가 중요하다.""",
            ),
            (
                "한 줄",
                """다운로드 전략은 취향이 아니라
브라우저 한도에 맞춘 분기 표다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-10-pipeline-limits-before-speed"] = entry(
        """파이프라인을 늘리면 속도가 오를 줄 알았다.
실제로는 한 구간 한계가 전체를 결정했다.

한계를 먼저 보지 않으면 속도 최적화는 허공이다.""",
        [
            (
                "느린 구간의 지배",
                """읽기, 암호화, 송신, 수신, 쓰기.
가장 느린 칸이 전체 박자를 정한다.""",
            ),
            (
                "숫자 착시",
                """한 구간만 빠르게 만들면
다음 구간 대기열이 쌓인다.

전체가 빨라진 것처럼 보이지만 완료는 그대로다.""",
            ),
            (
                "한계 먼저",
                """병목을 재고 나서 손댄다.
추측 최적화는 로그만 늘린다.""",
            ),
            (
                "한 줄",
                """파이프라인 설계의 첫 질문은 속도가 아니라
어느 칸이 먼저 한계에 닿는가다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-11-zero-copy-pool"] = entry(
        """복사 한 번이 사소해 보였다.
큰 파일에서는 그 한 번이 메모리와 시간을 동시에 먹었다.

제로카피와 버퍼 풀을 이야기하게 된 이유다.""",
        [
            (
                "복사의 비용",
                """같은 바이트를 여러 계층이 다시 붙잡는다.
보일 때는 작고, 쌓이면 탭을 죽인다.""",
            ),
            (
                "풀을 둔 이유",
                """쓸 때마다 새로 할당하지 않는다.
쓰고 돌려보내 파편을 줄인다.""",
            ),
            (
                "과한 최적화의 선",
                """모든 경로를 제로카피로 만들지 않았다.
측정된 복사 구간만 걷어냈다.""",
            ),
            (
                "한 줄",
                """제로카피는 이념이 아니라
큰 전송에서 살아남기 위한 절약이다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-12-entitlement-before-payment"] = entry(
        """결제 화면을 먼저 붙이면 제품이 완성된 듯 보인다.
실제로는 권한 경계가 없으면 결제도 공허하다.

누가 무엇을 쓸 수 있는지가 돈보다 먼저였다.""",
        [
            (
                "결제 먼저의 착각",
                """카드를 받은 뒤에 권한을 만들면
이미 쓴 사람과 못 쓴 사람 경계가 흐려진다.""",
            ),
            (
                "권한이 먼저",
                """결제는 권한을 사는 행위다.
권한이 먼저 정의되어야 결제가 의미를 갖는다.""",
            ),
            (
                "권한 표",
                """무료 구간, 유료 구간, 만료, 좌석.
이 표가 없으면 영수증만 남는다.""",
            ),
            (
                "한 줄",
                """돈보다 권한 경계를 먼저 세운다.
결제는 그 경계 위의 문이다.""",
            ),
        ],
    )

    B["2026-06-29-ponswarp-12b-flow-that-survives-failure"] = entry(
        """실패해도 이어지는 흐름이 제품이다.
한 번 끊기면 처음부터인 전송은
큰 파일 앞에서 바로 버려진다.

살아남는 흐름을 기준으로 화면을 다시 짰다.""",
        [
            (
                "성공만의 함정",
                """성공 경로만 그리면 데모는 예쁘다.
실제 사용은 실패 경로에서 결정된다.""",
            ),
            (
                "이어지는 선택",
                """재시도, 이어받기, 다른 레일 전환.
버튼 위치가 판단 속도를 바꾼다.""",
            ),
            (
                "화면 문장",
                """사용자가 다음에 무엇을 하면 되는지
한 문장으로 남아야 한다.""",
            ),
            (
                "한 줄",
                """견고한 전송 제품은 빠른 성공보다
느려도 이어지는 실패 처리를 고른다.""",
            ),
        ],
    )

    return B


def write_beats(path: Path = BEATS_PATH) -> dict:
    data = beats()
    blob = json.dumps(data, ensure_ascii=False, indent=2)
    if BAD in blob:
        raise RuntimeError("forbidden placeholder leaked into beats json")
    path.write_text(blob + "\n", encoding="utf-8")
    return data


def apply_beats(db_path: Path = DB_PATH) -> dict:
    data = write_beats()
    con = sqlite3.connect(db_path)
    rows = con.execute(
        """
        select slug, title, content, excerpt from Post
        where status='published'
          and (slug like '%ponswarp%' or slug like '%main-ponswarp%')
        order by slug
        """
    ).fetchall()

    smells = [
        "그런데 방 안으로 사람이 들어오는 순간",
        "다음 작업자가 그대로 복사",
        "이 판단이 제품 문장",
        "온콜 관점",
        "이번 정리에서 확인한 핵심은 하나다",
        "배포 전에 괜찮다고 느낀 가정",
        "[[Pons",
        BAD,
    ]

    report = {"updated": [], "skipped": [], "missing": [], "residual": []}
    for slug, title, content, excerpt in rows:
        bare = bare_title(title)
        imgs = re.findall(r"!\[[^\]]*\]\((/tistory/[^)]+)\)", content or "")
        if slug in SKIP:
            ne = first_excerpt(content or "", bare)
            con.execute(
                "update Post set excerpt=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
                (ne, slug),
            )
            report["skipped"].append({"slug": slug, "kc": kchars(content or "")})
            continue
        if slug not in data:
            report["missing"].append(slug)
            continue
        payload = data[slug]
        sections = [(s["h2"], s["body"]) for s in payload["sections"]]
        body = build(bare, imgs, payload["opening"], sections)
        if BAD in body:
            raise RuntimeError("bad word in body for " + slug)
        kc = kchars(body)
        ne = first_excerpt(body, bare)
        rt = max(1, round(kc / 350))
        con.execute(
            "update Post set content=?, excerpt=?, readingTime=?, updatedAt=CURRENT_TIMESTAMP where slug=?",
            (body, ne, rt, slug),
        )
        report["updated"].append({"slug": slug, "kc": kc, "imgs": len(imgs)})

    con.commit()

    for slug, content in con.execute(
        """
        select slug, content from Post
        where status='published'
          and (slug like '%ponswarp%' or slug like '%main-ponswarp%')
        """
    ):
        hit = [s for s in smells if s in (content or "")]
        if hit:
            report["residual"].append({"slug": slug, "hit": hit})

    report["summary"] = {
        "updated": len(report["updated"]),
        "skipped": len(report["skipped"]),
        "missing": report["missing"],
        "residual": len(report["residual"]),
        "avg_kc": round(
            sum(x["kc"] for x in report["updated"]) / max(1, len(report["updated"])), 1
        ),
    }
    out = ROOT / "tmp" / "humanize-warp-report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    if report["residual"]:
        print("RESIDUAL", report["residual"][:20])
    if report["missing"]:
        print("MISSING", report["missing"])
    return report


def main() -> int:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--write-only", action="store_true")
    args = ap.parse_args()
    if args.write_only:
        data = write_beats()
        print("wrote", BEATS_PATH, "posts", len(data))
        return 0
    if args.apply:
        report = apply_beats()
        return 1 if report["missing"] or report["residual"] else 0
    data = write_beats()
    print("wrote", BEATS_PATH, "posts", len(data))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
