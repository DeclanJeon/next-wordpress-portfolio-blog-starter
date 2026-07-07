# 설계문서 공부 노트 split plan

## 문제 수정

초기 발행은 PRD, SRS, SDD, ADR, API Spec, Runbook을 한 글에 모두 넣어 10,707자짜리 장문이 됐다. 이는 `wordpress-blog` 스킬의 읽는 리듬과 이미지 서사성 기준을 제대로 따르지 못한 결과다.

수정 방향:

- 기존 글은 짧은 지도/허브 글로 축소한다.
- 세부 문서군은 별도 글로 분리한다.
- 각 글은 2~3분 읽기 길이로 제한한다.
- 각 글에 서로 다른 장면형 대표 이미지를 넣는다.
- project archive는 `study-note/software-design-docs` 아래 6편으로 노출한다.

## Taxonomy

- category: `study-note` / `공부 노트`
- project slug: `study-note/software-design-docs`
- project name: `설계문서 공부 노트`
- series slug: `software-design-docs-reading-path`
- series title: `설계문서 공부 노트 읽는 순서`

## Published posts

| 순서 | slug | title | role | length |
| --- | --- | --- | --- | --- |
| 1 | `2026-07-07-software-design-documents-map` | 개발 설계문서 지도: 문서 이름보다 질문을 먼저 본다 | 짧은 허브/지도 | 1,988자 |
| 2 | `2026-07-07-software-design-documents-product-docs` | 제품 판단 문서: PRD는 구현 지시서가 아니다 | Product Brief/BRD/MRD/PRD/Roadmap | 2,334자 |
| 3 | `2026-07-07-software-design-documents-requirements` | 요구사항 문서: “빠르게”를 검증 가능한 문장으로 바꾸기 | SRS/FRD/NFR/Acceptance Criteria | 2,642자 |
| 4 | `2026-07-07-software-design-documents-architecture` | 구조 설계 문서: SDD와 Architecture Doc은 박스 그림이 아니다 | SDD/Design Doc/C4/arc42 | 2,927자 |
| 5 | `2026-07-07-software-design-documents-decisions` | 결정 기록 문서: ADR과 RFC는 왜 나중의 개발자를 살리는가 | ADR/RFC/Decision Log | 2,204자 |
| 6 | `2026-07-07-software-design-documents-operations` | 계약과 운영 문서: API Spec부터 Runbook, SLO, Postmortem까지 | API/OpenAPI/Threat Model/Runbook/SLO/Postmortem | 3,496자 |

## Featured images

All images are generated as story scenes under `public/tistory/software-design-docs/`.

| slug | featuredImage | scene |
| --- | --- | --- |
| `2026-07-07-software-design-documents-map` | `/tistory/software-design-docs/2026-07-07-software-design-documents-map-cover-imagegen.webp` | developer sorting document cards into a layered map |
| `2026-07-07-software-design-documents-product-docs` | `/tistory/software-design-docs/2026-07-07-software-design-documents-product-docs-cover-imagegen.webp` | product path selected before implementation |
| `2026-07-07-software-design-documents-requirements` | `/tistory/software-design-docs/2026-07-07-software-design-documents-requirements-cover-imagegen.webp` | vague wishes converted into measurable gates |
| `2026-07-07-software-design-documents-architecture` | `/tistory/software-design-docs/2026-07-07-software-design-documents-architecture-cover-imagegen.webp` | layered architecture model, not one flat diagram |
| `2026-07-07-software-design-documents-decisions` | `/tistory/software-design-docs/2026-07-07-software-design-documents-decisions-cover-imagegen.webp` | decision corkboard and archived alternatives |
| `2026-07-07-software-design-documents-operations` | `/tistory/software-design-docs/2026-07-07-software-design-documents-operations-cover-imagegen.webp` | service bridge, contracts, runbook, gauges |

## Source references

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
- Google SRE Postmortem Culture: https://sre.google/sre-book/postmortem-culture/
