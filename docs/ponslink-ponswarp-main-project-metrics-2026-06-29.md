# PonsLink · PonsWarp 메인 포지셔닝과 커밋 기반 지표 설계

작성일: 2026-06-29
적용 범위: `blog.ponslink.com` / portfolio `Work` 섹션 / 향후 제품 회고 글

## 1. 결론

PonsLink와 PonsWarp를 메인 프로젝트로 둔다. 나머지 서비스는 “번외 프로젝트”로 묶는다.

이유는 단순히 두 프로젝트가 운영 URL을 갖고 있어서가 아니다. 커밋 내역을 보면 두 프로젝트 모두 반복적으로 제품 경계, 운영 안정성, 사용자 흐름, 배포/측정까지 다룬 흔적이 남아 있다. 반면 다른 서비스들은 포트폴리오에서 확장 실험이나 사이드 도구로 보여 주는 편이 더 자연스럽다.

## 2. 메인/번외 노출 규칙

### 메인 프로젝트

1. **PonsLink**
   - 핵심 문장: “연결을 세션으로 바꾸는 제품”
   - 블로그 서사: 명함 교환 이후의 애매한 연락 → 요청 → 수락/보류/거절 → 일정 → 세션룸 → 운영/결제 경계
   - 정성 키워드: 요청 우선, 부담 낮추기, 접근 권한, 운영 가능한 세션 흐름

2. **PonsWarp**
   - 핵심 문장: “파일을 직접 전송으로 바꾸는 제품”
   - 블로그 서사: 클라우드 업로드 부담 → 브라우저 간 직접 전송 → 큰 파일/실패 복구 → OPFS/WASM/Rust signaling → 측정과 공유 메타데이터
   - 정성 키워드: 서버 저장 의존 줄이기, 대용량 전송, 백프레셔, 복구 가능성, 안전한 공유

### 번외 프로젝트

- Document Automation 계열: DocuFlow / PDF마스터
- Domain AI 계열: Ruminate / 명경 / Bible Companion
- Creator Tools 계열: YouTube-to-MD / Flucto / ClickCap / CaptureBrain
- Agent Tools 계열: page-production-skills / AgentDock / TraceForge

번외 프로젝트는 숨기지 않는다. 다만 “대표 제품”처럼 밀지 말고, 메인 서사를 보조하는 확장 실험으로 보여준다.

## 3. 커밋 내역에서 확인 가능한 정량 지표

> 주의: 아래 숫자는 로컬 Git 히스토리를 기준으로 한 구현 활동 지표다. 실제 사용자 수, 전송 속도, 전환율, 장애율 같은 운영 KPI는 커밋 내역만으로 확정할 수 없다. 운영 로그, GA4, 서버 메트릭, 벤치마크 결과가 별도로 필요하다.

### PonsLink

대상 저장소:

- `/home/declan/Documents/Develop/Project/pons_p2p/ponslink-room-frontend`
- `/home/declan/Documents/Develop/Project/pons_p2p/ponslink-api-infra`

| 항목 | 값 |
|---|---:|
| 커밋 수 | 254 |
| 기간 | 2026-05-11 ~ 2026-06-25 |
| 저장소별 active day 합계 | 40 |
| 변경 이벤트 파일 수 | 2,429 |
| unique touched path 합계 | 1,069 |
| 현재 tracked file 합계 | 983 |
| 삽입 라인 | 228,507 |
| 삭제 라인 | 44,436 |

키워드 기반 커밋 주제 분포:

| 주제 | 커밋 수 |
|---|---:|
| 요청/세션/룸 흐름 | 113 |
| 운영/릴리즈/배포 | 74 |
| 제품/마케팅/전환 | 42 |
| WebRTC/P2P | 39 |
| 테스트/품질 | 20 |
| 안정성/성능 | 14 |
| 파일 전송 | 7 |

해석:

- PonsLink는 “P2P 기술 실험”보다 “요청과 세션을 운영 가능한 제품 흐름으로 만드는 작업” 비중이 더 크다.
- 커밋 주제에서 request/session/room 계열이 가장 높다. 따라서 블로그에서는 WebRTC만 앞세우기보다, 사용자가 들어오기 전의 요청/승인/권한/세션 운영을 중심 서사로 잡는 게 맞다.
- 릴리즈/운영 계열 커밋도 많아서 “만들어 본 데모”보다 “계속 운영하며 고친 제품”으로 표현할 근거가 있다.

### PonsWarp

대상 저장소:

- `/home/declan/Documents/Develop/Project/ponswarp/PonsWarp`
- `/home/declan/Documents/Develop/Project/ponswarp/pons-core-wasm`
- `/home/declan/Documents/Develop/Project/ponswarp/ponswarp-signaling-rs`

| 항목 | 값 |
|---|---:|
| 커밋 수 | 183 |
| 기간 | 2025-11-20 ~ 2026-06-24 |
| 저장소별 active day 합계 | 39 |
| 변경 이벤트 파일 수 | 801 |
| unique touched path 합계 | 242 |
| 현재 tracked file 합계 | 154 |
| 삽입 라인 | 67,008 |
| 삭제 라인 | 25,750 |

키워드 기반 커밋 주제 분포:

| 주제 | 커밋 수 |
|---|---:|
| 파일 전송/대용량/OPFS/WASM/ZIP64 | 56 |
| 운영/릴리즈/배포 | 30 |
| 안정성/성능 | 26 |
| WebRTC/P2P/signaling | 23 |
| 제품/마케팅/측정 | 14 |
| 테스트/품질 | 4 |
| 요청/세션 | 2 |

해석:

- PonsWarp는 PonsLink와 반대로 파일 전송, 큰 파일, 복구, 백프레셔, WASM/Rust signaling 같은 기술 축이 선명하다.
- 커밋 수는 PonsLink보다 적지만 기간이 더 길고, 2025년 11~12월에 초기 구현 밀도가 높다. 이후 2026년 5~6월에 안정화, 측정, 공유 메타데이터, Cloud Drop 같은 제품화 흔적이 다시 나타난다.
- 블로그에서는 “빠른 파일 전송”이라는 단순 성능 주장보다, “큰 파일을 안전하게 끝까지 보내기 위해 실패·복구·백프레셔·저장 경계를 어떻게 나눴는가”를 중심으로 써야 한다.

## 4. 커밋 내역에서 확인 가능한 정성 지표

### PonsLink 정성 지표

커밋 히스토리에서 확인되는 고찰의 방향은 다음과 같다.

1. **요청 먼저, 방은 나중에**
   - 공개 요청, 이메일/캘린더 생명주기, 승인된 게스트, 요청 상태 게이팅이 반복해서 등장한다.
   - 제품 설계 메시지: “회의방을 만드는 것보다, 누가 왜 들어오는지 먼저 정리해야 했다.”

2. **세션 접근 권한과 운영 상태를 제품 품질로 봄**
   - stale participant, stale token, publish slot, idle live session 같은 커밋이 있다.
   - 제품 설계 메시지: “연결 품질은 미디어 품질만이 아니라, 잘못 남은 상태를 얼마나 빨리 정리하느냐에 달려 있다.”

3. **마케팅 문구와 제품 흐름을 함께 다듬음**
   - request-first marketing, richer marketing composites, pricing link 같은 커밋이 있다.
   - 제품 설계 메시지: “기능이 있어도 사용자가 처음 이해하는 문장이 틀리면 제품은 열리지 않는다.”

### PonsWarp 정성 지표

커밋 히스토리에서 확인되는 고찰의 방향은 다음과 같다.

1. **대용량 전송은 속도보다 완주 가능성이 먼저**
   - 버퍼 처리 오류, 파일 손상, 백프레셔 지연 감소, direct transfer failure handling이 반복된다.
   - 제품 설계 메시지: “빠르게 보내는 것보다, 깨지지 않고 끝까지 보내는 게 먼저였다.”

2. **브라우저만으로 부족한 경계는 WASM/Rust로 분리**
   - ZIP64 streaming, WASM memory boundary, Rust signaling, ICE fallback URL 커밋이 있다.
   - 제품 설계 메시지: “프론트엔드 하나로 버티기 어려운 경계는 core와 signaling으로 잘라냈다.”

3. **직접 전송과 Cloud Drop 사이의 제품 균형**
   - Cloud Drop, R2 shares, resumable parts, paid access, checkout/webhook이 보인다.
   - 제품 설계 메시지: “항상 직접 연결만 정답은 아니고, 실패하거나 비동기 공유가 필요한 순간에는 보완 흐름이 필요했다.”

## 5. 내부 근거 커밋 예시

블로그 본문에는 커밋 번호를 노출하지 않는 게 좋다. 다만 내부 설계 근거로는 아래 예시를 보관한다.

### PonsLink

- `2e0e640` — `Sharpen request-first marketing conversion`
  `src/pages/Marketing.tsx`, `src/components/seo/RouteMetadata.tsx`, 테스트 파일 변경. 요청 우선 문구와 전환 흐름을 직접 다듬은 근거.
- `0fd71be` — `feat: harden public request email calendar lifecycle`
  `src/http/routes.ts`, `src/providers/emailTemplates.ts`, `tests/api.test.ts` 변경. 공개 요청, 이메일, 캘린더, 테스트가 함께 움직인 근거.
- `b6e0139` — `End idle live sessions after the last participant leaves`
  비어 있는 세션 정리라는 운영 품질 관점의 근거.
- `12f1fc8` — `Ignore stale participants in signaling capacity checks`
  오래된 참여자 상태가 실시간 수용량 판단을 망칠 수 있다는 고찰의 근거.
- `2e51b32` — `Stop stale room tokens from consuming publish slots`
  접근 토큰과 슬롯을 운영 자원으로 다뤘다는 근거.

### PonsWarp

- `69ebbed` — `perf: reduce p2p transfer backpressure latency`
  `src/services/swarmManager.ts`, `src/utils/constants.ts`, `src/utils/transferTuning.test.ts` 변경. 백프레셔를 성능/안정성 축으로 다룬 근거.
- `1b6fb15` — `feat(zip64): 4GB 이상 파일 지원을 위한 ZIP64 스트리밍 압축 기능 추가`
  `docs/ZIP64_WASM_DESIGN.md`, `src/zip64/*` 변경. 대용량 파일 경계를 별도 core로 뺀 근거.
- `f1c69cb` — `fix: prevent signaling room cleanup deadlocks`
  `src/handlers/room.rs`, `src/handlers/turn.rs` 변경. signaling 서버 안정화의 근거.
- `3628858` — `Make Cloud Drop large uploads resumable by parts`
  큰 업로드의 실패 복구를 제품 흐름으로 다룬 근거.
- `d88a625` — `Enable production traffic measurement with GA4`
  운영 측정 체계를 붙인 근거. 단, 실제 측정값은 GA4 데이터 확인이 필요하다.

## 6. 글에 사용할 지표 표현 방식

커밋 번호와 함수명은 블로그 본문에 넣지 않는다. 대신 다음 표현으로 바꾼다.

### 쓸 수 있는 표현

- “두 달 사이 요청과 세션 흐름을 수백 번 고쳤다.”
- “PonsLink 커밋의 가장 큰 비중은 WebRTC 자체보다 요청/세션/운영 흐름에 있었다.”
- “PonsWarp는 파일 전송, 백프레셔, 대용량, WASM/Rust signaling 쪽으로 커밋이 몰려 있었다.”
- “속도 숫자를 자랑하기보다, 실패했을 때 어떻게 복구하고 다시 이어갈지를 더 많이 고쳤다.”

### 피해야 할 표현

- “전송 속도가 N배 빨라졌다.” — 벤치마크 없이는 불가.
- “사용자가 N명 늘었다.” — 운영 로그/GA4 없이는 불가.
- “전환율이 좋아졌다.” — 실험/분석 데이터 없이는 불가.
- “장애가 사라졌다.” — incident log 없이는 불가.

## 7. 이번 UI 반영 사항

- `PonsLink`와 `PonsWarp`에 `tier: "primary"`를 부여한다.
- 나머지 프로젝트에는 `tier: "bonus"`를 부여한다.
- `Work` 섹션은 `Main projects`와 `Bonus archive`로 나눠 보여준다.
- `Signature systems`는 PonsLink와 PonsWarp 두 개만 노출한다.
- 글 기획 목록에서는 세 번째 이후 항목에 `번외 /` 접두어를 붙여 메인 서사와 분리한다.

## 8. 재현 명령

아래 명령으로 같은 종류의 지표를 다시 확인했다.

```bash
git -C /home/declan/Documents/Develop/Project/pons_p2p/ponslink-room-frontend rev-list --count HEAD
git -C /home/declan/Documents/Develop/Project/pons_p2p/ponslink-api-infra rev-list --count HEAD
git -C /home/declan/Documents/Develop/Project/ponswarp/PonsWarp rev-list --count HEAD
git -C /home/declan/Documents/Develop/Project/ponswarp/pons-core-wasm rev-list --count HEAD
git -C /home/declan/Documents/Develop/Project/ponswarp/ponswarp-signaling-rs rev-list --count HEAD

git -C /home/declan/Documents/Develop/Project/ponswarp/PonsWarp show --stat --oneline 69ebbed
git -C /home/declan/Documents/Develop/Project/ponswarp/pons-core-wasm show --stat --oneline 1b6fb15
git -C /home/declan/Documents/Develop/Project/ponswarp/ponswarp-signaling-rs show --stat --oneline f1c69cb
git -C /home/declan/Documents/Develop/Project/pons_p2p/ponslink-room-frontend show --stat --oneline 2e0e640
git -C /home/declan/Documents/Develop/Project/pons_p2p/ponslink-api-infra show --stat --oneline 0fd71be
```
