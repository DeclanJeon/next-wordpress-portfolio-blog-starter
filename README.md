<div align="center">

# 🚀 Next + WordPress Portfolio Blog Starter

**Next.js 포트폴리오 프론트엔드 + WordPress 작성/관리 백엔드를 한 번에 설치하는 운영형 블로그 스타터**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![WordPress](https://img.shields.io/badge/WordPress-7.0-21759B?logo=wordpress)](https://wordpress.org/)
[![Bun](https://img.shields.io/badge/Bun-runtime-000000?logo=bun)](https://bun.sh/)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04%20%7C%2024.04-E95420?logo=ubuntu)](https://ubuntu.com/)
[![Nginx](https://img.shields.io/badge/Nginx-reverse%20proxy-009639?logo=nginx)](https://nginx.org/)
[![License](https://img.shields.io/badge/License-Project%20Defined-blue)](#)

</div>

---

## ✨ 이 저장소가 만들어주는 것

이 스타터는 개인 포트폴리오, 제품 회고, 기술 블로그, 운영 노트를 한 도메인에서 운영하기 위한 **Next.js + WordPress 하이브리드 블로그**입니다.

| 영역 | 역할 |
|---|---|
| ⚡ **Next.js** | 방문자가 보는 포트폴리오/블로그 UI, SEO/AEO/GEO/SNS 메타데이터 |
| ✍️ **WordPress** | 관리자 화면, 글 작성, 미디어 관리, REST API |
| 🧭 **Nginx** | `/wp-*`는 WordPress로, 나머지는 Next.js standalone으로 라우팅 |
| 🗄️ **MariaDB** | WordPress 데이터베이스 |
| 📦 **Prisma SQLite** | Next.js 로컬 관리 데이터 |
| 🛡️ **systemd** | Next.js 앱 프로세스 운영/재시작 |
| 🔐 **Certbot** | 운영 도메인 TLS 인증서 발급 선택 지원 |

```txt
Visitor / Browser
      │
      ▼
Nginx :80/:443
 ├─ /wp-admin, /wp-login.php, /wp-json, /wp-content → WordPress + PHP-FPM + MariaDB
 └─ /, /writing, /work, /api, /sitemap.xml          → Next.js standalone + Prisma SQLite
```

---

## 🚀 원클릭 운영 설치

> 대상: DNS가 서버를 가리키는 깨끗한 Ubuntu 22.04/24.04 VPS

```bash
curl -fsSL https://raw.githubusercontent.com/DeclanJeon/next-wordpress-portfolio-blog-starter/main/install.sh \
  | sudo bash -s -- \
    --domain blog.example.com \
    --email admin@example.com \
    --site-name "My Portfolio Blog" \
    --admin-user admin \
    --yes
```

### 🧪 먼저 dry-run으로 확인하기

실제 서버를 바꾸기 전에 실행 계획만 확인하세요.

```bash
curl -fsSL https://raw.githubusercontent.com/DeclanJeon/next-wordpress-portfolio-blog-starter/main/install.sh \
  | sudo bash -s -- \
    --dry-run \
    --domain blog.example.com \
    --email admin@example.com \
    --site-name "My Portfolio Blog"
```

### 🔒 로컬/테스트 환경에서 TLS 생략

```bash
curl -fsSL https://raw.githubusercontent.com/DeclanJeon/next-wordpress-portfolio-blog-starter/main/install.sh \
  | sudo bash -s -- \
    --domain local.test \
    --email admin@example.com \
    --site-name "Local Starter Test" \
    --admin-user owner \
    --skip-certbot \
    --yes
```

---

## ✅ 실제 검증 결과

2026-06-29 기준으로 격리된 Ubuntu 24.04 systemd Docker 컨테이너에서 원격 `install.sh`를 실행해 검증했습니다.

| 검증 항목 | 결과 |
|---|---:|
| 원격 `curl | install.sh` bootstrap | ✅ |
| Bun 설치 및 의존성 설치 | ✅ |
| Nginx/MariaDB/PHP-FPM 설치 및 시작 | ✅ |
| WP-CLI + WordPress 설치 | ✅ |
| Prisma SQLite 초기화 | ✅ |
| Next.js standalone build | ✅ |
| systemd Next service 등록/기동 | ✅ |
| Nginx site config validation | ✅ |
| Next 직접 HTTP 접근 | ✅ |
| Nginx Host header 경유 접근 | ✅ |
| WordPress REST `/wp-json/` | ✅ |
| Sitemap `/sitemap.xml` | ✅ |
| 재실행/idempotent 복구 | ✅ |

자세한 주의사항과 검증 메모는 [`docs/production-installation-notes.md`](docs/production-installation-notes.md)를 확인하세요.

---

## 🧰 설치 옵션

| Option | Default | 설명 |
|---|---:|---|
| `--domain` | `example.com` | 공개 도메인. 실운영에서는 반드시 변경하세요. |
| `--email` | `admin@example.com` | Certbot 및 WordPress 관리자 이메일 |
| `--site-name` | `Portfolio Blog` | 사이트 이름 |
| `--admin-user` | `admin` | WordPress 및 Next 로컬 관리자 ID |
| `--admin-password` | generated | 미지정 시 자동 생성 |
| `--db-password` | generated | WordPress DB 비밀번호. 미지정 시 자동 생성 |
| `--install-dir` | `/opt/next-wordpress-blog` | Next.js 앱 설치 루트 |
| `--wordpress-dir` | `/var/www/<domain>` | WordPress 설치 루트 |
| `--app-port` | `3011` | 로컬 Next.js 포트 |
| `--skip-certbot` | false | TLS 인증서 발급 생략 |
| `--no-wordpress` | false | Next-only 모드 |
| `--dry-run` | false | 서버 변경 없이 실행 계획만 출력 |
| `--yes` | false | 실제 변경 승인. 운영 설치에 필요 |

---

## 📁 설치 후 주요 경로

```txt
/etc/next-wordpress-blog/<domain>.env             # Next.js 운영 환경 변수, 0600
/etc/next-wordpress-blog/<domain>.credentials     # 생성된 계정/비밀번호, 0600
/etc/nginx/sites-available/<domain>               # Nginx site config
/etc/nginx/sites-enabled/<domain>                 # enabled symlink
/etc/systemd/system/<domain>-next.service         # Next.js systemd unit
/opt/next-wordpress-blog/releases/<timestamp>     # Next.js release
/opt/next-wordpress-blog/current                  # active release symlink
/opt/next-wordpress-blog/shared/db/custom.db      # Prisma SQLite DB
/var/www/<domain>                                 # WordPress root
```

---

## 🛠️ 운영 명령

```bash
# 설치 계획 확인
bun run setup:production -- --dry-run --domain blog.example.com --email admin@example.com

# 현재 상태 진단
bun run doctor:production -- --domain blog.example.com --email admin@example.com --dry-run

# 백업 계획 확인
bun run backup:production -- --domain blog.example.com --email admin@example.com --dry-run

# 롤백 힌트 확인
bun run rollback:production -- --domain blog.example.com --email admin@example.com --dry-run
```

서비스 확인 예시:

```bash
sudo systemctl status blog_example_com-next.service
sudo systemctl status nginx mariadb php8.3-fpm
curl -fsS https://blog.example.com/wp-json/
curl -fsS https://blog.example.com/sitemap.xml
```

---

## ⚠️ 운영 전 꼭 확인할 것

- 🌐 **DNS**: `--domain`의 A/AAAA 레코드가 설치 서버를 가리켜야 합니다.
- 🔥 **방화벽**: 80/443 포트가 열려 있어야 Certbot과 Nginx 접근이 가능합니다.
- 🔐 **TLS**: 로컬 검증은 `--skip-certbot`으로 진행했습니다. 실운영 인증서 발급은 DNS/포트/도메인 상태에 따라 달라집니다.
- 🧾 **비밀값**: `/etc/next-wordpress-blog/*.credentials`, `.env`, SQLite DB, 백업 파일을 Git에 커밋하지 마세요.
- 🧪 **재실행**: 설치 중 외부 다운로드가 실패할 수 있습니다. 스크립트는 주요 bootstrap 다운로드를 재시도하고, 재실행 가능한 방향으로 설계되어 있습니다.
- 🧩 **기존 서버**: 이미 Nginx/WordPress/DB가 있는 서버에서는 포트·도메인·경로 충돌을 먼저 확인하세요.

더 긴 체크리스트는 [`docs/production-installation-notes.md`](docs/production-installation-notes.md)에 있습니다.

---

## 💻 로컬 개발

```bash
cp .env.example .env
bun install --frozen-lockfile
bun run db:push
bun run dev
```

품질 확인:

```bash
bun test
bunx tsc --noEmit
bun run build
```

---

## 📚 문서

- [`docs/production-installation-notes.md`](docs/production-installation-notes.md) — 운영 설치 검증 결과와 주의사항
- [`docs/one-click-production-setup-design.md`](docs/one-click-production-setup-design.md) — 원클릭 설치 설계 문서
- [`docs/pons-field-notes-seo-brand-design-2026-06-29.md`](docs/pons-field-notes-seo-brand-design-2026-06-29.md) — SEO/브랜딩 설계 문서

---

## 🧭 프로젝트 철학

> “글은 WordPress에서 편하게 쓰고, 독자는 빠른 Next.js 경험으로 읽는다.”

이 스타터는 개인 프로젝트의 회고, 고민의 흔적, 구현 설명, 사용법을 장기적으로 쌓기 위한 기반입니다.
WordPress의 익숙한 작성 경험과 Next.js의 빠른 공개 UI를 분리하되, 운영자는 한 도메인에서 하나의 블로그처럼 관리할 수 있게 만드는 것이 목표입니다.
