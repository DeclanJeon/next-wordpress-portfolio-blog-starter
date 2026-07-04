#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import shutil
import sqlite3
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
WORKDIR = ROOT / "tmp" / "p2p-protocol-g001"
OUT_PATCH = WORKDIR / "p2p-protocol-g001-db-patch.json"
OUT_CANDIDATES = WORKDIR / "p2p-protocol-g001-candidate-posts.json"
OUT_REQUESTS = WORKDIR / "p2p-protocol-g001-imagegen-requests.json"
OUT_REQUESTS_JSONL = WORKDIR / "p2p-protocol-g001-imagegen-requests.jsonl"
OUT_REPORT = WORKDIR / "p2p-protocol-g001-generation-report.json"
PROMPT_DIR = WORKDIR / "imagegen-batch" / "prompts"
REQUESTS_BATCH = WORKDIR / "imagegen-batch" / "requests.jsonl"
GENERATED_DIR = WORKDIR / "generated-images"
PUBLIC_BODY_ROOT = ROOT / "public" / "tistory" / "body-images"
DB_PATH = ROOT / "db" / "custom.db"

IMAGE_SLOTS = [
    ("cover", "대표 장면"),
    ("flow", "흐름도"),
    ("failure", "실패 지도"),
    ("checklist", "점검표"),
]
BODY_SLOTS = ["flow", "failure", "checklist"]

TOPICS: list[dict[str, Any]] = [
    {
        "order": 1,
        "slug": "2026-07-04-p2p-protocol-01-dht-bittorrent-peer-discovery",
        "title": "[P2P 프로토콜] DHT와 BitTorrent식 peer discovery를 다시 보기",
        "excerpt": "피어를 찾는 일을 전송 이전의 별도 문제로 두고 DHT, tracker, magnet link가 나누는 책임을 정리한다.",
        "tags": "공부 노트,P2P,DHT,BitTorrent,Peer Discovery,Kademlia,Distributed Systems",
        "keyword": "DHT와 peer discovery",
        "labels": ["tracker", "DHT", "magnet", "peer list", "bootstrap"],
        "opening": "P2P를 처음 공부할 때는 연결이 붙은 뒤의 전송만 생각했다. 그런데 조금만 더 내려가면 더 앞선 질문이 나온다. 상대를 어떻게 찾을 것인가. 파일 조각을 누가 갖고 있는지, 어떤 피어가 살아 있는지, 처음 들어온 노드는 누구에게 물어봐야 하는지 정하지 못하면 DataChannel이든 TCP든 아무 의미가 없었다.",
        "memory": "BitTorrent를 다시 읽으면서 제일 크게 바뀐 감각은 tracker와 DHT를 경쟁 구도로 보지 않게 된 점이다. tracker는 중앙 주소록처럼 빠르게 시작하게 해 주고, DHT는 중앙 주소록이 약하거나 사라졌을 때도 swarm이 피어를 더듬어 찾게 해 준다. magnet link는 파일 자체보다 식별자와 발견 힌트를 먼저 건넨다.",
        "headings": [
            "전송보다 먼저 오는 발견 문제",
            "중앙 주소록을 지우면 책임이 사라질까",
            "DHT를 손으로 그리며 나눈 세 가지 책임",
            "BitTorrent가 보여 준 swarm의 감각",
            "PonsWarp에 바로 넣기 어려웠던 이유",
            "제품에서 peer discovery를 설명하는 법",
            "다음 구현 전에 남기는 점검표",
        ],
        "points": [
            "처음 참여한 피어가 bootstrap node를 모르면 네트워크는 시작되지 않는다.",
            "DHT는 모든 피어를 전부 아는 구조가 아니라 가까운 key 공간을 따라 물어보는 구조다.",
            "tracker가 있으면 시작은 빠르지만 운영자는 주소록의 신뢰와 abuse를 책임져야 한다.",
            "magnet link는 파일 위치가 아니라 content identifier와 발견 경로를 같이 건네는 약속에 가깝다.",
            "피어 발견은 개인 정보, 네트워크 정책, 차단 대응, 악성 피어 필터링과 바로 연결된다.",
        ],
        "failure": "발견 계층을 숨기면 사용자는 전송 실패처럼 느끼지만 실제 장애는 피어 목록이 비었거나 bootstrap이 막힌 상태일 수 있다.",
        "decision": "PonsWarp 같은 브라우저 제품에서는 완전한 DHT보다 signaling 기반 초대와 제한된 peer directory가 먼저 현실적이다. 브라우저가 오래 살아 있는 노드가 아니고, 탭이 닫히면 주소록의 한 점이 바로 사라지기 때문이다.",
    },
    {
        "order": 2,
        "slug": "2026-07-04-p2p-protocol-02-libp2p-stack-boundaries",
        "title": "[P2P 프로토콜] libp2p는 라이브러리보다 경계 묶음에 가깝다",
        "excerpt": "libp2p를 transport, security, muxing, peer id, discovery, pubsub의 조합으로 읽고 제품 경계에 맞게 쪼갠다.",
        "tags": "공부 노트,P2P,libp2p,Transport,Peer ID,PubSub,Protocol Stack",
        "keyword": "libp2p 구조",
        "labels": ["peer id", "transport", "security", "muxing", "pubsub"],
        "opening": "libp2p라는 이름을 처음 보면 P2P를 한 번에 해결해 주는 큰 라이브러리처럼 보인다. 나도 처음에는 그렇게 읽었다. 그런데 문서를 따라가다 보면 libp2p는 하나의 마법 함수가 아니라 여러 경계를 붙인 스택에 가깝다. transport를 고르고, peer id를 만들고, 보안 채널을 열고, 여러 stream을 multiplexing하고, discovery와 pubsub를 붙여야 비로소 제품에 가까워진다.",
        "memory": "이 구조가 좋았던 이유는 답을 하나로 고정하지 않는다는 점이었다. TCP, QUIC, WebSocket, WebTransport 같은 경로가 다르고, Noise 같은 보안 계층과 mplex/yamux 같은 stream 경계가 따로 있다. 대신 이 자유도는 곧 선택 비용이 된다. 어떤 모듈을 왜 쓰는지 적지 않으면 스택이 제품의 언어를 덮어 버린다.",
        "headings": [
            "라이브러리 이름 뒤에 숨은 여러 층",
            "peer id는 사용자 id가 아니다",
            "transport를 바꾸면 실패 모양도 바뀐다",
            "stream multiplexing이 제품에 주는 힌트",
            "pubsub는 채팅방이 아니라 전파 규칙이다",
            "브라우저 제품에서 libp2p를 그대로 삼키기 어려운 이유",
            "나중에 스택을 고를 때 볼 질문",
        ],
        "points": [
            "peer id는 네트워크 주체를 식별하지만 결제 계정이나 앱 사용자와 같은 말이 아니다.",
            "transport는 연결 가능성과 방화벽 통과 가능성을 바꾼다.",
            "보안 채널은 인증과 암호화를 담당하지만 제품 권한 정책을 대신하지 않는다.",
            "multiplexing은 하나의 연결 위에 여러 stream을 얹지만 각 stream의 backpressure 정책은 따로 봐야 한다.",
            "pubsub는 메시지를 퍼뜨리는 규칙이지 정확히 한 번 전달되는 업무 큐가 아니다.",
        ],
        "failure": "libp2p를 통째로 도입하면 문제를 해결한 듯 보이지만, 실제로는 어떤 계층에서 실패했는지 로그가 더 흐려질 수 있다.",
        "decision": "제품에 넣을 때는 libp2p 전체보다 peer id, discovery, stream, pubsub 중 어느 감각이 필요한지 먼저 고르는 편이 안전하다.",
    },
    {
        "order": 3,
        "slug": "2026-07-04-p2p-protocol-03-webtransport-quic-vs-webrtc",
        "title": "[P2P 프로토콜] WebTransport와 QUIC은 WebRTC를 대체할까",
        "excerpt": "WebTransport, QUIC, WebRTC를 연결 대상, 서버 역할, 브라우저 지원, NAT 통과 기준으로 비교한다.",
        "tags": "공부 노트,WebTransport,QUIC,WebRTC,P2P,Transport Protocol",
        "keyword": "WebTransport·QUIC·WebRTC 비교",
        "labels": ["QUIC", "WebTransport", "WebRTC", "NAT", "server endpoint"],
        "opening": "WebTransport와 QUIC을 처음 보면 WebRTC보다 훨씬 단정해 보인다. HTTP/3 위에서 stream과 datagram을 다루고, head-of-line blocking을 줄이고, 브라우저 API도 DataChannel보다 명확해 보인다. 그래서 한동안은 이것이 WebRTC 파일 전송의 더 깔끔한 대체재가 될 수 있지 않을까 생각했다.",
        "memory": "하지만 비교표를 그리면 바로 조심스러워진다. WebTransport는 브라우저와 서버 endpoint 사이를 잘 다루는 쪽에 가깝다. WebRTC는 브라우저끼리 연결하려는 욕심에서 NAT traversal, ICE, STUN, TURN 같은 무거운 장치를 끌고 온다. 둘 다 bytes를 다룰 수 있지만, 어느 쪽이 피어를 찾고 어느 쪽이 서버를 기준으로 삼는지 다르다.",
        "headings": [
            "깔끔한 API가 같은 문제를 푸는 것은 아니다",
            "QUIC stream과 DataChannel을 같은 줄에 놓기",
            "서버 endpoint가 있는 전송과 peer candidate가 있는 전송",
            "NAT traversal을 누가 책임지는가",
            "파일 전송 관점에서 보이는 차이",
            "PonsWarp가 두 선택지를 같이 볼 수밖에 없는 이유",
            "나중에 다시 비교할 기준",
        ],
        "points": [
            "WebTransport는 서버와의 저지연 양방향 전송에 강하다.",
            "WebRTC는 브라우저끼리 직접 연결하려는 모델 안에 ICE 절차를 포함한다.",
            "QUIC stream은 전송의 성질을 바꾸지만 peer discovery를 해결하지 않는다.",
            "TURN 비용을 피하려는 목적이라면 WebTransport가 자동 해답이 되지는 않는다.",
            "서버가 데이터를 잠시라도 중계해도 되는 제품인지 먼저 정해야 한다.",
        ],
        "failure": "API 모양만 보고 WebTransport를 고르면 서버 경유 구조가 제품 원칙과 충돌할 수 있고, WebRTC만 고집하면 브라우저 연결 실패와 TURN 비용을 계속 떠안게 된다.",
        "decision": "대용량 파일에서는 직접 전송을 우선하되, 비동기 수신이나 모바일 백그라운드 구간은 WebTransport/QUIC 기반 relay나 edge buffer와 섞는 판단이 현실적이다.",
    },
    {
        "order": 4,
        "slug": "2026-07-04-p2p-protocol-04-crdt-p2p-collaboration",
        "title": "[P2P 프로토콜] CRDT와 P2P 협업은 왜 같이 이야기될까",
        "excerpt": "CRDT를 충돌 없는 마법이 아니라 offline-first 협업에서 merge 책임을 데이터 구조로 옮기는 선택으로 정리한다.",
        "tags": "공부 노트,CRDT,P2P,Collaboration,Offline First,Conflict Resolution",
        "keyword": "CRDT와 P2P 협업",
        "labels": ["operation", "merge", "clock", "offline", "replica"],
        "opening": "P2P 협업을 상상하면 가장 먼저 떠오르는 장면은 같은 문서를 여러 사람이 동시에 고치는 모습이다. 서버 없이도 각자 편집하고, 나중에 만나면 알아서 합쳐지는 그림이다. 멋있지만 동시에 위험하다. 네트워크가 끊긴 동안 두 사람이 같은 문장을 고치면 무엇이 진짜인가. 누가 먼저였는지 모르면 어떤 변경을 남겨야 하는가.",
        "memory": "CRDT를 공부하면서 마음이 편해진 부분은 충돌을 없애 준다는 문장이 아니었다. 오히려 충돌을 데이터 구조 안에서 다룰 수 있게 만드는 방식이라는 점이었다. replica마다 operation을 만들고, causal order를 최대한 보존하고, 합쳐도 같은 결과가 되도록 규칙을 세운다. 서버가 모든 순서를 정하지 못하는 환경에서 merge 규칙을 제품이 명시하는 셈이다.",
        "headings": [
            "동시 편집에서 먼저 깨지는 것은 순서다",
            "CRDT는 충돌을 숨기는 마법이 아니다",
            "operation을 저장한다는 감각",
            "P2P 협업에서 서버가 사라지지 않는 부분",
            "UX는 merge 결과를 설명해야 한다",
            "PonsLink 화이트보드를 떠올리며 본 기준",
            "협업 기능을 넣기 전 질문",
        ],
        "points": [
            "각 replica가 같은 operation set을 받으면 같은 상태로 수렴해야 한다.",
            "문자열 편집, presence, cursor, drawing stroke는 서로 다른 merge 규칙이 필요하다.",
            "서버가 없어도 identity, 권한, snapshot 백업, abuse 대응은 남는다.",
            "사용자는 충돌 해결 알고리즘보다 왜 내 편집이 이렇게 보이는지 알고 싶어 한다.",
            "offline-first는 로컬 저장소와 sync 로그를 제품의 중심으로 끌어온다.",
        ],
        "failure": "CRDT를 쓰면 충돌이 사라진다고 설명하면 실제 화면에서 이상하게 합쳐진 문장을 사용자가 버그로 느끼는 순간 방어할 말이 없다.",
        "decision": "협업 제품에서는 CRDT를 기술 이름으로 앞세우기보다 어떤 데이터가 자동 merge 대상이고 어떤 데이터는 사용자 확인이 필요한지 먼저 나눠야 한다.",
    },
    {
        "order": 5,
        "slug": "2026-07-04-p2p-protocol-05-p2p-security-trust-boundary",
        "title": "[P2P 보안] P2P에서 trust boundary는 어디에 그어야 할까",
        "excerpt": "직접 연결이 곧 신뢰가 되는 착각을 버리고 peer identity, capability, encryption, abuse boundary를 나눠 본다.",
        "tags": "공부 노트,P2P Security,Trust Boundary,Capability,Encryption,Abuse Prevention",
        "keyword": "P2P 보안 모델",
        "labels": ["identity", "capability", "encryption", "abuse", "audit"],
        "opening": "P2P라는 말에는 묘한 친밀감이 있다. 서버를 덜 거치고 사용자끼리 직접 연결된다고 하면 더 개인적이고 더 안전할 것처럼 들린다. 하지만 직접 연결은 신뢰와 같은 말이 아니다. 오히려 상대 피어가 어떤 데이터를 보낼 수 있는지, 어떤 요청을 할 수 있는지, 어디까지 기록해야 하는지 더 조심스럽게 정해야 한다.",
        "memory": "PonsLink와 PonsWarp를 떠올리면 이 경계가 계속 돌아온다. 방에 들어온 사람은 누구인가. 링크를 가진 사람은 어느 기능까지 쓸 수 있는가. 파일을 보내는 피어가 실제 약속한 파일을 보내는가. 암호화된 채널이 있다고 해서 제품 권한이 해결되는 것은 아니다. 보안 채널은 길을 보호하고, 권한 정책은 행동을 제한한다.",
        "headings": [
            "직접 연결은 신뢰의 증거가 아니다",
            "peer identity와 사용자 계정을 분리하기",
            "capability는 링크보다 작아야 한다",
            "암호화 채널과 제품 권한은 다른 층이다",
            "악성 피어를 제품이 어떻게 견딜까",
            "감사 로그를 어디까지 남길 것인가",
            "P2P 기능을 켜기 전 보안 질문",
        ],
        "points": [
            "peer id는 네트워크 식별자이고 사용자 신원 보증은 별도 문제다.",
            "초대 링크에는 최소 권한과 만료가 있어야 한다.",
            "암호화는 전송 중 노출을 줄이지만 잘못된 파일이나 스팸 요청을 막지 않는다.",
            "rate limit과 block list는 중앙 서버가 없을수록 더 설계하기 어렵다.",
            "민감한 제품에서는 어떤 metadata를 남길지와 남기지 않을지 둘 다 결정해야 한다.",
        ],
        "failure": "P2P라는 이름만 믿고 권한 경계를 흐리면 사용자는 직접 연결된 상대에게 너무 많은 행동 권한을 넘겨 버릴 수 있다.",
        "decision": "제품에서는 peer를 신뢰하는 것이 아니라 특정 시간, 특정 방, 특정 파일, 특정 행동만 허용하는 capability를 만들어야 한다.",
    },
    {
        "order": 6,
        "slug": "2026-07-04-p2p-protocol-06-turn-server-cost-model",
        "title": "[TURN 운영] TURN 서버 비용은 어떻게 계산해야 할까",
        "excerpt": "TURN 비용을 예외 비용이 아니라 relay ratio, egress, region, 동시 세션, 품질 정책으로 나눠 계산한다.",
        "tags": "공부 노트,TURN,WebRTC Cost,Relay,Egress,Network Operations",
        "keyword": "TURN 서버 운영 비용",
        "labels": ["relay ratio", "egress", "region", "quota", "alert"],
        "opening": "P2P 구조를 이야기할 때 TURN 비용은 자주 뒤로 밀린다. 대부분 직접 연결될 것이고, TURN은 어쩔 수 없는 예외처럼 느껴진다. 나도 처음에는 그렇게 봤다. 하지만 운영 관점에서는 예외가 일정 비율 이상으로 쌓이는 순간 바로 비용 모델이 된다. 회사망, 학교망, 모바일망, 호텔 Wi-Fi가 섞이면 relay는 생각보다 자주 등장한다.",
        "memory": "TURN은 실패를 가리는 안전망이지만 동시에 가장 비싼 경로일 수 있다. 미디어든 파일이든 relay를 타면 서버 egress가 생긴다. region이 멀면 지연이 늘고, 가까운 region을 늘리면 고정 비용이 생긴다. 사용자는 P2P인지 TURN인지 보지 못한다. 제품은 품질과 비용 사이에서 어떤 순간에 relay를 허용할지 정해야 한다.",
        "headings": [
            "예외 경로가 비용 모델이 되는 순간",
            "relay ratio를 먼저 재야 한다",
            "egress는 파일 크기와 통화 시간에서 바로 나온다",
            "region 선택은 지연과 비용을 동시에 바꾼다",
            "quota와 품질 저하 문구를 같이 설계하기",
            "PonsWarp에서 TURN을 무제한으로 볼 수 없는 이유",
            "운영 대시보드에 남길 숫자",
        ],
        "points": [
            "relay ratio는 전체 연결 중 TURN을 탄 비율이다.",
            "egress는 전송한 payload 크기와 재전송, 중복 연결까지 포함해 본다.",
            "region은 가까울수록 좋지만 모든 지역에 둘 수는 없다.",
            "무료 플랜이라면 대용량 relay를 어디까지 허용할지 먼저 정해야 한다.",
            "알림은 월말 비용보다 relay 급증을 먼저 보여 줘야 한다.",
        ],
        "failure": "TURN을 fallback이라는 말로만 두면 무료 사용자가 큰 파일을 relay로 보내는 순간 비용과 품질 모두 설명하기 어려워진다.",
        "decision": "운영 기준은 직접 연결 성공률보다 relay를 탔을 때의 최대 손실을 먼저 계산하는 쪽이 안전하다.",
    },
    {
        "order": 7,
        "slug": "2026-07-04-p2p-protocol-07-merkle-chunk-integrity",
        "title": "[P2P 파일 무결성] chunk hash와 Merkle tree는 왜 필요할까",
        "excerpt": "대용량 P2P 파일 전송에서 전체 checksum만으로 부족한 이유와 chunk hash, Merkle root, 재시도 범위를 정리한다.",
        "tags": "공부 노트,P2P File Integrity,Merkle Tree,Chunk Hash,Checksum,File Transfer",
        "keyword": "Merkle tree와 chunk hash",
        "labels": ["chunk", "hash", "Merkle root", "resume", "verify"],
        "opening": "파일 전송에서 checksum을 붙이면 안전해 보인다. 전체 파일을 다 받은 뒤 hash를 계산해서 맞으면 성공, 틀리면 실패라고 보면 단순하다. 그런데 10GB 파일을 96%까지 받은 뒤 전체 hash가 틀렸다는 사실을 알게 되면 이 단순함은 갑자기 잔인해진다. 어디가 틀렸는지 모르기 때문에 다시 보내야 할 범위도 모른다.",
        "memory": "chunk hash와 Merkle tree를 공부한 이유는 속도보다 복구 범위를 줄이고 싶어서였다. 각 chunk의 hash를 알면 어느 조각이 깨졌는지 바로 찾을 수 있다. Merkle root는 많은 chunk hash를 하나의 짧은 신뢰 기준으로 묶는다. 파일 전체를 한 번에 믿는 대신 작은 조각들을 검증하고, 필요한 조각만 다시 요청할 수 있다.",
        "headings": [
            "전체 checksum만으로는 너무 늦다",
            "chunk hash는 실패 위치를 좁힌다",
            "Merkle root가 주는 짧은 약속",
            "이어받기와 무결성 검증은 같이 움직인다",
            "악성 피어와 손상된 저장소를 구분하기",
            "PonsWarp 전송 로그에 남기고 싶은 값",
            "파일 무결성 설계 전 질문",
        ],
        "points": [
            "전체 hash는 최종 판정에는 좋지만 중간 복구에는 느리다.",
            "chunk hash는 재전송 범위를 작은 조각으로 줄인다.",
            "Merkle root는 많은 조각 검증 정보를 짧게 대표한다.",
            "resume offset만 믿으면 이미 저장된 조각이 깨졌는지 모를 수 있다.",
            "수신자는 저장 완료와 hash 검증 완료를 다른 상태로 기록해야 한다.",
        ],
        "failure": "진행률만 믿고 완료 처리하면 마지막 검증에서 깨진 파일을 발견했을 때 사용자는 거의 다 된 전송이 통째로 사라졌다고 느낀다.",
        "decision": "대용량 파일 전송에서는 progress, stored, verified를 분리하고 verified 기준으로 완료 문구를 내보내야 한다.",
    },
    {
        "order": 8,
        "slug": "2026-07-04-p2p-protocol-08-mobile-browser-background-limits",
        "title": "[P2P 브라우저] 모바일과 백그라운드는 왜 P2P 전송을 흔들까",
        "excerpt": "브라우저 탭 수명, 모바일 절전, 백그라운드 제한, 파일 저장 권한이 P2P 연결과 전송 상태를 어떻게 흔드는지 본다.",
        "tags": "공부 노트,P2P,Mobile Browser,Background Limits,WebRTC,File Transfer",
        "keyword": "모바일/브라우저 백그라운드 제약",
        "labels": ["tab life", "background", "battery", "resume", "permission"],
        "opening": "데스크톱 브라우저에서 P2P 파일 전송이 잘 되는 것을 보면 모바일도 비슷하게 될 것 같았다. 같은 WebRTC이고 같은 DataChannel이면 크게 다르지 않을 줄 알았다. 그런데 모바일 브라우저는 오래 켜진 서버가 아니다. 화면이 꺼지고, 탭이 밀리고, OS가 배터리를 아끼고, 파일 저장 권한이 예상과 다르게 움직인다.",
        "memory": "이 제약을 받아들이고 나서야 P2P 전송을 연결 문제로만 보지 않게 됐다. 모바일에서는 연결이 붙어도 전송 시간이 길어지는 순간 탭 수명이 문제로 바뀐다. 백그라운드로 내려간 뒤에도 같은 속도로 계속 보낼 수 있다고 믿으면 안 된다. 사용자는 앱을 잠깐 바꿨을 뿐인데 제품은 그 사이 전송 상태를 잃을 수 있다.",
        "headings": [
            "브라우저 탭은 항상 살아 있지 않다",
            "백그라운드 제한은 네트워크 문제가 아니다",
            "모바일 저장 권한이 전송 상태를 바꾼다",
            "resume state를 화면 밖에 둬야 하는 이유",
            "사용자 문구는 끊김을 탓하면 안 된다",
            "PonsWarp 모바일 흐름에서 먼저 줄여야 할 기대",
            "모바일 P2P를 켜기 전 점검",
        ],
        "points": [
            "탭이 백그라운드로 가면 timer와 네트워크 작업이 제한될 수 있다.",
            "OS 절전 정책은 브라우저 코드가 직접 제어하기 어렵다.",
            "파일 저장 권한과 다운로드 동작은 플랫폼마다 다르게 보인다.",
            "resume token과 chunk verification이 없으면 중간 복구가 거의 불가능하다.",
            "모바일에서는 직접 전송보다 안전한 중간 보관 경로가 더 나은 UX일 수 있다.",
        ],
        "failure": "모바일에서도 데스크톱처럼 계속 열어 두면 된다고 설명하면 사용자의 실제 행동과 제품의 전송 모델이 바로 어긋난다.",
        "decision": "모바일 경로에서는 직접 전송 성공률보다 사용자가 화면을 떠났을 때 어떤 상태로 보존할지 먼저 정해야 한다.",
    },
    {
        "order": 9,
        "slug": "2026-07-04-p2p-protocol-09-edge-serverless-hybrid-p2p",
        "title": "[P2P 설계] edge와 serverless를 P2P와 섞으면 무엇이 달라질까",
        "excerpt": "순수 P2P와 서버 중심 구조 사이에서 signaling, relay, metadata, async handoff를 edge/serverless로 나누는 혼합 구조를 설계한다.",
        "tags": "공부 노트,P2P,Edge,Serverless,Hybrid Architecture,WebRTC,Cloud Drop",
        "keyword": "P2P와 edge/serverless 혼합 구조",
        "labels": ["edge", "metadata", "relay", "handoff", "policy"],
        "opening": "P2P를 공부하다 보면 순수한 구조를 오래 붙잡게 된다. 서버는 연결만 돕고 데이터는 피어끼리 직접 보내는 그림이다. 원칙을 세우기에는 좋지만 제품을 오래 생각하면 순수함만으로는 부족해진다. 사용자는 동시에 접속하지 않을 수 있고, 모바일은 중간에 잠들 수 있고, 회사망에서는 TURN이 필요하고, 권한과 결제는 어딘가에서 확인해야 한다.",
        "memory": "그래서 edge와 serverless를 P2P와 섞는 그림을 다시 보게 됐다. 이것은 P2P를 포기하는 설계가 아니다. 데이터 payload를 항상 서버에 맡기는 대신, signaling, metadata, async handoff, 짧은 relay, 정책 판단을 가까운 실행 위치에 나눠 두는 방식이다. 나는 여기서 무엇을 직접 보내고 무엇을 잠깐 맡길지 공개적으로 정하는 일을 먼저 보게 됐다.",
        "headings": [
            "순수 P2P 그림이 제품에서 흔들리는 순간",
            "edge는 payload 서버가 아니라 가까운 정책 지점일 수 있다",
            "serverless handoff가 필요한 비동기 장면",
            "Cloud Drop은 실패가 아니라 모드 전환이다",
            "비용과 개인정보 경계를 같이 그리기",
            "PonsLink와 PonsWarp를 한 구조로 다시 보면",
            "혼합 구조를 설계하기 전 질문",
        ],
        "points": [
            "signaling과 권한 검사는 edge 가까이에 둘수록 체감 지연이 줄어든다.",
            "payload를 서버에 올릴지 여부는 파일 민감도와 동시 접속 가능성에 따라 달라진다.",
            "serverless는 긴 전송을 직접 붙잡기보다 짧은 handoff와 정책 판단에 맞다.",
            "Cloud Drop은 직접 전송 실패의 부끄러운 우회가 아니라 시간차를 다루는 별도 모드다.",
            "혼합 구조에서는 사용자가 어떤 경로로 전송 중인지 이해할 수 있어야 한다.",
        ],
        "failure": "순수 P2P만 약속하면 비동기 수신, 모바일 이탈, TURN 비용, 권한 확인 같은 제품 현실을 전부 예외로 밀어내게 된다.",
        "decision": "제품 설계에서는 direct, relay, cloud drop, metadata-only 서버를 모드로 분리하고 각 모드의 비용과 개인정보 경계를 화면 문구까지 연결해야 한다.",
    },
]


def image_path(slug: str, slot: str) -> str:
    return f"/tistory/body-images/{slug}/{slug}-{slot}.webp"


def image_markdown(topic: dict[str, Any], slot: str, caption: str) -> str:
    alt = f"{topic['keyword']} {dict(IMAGE_SLOTS)[slot]}"
    return f"![{alt}]({image_path(topic['slug'], slot)})\n\n*{caption}*"

def normalize_topic_particles(content: str, keyword: str) -> str:
    """Attach Korean particles to a safe noun wrapper instead of raw mixed terms."""
    replacements = {
        f"{keyword}는": f"{keyword} 주제는",
        f"{keyword}은": f"{keyword} 주제는",
        f"{keyword}를": f"{keyword} 주제를",
        f"{keyword}을": f"{keyword} 주제를",
        f"{keyword}가": f"{keyword} 주제가",
        f"{keyword}이": f"{keyword} 주제가",
        f"{keyword}에서": f"{keyword} 주제에서",
        f"{keyword}에서는": f"{keyword} 주제에서는",
        f"{keyword}의": f"{keyword} 주제의",
        f"{keyword}와": f"{keyword} 주제와",
        f"{keyword}과": f"{keyword} 주제와",
        f"{keyword}로": f"{keyword} 주제로",
        f"{keyword}으로": f"{keyword} 주제로",
    }
    for source, replacement in replacements.items():
        content = content.replace(source, replacement)
    content = content.replace(f"{keyword} 주제가 붙을 제품 장면", f"{keyword} 주제를 붙일 제품 장면")
    return content


def body_for(topic: dict[str, Any], previous_slug: str | None, next_slug: str | None) -> str:
    h = topic["headings"]
    p = topic["points"]
    labels = topic["labels"]
    title_label = topic["title"].split("] ", 1)[-1]
    kw_ref = f"`{topic['keyword']}`"
    topic_term = f"{topic['keyword']} 주제"
    label_terms = [f"{label} 항목" for label in labels]
    heading_terms = [f"{heading} 절" for heading in h]
    order = int(topic["order"])
    previous_line = f"이전 글의 질문은 {previous_slug} 쪽에서 여기로 넘어온다. 이번에는 같은 P2P라도 {label_terms[0]}과 {label_terms[1]} 쪽 책임을 더 좁혀 본다." if previous_slug else f"앞선 realtime-network 시리즈가 연결과 전송의 기본기를 닦았다면, 여기서는 {label_terms[0]}부터 다시 잡고 더 아래쪽 프로토콜 감각으로 내려간다."
    next_line = f"다음 노트에서는 {label_terms[2]} 관찰을 {label_terms[4]} 판단으로 넘긴다. 여기서 남긴 {label_terms[1]} 흔적이 다음 글의 출발점이 된다." if next_slug else "여기까지 지나면 순수 P2P와 현실적인 혼합 구조 사이에서 무엇을 고를지 조금 더 차갑게 볼 수 있다."

    field_words = [
        "주소록을 접는 순간 남는 책임",
        "라이브러리 이름 아래 숨은 경계",
        "깔끔한 전송 API가 놓치는 것",
        "동시 편집이 남기는 순서의 빚",
        "직접 연결과 신뢰 사이의 간격",
        "fallback이 비용표로 바뀌는 지점",
        "완료율보다 늦게 오는 검증",
        "브라우저 탭 수명이 만든 변수",
        "순수한 구조와 제품 약속 사이",
    ]
    field_word = field_words[(order - 1) % len(field_words)]
    sequence_notes = [
        "DHT 쪽에서는 연결 버튼보다 먼저 주소를 더듬는 순서가 보였다.",
        "libp2p를 읽을 때는 import 문보다 스택을 조립하는 순서가 먼저 눈에 들어왔다.",
        "WebTransport 비교에서는 API 모양보다 연결 대상이 정해지는 순서가 더 중요했다.",
        "CRDT 협업에서는 편집 이벤트가 어떤 순서로 합쳐지는지부터 붙잡아야 했다.",
        "P2P 보안에서는 직접 연결이 열리는 순간보다 권한이 좁혀지는 순서가 먼저였다.",
        "TURN 비용은 fallback이 켜진 뒤가 아니라 relay 판단이 시작되는 지점부터 계산해야 했다.",
        "파일 무결성에서는 완료 표시보다 어떤 조각을 먼저 믿을 수 있는지가 핵심이었다.",
        "모바일 브라우저에서는 전송 코드보다 탭이 살아 있는 시간이 먼저 조건이 됐다.",
        "edge/serverless 혼합 구조에서는 payload 경로보다 정책 판단이 배치되는 순서가 앞섰다.",
    ]
    failure_notes = [
        "그래서 이 주제는 전송 전에 비어 있을 수 있는 주소록 문제로 남긴다.",
        "그래서 이 주제는 라이브러리 도입기가 아니라 스택 경계 점검표로 남긴다.",
        "그래서 이 주제는 대체 기술 비교가 아니라 endpoint 책임 비교로 남긴다.",
        "그래서 이 주제는 자동 병합 홍보가 아니라 순서와 수렴 규칙의 기록으로 남긴다.",
        "그래서 이 주제는 안전하다는 인상보다 capability 경계의 기록으로 남긴다.",
        "그래서 이 주제는 예외 비용이 아니라 운영 비용이 시작되는 지점으로 남긴다.",
        "그래서 이 주제는 checksum 성공담이 아니라 복구 범위를 좁히는 기록으로 남긴다.",
        "그래서 이 주제는 네트워크 문제가 아니라 브라우저 수명 문제로 남긴다.",
        "그래서 이 주제는 순수 P2P 포기가 아니라 제품 약속을 분리하는 기록으로 남긴다.",
    ]
    server_notes = [
        "tracker를 지우면 누가 처음 피어를 알려 줄지 바로 빈칸이 생겼다.",
        "스택을 얇게 가져가도 peer identity와 transport 선택은 누군가 책임져야 했다.",
        "서버 endpoint가 남는 구조에서는 서버가 없어진 것이 아니라 역할이 또렷해진다.",
        "중앙 서버가 순서를 정하지 않아도 merge 규칙은 어딘가에 남아야 했다.",
        "중앙 권한 서버를 덜 보더라도 abuse와 revoke 경계는 사라지지 않았다.",
        "TURN을 예외라고 부르면 비용의 주인이 사라진다.",
        "전체 hash 하나만 믿으면 깨진 조각을 다시 찾는 책임이 마지막까지 밀린다.",
        "모바일에서 중앙 서버를 줄여도 resume state는 어딘가에 남아야 했다.",
        "edge를 쓰면 중앙 서버가 사라지는 것이 아니라 정책 판단 위치가 가까워진다.",
    ]
    sketch_notes = [
        "DHT 그림에서는 식별자, bootstrap, peer list가 서로 다른 선으로 갈라졌다.",
        "libp2p 그림에서는 peer id, transport, security, muxing이 같은 박스에 들어가면 안 됐다.",
        "WebTransport 비교 그림에서는 server endpoint와 peer candidate가 다른 출발선에 있었다.",
        "CRDT 그림에서는 operation log, replica, snapshot이 서로 다른 시간축을 만들었다.",
        "보안 그림에서는 identity, capability, audit가 한 선에 놓이면 곧바로 위험해졌다.",
        "TURN 그림에서는 direct, relay, quota가 비용 축 위에서 갈라졌다.",
        "무결성 그림에서는 chunk, stored, verified가 같은 진행률로 합쳐지면 안 됐다.",
        "모바일 그림에서는 tab life, permission, resume이 전송 선 옆에 따로 붙었다.",
        "혼합 구조 그림에서는 edge policy, relay, cloud drop이 payload 선과 분리됐다.",
    ]
    product_notes = [
        "PonsWarp에 붙이면 이 발견 문제는 파일 전송 버튼보다 먼저 시작된다.",
        "PonsLink/PonsWarp에 붙이면 libp2p는 통째 도입보다 필요한 계층만 빌리는 쪽에 가깝다.",
        "PonsWarp에 붙이면 WebTransport와 WebRTC는 승자 경쟁보다 모드 선택 문제가 된다.",
        "PonsLink에 붙이면 CRDT는 화이트보드와 presence를 같은 규칙으로 합칠 수 없다는 경고가 된다.",
        "PonsLink/PonsWarp에 붙이면 보안 모델은 방, 링크, 파일, 행동 권한을 각각 좁히는 일이다.",
        "PonsWarp에 붙이면 TURN은 성공률을 높이는 장치이면서 동시에 비용 한도 장치다.",
        "PonsWarp에 붙이면 Merkle와 chunk hash는 진행률보다 완료 문구를 늦게 내보내는 이유가 된다.",
        "PonsWarp 모바일 흐름에 붙이면 직접 전송보다 끊김 이후 설명이 먼저 필요하다.",
        "PonsLink/PonsWarp에 붙이면 edge와 serverless는 payload 서버가 아니라 책임 분리 장치가 된다.",
    ]
    prototype_notes = [
        "DHT 실험은 magnet만 있는 시작, tracker가 있는 시작, bootstrap이 막힌 시작이면 충분하다.",
        "libp2p 실험은 peer id만 고정한 연결, transport를 바꾼 연결, pubsub가 늦게 도착하는 연결로 나눈다.",
        "WebTransport 실험은 서버 endpoint 경로, WebRTC direct 경로, TURN으로 떨어지는 경로를 나란히 둔다.",
        "CRDT 실험은 동시에 같은 stroke를 고치는 장면, offline 편집 장면, 늦은 replica가 합류하는 장면을 둔다.",
        "보안 실험은 만료된 capability, 권한이 좁은 초대, 악성 peer 요청을 따로 만든다.",
        "TURN 실험은 direct 성공, relay 전환, quota 초과 후 품질 저하 문구를 따로 본다.",
        "무결성 실험은 정상 chunk, 깨진 chunk, 이미 저장됐지만 검증 안 된 chunk를 따로 만든다.",
        "모바일 실험은 화면 켜짐, 백그라운드 이동, 저장 권한 실패를 따로 둔다.",
        "혼합 구조 실험은 direct, relay, cloud drop 세 모드를 같은 파일로 비교한다.",
    ]
    lab_notes = [
        "DHT 실험은 몇 개의 peer를 띄우는 것으로 끝나지 않는다. bootstrap 주소가 틀렸을 때, tracker가 늦게 답할 때, 같은 info hash를 가진 peer가 서로 다른 조각을 들고 있을 때를 나눠야 한다. 실제 제품에서는 누가 피어를 찾았는지보다 사용자가 기다리는 동안 어떤 설명을 받는지가 더 크게 남는다. 발견이 늦으면 전송률 그래프는 시작도 못 한다.",
        "libp2p 실험은 기능을 많이 켜는 쪽보다 하나씩 빼 보는 쪽이 더 잘 드러난다. transport만 바꿨을 때 실패 로그가 어떻게 달라지는지, peer id를 새로 만들었을 때 기존 권한과 어떻게 갈라지는지, pubsub가 늦게 도착할 때 화면은 어떤 상태를 보여야 하는지 따로 적는다. 스택의 자유도는 관측 기준이 있을 때만 장점이 된다.",
        "WebTransport 실험은 WebRTC와 같은 파일을 보내게 해 놓고 비교해야 한다. 서버 endpoint까지는 빠르게 붙지만 peer discovery를 하지 않는다는 사실, 직접 연결이 아니어서 비용과 개인정보 문구가 달라진다는 사실, 모바일망에서 latency가 어떻게 튀는지를 같은 표에 둔다. API가 깔끔하다는 느낌은 실험 조건을 통과해야 제품 판단이 된다.",
        "CRDT 실험은 happy path보다 이상한 편집 순서를 먼저 만들어야 한다. 같은 객체를 동시에 고치고, 오프라인 replica가 늦게 들어오고, 이미 삭제된 stroke에 추가 수정이 붙는 장면을 만든다. 자동 merge가 성공해도 사용자가 보기에 이상하면 실패로 적는다. 협업 기능은 알고리즘 결과와 사용자의 납득 사이가 가장 자주 벌어진다.",
        "P2P 보안 실험은 공격자처럼 생각해야 한다. 만료된 링크를 다시 쓰고, 권한이 낮은 peer가 큰 파일을 요청하고, 정상 peer처럼 보이는 쪽이 작은 spam 메시지를 계속 보낸다. 암호화 채널이 열렸다는 사실은 이 행동들을 막지 않는다. 제품이 허용한 capability만 실제로 통과하는지 확인해야 직접 연결을 안전하다고 말할 수 있다.",
        "TURN 비용 실험은 연결 성공률만 보면 틀린다. 같은 파일을 direct, relay, region이 먼 relay로 보내 보고 전송 시간, egress, 재시도, 사용자 대기 문구를 같이 기록한다. relay ratio가 낮아도 대용량 사용자가 몰리면 비용은 커질 수 있다. 그래서 예외 경로를 무료로 무한히 열어 두는 설계는 작은 서비스일수록 위험하다.",
        "Merkle 실험은 일부러 파일을 망가뜨려야 한다. chunk 하나만 틀렸을 때 전체 실패로 보일지, 해당 chunk만 다시 요청할지, 이미 저장된 조각을 검증 전 상태로 둘지 나눈다. 사용자는 완료율이 높으면 거의 끝났다고 느낀다. 그 순간 무결성 검증이 뒤늦게 실패하면 제품은 왜 다시 기다려야 하는지 설명해야 한다.",
        "모바일 브라우저 실험은 책상 위 노트북으로 재현하기 어렵다. 화면을 끄고, 앱을 전환하고, 배터리 절약 모드를 켜고, 저장 권한을 거부하고, 이동 중 네트워크를 바꿔야 한다. 이 장면에서 P2P 전송은 네트워크 프로토콜보다 브라우저 생명주기의 영향을 더 크게 받는다. 직접 연결이 붙었다는 말은 탭이 계속 살아 있다는 뜻이 아니다.",
        "edge/serverless 혼합 실험은 순수성을 포기했는지 따지는 일보다 책임 이동을 재는 일에 가깝다. direct가 실패했을 때 edge가 정책만 판단하는지, relay가 payload를 얼마나 오래 들고 있는지, cloud drop이 비동기 수신을 위해 어떤 metadata를 남기는지 나눠 본다. 섞는 순간에도 어떤 데이터가 어디에 머무는지 적어야 한다.",
    ]
    metric_notes = [
        "측정값은 peer 후보 수, 첫 응답까지 걸린 시간, bootstrap 실패율, tracker 응답 지연, 빈 peer list 비율로 나눠 본다. 이 숫자들이 있어야 발견 실패를 전송 실패와 분리할 수 있다.",
        "측정값은 transport별 연결 시간, 보안 handshake 실패율, stream별 backpressure 지연, pubsub 중복 수신, peer id 재생성 빈도로 나눠 본다. 그래야 어느 계층을 얇게 가져갈지 판단할 수 있다.",
        "측정값은 server endpoint 연결 시간, ICE 후보 수집 시간, TURN 전환 비율, QUIC stream 재시도, 사용자에게 보이는 모드 전환 횟수로 나눠 본다. 같은 bytes라도 운영 경계가 다르기 때문이다.",
        "측정값은 operation 수, merge 지연, replica 간 divergence 시간, snapshot 크기, 사용자가 되돌린 편집 수로 나눠 본다. 수렴만 보면 UX 실패를 놓친다.",
        "측정값은 capability 거절 수, 만료 링크 재사용 시도, 비정상 요청 차단 수, peer별 rate limit 발동 수, audit log 누락률로 나눠 본다. 보안은 성공 연결보다 거절 경로에서 더 많이 드러난다.",
        "측정값은 relay ratio, relay egress, region별 latency, quota 근접률, relay 중단 후 재시도 성공률로 나눠 본다. 비용과 품질을 같은 표에서 봐야 한다.",
        "측정값은 chunk 검증 실패율, 재요청한 byte 수, Merkle root 불일치 수, resume 이후 재검증 시간, 완료 문구 지연 시간으로 나눠 본다. 무결성은 마지막 hash 하나로 설명되지 않는다.",
        "측정값은 background 진입 후 유지 시간, permission 거절률, resume 성공률, 탭 복귀 후 재협상 시간, 저장소 쓰기 실패율로 나눠 본다. 모바일에서는 프로토콜보다 운영체제의 제한이 더 자주 보인다.",
        "측정값은 direct 유지 비율, relay 체류 시간, edge 정책 판단 지연, cloud drop 보관 시간, payload가 서버에 머문 총 시간으로 나눠 본다. 혼합 구조의 핵심은 어디까지 맡겼는지 숫자로 남기는 일이다.",
    ]
    language_notes = [
        "사용자 문구에서는 peer discovery라는 말을 그대로 내놓기보다 상대를 찾는 중, 후보를 다시 확인하는 중, 초대가 만료되었을 수 있음처럼 좁혀 적는 편이 낫다.",
        "사용자 문구에서는 libp2p라는 이름보다 연결 방식 확인 중, 보안 채널을 여는 중, 메시지 경로를 다시 잡는 중처럼 계층별 상태를 보여 주는 편이 낫다.",
        "사용자 문구에서는 QUIC이나 WebTransport를 앞세우기보다 서버 경유 모드, 직접 연결 모드, 임시 relay 모드처럼 비용과 개인정보 경계가 느껴지는 표현이 낫다.",
        "사용자 문구에서는 CRDT라는 이름보다 오프라인 변경을 합치는 중, 다른 사용자의 수정과 맞추는 중, 일부 변경은 확인이 필요함처럼 결과를 설명하는 편이 낫다.",
        "사용자 문구에서는 trust boundary를 말하기보다 이 링크로 가능한 행동, 이 방에서 허용된 파일, 이 peer가 요청할 수 없는 작업처럼 권한의 모양을 보여 주는 편이 낫다.",
        "사용자 문구에서는 TURN을 숨기기보다 네트워크 환경 때문에 우회 경로를 사용 중, 대용량 전송에서는 제한될 수 있음, 직접 연결을 다시 시도함처럼 비용 경계를 부드럽게 드러내는 편이 낫다.",
        "사용자 문구에서는 Merkle tree를 말하기보다 일부 조각을 확인하는 중, 손상된 조각만 다시 받는 중, 저장은 끝났지만 검증이 남음처럼 안심과 대기를 같이 설명하는 편이 낫다.",
        "사용자 문구에서는 background throttling을 말하기보다 화면을 닫으면 전송이 느려질 수 있음, 앱을 다시 열면 이어받음, 저장 권한이 필요함처럼 행동 기준을 주는 편이 낫다.",
        "사용자 문구에서는 edge/serverless를 말하기보다 직접 전송이 어려워 임시 보관 모드로 전환, 가까운 지역에서 정책 확인, 상대가 돌아오면 이어받음처럼 구조보다 경험을 먼저 적는 편이 낫다.",
    ]
    boundary_notes = [
        "경계가 흐려지는 순간은 tracker와 DHT를 모두 주소록이라고 뭉뚱그릴 때다. 둘은 시작 속도, 운영 책임, abuse 대응 방식이 다르다.",
        "경계가 흐려지는 순간은 peer id와 앱 사용자 계정을 같은 id처럼 다룰 때다. 네트워크 주체와 제품 권한 주체는 따로 움직인다.",
        "경계가 흐려지는 순간은 WebTransport가 빠르니 WebRTC를 대체한다고 말할 때다. 빠른 전송과 peer-to-peer 연결은 같은 요구사항이 아니다.",
        "경계가 흐려지는 순간은 CRDT가 있으니 충돌 처리가 끝났다고 말할 때다. 충돌 결과를 사용자가 이해하지 못하면 기능은 여전히 실패한다.",
        "경계가 흐려지는 순간은 암호화 채널을 열었다는 이유로 모든 peer 행동을 믿을 때다. 채널 보안과 행동 권한은 서로 다른 방어선이다.",
        "경계가 흐려지는 순간은 TURN을 fallback이라고만 부를 때다. fallback이 일정 비율을 넘으면 운영비와 제품 정책의 중심이 된다.",
        "경계가 흐려지는 순간은 checksum을 성공/실패 하나로 볼 때다. 큰 파일에서는 어느 조각이 틀렸는지와 어떻게 다시 받을지가 더 중요하다.",
        "경계가 흐려지는 순간은 모바일 브라우저를 데스크톱 브라우저와 같은 실행 환경으로 볼 때다. 탭 수명과 저장 권한은 프로토콜 밖에서 전송을 흔든다.",
        "경계가 흐려지는 순간은 edge와 serverless를 서버 회귀로만 볼 때다. payload를 맡기는지, 정책만 맡기는지, 비동기 보관을 맡기는지가 다르다.",
    ]
    field_diaries = [
        "운영 화면을 상상하면 DHT 쪽 문제는 늘 뒤늦게 드러난다. 전송 속도 그래프가 낮은 것이 아니라 그래프를 그릴 상대를 아직 찾지 못한 상태인데, 사용자는 둘을 같은 느림으로 느낀다. 그래서 peer 후보가 비어 있는 시간과 실제 byte가 흐르기 시작한 시간을 따로 기록해야 한다. 이 둘을 섞으면 개선 방향도 엉뚱해진다.",
        "운영 화면을 상상하면 libp2p 쪽 문제는 계층 이름이 섞일 때 길을 잃는다. 연결 실패가 transport 문제인지, 보안 negotiation 문제인지, stream open 문제인지, pubsub 전파 문제인지 나누지 않으면 라이브러리 로그를 많이 남겨도 제품 판단은 흐려진다. 스택을 쓴다는 말은 스택별 실패 이름을 갖겠다는 뜻이어야 한다.",
        "운영 화면을 상상하면 WebTransport와 WebRTC의 차이는 비용 표에서 다시 나타난다. 사용자는 둘 다 빠른 전송으로 보지만, 서버 endpoint를 거친 byte와 peer 사이에서 흐른 byte는 개인정보 문구와 인프라 비용이 다르다. 모드가 바뀌었는데 화면이 그대로라면 나중에 문의가 들어왔을 때 설명할 근거가 부족해진다.",
        "운영 화면을 상상하면 CRDT 문제는 데이터 손상이 아니라 납득 실패로 나타날 때가 많다. replica가 결국 같은 상태로 수렴했더라도 사용자가 방금 그린 선이 왜 다른 위치에 붙었는지 이해하지 못하면 신뢰는 깨진다. 그래서 merge 결과를 기술 로그와 화면 이벤트 양쪽에서 추적해야 한다.",
        "운영 화면을 상상하면 P2P 보안 문제는 성공한 연결보다 거절된 행동에서 더 많이 배운다. 어떤 peer가 어떤 capability를 들고 왔고, 어떤 작업이 왜 거절됐는지, 거절 뒤에 사용자에게 어떤 문구가 보였는지 남아야 한다. 그래야 보안을 불편함으로만 느끼지 않게 만들 수 있다.",
        "운영 화면을 상상하면 TURN 비용 문제는 월말 청구서보다 훨씬 일찍 보여야 한다. relay가 갑자기 늘어나는 region, 특정 네트워크에서 반복되는 우회, 무료 사용자의 대용량 relay가 보이면 제품은 아직 작을 때도 비용 정책을 고쳐야 한다. fallback이 조용히 성공하면 더 위험하다.",
        "운영 화면을 상상하면 Merkle와 chunk hash는 성공률보다 재시도 범위를 줄이는 도구로 보인다. 손상된 조각만 다시 받았는지, 이미 받은 조각을 다시 버렸는지, 검증 전 저장소가 얼마나 쌓였는지를 봐야 한다. 완료 직전 실패가 많다면 사용자는 프로토콜보다 제품 문구를 먼저 의심한다.",
        "운영 화면을 상상하면 모바일 P2P 문제는 네트워크 장애 목록만으로 설명되지 않는다. 탭이 background로 밀린 시각, 저장 권한이 거부된 시각, 화면 복귀 뒤 resume이 시작된 시각이 필요하다. 실제 원인이 브라우저 생명주기인데 relay나 protocol bug로 기록되면 다음 수정이 빗나간다.",
        "운영 화면을 상상하면 edge/serverless 혼합 구조는 모드 전환의 흔적이 중요하다. direct에서 relay로, relay에서 cloud drop으로 넘어간 순간마다 payload가 어디에 머물렀는지, 사용자가 어떤 약속을 받았는지 기록해야 한다. 혼합 구조는 책임을 흐리기 위해서가 아니라 흔적을 더 명확히 남기기 위해 써야 한다.",
    ]
    tradeoff_diaries = [
        "완전한 DHT를 브라우저 제품에 넣고 싶은 마음은 이해되지만, 항상 켜진 node가 부족하면 네트워크는 생각보다 약하다. 작은 제품에서는 제한된 directory와 초대 기반 흐름을 먼저 두고, 나중에 swarm 규모가 생겼을 때 발견 계층을 확장하는 편이 덜 위험하다.",
        "libp2p 전체를 가져오면 배우는 것은 많지만 제품의 첫 책임이 흐려질 수 있다. 필요한 것이 peer id인지, stream 경계인지, pubsub인지 먼저 고르면 작은 구현도 충분히 실험이 된다. 반대로 전부 켜면 실패 하나를 고치기 위해 스택 전체를 읽어야 한다.",
        "WebTransport는 서버 경유가 나쁘지 않은 기능에서는 매우 매력적이다. 하지만 서버가 payload를 보거나 relay 비용을 부담해도 되는지 정하지 않은 채 대체재로 부르면, 나중에 개인정보 설명과 비용 모델을 동시에 다시 써야 한다. 선택 기준은 API 취향보다 제품 약속이다.",
        "CRDT는 멋진 수렴성을 주지만 모든 데이터를 자동 merge 대상으로 만들 필요는 없다. 커서나 presence는 가볍게 합쳐도 되지만 결제, 권한, 파일 삭제 같은 행동은 사용자 확인이나 서버 판단이 필요할 수 있다. 자동화할수록 예외 경계가 더 중요해진다.",
        "P2P 보안에서 가장 쉬운 실수는 사용성을 위해 capability를 크게 주는 것이다. 큰 권한은 데모를 빠르게 만들지만 abuse가 시작되면 회수하기 어렵다. 작은 권한을 여러 번 주는 흐름이 번거로워 보여도 나중에 정책을 고치기 쉽다.",
        "TURN을 줄이겠다고 direct만 고집하면 성공률이 떨어지고, TURN을 넉넉히 열면 비용이 커진다. 둘 중 하나를 감정적으로 고를 수는 없다. 파일 크기, 사용자 plan, region, 네트워크 종류별로 어디까지 relay를 허용할지 숫자로 정해야 한다.",
        "Merkle 검증을 촘촘히 하면 안전하지만 metadata와 계산 비용이 늘어난다. chunk 크기를 작게 잡으면 복구 범위는 줄지만 index와 hash 관리가 복잡해진다. 그래서 파일 크기별 정책을 다르게 두는 것이 하나의 정답보다 현실적이다.",
        "모바일에서 직접 전송을 끝까지 지키려 하면 사용자는 화면을 켜 두어야 한다는 부담을 떠안는다. 반대로 서버 보관을 빨리 허용하면 P2P 약속이 약해진다. 이 tradeoff는 기술 선택보다 먼저 사용자에게 어떤 행동을 요구할지 정하는 문제다.",
        "edge/serverless를 섞으면 순수 P2P라는 구호는 약해질 수 있다. 대신 실패한 사용자에게 더 나은 복구 경로를 줄 수 있다. 섞었다는 사실을 숨기지 않고 어떤 데이터와 metadata를 어디까지 맡겼는지 제품 원칙으로 고정해야 한다.",
    ]
    scale_notes = [
        "PonsWarp에서 peer discovery를 넣는다면 작은 서비스의 장점을 살려야 한다. 거대한 공개 DHT를 흉내 내기보다 초대 링크, 제한된 directory, 실패 문구를 빠르게 고치면서 실제 사용자가 어디서 기다리는지 먼저 보아야 한다.",
        "PonsLink/PonsWarp에서 libp2p 감각을 가져온다면 전체 스택보다 관측 가능한 계층 하나부터 고르는 편이 낫다. 작은 제품은 모든 예외를 인프라로 덮을 수 없지만, 대신 peer id나 pubsub 같은 한 경계를 빠르게 바꿔 볼 수 있다.",
        "PonsWarp에서 WebTransport와 WebRTC를 같이 본다면 작은 제품의 약점은 비용이고 장점은 모드 설명을 빨리 고칠 수 있다는 점이다. direct와 서버 경유 문구를 빨리 나눠 두면 나중에 더 큰 구조로 옮길 때도 덜 흔들린다.",
        "PonsLink 협업 기능에서 CRDT를 다룬다면 작은 제품은 사용자 납득을 더 가까이 볼 수 있다. 거대한 협업 플랫폼처럼 모든 충돌을 감추기보다, 어떤 merge는 자동이고 어떤 merge는 설명이 필요한지 빠르게 문장으로 검증할 수 있다.",
        "PonsLink/PonsWarp의 P2P 보안은 작은 권한을 자주 확인하는 쪽이 맞다. 큰 플랫폼처럼 중앙 정책으로 뒤늦게 덮을 수 없으니, 처음부터 방, 링크, 파일, 행동 권한을 작게 나누고 거절 로그를 읽을 수 있어야 한다.",
        "PonsWarp에서 TURN 비용은 작은 제품의 생존선에 가깝다. 큰 인프라처럼 relay 비용을 흡수하기 어렵기 때문에, 무료 전송 한도와 direct 재시도 문구를 일찍 드러내야 사용자가 품질 저하를 버그로만 받아들이지 않는다.",
        "PonsWarp의 파일 무결성은 화려한 분산 구조보다 신뢰할 수 있는 완료 문구가 먼저다. 작은 제품에서는 조각 하나가 깨졌을 때 전체를 다시 보내는 경험이 치명적이므로, chunk 단위 재시도와 검증 로그를 곧장 제품 언어로 내려야 한다.",
        "PonsWarp 모바일 흐름에서는 작은 제품답게 기대치를 정직하게 낮추는 편이 낫다. 탭을 닫아도 무조건 직접 전송된다고 말하기보다, 화면 유지, 권한, 이어받기 조건을 분명히 알려 주는 쪽이 신뢰를 덜 잃는다.",
        "PonsLink/PonsWarp의 혼합 구조는 큰 플랫폼 흉내가 아니라 책임 위치를 작게 나눠 보는 실험이어야 한다. edge, relay, cloud drop을 섞더라도 payload와 metadata가 어디에 머무는지 바로 설명할 수 있어야 한다.",
    ]
    sequence_note = sequence_notes[(order - 1) % len(sequence_notes)]
    failure_note = failure_notes[(order - 1) % len(failure_notes)]
    server_note = server_notes[(order - 1) % len(server_notes)]
    sketch_note = sketch_notes[(order - 1) % len(sketch_notes)]
    product_note = product_notes[(order - 1) % len(product_notes)]
    prototype_note = prototype_notes[(order - 1) % len(prototype_notes)]
    lab_note = lab_notes[(order - 1) % len(lab_notes)]
    metric_note = metric_notes[(order - 1) % len(metric_notes)]
    language_note = language_notes[(order - 1) % len(language_notes)]
    boundary_note = boundary_notes[(order - 1) % len(boundary_notes)]
    field_diary = field_diaries[(order - 1) % len(field_diaries)]
    tradeoff_diary = tradeoff_diaries[(order - 1) % len(tradeoff_diaries)]
    scale_note = scale_notes[(order - 1) % len(scale_notes)]

    blocks: dict[str, list[str]] = {
        "intro": [
            topic["opening"],
            topic["memory"],
            previous_line,
        ],
        "flow_image": [
            image_markdown(topic, "flow", f"{kw_ref}: 발견, 검증, 운영 경계를 한 장에 겹쳐 둔 흐름 노트."),
        ],
        "h0": [
            f"## {h[0]}",
            f"{sequence_note} {heading_terms[0]}을 적어 두면 버튼 하나 뒤에 {label_terms[0]}, {label_terms[1]}, {label_terms[2]}이 차례로 숨어 있다는 점이 드러난다. {topic['keyword']}에서 순서를 지우면 직접 연결은 금방 과장된 그림이 된다.",
            f"{p[0]} {failure_note} 사용자가 보는 문구는 하나여도 실제 원인은 {label_terms[0]} 준비 실패, {label_terms[1]} 판단 실패, {label_terms[2]} 상태 불일치로 갈라질 수 있다. {title_label}라는 제목도 결국 그 경계를 다시 보자는 뜻에 가깝다.",
            f"확인할 장면은 다음 표현으로 적었다: {field_word}. 성공 흐름만 그리지 않고 시작 실패와 중간 이탈을 같은 종이에 놓고, 사용자가 누르는 버튼 이름 옆에 내부 상태 이름을 붙인다. 이때 확인한 조건은 따로 적는다. {p[1]} 그러면 화면에는 하나의 연결처럼 보이는 일이 전혀 다른 제품 경험으로 바뀌는 지점이 보인다.",
            f"데모가 성공한 뒤에도 두 항목이 남는다: {labels[3]} / {labels[4]}. {heading_terms[0]}을 기준으로 보면 협조적인 네트워크와 짧은 시간만 지나가는 시연에서는 보이지 않지만, 오래 켜진 탭, 잠든 모바일, 회사 방화벽, 만료된 초대 링크, 느린 저장소가 들어오면 이 주제의 성격이 바뀐다. 개념을 외우는 데서 끝내지 않고 실패가 사용자 문장으로 어떻게 번역되는지까지 내려가야 한다.",
        ],
        "h1": [
            f"## {h[1]}",
            f"{server_note} 하지만 {heading_terms[1]}에서 다시 보면 서버를 덜 쓴다는 말은 책임이 사라진다는 뜻이 아니었다. {p[1]} 이 책임이 코드 밖으로 밀려나면 장애 분석은 더 어려워지고, 로그에는 막연한 연결 실패만 남는다.",
            f"내가 다시 적은 기준은 {label_terms[0]} 이후에 누가 무엇을 대신하는가다. 피어가 나눠 갖는지, 브라우저 로컬 상태가 갖는지, edge가 잠깐 맡는지, 아니면 사용자가 기다리는 방식으로 비용을 넘기는지 구분해야 한다. {topic['keyword']}에서 이 구분이 빠지면 아래 문장도 제품 약속이 되지 못한다. {p[2]}",
            f"{label_terms[0]}만 떼어 놓고 보면 판단이 흐리다. {label_terms[0]}이 성공률을 올리는 장치인지, {label_terms[1]}이 비용을 옮기는 장치인지, {label_terms[4]}가 기다림을 설명하는 장치인지 갈라져야 한다. 같은 기술이라도 {label_terms[1]} 옆에 놓는지 {label_terms[4]} 옆에 놓는지에 따라 제품 판단은 달라진다.",
            f"이 구분 없이 기술을 붙였을 때의 피곤함은 {label_terms[0]} 근처에서 특히 늦게 터진다. 처음에는 코드는 짧아진다. 하지만 장애가 생기면 모든 것이 연결 안 됨으로 뭉치고, 화면 문구를 고쳐도 실제 실패 원인이 그대로 남는다.",
        ],
        "h2": [
            f"## {h[2]}",
            f"{sketch_note} 이 셋이 한 줄로 뭉치면 구현은 빨라 보이지만 {heading_terms[2]}에서 고쳐야 할 부분을 찾기 어렵다.",
            f"그래서 API 이름보다 상태 이름을 먼저 본다. {label_terms[0]}에서 시작한 일이 `pending-{labels[0]}`, `offered-{labels[1]}`, `verified-{labels[2]}`, `relayed-{labels[3]}`, `stored-{labels[4]}` 중 어디에 있는지 알아야 한다. 이런 상태가 없으면 사용자는 기다리는 중인지, 실패한 것인지, 다시 시작할 수 있는지 구분하지 못한다.",
            f"상태 이름이 중요한 이유는 추가 조건을 분리해서 적을 때 더 선명해진다. {p[4]} 내부적으로는 잠깐 지나가는 값처럼 보여도 운영 단서는 {label_terms[4]} 쪽에 남는다. {heading_terms[2]}에서는 {label_terms[0]}에서 {label_terms[1]}으로 되돌릴 수 있는지, {label_terms[2]}와 {label_terms[3]}을 별도 상태로 나눌지 같은 질문이 생긴다.",
            f"{heading_terms[2]}은 설계 문서에만 남기면 오래 가지 않는다. 실제 제품에서는 {label_terms[0]} dashboard, {label_terms[1]} error copy, {label_terms[2]} retry policy, {label_terms[4]} support log로 흩어진다. 그래서 어떤 상태를 DB에 남길지, 어떤 상태는 메모리에만 둘지, 어떤 상태는 사용자에게 보여 줄지까지 같이 적어 둔다.",
        ],
        "failure_image": [
            image_markdown(topic, "failure", f"{topic['failure']}"),
        ],
        "h3": [
            f"## {h[3]}",
            f"{p[3]} {label_terms[3]} 문장을 제품에 넣으면 결정이 여럿 따라온다. 개발자는 내부 프로토콜을 알고 있지만 사용자는 {label_terms[3]} 경로를 보지 못한다. 그래서 UI는 {heading_terms[3]}의 기술 이름을 그대로 보여 주기보다 지금 어떤 조건을 기다리는지, 어떤 선택지가 남았는지, 어떤 데이터가 아직 안전하지 않은지 알려 줘야 한다.",
            f"{topic['failure']} {topic['keyword']} 실패에 이름을 붙여 두면 장애가 났을 때 blame이 줄어든다. {label_terms[0]}이 비어 있는지, {label_terms[1]}이 막힌 것인지, 상대 피어가 사라진 것인지, 저장 검증이 실패한 것인지 나눌 수 있기 때문이다.",
            f"{heading_terms[3]}에서 우선순위도 바뀐다. 가장 화려한 경로를 먼저 만들기보다 {topic['keyword']}에서 사용자가 헷갈릴 실패를 먼저 설명하게 된다. 이 방향은 느려 보이지만 {label_terms[2]} 상태가 좁게 붙어 있으면 재현이 쉽고, 재현이 쉬우면 운영 중에 고쳐도 사용자의 신뢰를 덜 잃는다.",
            f"반대로 이 주제를 하나의 옵션처럼만 붙이면 기능 플래그를 끄는 것도 어려워진다. 어떤 사용자가 어떤 경로를 타고 있었는지 모르면 점진 배포도, 롤백도, 비용 제한도 어색해진다. 프로토콜 선택은 {label_terms[4]} 정책과 같이 설계되어야 한다.",
        ],
        "h4": [
            f"## {h[4]}",
            topic["decision"],
            f"{heading_terms[4]}에서는 이상적인 구조를 낮추자는 말보다 현실에서 살아남는 기준을 먼저 본다. 이 주제가 {label_terms[0]} 원칙과 함께 실제 제품에서 계속 살아남으려면 언제 {label_terms[0]} 직접 경로를 포기할지, 언제 {label_terms[1]} 우회로를 허용할지, 언제 {label_terms[4]} 쪽에 책임을 잠깐 맡길지 먼저 정해야 한다. {topic['keyword']} 기준이 있어야 현실을 만났을 때 변명으로 바뀌지 않는다.",
            f"판단표를 만들 때는 두 열을 쓴다. 왼쪽에는 기술적으로 가능한 일을 쓰고, 오른쪽에는 사용자가 어떻게 오해할 수 있는지 적는다. 왼쪽 예시는 이렇게 남긴다. {p[0]} 오른쪽에는 항상 빠르다고 기대함, 서버가 파일을 본다고 오해함, 내 변경이 사라졌다고 느낌, 완료율이 뒤로 감 같은 문장이 들어간다.",
            f"이 두 열이 함께 있어야 {label_terms[1]} 선택이 제품 결정이 된다. 기술적으로 가능한 일을 그대로 켜면 기능 목록은 늘지만 설명 책임도 같이 늘어난다. {topic['keyword']}에서는 사용자 오해만 피하려고 기능을 줄여도 필요한 구조를 놓칠 수 있다.",
        ],
        "h5": [
            f"## {h[5]}",
            f"{topic['keyword']}를 화면 문구로 옮길 때 내부 구조를 그대로 번역하면 금방 딱딱해진다. 사용자가 {topic['keyword']} 용어를 몰라도 지금 어떤 일이 벌어지는지는 이해할 수 있어야 한다. 예를 들어 {label_terms[0]} 처리 중이라는 말보다 {topic['keyword']}의 실제 조건을 사람 말로 풀어 주는 편이 더 정확한 순간이 있다. 내부 메모는 이렇게 남긴다. {p[0]}",
            f"{product_note} 같은 P2P라도 제품이 지켜야 할 약속이 다르면 {label_terms[2]} 선택도 달라진다.",
            f"{topic['keyword']}를 제품 이름으로 포장하지는 않는다. {label_terms[0]}을 다음 기능 후보로 밀기보다 다음 실패를 미리 읽기 위한 렌즈로 둔다. 어떤 경로가 성공했는지보다 {topic['keyword']} 실패 뒤에 어느 책임자가 남는지 보는 렌즈다.",
            f"{label_terms[3]} 결정을 다시 만났을 때 이 노트가 바로 떠올라야 한다. {label_terms[0]} 실패를 먼저 작게 다루고, 그 실패가 {label_terms[4]} 판단에서 {labels[3]} 로그로 넘어가는 순간을 기록하면 프로토콜 이름보다 제품의 다음 수정 지점이 더 선명해진다.",
            f"관측값도 {label_terms[1]}, {label_terms[2]}, {label_terms[3]} 세 갈래로 나눠 둔다. {label_terms[1]} 단계가 멈춘 시각, {label_terms[2]} 때문에 사용자가 기다린 시간, {label_terms[3]} 상태에서 고른 대안을 따로 적는다. {p[0]} 이 {label_terms[1]} 값이 갈라져야 나중에 'P2P가 느리다'는 한 문장을 실제 원인으로 다시 풀 수 있다.",
            f"{topic['keyword']} 운영 로그는 개발자용 이벤트 이름만으로는 부족하다. {label_terms[0]} 문구, 브라우저가 허용한 {label_terms[1]} 권한, 상대 피어가 마지막으로 응답한 {label_terms[3]} 시각, {label_terms[4]} 때문에 모드를 바꾼 이유가 같은 trace 안에 붙어야 한다. 그래야 {label_terms[4]} 문의가 왔을 때 네트워크 탓으로 도망가지 않고 {label_terms[0]}에서 우리가 고른 선택을 설명할 수 있다.",
            f"{topic['keyword']}를 작게 적용한다면 바로 전체 구조를 바꾸지 않는다. 먼저 {label_terms[0]}만 따로 계측하고, 그다음 {label_terms[1]} 실패 문구를 한 단계 더 쪼갠다. 마지막 {label_terms[4]} 전환 기준은 별도로 둔다. {p[4]} 이렇게 순서를 좁히면 실험이 실패해도 제품 전체가 같이 흔들리지 않는다.",
        ],
        "experiment": [
            f"## 실험 메모: {labels[0]} 흔들어 보기",
            lab_note,
            metric_note,
            f"{topic['keyword']} 실험은 큰 프레임워크를 붙이기 전에 작은 실패를 먼저 만드는 방식으로 진행한다. {label_terms[0]} 하나를 바꿨을 때 {label_terms[1]}과 {label_terms[2]}이 같이 흔들리는지, 아니면 독립적으로 회복되는지 보는 것이다. {topic['keyword']}에서 독립적으로 회복되지 않는 부분은 아직 경계가 충분히 나뉘지 않은 상태다.",
            f"{topic['keyword']} 로그는 기술 용어와 사용자 문구를 같이 남긴다. 내부에는 {heading_terms[0]}, {heading_terms[2]}, {heading_terms[4]} 상태를 남기고, 화면에는 사용자가 다음 행동을 고를 수 있는 문장만 남긴다. {topic['keyword']}의 두 기록이 연결되어야 나중에 장애를 다시 읽을 수 있다.",
        ],
        "language": [
            f"## 표현 다시 고치기: {labels[1]}를 제품 언어로 옮기기",
            language_note,
            boundary_note,
            f"{topic['keyword']} 용어를 고칠 때는 쉬운 말로 바꾸는 것에서 멈추지 않는다. 쉬운 말이 실제 책임을 흐리면 더 나쁘다. {label_terms[1]}이라고 적힌 내부 상태가 사용자에게는 {label_terms[0]} 대기인지, {label_terms[2]} 위험인지, {label_terms[4]} 비용인지, 다시 눌러야 하는 행동인지 분명해야 한다.",
            f"{topic['keyword']}에서 내가 좋아하는 기준은 {label_terms[2]} 문장을 지웠을 때도 로그가 남는가다. UI 문구는 배포 뒤에 바뀔 수 있지만 {label_terms[2]} 상태와 {label_terms[4]} 판단은 사라지면 안 된다. {topic['keyword']} 기록이 남아야 공부 노트가 다음 구현을 고치는 근거가 된다.",
        ],
        "ops": [
            f"## 운영에서 다시 볼 장면: {labels[4]}",
            field_diary,
            tradeoff_diary,
            f"여기서 다시 {label_terms[4]}을 본다. 처음 공부할 때는 세부 용어가 많아 보였지만, {topic['keyword']} 운영에서는 결국 상태를 나누고 책임자를 남기는 문제로 돌아온다. {label_terms[0]} 값은 브라우저에, {label_terms[1]} 단서는 signaling 서버에, {label_terms[4]} 비용은 사용자의 기다림 속에 남을 수 있다. {topic['keyword']}에서는 이 셋을 한 문장으로 뭉치지 않는 것이 중요하다.",
            f"또 하나 남는 기준은 {topic['keyword']} 실패 후 회복이다. {label_terms[0]}이 실패했을 때 바로 끝낼지, {label_terms[1]} 경로로 다시 시도할지, {label_terms[2]} 상태를 보존할지, {label_terms[3]} 조건을 낮출지 정해야 한다. {topic['keyword']} 회복 경로가 없으면 기능은 성공 데모에서만 존재한다.",
            scale_note,
            f"{label_terms[0]} 구현 노트로 돌아올 때는 이 문단을 체크리스트로 삼는다. {p[0]} {p[1]} {p[2]} 세 문장이 실제 코드와 로그에 대응하지 않으면 아직 공부가 기능으로 내려오지 않은 것이다. 대응 필드가 보이면 {topic['keyword']}에서 얻은 기준이 제품 안으로 조금은 들어온 셈이다.",
            f"{topic['keyword']} 운영 장면은 성공, 대기, 실패 세 단어로 닫히지 않는다. {label_terms[0]} 준비, {label_terms[1]} 선택, {label_terms[2]} 보존, {label_terms[3]} 제한, {label_terms[4]} 판단이 서로 다른 시각에 일어난다. {label_terms[0]} 시각을 나누면 같은 실패도 재시도 대상, 사용자 행동 요청, 운영 정책 수정으로 갈라진다.",
            f"{label_terms[0]}부터 {label_terms[4]}까지 한 줄에 놓고 표를 채운다. 열은 사용자 문장, {topic['keyword']} 내부 상태, 다음 행동, 지워도 되는 데이터와 보존할 데이터다. 이 표를 채우지 못하면 {topic_term}는 아직 내 머릿속 개념일 뿐이다. 표가 채워질 때부터 {topic['keyword']}는 PonsLink나 PonsWarp 안에서 고칠 수 있는 단위가 된다.",
        ],
        "checklist": [
            f"## {h[6]}",
            f"다음 구현 전에 아래 질문을 먼저 적어 둔다. 기준점은 {heading_terms[6]}이다.",
            *[f"- {item}" for item in p],
            image_markdown(topic, "checklist", f"{kw_ref}: 구현 전에 다시 볼 질문을 현장 노트처럼 정리한다."),
            f"{prototype_note} 여기에 사용자가 탭을 닫거나 상대가 사라지는 {topic['keyword']} 이탈 경로를 붙인다. {topic['keyword']} 장면에서 {label_terms[0]}과 {label_terms[4]}이 같은 문구로 뭉친다면 아직 설계가 덜 갈라진 것이다.",
            f"나는 {label_terms[2]} 숫자만 믿지 않으려고 한다. 완료율은 마지막 상태만 말하고 {label_terms[0]} 중간에 생긴 불안을 잘 말해 주지 않는다. 그래서 {label_terms[0]} 전송 시간, {label_terms[1]} 재시도, {label_terms[2]} 전환, {label_terms[3]} 검증 실패, {label_terms[4]} 다시 누른 횟수를 같이 본다.",
            f"{topic['keyword']} 운영에서 틀릴 수 있는 부분도 미리 적어 둔다. {label_terms[0]} 로컬 테스트가 깔끔해 보여도 실제 네트워크에서는 {label_terms[1]} 시간, {label_terms[2]} 권한, {label_terms[3]} 배터리, 저장소, {label_terms[4]} 비용 제한을 동시에 만난다. 특히 {label_terms[4]} 조건이 빠지면 설계 문장은 맞아도 제품 경험은 틀릴 수 있다.",
            f"{heading_terms[6]}을 통과하지 못하면 구현을 미루는 편이 낫다. 아직 몰라서 미루는 것이 아니라 {label_terms[0]}과 {label_terms[4]} 사이의 실패 이름을 붙이지 못한 상태이기 때문이다. {topic['keyword']}에서 이름 없는 {label_terms[0]} 실패는 결국 {label_terms[4]} 불편으로 나타난다.",
            f"마지막 확인은 {topic['keyword']}를 PonsLink나 PonsWarp 중 어느 제품 장면에 붙일지 고르는 일이다. {topic['keyword']}를 순수 이론으로만 남기면 글은 깔끔해지지만 내 판단은 잘 바뀌지 않는다. 직접 만든 제품의 {label_terms[0]} 장면과 {label_terms[4]} 판단이 다시 연결될 때 비로소 공부한 흔적이 된다.",
        ],
        "criteria": [
            f"## 기준 다시 묻기: {labels[0]}",
            f"### {topic['keyword']}: P2P를 더 순수하게 만드는가?",
            f"순수하게 만든다기보다 책임의 위치를 드러낸다. {label_terms[0]}과 {label_terms[1]} 일부는 피어로 옮겨지고, {label_terms[3]} 일부는 edge나 서버에 남고, 나머지는 사용자 경험으로 번역된다.",
            f"### 첫 제품 적용 후보는 {labels[0]}인가?",
            f"대부분은 바로 넣기보다 {topic['keyword']} 관측 지표와 실패 문구를 먼저 준비해야 한다. 아래 조건을 설명할 수 없는 프로토콜은 성공 데모가 있더라도 제품에 넣기 이르다. {p[4]}",
            f"### 가져갈 기준은 무엇인가: {labels[2]} / {labels[4]}",
            f"핵심은 서버 유무가 아니라 책임이 이동하는 위치다. {topic['keyword']}에서 {label_terms[2]}과 {label_terms[4]}을 이 기준으로 보면 P2P와 {label_terms[1]}, {label_terms[3]}, {label_terms[4]}은 서로 반대말이 아니라 {label_terms[0]} 경계를 고르는 후보가 된다.",
            next_line,
        ],
    }

    section_plans = [
        ["intro", "flow_image", "h0", "h1", "h2", "failure_image", "h3", "h4", "h5", "experiment", "language", "ops", "checklist", "criteria"],
        ["intro", "h1", "flow_image", "h0", "h2", "h5", "experiment", "h3", "failure_image", "h4", "language", "ops", "checklist", "criteria"],
        ["intro", "flow_image", "h0", "h2", "h1", "h3", "failure_image", "h4", "experiment", "ops", "language", "h5", "checklist", "criteria"],
        ["intro", "h0", "flow_image", "h3", "h1", "h2", "failure_image", "h5", "language", "experiment", "ops", "checklist", "criteria"],
        ["intro", "h1", "h4", "flow_image", "h0", "h2", "h3", "failure_image", "h5", "ops", "experiment", "language", "checklist", "criteria"],
        ["intro", "h0", "h5", "h1", "flow_image", "h4", "h2", "ops", "experiment", "h3", "failure_image", "language", "checklist", "criteria"],
        ["intro", "h2", "flow_image", "h0", "h3", "h1", "failure_image", "h4", "h5", "ops", "experiment", "language", "checklist", "criteria"],
        ["intro", "h0", "h1", "h5", "flow_image", "h2", "h3", "experiment", "language", "ops", "failure_image", "h4", "checklist", "criteria"],
        ["intro", "h4", "h0", "flow_image", "h1", "h2", "h5", "ops", "h3", "failure_image", "experiment", "language", "checklist", "criteria"],
    ]
    lines: list[str] = []
    for block_name in section_plans[(order - 1) % len(section_plans)]:
        lines.extend(blocks[block_name])

    content = "\n\n".join(lines) + "\n"
    frame_rewrites = {
        "성공 흐름만 그리지 않고 시작 실패와 중간 이탈을 같은 종이에 놓고, 사용자가 누르는 버튼 이름 옆에 내부 상태 이름을 붙인다.": "{keyword} 노트에서는 성공선과 실패선을 처음부터 같은 장에 놓고, 버튼 옆에는 {label0} 상태 이름을 붙인다.",
        "그러면 화면에는 하나의 연결처럼 보이는 일이 전혀 다른 제품 경험으로 바뀌는 지점이 보인다.": "그렇게 놓고 보면 화면의 한 연결 버튼도 {label1} 조건에 따라 전혀 다른 경험으로 갈라진다.",
        "개념을 외우는 데서 끝내지 않고 실패가 사용자 문장으로 어떻게 번역되는지까지 내려가야 한다.": "{keyword}를 외우는 데서 멈추지 않고, 실패가 사용자 문장으로 바뀌는 지점까지 내려가야 한다.",
        "이 책임이 코드 밖으로 밀려나면 장애 분석은 더 어려워지고, 로그에는 막연한 연결 실패만 남는다.": "{label0} 책임을 코드 밖으로 밀어내면 장애 분석은 흐려지고, 로그에는 {keyword}와 무관해 보이는 실패만 남는다.",
        "피어가 나눠 갖는지, 브라우저 로컬 상태가 갖는지, edge가 잠깐 맡는지, 아니면 사용자가 기다리는 방식으로 비용을 넘기는지 구분해야 한다.": "{keyword}에서는 {label0}은 피어가 맡는지, {label1}은 브라우저가 들고 있는지, {label4}는 edge가 잠깐 대신하는지 따로 적어야 한다.",
        "그것이 성공률을 올리는 장치인지, 비용을 옮기는 장치인지, 사용자에게 기다림을 설명하는 장치인지가 갈라져야 한다.": "{label0} 항목이 성공률 장치인지, {label1} 비용 이동 장치인지, {label4} 기다림 설명 장치인지 먼저 갈라야 한다.",
        "하지만 장애가 생기면 모든 것이 연결 안 됨으로 뭉치고, 화면 문구를 고쳐도 실제 실패 원인이 그대로 남는다.": "장애가 오면 {label1} 항목과 {label4} 항목이 모두 연결 실패처럼 보이고, 문구만 고쳐서는 원인이 그대로 남는다.",
        "이런 상태가 없으면 사용자는 기다리는 중인지, 실패한 것인지, 다시 시작할 수 있는지 구분하지 못한다.": "{keyword} 상태가 쪼개져 있지 않으면 사용자는 대기, 실패, 재시작 가능성을 구분하지 못한다.",
        "상태 이름이 중요한 이유는 추가 조건을 분리해서 적을 때 더 선명해진다.": "{label4} 조건을 따로 적어 보면 상태 이름의 필요성이 더 선명해진다.",
        "실제 제품에서는 dashboard, error copy, retry policy, support log로 흩어진다.": "{keyword}가 제품으로 내려오면 {label0} dashboard, {label1} error copy, {label2} retry policy, {label4} support log가 서로 다른 조각을 맡는다.",
        "그래서 어떤 상태를 DB에 남길지, 어떤 상태는 메모리에만 둘지, 어떤 상태는 사용자에게 보여 줄지까지 같이 적어 둔다.": "그래서 {keyword} 상태 중 DB에 남길 {label0}, 메모리에만 둘 {label1}, 사용자에게 보일 {label4}를 같이 적어 둔다.",
        "지금 어떤 조건을 기다리는지, 어떤 선택지가 남았는지, 어떤 데이터가 아직 안전하지 않은지 알려 줘야 한다.": "{keyword} 화면은 기다리는 조건, 남은 선택지, 아직 안전하지 않은 데이터를 분리해서 알려 줘야 한다.",
        "반대로 이 주제를 하나의 옵션처럼만 붙이면 기능 플래그를 끄는 것도 어려워진다.": "{keyword}를 단순 옵션처럼 붙이면 나중에 기능 플래그를 끄는 일도 어려워진다.",
        "어떤 사용자가 어떤 경로를 타고 있었는지 모르면 점진 배포도, 롤백도, 비용 제한도 어색해진다.": "{label0} 경로를 탄 사용자를 모르면 점진 배포, 롤백, 비용 제한이 모두 어색해진다.",
        "왼쪽에는 기술적으로 가능한 일을 쓰고, 오른쪽에는 사용자가 어떻게 오해할 수 있는지 적는다.": "한쪽에는 {keyword}로 가능한 일을, 다른 한쪽에는 사용자가 오해할 장면을 적는다.",
        "오른쪽에는 항상 빠르다고 기대함, 서버가 파일을 본다고 오해함, 내 변경이 사라졌다고 느낌, 완료율이 뒤로 감 같은 문장이 들어간다.": "{keyword} 오해 칸에는 {label0} 속도 기대, {label1} 서버 노출 불안, {label2} 변경 손실 감각, {label4} 완료율 역행을 따로 넣는다.",
        "기술적으로 가능한 일을 그대로 켜면 기능 목록은 늘지만 설명 책임도 같이 늘어난다.": "{keyword} 기능을 그대로 켜면 목록은 늘지만 설명해야 할 책임도 같이 늘어난다.",
        "이 주제를 사용자가 몰라도 지금 어떤 일이 벌어지는지는 이해할 수 있어야 한다.": "사용자가 {keyword}를 몰라도 지금 벌어지는 일은 이해할 수 있어야 한다.",
        "완벽한 분산 구조를 만들겠다는 욕심보다, 지금 제품에서 가장 자주 만날 실패 하나를 안전하게 처리하는 쪽으로 시작할 수 있다.": "완벽한 분산 구조보다 지금 제품에서 가장 자주 만날 {label0} 실패 하나를 안전하게 다루는 데서 시작한다.",
        "작은 정책 하나, 로그 필드 하나, 안내 문구 하나가 프로토콜 선택만큼 중요해지는 순간이 있다.": "{keyword}에서는 {label0} 정책, {label3} 로그 필드, {label4} 안내 문구가 프로토콜 선택만큼 무거워지는 순간이 있다.",
        "이 값들이 따로 있어야 나중에 'P2P가 느리다'는 한 문장을 실제 원인으로 다시 풀 수 있다.": "이 {label1} 값이 갈라져야 나중에 P2P가 느리다는 말을 {keyword}의 실제 원인으로 다시 풀 수 있다.",
        "그래야 고객 문의가 들어왔을 때 네트워크 문제라는 말로 도망가지 않고 우리가 어떤 선택을 했는지 설명할 수 있다.": "그래야 {label4} 문의가 왔을 때 네트워크 탓으로 도망가지 않고 {label0}에서 우리가 고른 선택을 설명할 수 있다.",
        "이렇게 순서를 좁히면 실험이 실패해도 제품 전체가 같이 흔들리지 않는다.": "{keyword} 실험의 순서를 좁혀 두면 실패해도 제품 전체가 같이 흔들리지 않는다.",
        "처음 공부할 때는 세부 용어가 많아 보였지만, 운영 관점에서는 결국 상태를 나누고 책임자를 남기는 문제로 돌아온다.": "처음에는 {keyword} 용어가 많아 보였지만, 운영에서는 상태를 나누고 책임자를 남기는 문제로 돌아온다.",
        "어떤 값은 브라우저에 있고, 어떤 값은 signaling 서버에 있고, 어떤 값은 사용자의 기다림 속에 있다.": "{label0} 값은 브라우저에, {label1} 단서는 signaling 서버에, {label4} 비용은 사용자의 기다림 속에 남을 수 있다.",
        "세 문장이 실제 코드와 로그에 대응하지 않으면 아직 공부가 기능으로 내려오지 않은 것이다.": "{keyword} 문장이 코드와 로그에 대응하지 않으면 아직 기능으로 내려오지 않은 상태다.",
        "반대로 대응하는 필드가 보이면 글에서 얻은 기준이 제품 안으로 조금은 들어온 셈이다.": "대응 필드가 보이면 {keyword}에서 얻은 기준이 제품 안으로 들어온 셈이다.",
        "사용자가 직접 보는 것은 성공, 대기, 실패 세 단어뿐이지만 내부 상태는 그보다": "사용자가 보는 말은 성공, 대기, 실패 정도지만 {keyword} 내부 상태는 그보다",
        "이 시각을 나눠 적으면 같은 실패라도 재시도할 실패인지, 사용자에게 행동을 요청할 실패인지, 운영자가 비용 정책을 바꿔야 할 실패인지 갈라진다.": "{label0} 시각을 나누면 같은 실패도 재시도 대상, 사용자 행동 요청, 운영 정책 수정으로 갈라진다.",
        "첫 열은 사용자가 본 문장, 둘째 열은 내부 상태, 셋째 열은 다음 행동, 넷째 열은 지워도 되는 데이터와 절대 지우면 안 되는 데이터다.": "표의 열은 사용자 문장, {keyword} 내부 상태, 다음 행동, 지워도 되는 데이터와 보존할 데이터로 나눈다.",
        "표가 채워질 때부터 비로소 PonsLink나 PonsWarp 같은 실제 제품 안에서 고칠 수 있는 단위가 된다.": "표가 채워질 때부터 {keyword}는 PonsLink나 PonsWarp 안에서 고칠 수 있는 단위가 된다.",
        "완료율은 마지막 상태만 말해 주고, 중간에 사용자가 얼마나 불안했는지는 잘 말해 주지 않는다.": "완료율은 마지막 상태만 말하고 {keyword} 중간에 생긴 불안을 잘 말해 주지 않는다.",
        "그래서 전송 시간, 재시도 횟수, relay 전환 비율, 검증 실패율, 사용자가 다시 눌러 본 횟수를 같이 본다.": "그래서 {label0} 전송 시간, {label1} 재시도, {label2} 전환, {label3} 검증 실패, {label4} 다시 누른 횟수를 {keyword} 표에서 같이 본다.",
        "이 주제는 로컬 테스트에서는 깔끔해 보이지만 실제 네트워크에서는 시간, 권한, 배터리, 저장소, 비용 제한을 동시에 만난다.": "{keyword}는 {label0} 로컬 테스트가 깔끔해 보여도 실제 네트워크에서는 {label1} 시간, {label2} 권한, {label3} 배터리, 저장소, {label4} 비용 제한을 동시에 만난다.",
        "마지막으로 PonsLink나 PonsWarp 중 어느 제품 장면에 붙는지 확인한다.": "마지막에는 {keyword}가 PonsLink와 PonsWarp 중 어느 장면을 고치는지 확인한다.",
        "아래 조건을 설명할 수 없는 프로토콜은 성공 데모가 있더라도 제품에 넣기 이르다.": "{keyword} 조건을 설명하지 못하면 성공 데모가 있어도 제품에 넣기 이르다.",
        "제품으로 내려오면 이 기준은 dashboard, error copy, retry policy, support log에 흩어진다.": "{keyword} 기준은 제품 안에서 {label0} dashboard, {label1} error copy, {label2} retry policy, {label4} support log로 나뉘어 남는다.",
        "오해 칸에는 빠를 것이라는 기대, 서버가 본다는 불안, 변경이 사라졌다는 느낌, 완료율이 뒤로 가는 장면을 넣는다.": "{keyword} 오해 칸에는 속도 기대, 서버 노출 불안, 변경 손실 감각, 완료율 역행을 따로 넣는다.",
        "절에서 다시 보면 서버를 덜 쓴다는 말은 책임이 사라진다는 뜻이 아니었다.": "대목에서 다시 보면 {keyword}는 서버를 덜 써도 책임이 남는 문제였다.",
        "절을 기준으로 보면 협조적인 네트워크와 짧은 시간만 지나가는 시연에서는 보이지 않지만, 오래 켜진 탭, 잠든 모바일, 회사 방화벽, 만료된 초대 링크, 느린 저장소가 들어오면 이 주제의 성격이 바뀐다.": "대목을 기준으로 보면 {keyword} 주제는 짧은 시연보다 {label0} 항목이 늦어지고 {label4} 항목이 흔들리는 실제 조건에서 성격이 바뀐다.",
    }
    context = {
        "keyword": topic["keyword"],
        "label0": labels[0],
        "label1": labels[1],
        "label2": labels[2],
        "label3": labels[3],
        "label4": labels[4],
    }
    for source, replacement in frame_rewrites.items():
        content = content.replace(source, replacement.format(**context))
    content = normalize_topic_particles(content, topic["keyword"])
    return content


def plain_text(markdown: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"!\[[^\]]*\]\([^)]*\)|\[([^\]]+)\]\([^)]*\)|[#>*_`~|\-]+", " ", markdown)).strip()


def reading_time(content: str) -> int:
    return max(6, round(len(plain_text(content)) / 760))


def build_posts() -> list[dict[str, Any]]:
    posts: list[dict[str, Any]] = []
    for index, topic in enumerate(TOPICS):
        previous_slug = TOPICS[index - 1]["slug"] if index > 0 else None
        next_slug = TOPICS[index + 1]["slug"] if index + 1 < len(TOPICS) else None
        content = body_for(topic, previous_slug, next_slug)
        post = {
            "id": f"post-{topic['slug']}",
            "slug": topic["slug"],
            "title": topic["title"],
            "excerpt": topic["excerpt"],
            "content": content,
            "category": "공부 노트",
            "tags": topic["tags"],
            "coverColor": "#1f2937",
            "featuredImage": image_path(topic["slug"], "cover"),
            "status": "published",
            "readingTime": reading_time(content),
            "plainChars": len(plain_text(content)),
            "order": topic["order"],
        }
        posts.append(post)
    return posts


def prompt_for(topic: dict[str, Any], slot: str) -> str:
    slot_name = dict(IMAGE_SLOTS)[slot]
    labels = ", ".join(topic["labels"])
    return f"""Use latest Codex imagegen / gpt-5.5 raster image generation only.
Create one original 16:9 horizontal Korean technical study-note illustration for `{topic['title']}`.
Slot `{slot}` is `{slot_name}` for `{topic['keyword']}`.
Visual direction: warm notebook paper, field-note sketch, fountain-pen line work, light blue-pencil arrows, muted sepia sticky notes, sparse watercolor accents. Keep it as one focused scene or one simple technical map, not a multi-panel storyboard.
Include at most 2-5 short Korean/technical labels using these ideas where useful: {labels}.
The image should feel hand-studied and concrete, not a generic SaaS card.
No SVG. No canvas. No HTML screenshot. No Python-drawn or code-rendered image. No diagram-card fallback. No vector source converted to WebP. No vector-to-WebP conversion. Do not use agbrowse or provider-cache-only screenshots. Keep text sparse and legible."""


def write_requests(posts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    PROMPT_DIR.mkdir(parents=True, exist_ok=True)
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    requests: list[dict[str, Any]] = []
    idx = 1
    by_slug = {topic["slug"]: topic for topic in TOPICS}
    for post in posts:
        topic = by_slug[post["slug"]]
        for slot, slot_kind in IMAGE_SLOTS:
            prompt_path = PROMPT_DIR / f"{idx:03d}-{post['slug']}-{slot}.txt"
            prompt_text = prompt_for(topic, slot)
            prompt_path.write_text(prompt_text, encoding="utf-8")
            target_dir = GENERATED_DIR / post["slug"]
            req = {
                "index": idx,
                "slug": post["slug"],
                "title": post["title"],
                "slotId": slot,
                "slotKind": slot_kind,
                "promptPath": str(prompt_path.relative_to(ROOT)),
                "targetPng": str((target_dir / f"{post['slug']}-{slot}.png").relative_to(ROOT)),
                "targetWebp": str((target_dir / f"{post['slug']}-{slot}.webp").relative_to(ROOT)),
                "publicWebp": image_path(post["slug"], slot),
                "requiredBackend": "latest Codex imagegen / gpt-5.5",
                "finalPrompt": prompt_text,
            }
            requests.append(req)
            idx += 1
    OUT_REQUESTS.write_text(json.dumps(requests, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_REQUESTS_JSONL.write_text("\n".join(json.dumps(req, ensure_ascii=False) for req in requests) + "\n", encoding="utf-8")
    REQUESTS_BATCH.parent.mkdir(parents=True, exist_ok=True)
    REQUESTS_BATCH.write_text(OUT_REQUESTS_JSONL.read_text(encoding="utf-8"), encoding="utf-8")
    return requests


def write_artifacts(posts: list[dict[str, Any]], requests: list[dict[str, Any]]) -> None:
    WORKDIR.mkdir(parents=True, exist_ok=True)
    candidates = [{"slug": p["slug"], "title": p["title"], "tags": p["tags"], "content": p["content"], "category": p["category"]} for p in posts]
    OUT_CANDIDATES.write_text(json.dumps(candidates, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_PATCH.write_text(json.dumps({"schemaVersion": 1, "kind": "p2p-protocol-deep-dive-db-patch", "posts": posts, "imageRequests": requests}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = {"schemaVersion": 1, "posts": len(posts), "imageRequests": len(requests), "minPlainChars": min(p["plainChars"] for p in posts), "maxPlainChars": max(p["plainChars"] for p in posts)}
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ms(value: dt.datetime) -> int:
    return int(value.timestamp() * 1000)


def apply_db(posts: list[dict[str, Any]]) -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("PRAGMA foreign_keys=ON")
        now = ms(dt.datetime(2026, 7, 4, 14, 30, tzinfo=dt.UTC))
        author = conn.execute("SELECT id, displayName FROM User WHERE username=?", ("ponslink",)).fetchone() or conn.execute("SELECT id, displayName FROM User ORDER BY createdAt LIMIT 1").fetchone()
        if not author:
            raise RuntimeError("no author found")
        author_id, author_name = author

        def upsert_tax(slug: str, name: str, kind: str, parent_id: str | None, description: str, sort_order: int, fallback_id: str) -> str:
            row = conn.execute("SELECT id FROM TaxonomyNode WHERE slug=?", (slug,)).fetchone()
            if row:
                tax_id = row[0]
                conn.execute("UPDATE TaxonomyNode SET name=?, kind=?, parentId=?, description=?, sortOrder=?, updatedAt=? WHERE slug=?", (name, kind, parent_id, description, sort_order, now, slug))
            else:
                tax_id = fallback_id
                conn.execute("INSERT INTO TaxonomyNode (id, slug, name, kind, parentId, description, sortOrder, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)", (tax_id, slug, name, kind, parent_id, description, sort_order, now, now))
            return tax_id

        category_id = upsert_tax("study-note", "공부 노트", "category", None, "직접 만든 제품을 이해하기 위해 정리한 네트워크, 브라우저, 시스템 설계 공부 기록", 25, "tax-study-note")
        project_id = upsert_tax("study-note/p2p-protocols", "분산 P2P 프로토콜", "project", category_id, "DHT, libp2p, WebTransport, CRDT, trust boundary, TURN 비용, Merkle 검증, 모바일 제약, edge/serverless 혼합 구조를 정리한 후속 공부 노트", 20, "tax-study-note-p2p-protocols")

        series_slug = "distributed-p2p-protocol-deep-dive"
        row = conn.execute("SELECT id FROM Series WHERE slug=?", (series_slug,)).fetchone()
        if row:
            series_id = row[0]
            conn.execute("UPDATE Series SET title=?, description=?, projectSlug=?, sortOrder=?, updatedAt=? WHERE slug=?", ("분산 P2P 프로토콜 딥다이브", "DHT와 libp2p부터 CRDT, TURN 비용, Merkle 검증, 모바일 제약, edge/serverless 혼합 구조까지 이어지는 P2P 2차 공부 노트.", "study-note/p2p-protocols", 6, now, series_slug))
        else:
            series_id = "series-distributed-p2p-protocol-deep-dive"
            conn.execute("INSERT INTO Series (id, slug, title, description, projectSlug, sortOrder, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)", (series_id, series_slug, "분산 P2P 프로토콜 딥다이브", "DHT와 libp2p부터 CRDT, TURN 비용, Merkle 검증, 모바일 제약, edge/serverless 혼합 구조까지 이어지는 P2P 2차 공부 노트.", "study-note/p2p-protocols", 6, now, now))

        post_ids: list[str] = []
        base = dt.datetime(2026, 7, 4, 14, 0, tzinfo=dt.UTC)
        for post in posts:
            published = ms(base + dt.timedelta(minutes=post["order"] * 7))
            existing = conn.execute("SELECT id, views FROM Post WHERE slug=?", (post["slug"],)).fetchone()
            if existing:
                post_id = existing[0]
                conn.execute("UPDATE Post SET title=?, excerpt=?, content=?, category=?, tags=?, coverColor=?, featuredImage=?, status=?, readingTime=?, authorId=?, authorName=?, publishedAt=?, updatedAt=? WHERE slug=?", (post["title"], post["excerpt"], post["content"], post["category"], post["tags"], post["coverColor"], post["featuredImage"], post["status"], post["readingTime"], author_id, author_name, published, now, post["slug"]))
            else:
                post_id = post["id"]
                conn.execute("INSERT INTO Post (id, slug, title, excerpt, content, category, tags, coverColor, featuredImage, status, readingTime, views, authorId, authorName, publishedAt, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (post_id, post["slug"], post["title"], post["excerpt"], post["content"], post["category"], post["tags"], post["coverColor"], post["featuredImage"], post["status"], post["readingTime"], 0, author_id, author_name, published, now, now))
            post_ids.append(post_id)
        placeholders = ",".join("?" for _ in post_ids)
        conn.execute(f"DELETE FROM PostTaxonomy WHERE role='primary' AND postId IN ({placeholders})", post_ids)
        for post_id in post_ids:
            conn.execute("INSERT OR REPLACE INTO PostTaxonomy (id, postId, nodeId, role, sortOrder) VALUES (?,?,?,?,?)", (f"pt-{post_id}-{project_id}", post_id, project_id, "primary", 0))
        conn.execute("DELETE FROM PostSeries WHERE seriesId=?", (series_id,))
        for order, post_id in enumerate(post_ids, start=1):
            conn.execute("INSERT INTO PostSeries (id, postId, seriesId, sortOrder, isPinned) VALUES (?,?,?,?,?)", (f"ps-{series_id}-{order}", post_id, series_id, order, 1 if order <= 3 else 0))
        conn.commit()
    finally:
        conn.close()


def finalize_images(requests: list[dict[str, Any]]) -> None:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for req in requests:
        src = ROOT / req["targetWebp"]
        if not src.exists():
            raise FileNotFoundError(f"missing generated WebP: {src}")
        dest = ROOT / "public" / req["publicWebp"].lstrip("/")
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        grouped.setdefault(req["slug"], []).append(req)

    for slug, entries in grouped.items():
        assets = []
        final_paths = []
        content_paths = []
        for req in sorted(entries, key=lambda item: int(item["index"])):
            final_path = req["publicWebp"]
            final_paths.append(final_path)
            if req["slotId"] in BODY_SLOTS:
                content_paths.append(final_path)
            file_path = ROOT / "public" / final_path.lstrip("/")
            assets.append({
                "slotId": req["slotId"],
                "requestIndex": req["index"],
                "promptId": f"{slug}:{req['slotId']}",
                "promptPath": req["promptPath"],
                "generationId": f"codex-imagegen-p2p-protocol-{req['index']}",
                "stagingAssetPath": req["targetWebp"],
                "finalAssetPath": final_path,
                "sha256": hashlib.sha256(file_path.read_bytes()).hexdigest(),
            })
        manifest = {
            "schemaVersion": 1,
            "backend": "Codex imagegen / Imagen",
            "model": "gpt-5.5",
            "sourceType": "codex-imagegen-imagen-raster",
            "generatedAt": dt.datetime.now(dt.UTC).isoformat(),
            "goalId": "p2p-protocol-followup",
            "slug": slug,
            "promptId": f"{slug}:body-image-set",
            "generationId": f"codex-imagegen-p2p-protocol-{slug}",
            "finalAssetPaths": final_paths,
            "contentImagePaths": content_paths,
            "assets": assets,
        }
        (PUBLIC_BODY_ROOT / slug / ".imagegen-provenance.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply-db", action="store_true")
    parser.add_argument("--finalize-images", action="store_true")
    args = parser.parse_args()
    WORKDIR.mkdir(parents=True, exist_ok=True)
    posts = build_posts()
    requests = write_requests(posts)
    write_artifacts(posts, requests)
    if args.finalize_images:
        finalize_images(requests)
    if args.apply_db:
        apply_db(posts)
    print(json.dumps({"posts": len(posts), "imageRequests": len(requests), "workdir": str(WORKDIR), "minChars": min(p["plainChars"] for p in posts), "maxChars": max(p["plainChars"] for p in posts), "applyDb": args.apply_db, "finalizeImages": args.finalize_images}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
