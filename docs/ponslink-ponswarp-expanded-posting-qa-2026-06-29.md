# PonsLink/PonsWarp 보강 글 게시 및 QA 보고서

- 작성일: 2026-06-29
- 대상: blog.ponslink.com
- 로컬 작업 디렉토리: `/home/declan/Documents/Develop/Project/portfolio/v2`
- 기준 설계문서: `docs/ponslink-ponswarp-expanded-story-insertion-and-reddit-qa-2026-06-29.md`
- 생성/반영 스크립트: `scripts/create-expanded-pons-story-posts.py`

## 결과

PonsLink 보강 8편, PonsWarp 보강 8편, 총 16편을 작성해서 로컬 DB와 운영 DB에 게시했다.
각 글에는 중복 없는 대표 이미지 1개와 본문 이해를 돕는 다이어그램 1개를 붙였다.
대표 이미지는 카드/썸네일용이고, 본문 다이어그램은 글의 논리 흐름을 바로 이해하도록 만든 설명용 자산이다.

## 게시 목록

| # | 구분 | 제목 | slug | Read | 대표 이미지 | 본문 다이어그램 |
|---:|---|---|---|---:|---|---|
| 1 | PonsLink | [PonsLink] 계정 없이 링크 하나로 만나는 방을 만들고 싶었다 | `2026-06-16-ponslink-00-link-only-room` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-16-ponslink-00-link-only-room.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-16-ponslink-00-link-only-room-diagram.svg` |
| 2 | PonsLink | [PonsLink] 나는 먼저 방을 만들었다, 제품 설명은 그다음이었다 | `2026-06-16-ponslink-01b-room-before-product` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-16-ponslink-01b-room-before-product.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-16-ponslink-01b-room-before-product-diagram.svg` |
| 3 | PonsLink | [PonsLink] 링크는 단순했지만, 뒤에서는 신호가 계속 엉켰다 | `2026-06-16-ponslink-02b-signal-behind-link` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-16-ponslink-02b-signal-behind-link.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-16-ponslink-02b-signal-behind-link-diagram.svg` |
| 4 | PonsLink | [PonsLink] 말로 부족한 순간마다 방에 기능이 하나씩 붙었다 | `2026-06-16-ponslink-04b-room-grew-with-context` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-16-ponslink-04b-room-grew-with-context.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-16-ponslink-04b-room-grew-with-context-diagram.svg` |
| 5 | PonsLink | [PonsLink] PonsCast는 같은 시간을 공유하고 싶어서 만든 기능이었다 | `2026-06-16-ponslink-04c-ponscast-same-time` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-16-ponslink-04c-ponscast-same-time.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-16-ponslink-04c-ponscast-same-time-diagram.svg` |
| 6 | PonsLink | [PonsLink] 좋은 방만으로는 실제 약속이 굴러가지 않았다 | `2026-06-16-ponslink-07b-good-room-not-enough` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-16-ponslink-07b-good-room-not-enough.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-16-ponslink-07b-good-room-not-enough-diagram.svg` |
| 7 | PonsLink | [PonsLink] 파일 전송은 결국 방 밖으로 독립해야 했다 | `2026-06-16-ponslink-09b-file-transfer-left-room` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-16-ponslink-09b-file-transfer-left-room.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-16-ponslink-09b-file-transfer-left-room-diagram.svg` |
| 8 | PonsLink | [PonsLink] 커밋을 다시 보니, 내가 만든 건 회의 앱보다 연결 방식에 가까웠다 | `2026-06-16-ponslink-12b-connection-method` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-16-ponslink-12b-connection-method.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-16-ponslink-12b-connection-method-diagram.svg` |
| 9 | PonsWarp | [PonsWarp] 파일 전송은 PonsLink 안에서 먼저 고장났다 | `2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-29-ponswarp-00-file-transfer-broke-in-ponslink-diagram.svg` |
| 10 | PonsWarp | [PonsWarp] TB급 전송을 꿈꾸자 데이터 그리드가 필요해졌다 | `2026-06-29-ponswarp-01b-data-grid-tb-experiment` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-29-ponswarp-01b-data-grid-tb-experiment.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-29-ponswarp-01b-data-grid-tb-experiment-diagram.svg` |
| 11 | PonsWarp | [PonsWarp] 데스크탑 앱까지 갔지만, 테스트할 기기가 없었다 | `2026-06-29-ponswarp-02b-desktop-testing-fatigue` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-29-ponswarp-02b-desktop-testing-fatigue.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-29-ponswarp-02b-desktop-testing-fatigue-diagram.svg` |
| 12 | PonsWarp | [PonsWarp] ACK 하나 때문에 전송이 멈추고 살아났다 | `2026-06-29-ponswarp-04b-ack-backpressure-battle` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-29-ponswarp-04b-ack-backpressure-battle.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-29-ponswarp-04b-ack-backpressure-battle-diagram.svg` |
| 13 | PonsWarp | [PonsWarp] 2GB를 넘기자 브라우저 메모리가 먼저 무너졌다 | `2026-06-29-ponswarp-05b-browser-memory-2gb` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-29-ponswarp-05b-browser-memory-2gb.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-29-ponswarp-05b-browser-memory-2gb-diagram.svg` |
| 14 | PonsWarp | [PonsWarp] OPFS는 만능키가 아니라 마지막 안전망이었다 | `2026-06-29-ponswarp-05c-opfs-safety-net` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-29-ponswarp-05c-opfs-safety-net.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-29-ponswarp-05c-opfs-safety-net-diagram.svg` |
| 15 | PonsWarp | [PonsWarp] Rust와 WASM은 속도 욕심보다 메모리 생존을 위한 선택이었다 | `2026-06-29-ponswarp-06b-rust-wasm-memory-survival` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-29-ponswarp-06b-rust-wasm-memory-survival.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-29-ponswarp-06b-rust-wasm-memory-survival-diagram.svg` |
| 16 | PonsWarp | [PonsWarp] 결국 내가 만든 건 파일 전송 버튼이 아니라 실패를 견디는 흐름이었다 | `2026-06-29-ponswarp-12b-flow-that-survives-failure` | 1분 | `/tistory/pons-story-inserts/covers/2026-06-29-ponswarp-12b-flow-that-survives-failure.svg` | `/tistory/pons-story-inserts/diagrams/2026-06-29-ponswarp-12b-flow-that-survives-failure-diagram.svg` |

## 운영 반영 내역

- 로컬 DB: `db/custom.db`
- 로컬 DB 백업: `db/backups/custom.db.before-expanded-pons-story-posts-20260629224155`, `db/backups/custom.db.before-expanded-pons-story-posts-20260629225150`
- 운영 DB: `/opt/ponslink-blog-next/shared/db/custom.db`
- 운영 DB 백업:
  - `/opt/ponslink-blog-next/shared/db/custom.db.before-expanded-pons-story-posts-20260629154546`
  - `/opt/ponslink-blog-next/shared/db/custom.db.before-expanded-pons-story-posts-20260629155226`
- 운영 릴리스: `/opt/ponslink-blog-next/releases/202606292252-expanded-pons-story`
- current 링크: `/opt/ponslink-blog-next/current -> /opt/ponslink-blog-next/releases/202606292252-expanded-pons-story`
- 서비스: `ponslink-blog-next.service` 재시작 완료, `active`

## QA 체크리스트

| 항목 | 결과 | 근거 |
|---|---:|---|
| 글 개수 | 통과 | 로컬/운영 DB 모두 16행, PonsLink 8 + PonsWarp 8 |
| 카테고리 목록 노출 | 통과 | `/writing?category=PonsLink`, `/writing?category=PonsWarp` 각각 새 slug 8개 확인 |
| 개별 글 접근 | 통과 | 16개 `/writing/{slug}` 모두 HTTP 200 |
| 이전/다음 글 네비게이션 | 통과 | 16개 글 HTML에서 이전/다음 네비게이션 마커 확인 |
| 대표 이미지 | 통과 | 16개 모두 고유 path, 운영 asset 대표 샘플 HTTP 200 `image/svg+xml` |
| 본문 다이어그램 | 통과 | 16개 모두 고유 path, 운영 asset 대표 샘플 HTTP 200 `image/svg+xml` |
| 전체 published 대표 이미지 중복 | 통과 | 로컬 published post 기준 duplicate 0개 |
| 경어체 금지 | 통과 | `합니다/했습니다/됩니다/입니다/드립니다/주세요/습니다` 패턴 0건 |
| 커밋 번호 노출 금지 | 통과 | 7~40자 hex commit-like 패턴 0건 |
| 함수명 노출 금지 | 통과 | function-call-like 패턴 0건 |
| PonsLink 요구 서사 | 통과 | 링크/방/개인정보/화이트보드/통역/회의록/PonsCast/파일 전송 포함 |
| PonsWarp 요구 서사 | 통과 | PonsLink 분리, 데이터 그리드, TB, Rust, WASM, Desktop 테스트 피로, ACK, 백프래셔, 2GB, IndexedDB, OPFS 포함 |
| Reddit 독자 관점 QA | 통과 | 실패→판단→구조→회고 순서가 있고, 과장된 성능 단정 대신 “실험/경계/선택”으로 서술 |

## 실행한 검증 명령

```bash
bun test src/lib/reading-time.test.ts src/lib/retrospectives.test.ts
DATABASE_URL="file:$PWD/db/custom.db" bun run build
```

결과:

- `bun test`: 9 pass, 0 fail
- `next build`: compiled successfully, `/writing`과 `/writing/[slug]` dynamic route 확인

## 라이브 QA 샘플

- `https://blog.ponslink.com/writing/2026-06-16-ponslink-00-link-only-room` → 200
- `https://blog.ponslink.com/writing/2026-06-29-ponswarp-04b-ack-backpressure-battle` → 200, “백프래셔” 표기 확인
- `https://blog.ponslink.com/writing?category=PonsLink` → 새 글 8개 확인
- `https://blog.ponslink.com/writing?category=PonsWarp` → 새 글 8개 확인
- `/tistory/pons-story-inserts/covers/2026-06-16-ponslink-00-link-only-room.svg` → 200, `image/svg+xml`
- `/tistory/pons-story-inserts/diagrams/2026-06-29-ponswarp-04b-ack-backpressure-battle-diagram.svg` → 200, `image/svg+xml`

## 스토리텔링 QA 메모

PonsLink 쪽은 “계정 없는 링크 → room-first → 신호/권한의 복잡도 → 방 안에서 맥락 기능이 늘어남 → PonsCast의 개인적 동기 → 운영 요청/파일 전송 분리 → 연결 방식 회고” 순서로 들어갔다.
PonsWarp 쪽은 “PonsLink 안에서 파일 전송이 깨짐 → TB급/데이터 그리드 실험 → Rust/WASM/데스크탑 앱 시도 → 테스트 피로 → 웹 P2P 안정화 → ACK/백프래셔 → 2GB 메모리 문제 → IndexedDB 검토와 OPFS 선택 → 실패를 견디는 흐름”으로 이어진다.

Reddit 독자가 읽는다고 가정했을 때, 단순 홍보글보다는 ‘왜 이렇게 돌아왔는지’가 보이는 편이다.
다만 각 글이 1분 내외라 아주 긴 딥다이브는 아니다. 이후 확장한다면 ACK/OPFS/Rust-WASM 각각은 별도 5~10분짜리 글로 늘릴 수 있다.

## 남은 리스크

- 이번 대표 이미지와 다이어그램은 문맥 정확성과 중복 방지를 위해 프로젝트 내 SVG 자산으로 만들었다. 사진풍 생성 이미지보다 설명성은 높지만, 감성적인 썸네일 다양성은 상대적으로 낮다.
- Cloudflare/Next 캐시 때문에 새 public asset은 단순 파일 복사만으로 404가 날 수 있다. 이번에는 새 standalone release로 전환해서 해결했다.
