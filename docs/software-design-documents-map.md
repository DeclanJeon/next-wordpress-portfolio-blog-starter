# 개발 설계문서 지도 글 설계

## 배치

- category: `study-note` / `공부 노트`
- project slug: `study-note/software-design-docs`
- project name: `설계문서 공부 노트`
- post slug: `2026-07-07-software-design-documents-map`
- title: `개발 설계문서 지도: PRD부터 ADR, API Spec, Runbook까지`
- excerpt: `PRD, SRS, SDD, ADR, API Spec, Threat Model, Runbook처럼 흩어진 개발 설계문서를 제품 판단, 요구사항, 구조, 결정 기록, 인터페이스, 운영의 흐름으로 다시 정리한다.`

## 왜 새 모음이 필요한가

현재 라이브 taxonomy에서 `study-note` 하위 project는 `study-note/realtime-network`, `study-note/p2p-protocols`뿐이다. 설계문서 글은 특정 제품 회고가 아니라 개발자가 제품/시스템을 설계할 때 참고하는 공부 노트이므로 `dev-retrospective/document-automation`이나 `operation-note/blog-ops`가 아니라 새 `study-note/software-design-docs` project에 배치한다.

## 글의 중심 메시지

설계문서는 종류가 많아서 어려운 게 아니다. 제품 판단, 사용자 이해, 요구사항, 구조 설계, 결정 기록, 인터페이스 계약, 검증과 운영을 한 문서에 섞기 때문에 어려워진다. 작은 팀은 문서 이름을 줄여도 되지만 결정의 층위는 줄이면 안 된다.

## 포함 문서 지도

| 층위 | 문서 | 핵심 질문 |
| --- | --- | --- |
| 제품 판단 | Vision Doc, Product Brief, BRD, MRD, PRD, Roadmap | 왜 만들고 누구에게 가치가 있는가 |
| 사용자 이해 | Persona, JTBD, User Journey Map, Use Case, User Story Map | 사용자는 어떤 상황에서 무엇을 하려는가 |
| 요구사항 | SRS, SyRS, FRD, NFR, Acceptance Criteria, Traceability Matrix | 시스템은 무엇을 만족해야 하는가 |
| 구조/설계 | SDD, Technical Design Doc, Architecture Doc, HLD, LLD, C4, arc42, UML | 어떤 구조와 책임 경계로 풀 것인가 |
| 결정 기록 | ADR, RFC, Decision Log | 왜 이 선택을 했고 어떤 대안을 버렸는가 |
| 계약/인터페이스 | API Spec, OpenAPI, AsyncAPI, ERD, Data Dictionary, Schema, ICD | 시스템과 시스템은 어떤 약속으로 연결되는가 |
| 검증/운영 | Test Strategy, Test Plan, QA Checklist, Threat Model, Release Plan, Migration Plan, Rollback Plan, Runbook, SLI/SLO/SLA, Postmortem | 맞게 만들었고 안전하게 운영할 수 있는가 |

## 핵심 참고 출처

- Atlassian PRD: https://www.atlassian.com/agile/product-management/requirements
- ISO/IEC/IEEE 29148:2018: https://standards.ieee.org/ieee/29148/6937/
- NASA requirements checklist: https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/
- Google Design Docs: https://www.industrialempathy.com/posts/design-docs-at-google/
- IEEE 1016-2009 SDD: https://standards.ieee.org/ieee/1016/4502/
- SEI Views and Beyond: https://www.sei.cmu.edu/library/documenting-software-architectures-views-and-beyond-second-edition/
- arc42: https://arc42.org/overview
- C4 model: https://c4model.com/
- Michael Nygard ADR: https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- OpenAPI Specification: https://spec.openapis.org/oas/latest.html
- OWASP Threat Modeling Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
- Google SRE SLO: https://sre.google/sre-book/service-level-objectives/
- Google SRE Launch Checklist: https://sre.google/sre-book/launch-checklist/
- Google SRE Postmortem Culture: https://sre.google/sre-book/postmortem-culture/
- GOV.UK Service Standard: https://www.gov.uk/service-manual/service-standard

## 발행 본문 초안

개발 문서를 찾아보기 시작하면 약어가 끝없이 나온다. PRD, SRS, SDD 정도만 알아도 복잡한데 BRD, MRD, NFR, ADR, RFC, API Spec, ERD, Runbook, Postmortem까지 이어진다. 처음에는 이걸 전부 외워야 하나 싶다.

하지만 실제 문제는 약어가 많다는 데 있지 않다. 각 문서가 어떤 결정을 맡는지 모르면 모든 문서가 비슷한 기획서처럼 보인다. PRD에는 API 필드가 들어가고, SRS에는 “빠르게 동작해야 한다” 같은 희망사항이 남고, 설계문서에는 박스 몇 개만 그려진다. 문서는 길어지지만 구현은 여전히 흔들린다.

**설계문서는 개발을 느리게 하려고 만드는 게 아니다. 제품의 이유, 시스템의 조건, 구조의 선택, 인터페이스의 약속, 운영의 기준을 한 문서에 섞지 않으려고 만든다.**

## 문서는 이름보다 질문으로 나누는 편이 낫다

문서를 종류별로 외우면 금방 막힌다. 회사마다 이름이 다르고, 같은 약어도 다르게 쓰인다. TDD만 해도 어떤 팀은 Technical Design Document라고 부르고, 개발자 대부분은 Test-Driven Development로 이해한다. 그래서 문서 이름보다 먼저 봐야 할 것은 그 문서가 답하는 질문이다.

| 층위 | 문서 | 핵심 질문 |
| --- | --- | --- |
| 제품 판단 | Vision, BRD, MRD, PRD, Roadmap | 왜 만들고 누구에게 가치가 있는가 |
| 사용자 이해 | Persona, JTBD, Journey Map, Use Case | 사용자는 어떤 상황에서 무엇을 하려는가 |
| 요구사항 | SRS, FRD, NFR, Acceptance Criteria | 시스템은 무엇을 만족해야 하는가 |
| 구조/설계 | SDD, Design Doc, Architecture Doc, C4, arc42 | 어떤 구조로 풀 것인가 |
| 결정 기록 | ADR, RFC, Decision Log | 왜 이 선택을 했는가 |
| 계약/인터페이스 | API Spec, OpenAPI, ERD, Schema | 시스템끼리 어떤 약속을 하는가 |
| 검증/운영 | Test Strategy, Threat Model, Runbook, SLO, Postmortem | 맞게 만들고 안전하게 운영할 수 있는가 |

이 표의 핵심은 순서다. 제품 판단에서 요구사항으로 내려오고, 요구사항은 설계와 인터페이스로 갈라지고, 결정은 ADR로 남으며, 검증과 운영 문서가 배포 이후까지 이어진다. 작은 팀이라면 이 문서를 모두 따로 만들 필요는 없다. 그래도 질문은 섞으면 안 된다.

## 제품 판단 문서: 왜 만들고 누구에게 가치가 있는가

제품 판단 문서는 구현 방법을 정하려고 쓰는 문서가 아니다. 왜 이 문제를 풀어야 하는지, 누구에게 가치가 있는지, 어떤 결과를 성공으로 볼지를 정한다. 여기에는 Vision Doc, Product Brief, BRD, MRD, PRD, Roadmap이 들어간다.

BRD는 business requirements document다. 조직이 왜 이 일을 해야 하는지, 어떤 사업 결과가 필요한지에 가깝다. MRD는 market requirements document다. 시장, 고객군, 경쟁, 포지셔닝을 본다. PRD는 product requirements document다. 사용자 문제, 제품 범위, 성공 기준, 하지 않을 일을 제품팀과 개발팀이 함께 맞추는 문서다.

Atlassian의 PRD 가이드는 PRD를 제품의 목적, 기능, 행동을 이해관계자와 정렬하는 문서로 본다. 또 좋은 PRD는 혼자 쓰는 문서가 아니라 제품, 디자인, 개발이 함께 다듬는 문서라고 설명한다. 이 관점이 중요하다. PRD는 개발팀에게 명령하는 문서가 아니라, 제품 판단의 기준선을 공유하는 문서다.

나쁜 PRD는 구현을 너무 빨리 정한다.

```md
- 알림은 WebSocket으로 보낸다.
- 파일 목록은 Redis에 캐시한다.
```

좋은 PRD는 사용자가 얻어야 할 결과와 이번 범위를 먼저 고정한다.

```md
- 사용자는 요청 상태가 바뀐 뒤 5분 안에 변경 사실을 알 수 있어야 한다.
- 첫 버전에서는 앱 내부 알림만 제공하고 이메일과 푸시는 제외한다.
```

WebSocket은 구현 선택이다. “5분 안에 알 수 있어야 한다”는 제품 요구에 가깝다. 이메일과 푸시를 제외한다는 문장은 범위를 지킨다. PRD가 이 선을 넘으면 다음 문서들이 모두 흐려진다.

## 사용자 이해 문서: 기능 목록 전에 상황을 본다

사용자 이해 문서는 화면을 예쁘게 설명하는 문서가 아니다. 사용자가 어떤 상황에서 어떤 일을 하려고 하는지 정리한다. Persona, JTBD, User Journey Map, Use Case, User Story Map이 여기에 들어간다.

Persona는 대표 사용자 유형을 잡는다. JTBD는 사용자가 “고용”하려는 일을 본다. Journey Map은 사용자가 목표에 도달하는 과정과 막히는 지점을 그린다. Use Case는 사용자와 시스템의 상호작용 시나리오를 정리한다. User Story Map은 사용자 활동 흐름을 기준으로 릴리즈 단위를 나눈다.

GOV.UK Service Standard가 좋은 기준을 준다. 좋은 서비스는 사용자의 필요를 이해하고, 사용자의 전체 문제를 풀며, 여러 채널에서 이어지는 경험을 제공해야 한다. 접근성, 보안, 성공 지표, 신뢰성도 서비스의 일부다. 이 관점에서 보면 사용자 문서는 UI 문서보다 넓다.

예를 들어 “예약 기능”이라고 쓰면 너무 좁다. 실제 질문은 이렇다.

```md
- 사용자는 상담 전에 어떤 정보를 미리 전달해야 하는가?
- 상담자는 어떤 요청을 거절하거나 보류해야 하는가?
- 사용자는 거절 이유를 어느 정도까지 이해해야 하는가?
- 같은 사용자가 다시 요청할 때 이전 맥락을 어떻게 이어야 하는가?
```

이 질문 없이 기능 목록부터 만들면 구현은 빨라 보이지만 제품은 금방 흔들린다. 사용자의 상황을 문서로 남기는 이유는 기능을 늘리기 위해서가 아니라, 만들지 않을 기능을 판단하기 위해서다.

## 요구사항 문서: 희망사항을 검증 가능한 문장으로 바꾼다

요구사항 문서는 “좋게 만들자”를 “무엇을 만족해야 통과인가”로 바꾸는 문서다. 여기에는 SRS, SyRS, FRD, NFR, Acceptance Criteria, Traceability Matrix가 들어간다.

SRS는 software requirements specification이다. 소프트웨어가 만족해야 할 기능과 조건을 적는다. SyRS는 system requirements specification으로, 소프트웨어 밖의 장치, 사람, 외부 시스템까지 포함한 시스템 요구사항에 가깝다. FRD는 functional requirements document다. 기능 동작을 다룬다. NFR은 non-functional requirements다. 성능, 보안, 가용성, 확장성, 접근성, 관측 가능성 같은 품질 조건을 다룬다.

ISO/IEC/IEEE 29148은 요구사항 공학과 요구사항 산출물의 기준을 다룬다. NASA의 요구사항 작성 가이드는 좋은 요구사항이 necessary, verifiable, attainable, clear, correct, complete, consistent, traceable해야 한다고 정리한다. 핵심은 검증 가능성이다.

나쁜 요구사항은 이렇게 생겼다.

```md
- 파일 전송은 안정적이어야 한다.
- 관리자 화면은 사용하기 쉬워야 한다.
- 검색은 빠르게 동작해야 한다.
```

이 문장들은 좋은 의도를 담고 있지만 요구사항으로는 약하다. 무엇을 측정해야 하는지 알 수 없다. 더 나은 문장은 이렇게 바뀐다.

```md
- 1GB 이하 파일 전송 중 네트워크가 10초 이하로 끊겼다가 복구되면 사용자는 파일을 처음부터 다시 선택하지 않고 이어서 전송할 수 있어야 한다.
- 관리자는 예약 요청 상세 화면에서 승인, 보류, 거절 결정을 2단계 이하의 조작으로 수행할 수 있어야 한다.
- 검색 요청의 95%는 정상 부하 조건에서 300ms 안에 첫 결과를 반환해야 한다.
```

이제 테스트할 수 있다. 안정성, 사용성, 빠름이라는 말이 조건과 기준으로 바뀌었기 때문이다. 요구사항 문서의 역할은 문장을 늘리는 것이 아니라 나중에 “이건 됐다 / 안 됐다”를 판단할 수 있게 만드는 것이다.

## 구조와 설계 문서: 무엇을 썼는지가 아니라 왜 골랐는지를 남긴다

구조와 설계 문서는 “무엇을 만족해야 하는가”에서 “어떤 구조로 풀 것인가”로 내려간다. SDD, Technical Design Doc, Architecture Doc, HLD, LLD, C4, arc42, UML이 여기에 들어간다.

IEEE 1016-2009는 SDD를 software design information을 기록하고 핵심 이해관계자에게 전달하기 위한 표현으로 설명한다. 이 표준은 현재 inactive-reserved 상태라 그대로 따라야 할 최신 표준처럼 말하면 안 된다. 그래도 SDD가 특정 다이어그램이 아니라 설계 정보를 기록하고 전달하는 그릇이라는 점을 이해하는 데는 유용하다.

Google의 Design Docs 글은 Technical Design Doc을 더 실무적으로 설명한다. 좋은 design doc은 context and scope, goals and non-goals, actual design, alternatives considered, cross-cutting concerns를 담는다. 여기서 중요한 것은 alternatives considered다. 설계문서의 가치는 “무엇을 만들겠다”보다 “왜 이 구조를 골랐고 무엇을 포기했는가”에 있다.

나쁜 설계문서는 기술 이름만 나열한다.

```md
- Redis를 사용한다.
- WebSocket으로 실시간 알림을 보낸다.
- PostgreSQL에 저장한다.
```

이건 선택 결과일 뿐이다. 좋은 설계문서는 대안과 비용을 같이 적는다.

```md
- Redis pub/sub는 구현이 단순하지만 메시지 영속성이 약하다.
- PostgreSQL polling은 새 인프라가 필요 없지만 지연과 부하가 생긴다.
- 이번 버전은 상태 변경 빈도가 낮고 운영 단순성이 더 중요하므로 PostgreSQL outbox와 짧은 polling을 선택한다.
- 실시간성이 제품 핵심 지표가 되면 queue 또는 pub/sub로 전환한다.
```

이 문서에는 미래의 변경자가 읽을 수 있는 정보가 있다. 왜 지금은 단순한 구조를 골랐는지, 언제 바꿔야 하는지가 남아 있다.

아키텍처 문서는 여기서 더 넓어진다. SEI의 Views and Beyond는 architecture documentation을 views, styles, interfaces, behavior, rationale로 본다. arc42는 Introduction & Goals, Constraints, Context & Scope, Solution Strategy, Building Block View, Runtime View, Deployment View, Crosscutting Concepts, Architectural Decisions, Quality Requirements, Risks & Technical Debt, Glossary로 나눈다. C4 model은 System Context, Container, Component, Code라는 계층으로 소프트웨어 구조를 시각화한다.

즉 아키텍처 문서는 한 장짜리 박스 그림이 아니다. 정적 구조, 런타임 흐름, 배포 환경, 품질 요구, 위험을 서로 다른 view로 나눠야 한다. PonsLink 같은 제품도 마찬가지다. 사용자가 보는 request flow, 서버가 보는 session state, 운영자가 보는 incident path, 보안 관점의 trust boundary는 같은 그림 하나로 충분히 설명되지 않는다.

## 결정 기록 문서: 큰 문서를 작게 쪼개서 오래 남긴다

큰 설계문서는 자주 낡는다. 처음에는 열심히 쓰지만 코드가 바뀌고 일정이 밀리면 업데이트가 멈춘다. Michael Nygard의 ADR 글은 이 문제를 정확히 찌른다. 큰 문서는 거의 읽히지 않고 유지되지 않는다. 작은 모듈형 문서가 업데이트될 가능성이 더 높다.

ADR은 Architecture Decision Record다. 구조, 비기능 특성, 의존성, 인터페이스, 구축 기법에 영향을 주는 중요한 결정을 짧게 남긴다. 보통 Status, Context, Decision, Consequences를 적는다. 결정이 뒤집히면 삭제하지 않고 superseded로 남긴다. 그 결정이 한때 왜 맞았는지를 아는 것도 중요하기 때문이다.

예시는 이렇게 쓸 수 있다.

```md
# ADR-001: 첫 버전은 SQLite를 사용한다

## Status
Accepted

## Context
초기 트래픽은 낮고 배포 단순성이 중요하다. 운영자는 한 명이고, 백업과 복구 절차를 빠르게 이해해야 한다.

## Decision
첫 버전은 PostgreSQL 대신 SQLite를 사용한다.

## Consequences
운영과 배포는 단순해진다. 동시 쓰기와 수평 확장은 나중에 다시 판단해야 한다.
```

RFC는 조금 다르게 쓰인다. 팀 안에서 아직 확정되지 않은 설계 제안이나 큰 변경을 토론하기 위한 문서로 쓰이는 경우가 많다. ADR이 “결정된 이유”에 가깝다면 RFC는 “결정하기 전의 제안과 검토”에 가깝다. Decision Log는 더 가볍게 날짜, 결정, 이유, 영향만 남길 수도 있다.

중요한 것은 형식이 아니다. 미래의 개발자가 “왜 이렇게 했지?”라고 물었을 때 blind accept나 blind change를 하지 않게 만드는 것이다.

## 계약과 인터페이스 문서: 시스템 사이의 약속을 기계도 읽게 만든다

서비스가 커질수록 내부 구현보다 경계의 약속이 중요해진다. 이 층위에는 API Spec, OpenAPI, AsyncAPI, ERD, Data Dictionary, Schema, ICD가 들어간다.

OpenAPI Specification은 HTTP API를 위한 language-agnostic interface description이다. 소스코드, 추가 문서, 네트워크 트래픽 검사 없이도 서비스의 capability를 이해할 수 있게 한다. 잘 정의된 OpenAPI 문서는 문서 생성, 코드 생성, 테스트 도구에도 쓰일 수 있다. API 호출의 추측을 줄이는 것이 핵심이다.

API Spec은 “백엔드가 프론트엔드에게 이렇게 부르면 된다”고 적어주는 문서가 아니다. 시스템 사이의 계약이다. 이 계약에는 endpoint, request, response, error shape, auth, rate limit, versioning, deprecation policy가 들어가야 한다.

데이터 쪽에는 ERD와 Data Dictionary가 있다. ERD는 엔티티와 관계를 보여 준다. Data Dictionary는 필드 이름, 의미, 타입, nullable 여부, 단위, 소유권, 보존 기간을 적는다. schema는 이 약속을 기계가 검증할 수 있는 형태로 만든다. ICD, 즉 Interface Control Document는 더 엄격한 환경에서 시스템 간 인터페이스를 통제하는 문서로 쓰인다.

작은 팀에서도 이 층위를 무시하면 금방 문제가 생긴다. API response의 `status`가 결제 상태인지 요청 상태인지, `expiredAt`이 만료 예정인지 실제 폐기 시각인지, `userId`가 내부 사용자 ID인지 외부 공개 ID인지 헷갈리기 시작한다. 코드만 보면 지금의 형태는 알 수 있지만, 그 필드가 어떤 약속을 대표하는지는 알기 어렵다.

## 검증과 운영 문서: 설계는 배포 전에 끝나지 않는다

설계는 배포 전에 끝나지 않는다. 운영 중에 무엇을 정상으로 볼지, 장애가 나면 어떻게 움직일지, 실패 후 무엇을 배울지까지 이어져야 한다. 이 층위에는 Test Strategy, Test Plan, QA Checklist, Threat Model, Release Plan, Migration Plan, Rollback Plan, Runbook, SLI/SLO/SLA, Postmortem이 들어간다.

Test Strategy는 무엇을 어떤 수준에서 검증할지 정한다. 단위 테스트, 통합 테스트, E2E, 수동 QA, 성능 테스트, 보안 테스트의 역할을 나눈다. Test Plan은 이번 릴리즈나 기능의 테스트 범위와 환경을 정한다. Test Case는 입력, 조건, 기대 결과를 더 구체화한다.

Threat Model은 보안을 설계 끝에 붙이는 문서가 아니다. OWASP Threat Modeling Cheat Sheet는 threat modeling을 보안 관점에서 시스템을 모델링하고, 적용 가능한 위협과 대응을 찾는 구조적 반복 프로세스로 설명한다. 네 가지 질문이 좋다.

```md
- 무엇을 만들고 있는가?
- 무엇이 잘못될 수 있는가?
- 그것에 대해 무엇을 할 것인가?
- 충분히 잘했는가?
```

이 질문은 설계 단계에서 해야 한다. DFD, trust boundary, data flow, data store, process, external entity를 보면서 STRIDE 같은 방법으로 위협을 찾는다. 보안은 체크리스트가 아니라 시스템 구조 안에 들어가야 한다.

운영 문서는 서비스가 실제로 살아 있을 때 필요하다. Google SRE Book은 SLI를 서비스 수준을 나타내는 정량 지표, SLO를 그 지표의 목표값, SLA를 목표를 못 지켰을 때의 결과가 포함된 계약으로 구분한다. 이 구분은 작아 보여도 중요하다. “99.9%로 운영하자”라고 말하는 것과 “어떤 요청의 어떤 지표를 어떤 기간 동안 99.9%로 볼 것인가”는 완전히 다르다.

Launch Checklist는 배포 전에 architecture, capacity, reliability, monitoring, security, automation, rollout을 확인하게 한다. Runbook은 반복 운영 절차를 적는다. Migration Plan은 데이터나 시스템 전환 순서를 정한다. Rollback Plan은 실패했을 때 어디까지 되돌릴지 정한다.

Postmortem은 실패 뒤에 남는 문서다. Google SRE는 postmortem을 incident, impact, mitigation, root cause, follow-up action의 기록으로 설명한다. 핵심은 blameless다. 사람을 탓하지 않고 시스템과 프로세스가 어떻게 다음 실패를 줄일지 본다. 좋은 postmortem은 장애 보고서가 아니라 다음 설계의 입력이다.

## 작은 팀은 이 문서를 전부 만들 필요가 없다

여기까지 보면 문서가 너무 많아 보인다. 작은 팀이나 1인 개발자가 이 문서를 전부 만들 필요는 없다. 오히려 문서 이름을 다 맞추려고 하면 작업이 멈춘다. 중요한 것은 이름이 아니라 결정의 층위다.

작은 팀은 한 장짜리 Design Note로 시작해도 된다.

```md
# One-page Design Note

## 1. 왜 하는가 — Product
- 사용자 문제:
- 목표:
- 성공 기준:
- 이번에 하지 않을 것:

## 2. 누구의 어떤 상황인가 — User
- 주요 사용자:
- 사용자가 하려는 일:
- 현재 막히는 지점:
- 핵심 시나리오:

## 3. 무엇을 만족해야 하는가 — Requirements
- 기능 요구사항:
- 비기능 요구사항:
- acceptance criteria:
- 추적해야 할 제약:

## 4. 어떤 구조로 풀 것인가 — Design
- 제안 구조:
- 주요 컴포넌트:
- 데이터 흐름:
- API / 이벤트:
- 저장소 / 스키마:
- 실패 경로:

## 5. 왜 이 선택인가 — Decision
- 선택한 대안:
- 버린 대안:
- 트레이드오프:
- ADR로 남길 결정:

## 6. 어떻게 검증할 것인가 — Test
- 자동 테스트:
- 수동 QA:
- 경계 조건:
- 회귀 방지:

## 7. 어떻게 운영할 것인가 — Operations
- 배포 순서:
- 롤백 조건:
- 모니터링 지표:
- SLO:
- 런북:
- 장애 후 포스트모템 기준:
```

이 한 장은 PRD도 되고, SRS도 되고, design doc도 된다. 단, 섹션을 섞지 않는다. “왜 하는가”에 Redis가 들어가면 너무 이르다. “요구사항”에 빠르게라는 말만 있으면 검증할 수 없다. “설계”에 대안이 없으면 나중에 왜 골랐는지 알 수 없다. “운영”이 없으면 잘 돌아갈 때만 설명하는 문서가 된다.

## 문서는 산출물이 아니라 결정의 추적선이다

개발 문서를 많이 만들수록 좋은 팀이 되는 것은 아니다. 오래 살아남는 문서는 대개 짧고, 특정 결정을 정확히 맡고, 나중에 검증하거나 뒤집을 수 있다. 반대로 모든 것을 담으려는 문서는 빨리 낡는다.

그래서 설계문서를 볼 때는 이름보다 질문을 먼저 봐야 한다.

```md
- 왜 하는가?
- 누구의 어떤 상황인가?
- 무엇을 만족해야 하는가?
- 어떤 구조로 풀 것인가?
- 왜 이 선택을 했는가?
- 시스템 사이의 약속은 무엇인가?
- 어떻게 검증하고 운영할 것인가?
```

이 질문들이 분리되어 있으면 문서 이름은 줄여도 된다. PRD, SRS, SDD, ADR, API Spec, Runbook을 모두 만들지 않아도 된다. 하지만 제품 판단, 요구사항, 설계, 결정, 계약, 운영이 한 문장 안에 뒤섞이면 구현은 계속 흔들린다.

좋은 설계문서는 개발을 대신하지 않는다. 대신 개발 전에 무엇을 결정했고, 무엇을 아직 열어두었으며, 나중에 무엇을 바꿔도 되는지 알려준다. 문서가 짐이 아니라 지도가 되는 순간은 거기서 시작된다.
