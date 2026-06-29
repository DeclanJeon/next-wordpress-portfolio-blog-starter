# Pons Field Notes SEO/AEO/GEO 브랜드 설계

작성일: 2026-06-29
대상: `blog.ponslink.com` 전체 블로그 검색·공유·브랜드 자산

## 컨셉

블로그의 공개 명칭은 `Pons Field Notes`로 잡는다.
정체성은 “제품을 만들고 운영하며 남긴 필드 노트”다.

- 핵심 주제: PonsLink, 제품 회고, WebRTC, 문서 자동화, 도메인 AI, 운영 가능한 작은 시스템
- 톤: 따뜻한 종이, 조용한 기술 노트, 실제 운영 흔적, 과장 없는 회고
- 시각 언어: PonsLink 심볼 + warm paper + clay accent + 얇은 흐름 다이어그램
- 금지: 외부 Z 로고, 파란/보라 AI SaaS 그라디언트, 의미 없는 추상 썸네일, 텍스트가 깨지는 이미지 모델 결과

## 적용 원칙

### SEO

- 모든 페이지에 canonical URL을 둔다.
- 사이트 전체 title template을 둔다.
- 홈/글목록/워크/개별 글의 description을 각각 분리한다.
- Open Graph/Twitter 이미지는 절대 URL로 제공한다.
- 공개 글은 sitemap에 포함하고 draft/trash는 제외한다.
- robots는 공개 검색을 허용하되 writer/admin/API는 차단한다.

### AEO/GEO

Google의 생성형 검색 가이드는 AEO/GEO를 별도 마술로 보지 않고 검색 경험 최적화의 일부로 본다. 따라서 이 블로그에서는 다음을 우선한다.

- 경험 기반 원문: 커밋·구현·운영 판단을 설명하는 비상품성 글
- 구조화 데이터: `WebSite`, `Organization`, `Blog`, `BlogPosting`, `BreadcrumbList`
- 크롤러 접근성: sitemap, robots, canonical, snippet 허용
- 글별 명확한 author/date/image/category/tag 제공
- 검색 의도에 맞는 구체적 title/description

## 자산

- 로고 원천: `/home/declan/Documents/Develop/Project/pons_p2p/ponslink-room-frontend/dist/ponslink-logo.svg`
- 심볼 원천: `/home/declan/Documents/Develop/Project/pons_p2p/ponslink-room-frontend/dist/icon.svg`
- SNS 배경: `$imagegen` 생성 이미지 사용, 문구는 코드 합성
- 대표 OG: `/brand/pons-field-notes-og.png` 1200x630
- Twitter: `/brand/pons-field-notes-twitter.png` 1200x630
- Square: `/brand/pons-field-notes-square.png` 1024x1024
- favicon: `/favicon.svg`, `/favicon-32x32.png`, `/favicon-16x16.png`
- app icon: `/apple-icon.png`, `/icon-192.png`, `/icon-512.png`

## 메타데이터 구조

### Site

- name: `Pons Field Notes`
- title: `Pons Field Notes — 제품을 만들고 운영하며 남긴 기록`
- description: `PonsLink, 제품 회고, WebRTC, 문서 자동화, 도메인 AI를 만들며 남긴 설계 판단과 운영 기록.`
- locale: `ko_KR`
- url: `https://blog.ponslink.com`

### Pages

- `/`: portfolio + writing gateway 중심의 사이트 홈
- `/writing`: 공개 글 아카이브
- `/work`: 운영 중인 제품/시스템 아카이브
- `/writing/[slug]`: BlogPosting 메타 + Article JSON-LD

## 검증 기준

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `/robots.txt`가 sitemap을 가리키는지 확인
- `/sitemap.xml`에 `/`, `/writing`, `/work`, 공개 글 URL이 있는지 확인
- 라이브 HTML에 `og:image`, `twitter:image`, `application/ld+json`, favicon 링크가 있는지 확인
