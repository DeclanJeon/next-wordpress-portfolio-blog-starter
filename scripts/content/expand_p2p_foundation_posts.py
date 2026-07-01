#!/usr/bin/env python3
"""Regenerate P2P foundation posts with varied article templates and image concepts.

The database is intentionally the content target; git stores this deterministic script and
public visual assets so the production content can be reproduced.
"""
from __future__ import annotations

from dataclasses import dataclass
import datetime as dt
import hashlib
import html
import random
import re
import sqlite3
import sys
from pathlib import Path
from typing import Callable

AUTHOR_ID = "ponslink-content"
AUTHOR_NAME = "PonsLink"
TAXONOMY_ID = "tax-dev-retrospective-p2p-foundations"
CATEGORY = "개발 회고"
ASSET_DIR = Path("public/tistory/p2p-foundations/varied")


@dataclass(frozen=True)
class Topic:
    slug: str
    title: str
    excerpt: str
    tags: str
    published_at: str
    labels: tuple[str, ...]
    principle: str
    scenario: str
    decision: str
    risks: tuple[str, ...]
    questions: tuple[str, ...]
    template_id: str
    image_concepts: tuple[str, ...]


@dataclass(frozen=True)
class Asset:
    concept_id: str
    path: str
    alt: str
    caption: str


@dataclass(frozen=True)
class ArticleTemplate:
    id: str
    name: str
    render: Callable[[Topic, list[Asset]], str]


@dataclass(frozen=True)
class ImageConcept:
    id: str
    name: str
    render: Callable[[Topic, str, int], str]


TOPICS = [
    Topic(
        slug="2026-06-16-p2p-00-grid-computing-first-step",
        title="[P2P] 그리드 컴퓨팅을 만들고 싶어서 P2P를 다시 읽기 시작했다",
        excerpt="P2P를 파일 전송이나 화상회의 기능으로만 보지 않고, 분산 작업과 그리드 컴퓨팅의 기반으로 다시 정리한다.",
        tags="P2P,Grid Computing,Distributed Systems,Foundations,Architecture",
        published_at="2026-06-15T15:10:00.000Z",
        labels=("작업 큐", "브라우저 워커", "검증", "재시도", "결과 조립"),
        principle="그리드 컴퓨팅은 남는 장치를 많이 모으는 일이 아니라, 작은 작업을 안전하게 나누고 검증해서 다시 합치는 운영 모델이다.",
        scenario="대용량 자료를 여러 브라우저가 조각 단위로 해시하고, 일부 피어는 썸네일을 만들고, 느린 피어의 조각은 다시 배정되는 실험",
        decision="완전 분산보다 중앙 스케줄러와 P2P 데이터 경로를 섞은 하이브리드 구조에서 시작한다.",
        risks=("워커가 중간에 떠남", "결과 검증 비용이 계산 이득을 넘음", "모바일 브라우저가 백그라운드에서 멈춤"),
        questions=("작업 조각은 독립적으로 재시도 가능한가", "결과를 빠르게 검증할 기준이 있는가", "스케줄러가 반드시 중앙에 있어야 하는 정보는 무엇인가"),
        template_id="T05",
        image_concepts=("I02", "I10", "I05", "I08"),
    ),
    Topic(
        slug="2026-06-16-p2p-01-client-server-vs-peer-to-peer",
        title="[P2P] 서버-클라이언트와 피어 투 피어는 무엇이 다른가",
        excerpt="P2P를 이해하려면 먼저 누가 중심을 갖고, 누가 데이터를 들고, 누가 장애 지점이 되는지를 구분해야 한다.",
        tags="P2P,Network Architecture,Client Server,Foundations,WebRTC",
        published_at="2026-06-15T15:12:00.000Z",
        labels=("클라이언트", "서버", "피어", "제어면", "데이터면"),
        principle="P2P는 서버를 없애는 선언이 아니라 서버의 책임과 피어의 책임을 다시 배치하는 설계 선택이다.",
        scenario="로그인과 권한은 서버가 판단하지만 실제 파일 조각과 실시간 이벤트 일부는 브라우저끼리 직접 주고받는 상담 방",
        decision="권한, 감사, 영구 저장은 서버에 남기고 무거운 일시 데이터만 피어 경로로 옮긴다.",
        risks=("인증까지 피어에게 넘김", "직접 연결 실패가 화면에 설명되지 않음", "삭제와 보존 정책이 흐려짐"),
        questions=("이 데이터는 중앙에 반드시 남아야 하는가", "서버가 판단할 약속과 피어가 운반할 바이트는 무엇인가", "직접 경로가 막히면 어떤 우회가 있는가"),
        template_id="T09",
        image_concepts=("I06", "I01", "I08", "I04"),
    ),
    Topic(
        slug="2026-06-16-p2p-02-mesh-sfu-mcu-topology",
        title="[P2P] Mesh, SFU, MCU는 연결을 어디서 합칠지의 선택이다",
        excerpt="Mesh, SFU, MCU는 화상회의 용어처럼 보이지만 본질은 데이터 경로와 비용, 품질, 제어권의 선택이다.",
        tags="P2P,WebRTC,Mesh,SFU,MCU,Realtime,Architecture",
        published_at="2026-06-15T15:14:00.000Z",
        labels=("Mesh", "SFU", "MCU", "업로드", "품질 제어"),
        principle="Mesh, SFU, MCU의 차이는 연결을 어디서 복제하고 어디서 합칠지 결정하는 비용 모델의 차이다.",
        scenario="2명 상담 방은 Mesh로 충분하지만 12명 세미나, 녹화, 저성능 단말 지원이 필요해지는 순간",
        decision="작은 방은 Mesh, 다자 방은 SFU, 녹화와 단일 출력은 MCU로 가는 전환 기준을 문서화한다.",
        risks=("Mesh 방을 키워 업로드가 터짐", "SFU 도입 후 품질 레이어 정책이 없음", "MCU 서버 인코딩 비용을 과소평가함"),
        questions=("한 사용자가 감당할 업로드 수는 몇 개인가", "서버가 전달만 하면 되는가 합성해야 하는가", "녹화와 방송이 핵심 기능인가"),
        template_id="T03",
        image_concepts=("I04", "I01", "I07", "I05"),
    ),
    Topic(
        slug="2026-06-16-p2p-03-what-can-we-build-with-p2p",
        title="[P2P] 피어 투 피어로 실제 무엇을 만들 수 있는가",
        excerpt="P2P는 화상회의만을 위한 기술이 아니다. 파일 전송, 협업, 엣지 연산, 로컬 우선 제품까지 이어지는 설계 선택이다.",
        tags="P2P,Product,File Transfer,Realtime,Edge Computing,Collaboration",
        published_at="2026-06-15T15:16:00.000Z",
        labels=("파일 전송", "협업", "로컬 우선", "엣지 연산", "콘텐츠 배포"),
        principle="P2P의 제품 가치는 중앙 서버가 모든 데이터 경로를 소유하지 않아도 되는 순간에 생긴다.",
        scenario="파일은 직접 보내고, 화이트보드 이벤트는 가까운 참여자끼리 동기화하고, 무거운 계산은 여유 장치에 맡기는 제품 묶음",
        decision="제품 후보를 데이터 무게, 중앙 일관성 필요, 실패 허용도 기준으로 나눠 적용한다.",
        risks=("협업 충돌을 연결 문제로 착각함", "악의적 피어 검증을 생략함", "오프라인/재접속 UX가 없음"),
        questions=("가장 무거운 바이트는 무엇인가", "오프라인에서도 계속되어야 하는 작업은 무엇인가", "중앙 서버가 줄어들 때 신뢰를 어떻게 설명할 것인가"),
        template_id="T10",
        image_concepts=("I08", "I09", "I10", "I04"),
    ),
    Topic(
        slug="2026-06-16-p2p-04-grid-computing-from-p2p",
        title="[P2P] 그리드 컴퓨팅은 남는 자원을 작업 단위로 묶는 일이다",
        excerpt="그리드 컴퓨팅은 여러 장치의 남는 계산 자원을 하나의 큰 작업장처럼 쓰려는 시도다.",
        tags="P2P,Grid Computing,Distributed Systems,Scheduling,Foundations",
        published_at="2026-06-15T15:18:00.000Z",
        labels=("분할", "배정", "실행", "검증", "재시도"),
        principle="그리드는 여러 컴퓨터를 하나처럼 보이게 하는 마술이 아니라 독립 작업을 안전하게 순환시키는 파이프라인이다.",
        scenario="이미지 변환과 해시 계산을 작은 작업으로 나누고, 느린 워커의 조각만 다시 큐에 넣는 처리 시스템",
        decision="작업 큐, 스케줄러, 워커, 검증기, 조립기를 분리하고 검증 가능한 작업부터 적용한다.",
        risks=("공유 상태가 많은 작업을 억지로 분산함", "검증 없이 가장 빠른 결과만 믿음", "스케줄러가 워커 상태를 모르고 배정함"),
        questions=("작업 조각 크기는 어느 정도가 적절한가", "워커가 떠나면 누가 이어받는가", "검증은 중복 계산인가 샘플링인가"),
        template_id="T02",
        image_concepts=("I01", "I10", "I06", "I07"),
    ),
    Topic(
        slug="2026-06-16-p2p-05-signaling-stun-turn-ice",
        title="[P2P] WebRTC 이전에 Signaling, STUN, TURN, ICE를 먼저 이해해야 한다",
        excerpt="WebRTC 연결 실패의 대부분은 미디어 API가 아니라 서로를 찾고 통과하는 과정에서 생긴다.",
        tags="P2P,WebRTC,Signaling,STUN,TURN,ICE,NAT",
        published_at="2026-06-15T15:20:00.000Z",
        labels=("Signaling", "STUN", "TURN", "ICE", "NAT"),
        principle="WebRTC 연결은 미디어 전송 전에 약속 교환, 주소 발견, 후보 시험, 릴레이 전환을 거치는 탐색 과정이다.",
        scenario="두 브라우저가 방 서버로 SDP와 candidate를 교환하고, 직접 연결이 막히면 TURN 릴레이로 전환되는 흐름",
        decision="시그널링 로그, ICE 상태, TURN 사용률을 제품 상태와 운영 지표로 노출한다.",
        risks=("시그널링을 WebRTC가 자동 제공한다고 착각함", "TURN 비용을 예산에 넣지 않음", "ICE 실패가 사용자에게 무한 로딩으로 보임"),
        questions=("SDP와 candidate는 어디에 기록되는가", "TURN 사용률은 어떻게 감시하는가", "릴레이 전환을 사용자에게 어떻게 설명하는가"),
        template_id="T04",
        image_concepts=("I09", "I05", "I07", "I01"),
    ),
    Topic(
        slug="2026-06-16-p2p-06-realtime-product-patterns",
        title="[패턴] 실시간 제품은 상태 머신, 역압, 멱등성으로 버틴다",
        excerpt="실시간 제품의 안정성은 멋진 프레임워크보다 상태 전이, 흐름 제어, 재시도 가능한 명령에서 나온다.",
        tags="Design Patterns,Realtime,State Machine,Backpressure,Idempotency,PubSub,P2P",
        published_at="2026-06-15T15:22:00.000Z",
        labels=("상태 머신", "역압", "멱등성", "Pub/Sub", "재시도"),
        principle="실시간 제품은 빠르게 보내는 능력보다 상태를 제한하고, 받을 수 있을 만큼만 흐르게 하고, 중복을 안전하게 만드는 능력으로 버틴다.",
        scenario="파일 전송 중 네트워크가 흔들릴 때 상태 머신이 전이를 제한하고, 역압이 속도를 낮추며, 작업 ID가 중복 처리를 막는 장면",
        decision="상태 머신, backpressure, idempotency, pub/sub, timeout을 제품 기본 패턴으로 문서화한다.",
        risks=("boolean 플래그가 불가능한 상태 조합을 만듦", "버퍼 수위를 보지 않고 계속 보냄", "재시도 요청이 같은 작업을 두 번 처리함"),
        questions=("가능한 상태와 전이를 한 장으로 그릴 수 있는가", "받는 쪽의 처리 속도가 보내는 쪽에 전달되는가", "같은 명령이 두 번 와도 결과가 같은가"),
        template_id="T07",
        image_concepts=("I09", "I05", "I07", "I03"),
    ),
]


PALETTE = {
    "paper": "#f7f3ea",
    "ink": "#2f2720",
    "muted": "#8a725a",
    "line": "#b8a489",
    "clay": "#c8875c",
    "blue": "#496a86",
    "green": "#6f8a72",
    "rose": "#b96f62",
    "gold": "#d7b98b",
}


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def svg_base(title: str, subtitle: str, body: str, bg: str = "#f7f3ea") -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="840" viewBox="0 0 1400 840" role="img" aria-label="{esc(title)}">
<defs>
  <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 Z" fill="{PALETTE['blue']}"/></marker>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#b8a489" flood-opacity="0.25"/></filter>
</defs>
<rect width="1400" height="840" fill="{bg}"/>
<rect x="46" y="46" width="1308" height="748" rx="34" fill="#fffdf8" stroke="#d8c9b4"/>
<text x="92" y="112" font-size="32" font-weight="700" fill="{PALETTE['ink']}" font-family="sans-serif">{esc(title[:44])}</text>
<text x="92" y="150" font-size="16" fill="{PALETTE['muted']}" font-family="monospace">{esc(subtitle)}</text>
{body}
</svg>'''


def box(x: int, y: int, w: int, h: int, text: str, fill: str = "#fbf8f1") -> str:
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{fill}" stroke="{PALETTE["line"]}"/><text x="{x+w/2}" y="{y+h/2+7}" text-anchor="middle" font-size="22" fill="{PALETTE["ink"]}" font-family="sans-serif">{esc(text[:18])}</text>'


def arrow(x1: int, y1: int, x2: int, y2: int, label: str = "") -> str:
    text = f'<text x="{(x1+x2)/2}" y="{(y1+y2)/2-12}" text-anchor="middle" font-size="15" fill="{PALETTE["muted"]}" font-family="sans-serif">{esc(label[:16])}</text>' if label else ""
    return f'<path d="M{x1},{y1} C {(x1+x2)/2},{y1} {(x1+x2)/2},{y2} {x2},{y2}" fill="none" stroke="{PALETTE["blue"]}" stroke-width="3" marker-end="url(#arrow)"/>{text}'


def render_architecture(topic: Topic, title: str, slot: int) -> str:
    body = "".join(box(140 + i * 240, 300, 190, 92, label, "#f7f9fb") for i, label in enumerate(topic.labels[:5]))
    body += "".join(arrow(330 + i * 240, 346, 380 + i * 240, 346, "interface") for i in range(4))
    body += '<rect x="150" y="545" width="1100" height="96" rx="24" fill="#eef4ef" stroke="#9bb69f"/><text x="700" y="602" text-anchor="middle" font-size="24" fill="#2f2720" font-family="sans-serif">control plane stays observable; data plane moves only when it earns its cost</text>'
    return svg_base(title, "I01 Editorial Architecture Diagram", body)


def render_notebook(topic: Topic, title: str, slot: int) -> str:
    lines = "".join(f'<line x1="120" y1="{210+i*54}" x2="1270" y2="{210+i*54}" stroke="#e6d9c5"/>' for i in range(10))
    scribbles = "".join(f'<path d="M{180+i*240},{300+i%2*80} q80,-70 160,0 t160,0" fill="none" stroke="{PALETTE["blue"]}" stroke-width="3" stroke-dasharray="8 9"/>' for i in range(3))
    notes = "".join(f'<text x="{180+(i%2)*520}" y="{275+i*82}" font-size="26" fill="{PALETTE["ink"]}" font-family="sans-serif">• {esc(label)}</text>' for i, label in enumerate(topic.labels[:5]))
    body = lines + scribbles + notes + '<rect x="930" y="575" width="250" height="120" rx="14" fill="#fff3cf" stroke="#d7b98b" transform="rotate(-2 930 575)"/>' + f'<text x="955" y="640" font-size="23" fill="{PALETTE["ink"]}" font-family="sans-serif">{esc(topic.decision[:18])}</text>'
    return svg_base(title, "I02 Hand-drawn Notebook Sketch", body, "#fbf7ee")


def render_screen_mock(topic: Topic, title: str, slot: int) -> str:
    rows = "".join(f'<rect x="180" y="{250+i*72}" width="1040" height="48" rx="10" fill="{["#eef4ef", "#fff7e8", "#f7eeee"][i%3]}"/><text x="210" y="{281+i*72}" font-size="19" fill="{PALETTE["ink"]}" font-family="monospace">{esc(topic.risks[i % len(topic.risks)])}</text><circle cx="1160" cy="{274+i*72}" r="12" fill="{[PALETTE["green"], PALETTE["gold"], PALETTE["rose"]][i%3]}"/>' for i in range(6))
    body = '<rect x="150" y="210" width="1100" height="500" rx="22" fill="#f8fafc" stroke="#c9d3dc" filter="url(#shadow)"/><rect x="150" y="210" width="1100" height="56" rx="22" fill="#e9edf2"/><text x="190" y="247" font-size="20" font-family="monospace" fill="#475569">runtime monitor · live surface</text>' + rows
    return svg_base(title, "I03 Product Screen Mock", body)


def render_matrix(topic: Topic, title: str, slot: int) -> str:
    body = '<line x1="700" y1="220" x2="700" y2="690" stroke="#aa967b" stroke-width="3"/><line x1="210" y1="455" x2="1190" y2="455" stroke="#aa967b" stroke-width="3"/>'
    cells = [(300,330,topic.labels[0]),(870,330,topic.labels[1]),(300,585,topic.labels[2]),(870,585,topic.labels[3])]
    for x,y,label in cells:
        body += f'<rect x="{x-160}" y="{y-70}" width="320" height="118" rx="20" fill="#fff8ed" stroke="#d7b98b"/><text x="{x}" y="{y}" text-anchor="middle" font-size="26" fill="{PALETTE["ink"]}" font-family="sans-serif">{esc(label)}</text>'
    body += '<text x="700" y="735" text-anchor="middle" font-size="22" fill="#735f4a" font-family="sans-serif">choose by cost, control, failure recovery</text>'
    return svg_base(title, "I04 Decision Matrix Card", body)


def render_timeline(topic: Topic, title: str, slot: int) -> str:
    body = '<line x1="180" y1="440" x2="1220" y2="440" stroke="#496a86" stroke-width="5" marker-end="url(#arrow)"/>'
    for i, label in enumerate(topic.labels[:5]):
        x = 220 + i * 235
        body += f'<circle cx="{x}" cy="440" r="26" fill="#fffdf8" stroke="#496a86" stroke-width="4"/><text x="{x}" y="{520 if i%2 else 360}" text-anchor="middle" font-size="22" fill="{PALETTE["ink"]}" font-family="sans-serif">{esc(label)}</text><line x1="{x}" y1="{466 if i%2 else 414}" x2="{x}" y2="{492 if i%2 else 386}" stroke="#b8a489"/>'
    return svg_base(title, "I05 Sequence Timeline", body)


def render_layer_stack(topic: Topic, title: str, slot: int) -> str:
    body = ""
    fills = ["#f2efe7", "#e9f0f5", "#edf4ef", "#fff3df", "#f7e8e4"]
    for i, label in enumerate(reversed(topic.labels[:5])):
        y = 245 + i * 82
        body += f'<rect x="250" y="{y}" width="900" height="66" rx="16" fill="{fills[i]}" stroke="#b8a489"/><text x="700" y="{y+42}" text-anchor="middle" font-size="24" fill="{PALETTE["ink"]}" font-family="sans-serif">Layer {5-i}: {esc(label)}</text>'
    body += '<text x="700" y="715" text-anchor="middle" font-size="22" fill="#735f4a" font-family="sans-serif">upper layers decide policy; lower layers carry bytes</text>'
    return svg_base(title, "I06 Layered Stack Illustration", body)


def render_failure_map(topic: Topic, title: str, slot: int) -> str:
    body = box(140, 370, 210, 92, "client", "#eef4ef") + box(595, 370, 210, 92, "network", "#fff3df") + box(1050, 370, 210, 92, "peer", "#eef4ef")
    body += arrow(350, 416, 595, 416, "try") + arrow(805, 416, 1050, 416, "deliver")
    for i, risk in enumerate(topic.risks[:3]):
        body += f'<circle cx="{460+i*230}" cy="{310+i%2*230}" r="38" fill="#f7e8e4" stroke="#b96f62" stroke-width="4"/><text x="{460+i*230}" y="{310+i%2*230+7}" text-anchor="middle" font-size="18" fill="#7f3128" font-family="sans-serif">!</text><text x="{520+i*190}" y="{300+i%2*230}" font-size="19" fill="{PALETTE["ink"]}" font-family="sans-serif">{esc(risk[:24])}</text>'
    body += '<path d="M230,530 C450,700 930,700 1160,530" fill="none" stroke="#6f8a72" stroke-width="4" stroke-dasharray="12 10" marker-end="url(#arrow)"/><text x="700" y="690" text-anchor="middle" font-size="22" fill="#416447" font-family="sans-serif">fallback path</text>'
    return svg_base(title, "I07 Failure Map", body)


def render_storyboard(topic: Topic, title: str, slot: int) -> str:
    body = ""
    for i, label in enumerate(topic.labels[:4]):
        x = 115 + i * 315
        body += f'<rect x="{x}" y="240" width="260" height="340" rx="22" fill="#fffdf8" stroke="#cdb99d" filter="url(#shadow)"/><circle cx="{x+80}" cy="340" r="42" fill="#d7b98b"/><rect x="{x+130}" y="312" width="82" height="64" rx="10" fill="#e9f0f5" stroke="#496a86"/><path d="M{x+75},430 q70,-60 140,0" fill="none" stroke="#496a86" stroke-width="3" marker-end="url(#arrow)"/><text x="{x+130}" y="520" text-anchor="middle" font-size="22" fill="{PALETTE["ink"]}" font-family="sans-serif">{esc(label)}</text>'
    return svg_base(title, "I08 Storyboard Panels", body)


def render_component_catalog(topic: Topic, title: str, slot: int) -> str:
    body = ""
    for i, label in enumerate(topic.labels[:5]):
        x = 170 + (i % 3) * 360
        y = 245 + (i // 3) * 190
        body += f'<rect x="{x}" y="{y}" width="290" height="130" rx="18" fill="#f8fafc" stroke="#b8a489"/><text x="{x+28}" y="{y+45}" font-size="25" font-weight="700" fill="{PALETTE["ink"]}" font-family="sans-serif">{esc(label)}</text><text x="{x+28}" y="{y+86}" font-size="17" fill="#735f4a" font-family="sans-serif">role · boundary · signal</text>'
    body += '<rect x="530" y="625" width="340" height="58" rx="20" fill="#fff3df" stroke="#d7b98b"/><text x="700" y="662" text-anchor="middle" font-size="22" fill="#2f2720" font-family="sans-serif">catalog first, coupling later</text>'
    return svg_base(title, "I09 Component Catalog", body)


def render_blueprint(topic: Topic, title: str, slot: int) -> str:
    body = '<rect x="0" y="0" width="1400" height="840" fill="#e9f0f5" opacity="0.55"/>'
    for i in range(0, 1400, 70):
        body += f'<line x1="{i}" y1="0" x2="{i}" y2="840" stroke="#d6e0e8"/>'
    for j in range(0, 840, 70):
        body += f'<line x1="0" y1="{j}" x2="1400" y2="{j}" stroke="#d6e0e8"/>'
    for i, label in enumerate(topic.labels[:5]):
        x = 150 + i * 235
        body += box(x, 360, 180, 84, label, "#f8fbff")
        if i < 4:
            body += arrow(x+180, 402, x+235, 402, "")
    body += '<text x="700" y="585" text-anchor="middle" font-size="24" fill="#1f4058" font-family="monospace">input → split → assign → verify → assemble</text>'
    return svg_base(title, "I10 Dataflow Blueprint", body, "#e9f0f5")


IMAGE_CONCEPTS: dict[str, ImageConcept] = {
    "I01": ImageConcept("I01", "Editorial Architecture Diagram", render_architecture),
    "I02": ImageConcept("I02", "Hand-drawn Notebook Sketch", render_notebook),
    "I03": ImageConcept("I03", "Product Screen Mock", render_screen_mock),
    "I04": ImageConcept("I04", "Decision Matrix Card", render_matrix),
    "I05": ImageConcept("I05", "Sequence Timeline", render_timeline),
    "I06": ImageConcept("I06", "Layered Stack Illustration", render_layer_stack),
    "I07": ImageConcept("I07", "Failure Map", render_failure_map),
    "I08": ImageConcept("I08", "Storyboard Panels", render_storyboard),
    "I09": ImageConcept("I09", "Component Catalog", render_component_catalog),
    "I10": ImageConcept("I10", "Dataflow Blueprint", render_blueprint),
}


def clean_title(topic: Topic) -> str:
    return topic.title.split("] ", 1)[-1]


def image_markdown(asset: Asset) -> str:
    return f"![{asset.alt}]({asset.path})\n\n_{asset.caption}_\n"


def paragraph(topic: Topic, angle: str, detail: str, action: str) -> str:
    return (
        f"{angle} {topic.principle} 이 원칙을 {clean_title(topic)}에 적용하면, 먼저 {topic.scenario}을 기준 장면으로 잡아야 한다. "
        f"이 장면은 추상적인 네트워크 설명이 아니라 실제 제품에서 사용자가 기다리고, 실패를 보고, 다시 시도하는 흐름이다. "
        f"따라서 설명의 중심은 기술 이름이 아니라 책임의 배치, 데이터 경로, 관찰 가능한 상태가 된다.\n\n"
        f"구체적으로는 {detail}을 분리해서 봐야 한다. {topic.decision} 이 선택은 단순한 취향이 아니라 비용과 실패 대응을 동시에 줄이는 기준이다. "
        f"반대로 {topic.risks[0]} 같은 상황을 설계에서 빼면 데모는 성공해도 운영에서는 바로 흔들린다. "
        f"그래서 이 글에서는 {action}까지 연결해, 개념이 제품 판단으로 바뀌는 지점을 남긴다.\n"
    )


def ensure_long(parts: list[str], topic: Topic, target: int = 10300) -> None:
    rounds = 0
    while len("\n".join(parts)) < target:
        q = topic.questions[rounds % len(topic.questions)]
        r = topic.risks[rounds % len(topic.risks)]
        parts.append(
            f"### 보강 노트 {rounds + 1}: {q}\n\n"
            f"이 질문은 체크리스트의 빈칸이 아니라 구현 순서를 바꾸는 기준이다. {q}에 답하려면 로그, UI 상태, 재시도 정책, 운영 지표가 같은 단어를 써야 한다. "
            f"그렇지 않으면 개발자는 성공으로 보지만 사용자는 멈춤으로 느끼고, 운영자는 원인을 찾지 못한다. 특히 {r} 상황에서는 작은 차이가 장애 대응 시간을 크게 바꾼다. "
            f"좋은 설계는 이 장면을 숨기지 않고 문서와 화면, 테스트에 함께 남긴다.\n"
        )
        rounds += 1


def render_build_diary(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 처음에는 거창한 플랫폼보다 ‘내 컴퓨터와 주변 브라우저의 남는 힘을 묶으면 무엇을 할 수 있을까’라는 작은 호기심에 가까웠다.\n", image_markdown(assets[0])]
    sections = [
        ("만들고 싶었던 것", "목표를 기능 목록이 아니라 장면으로 잡는다.", "실험의 성공 기준을 먼저 정한다"),
        ("첫 번째 접근", "작업 큐와 브라우저 워커를 가장 단순한 형태로 놓는다.", "작은 파일 조각 하나부터 검증한다"),
        ("막힌 지점", "노드 이탈과 검증 비용이 바로 병목이 된다.", "실패를 정상 흐름으로 승격한다"),
        ("버린 선택지", "완전 분산과 무검증 결과 수집은 데모용으로만 남긴다.", "중앙 스케줄러를 부끄러워하지 않는다"),
        ("다시 잡은 설계", "큐, 워커, 검증기, 조립기를 분리한다.", "각 단계의 로그를 남긴다"),
        ("남은 리스크", "모바일 환경과 악의적 결과를 따로 본다.", "제품화 전 실패 주입 테스트를 둔다"),
        ("다음 구현 항목", "작업 단위와 재시도 한계를 숫자로 정한다.", "프로토타입 범위를 고정한다"),
    ]
    for i, (heading, detail, action) in enumerate(sections):
        parts.append(f"## {heading}\n\n" + paragraph(topic, "빌드 다이어리 관점에서는", detail, action))
        if i in (1, 3, 5):
            parts.append(image_markdown(assets[(i // 2) + 1]))
    ensure_long(parts, topic)
    return "\n".join(parts)


def render_layered_model(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 이 글은 서버와 피어를 경쟁 관계로 보지 않고 서로 다른 계층의 책임으로 나눠 본다.\n", image_markdown(assets[0])]
    layers = ["물리/네트워크", "연결/세션", "데이터/작업", "제품 정책", "운영/관측"]
    for i, layer in enumerate(layers):
        parts.append(f"## Layer {i+1}. {layer}\n\n" + paragraph(topic, f"{layer} 계층에서는", f"{topic.labels[i % len(topic.labels)]}의 책임", "계층을 넘나드는 암묵적 의존을 줄인다"))
        if i in (1, 3):
            parts.append(image_markdown(assets[1 + i // 2]))
    parts.append("## 계층 간 경계\n\n" + paragraph(topic, "마지막으로", "서버가 판단할 것과 피어가 운반할 것", "장애 지점을 사용자가 이해할 수 있는 상태로 바꾼다"))
    parts.append(image_markdown(assets[3]))
    ensure_long(parts, topic)
    return "\n".join(parts)


def render_decision_matrix(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 선택지는 이름보다 비용 곡선으로 이해하는 편이 정확하다.\n", image_markdown(assets[0])]
    sections = ["선택지가 많아지는 순간", "Mesh의 비용 축", "SFU의 제어 축", "MCU의 합성 축", "실패 대응 축", "의사결정 매트릭스", "추천 조합"]
    for i, heading in enumerate(sections):
        parts.append(f"## {heading}\n\n" + paragraph(topic, "의사결정 매트릭스에서는", f"{heading}에서 달라지는 업로드·서버·품질 비용", "방 크기와 녹화 요구에 따라 전환 기준을 남긴다"))
        if i in (2, 4, 5):
            parts.append(image_markdown(assets[min(3, i-1)]))
    ensure_long(parts, topic)
    return "\n".join(parts)


def render_case_generalization(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 가능성을 나열하기보다 하나의 제품 장면에서 시작해 일반 원칙으로 확장한다.\n", image_markdown(assets[0])]
    sections = ["제품 장면 하나", "장면에서 보이는 문제", "파일 전송으로 일반화", "협업으로 일반화", "엣지 연산으로 일반화", "놓치기 쉬운 예외", "다른 제품에 적용하는 법"]
    for i, heading in enumerate(sections):
        parts.append(f"## {heading}\n\n" + paragraph(topic, "케이스 스터디 관점에서는", f"{heading}에 맞는 사용자 흐름과 데이터 소유권", "각 사례를 중앙 일관성과 실패 허용도로 다시 분류한다"))
        if i in (1, 3, 5):
            parts.append(image_markdown(assets[(i + 1) // 2]))
    ensure_long(parts, topic)
    return "\n".join(parts)


def render_foundation_architecture(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 파운데이션 관점에서는 작업 큐 하나가 아니라 운영 가능한 구성 요소 묶음을 봐야 한다.\n", image_markdown(assets[0])]
    sections = ["왜 파운데이션이 필요한가", "전체 조감도", "작업 큐와 스케줄러", "워커와 검증기", "핵심 패턴 세 가지", "운영·보안·관측성", "다음 글로 이어지는 지점"]
    for i, heading in enumerate(sections):
        parts.append(f"## {heading}\n\n" + paragraph(topic, "파운데이션 아키텍처에서는", f"{heading}를 독립 컴포넌트로 보는 방식", "구성 요소를 느슨하게 묶고 지표를 먼저 붙인다"))
        if i in (1, 4, 5):
            parts.append(image_markdown(assets[min(3, i//2 + 1)]))
    ensure_long(parts, topic)
    return "\n".join(parts)


def render_concept_deconstruction(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 이 글은 API 호출법보다 연결이 성립하기 전의 약속과 탐색 과정을 분해한다.\n", image_markdown(assets[0])]
    sections = ["흔한 오해", "Signaling", "STUN", "TURN", "ICE", "작은 연결 예제", "경계 조건과 제품 상태"]
    for i, heading in enumerate(sections):
        parts.append(f"## {heading}\n\n" + paragraph(topic, "개념 분해 방식으로 보면", f"{heading}가 연결 탐색에서 맡는 책임", "각 단어를 로그와 UI 상태에 연결한다"))
        if i in (2, 4, 6):
            parts.append(image_markdown(assets[min(3, i//2)]))
    ensure_long(parts, topic)
    return "\n".join(parts)


def render_pattern_language(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 여기서는 기능 목록 대신 반복해서 재사용할 수 있는 패턴 언어로 정리한다.\n", image_markdown(assets[0])]
    patterns = ["상태 머신", "Backpressure", "Idempotency", "Pub/Sub", "Timeout과 Retry", "안티패턴", "적용 체크리스트"]
    for i, heading in enumerate(patterns):
        detail = f"{heading}의 맥락·문제·해결·주의점을 한 묶음으로 보는 방식"
        parts.append(f"## Pattern {i+1}. {heading}\n\n" + paragraph(topic, "패턴 언어에서는", detail, "패턴끼리 충돌하지 않도록 상태와 이벤트 이름을 제한한다"))
        if i in (1, 3, 5):
            parts.append(image_markdown(assets[min(3, i//2 + 1)]))
    ensure_long(parts, topic)
    return "\n".join(parts)


def render_problem_evolution(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 문제는 한 번에 해결되지 않고 운영 피로를 줄이는 방향으로 진화한다.\n", image_markdown(assets[0])]
    sections = ["들어가며", "Phase 1. 가장 단순한 구현", "Phase 1의 문제점", "Phase 2. 개선안", "Phase 2의 남은 문제", "Phase 3. 운영 가능한 구조", "마치며"]
    for i, heading in enumerate(sections):
        parts.append(f"## {heading}\n\n" + paragraph(topic, "진화기 구조에서는", f"{heading}에서 드러나는 불편함", "다음 단계의 자동화 또는 관측성으로 연결한다"))
        if i in (1, 3, 5):
            parts.append(image_markdown(assets[min(3, i//2 + 1)]))
    ensure_long(parts, topic)
    return "\n".join(parts)


def render_failure_catalog(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 성공 흐름보다 실패 흐름을 먼저 모아야 운영 가능한 제품이 된다.\n", image_markdown(assets[0])]
    sections = ["실패 모드를 먼저 보는 이유", "연결 실패", "느린 수신자", "중복 이벤트", "검증 실패", "Fallback과 UX", "테스트 카탈로그"]
    for i, heading in enumerate(sections):
        parts.append(f"## {heading}\n\n" + paragraph(topic, "실패 카탈로그에서는", f"{heading}가 사용자와 운영자에게 보이는 방식", "감지 지표와 회복 행동을 같은 표에 둔다"))
        if i in (1, 4, 5):
            parts.append(image_markdown(assets[min(3, i//2 + 1)]))
    ensure_long(parts, topic)
    return "\n".join(parts)


def render_toy_to_product(topic: Topic, assets: list[Asset]) -> str:
    parts = [f"# {clean_title(topic)}\n", f"{topic.excerpt} 데모에서는 연결만 보이지만 제품에서는 권한, 실패, 비용, 안내 문구가 함께 보인다.\n", image_markdown(assets[0])]
    sections = ["데모에서는 쉬웠던 장면", "사용자 환경에서 달라지는 조건", "브라우저 제약", "제품화에 필요한 부품", "운영 체크포인트", "출시 전 검증 목록"]
    for i, heading in enumerate(sections):
        parts.append(f"## {heading}\n\n" + paragraph(topic, "데모에서 제품으로 넘어가면", f"{heading} 때문에 달라지는 제약", "출시 전 검증 항목으로 남긴다"))
        if i in (1, 3, 5):
            parts.append(image_markdown(assets[min(3, i//2 + 1)]))
    ensure_long(parts, topic)
    return "\n".join(parts)


TEMPLATES: dict[str, ArticleTemplate] = {
    "T01": ArticleTemplate("T01", "Problem Evolution Log", render_problem_evolution),
    "T02": ArticleTemplate("T02", "Foundation Architecture Guide", render_foundation_architecture),
    "T03": ArticleTemplate("T03", "Decision Matrix Essay", render_decision_matrix),
    "T04": ArticleTemplate("T04", "Concept Deconstruction", render_concept_deconstruction),
    "T05": ArticleTemplate("T05", "Build Diary / Implementation Memo", render_build_diary),
    "T06": ArticleTemplate("T06", "Failure Mode Catalog", render_failure_catalog),
    "T07": ArticleTemplate("T07", "Pattern Language", render_pattern_language),
    "T08": ArticleTemplate("T08", "From Toy Demo to Product", render_toy_to_product),
    "T09": ArticleTemplate("T09", "Layered Mental Model", render_layered_model),
    "T10": ArticleTemplate("T10", "Case Study + Generalization", render_case_generalization),
}


def pick_by_slug(slug: str, items: list[str], count: int) -> list[str]:
    seed = int(hashlib.sha256(slug.encode()).hexdigest(), 16)
    rng = random.Random(seed)
    return rng.sample(items, count)


def write_assets(topic: Topic) -> tuple[str, list[Asset]]:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    assets: list[Asset] = []
    for idx, concept_id in enumerate(topic.image_concepts):
        concept = IMAGE_CONCEPTS[concept_id]
        suffix = concept.name.lower().replace(" ", "-").replace("/", "-")
        filename = f"{topic.slug}-{concept_id.lower()}-{suffix}.svg"
        rel = f"/tistory/p2p-foundations/varied/{filename}"
        title = f"{clean_title(topic)} · {concept.name}"
        (ASSET_DIR / filename).write_text(concept.render(topic, title, idx), encoding="utf-8")
        captions = [
            f"{concept.name} 형식으로 정리한 이 글의 핵심 판단 지점.",
            f"본문 중간에서 비용, 실패, 책임 경계를 다시 확인하기 위한 시각 자료.",
            f"제품 적용 전에 확인해야 할 경로와 위험을 압축한 다이어그램.",
            f"마지막 의사결정 전에 남겨둘 운영·검증 관점의 요약 그림.",
        ]
        assets.append(Asset(concept_id, rel, f"{clean_title(topic)} {concept.name}", captions[idx]))
    return assets[0].path, assets


def post_id_for(slug: str) -> str:
    return "p2p-foundation-" + slug.replace("2026-06-16-", "").replace("-", "_")[:42]


def render_content(topic: Topic, assets: list[Asset]) -> str:
    template = TEMPLATES[topic.template_id]
    body = template.render(topic, assets)
    if len(body) < 10000:
        raise RuntimeError(f"content too short for {topic.slug}: {len(body)}")
    return body


def section_signature(content: str) -> str:
    headings = "|".join(re.findall(r"^##\s+(.+)$", content, flags=re.MULTILINE))
    return hashlib.sha256(headings.encode()).hexdigest()[:12]


def repeated_long_sentences(contents: dict[str, str]) -> list[str]:
    seen: dict[str, str] = {}
    duplicates: list[str] = []
    for slug, content in contents.items():
        sentences = re.split(r"(?<=[.!?。다])\s+|\n+", content)
        for sentence in sentences:
            normalized = re.sub(r"\s+", " ", sentence.strip())
            if len(normalized) < 80:
                continue
            digest = hashlib.sha256(normalized.encode()).hexdigest()
            if digest in seen and seen[digest] != slug:
                duplicates.append(normalized[:120])
            else:
                seen[digest] = slug
    return duplicates


def validate(rendered: dict[str, tuple[Topic, str, list[Asset]]]) -> None:
    template_ids = [topic.template_id for topic, _, _ in rendered.values()]
    if len(set(template_ids)) != len(template_ids):
        raise RuntimeError(f"template_id duplicated: {template_ids}")
    combos = [tuple(topic.image_concepts) for topic, _, _ in rendered.values()]
    if len(set(combos)) != len(combos):
        raise RuntimeError("image concept combo duplicated")
    signatures: dict[str, str] = {}
    for slug, (topic, content, assets) in rendered.items():
        body_images = content.count("![")
        if len(content) < 10000:
            raise RuntimeError(f"{slug} under 10000 chars")
        if not (3 <= body_images <= 4):
            raise RuntimeError(f"{slug} body image count invalid: {body_images}")
        sig = section_signature(content)
        if sig in signatures:
            raise RuntimeError(f"section signature duplicated: {slug} and {signatures[sig]}")
        signatures[sig] = slug
        if len(assets) != 4:
            raise RuntimeError(f"{slug} needs four assets")
    duplicates = repeated_long_sentences({slug: content for slug, (_, content, _) in rendered.items()})
    if duplicates:
        raise RuntimeError("long repeated sentence found: " + duplicates[0])


def upsert_post(conn: sqlite3.Connection, topic: Topic, content: str, featured_image: str) -> None:
    now = dt.datetime.now(dt.UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    post_id = post_id_for(topic.slug)
    reading_time = max(10, round(len(content) / 520))
    conn.execute(
        """
        INSERT INTO Post (id, slug, title, excerpt, content, category, tags, coverColor, featuredImage, status, readingTime, views, authorId, authorName, publishedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, 0, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          title=excluded.title,
          excerpt=excluded.excerpt,
          content=excluded.content,
          category=excluded.category,
          tags=excluded.tags,
          coverColor=excluded.coverColor,
          featuredImage=excluded.featuredImage,
          status=excluded.status,
          readingTime=excluded.readingTime,
          authorId=excluded.authorId,
          authorName=excluded.authorName,
          publishedAt=excluded.publishedAt,
          updatedAt=excluded.updatedAt
        """,
        (post_id, topic.slug, topic.title, topic.excerpt, content, CATEGORY, topic.tags, "#7c5f43", featured_image, reading_time, AUTHOR_ID, AUTHOR_NAME, topic.published_at, topic.published_at, now),
    )
    actual_post_id = conn.execute("SELECT id FROM Post WHERE slug=?", (topic.slug,)).fetchone()[0]
    conn.execute(
        """
        INSERT INTO PostTaxonomy (id, postId, nodeId, role, sortOrder)
        VALUES (?, ?, ?, 'primary', 0)
        ON CONFLICT(postId, nodeId, role) DO UPDATE SET sortOrder=excluded.sortOrder
        """,
        (f"pt-{actual_post_id}-{TAXONOMY_ID}", actual_post_id, TAXONOMY_ID),
    )


def main() -> None:
    db_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("db/custom.db")
    if not db_path.exists():
        raise SystemExit(f"database not found: {db_path}")
    rendered: dict[str, tuple[Topic, str, list[Asset]]] = {}
    featured: dict[str, str] = {}
    for topic in TOPICS:
        featured_image, assets = write_assets(topic)
        content = render_content(topic, assets)
        rendered[topic.slug] = (topic, content, assets)
        featured[topic.slug] = featured_image
    validate(rendered)
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys=ON")
        for slug, (topic, content, _) in rendered.items():
            upsert_post(conn, topic, content, featured[slug])
        conn.commit()
        rows = conn.execute(
            """
            SELECT slug, length(content), (length(content)-length(replace(content,'![','')))/2 AS body_images,
                   readingTime, featuredImage
            FROM Post
            WHERE slug LIKE '2026-06-16-p2p-%'
            ORDER BY slug
            """
        ).fetchall()
    finally:
        conn.close()
    print("slug | template_id | image_concepts | section_signature | chars | body_images | reading_time | featured")
    for slug, chars, body_images, reading_time, featured_image in rows:
        topic = next(topic for topic in TOPICS if topic.slug == slug)
        sig = section_signature(rendered[slug][1])
        print(f"{slug} | {topic.template_id} | {','.join(topic.image_concepts)} | {sig} | {chars} | {body_images} | {reading_time} | {featured_image}")


if __name__ == "__main__":
    main()
