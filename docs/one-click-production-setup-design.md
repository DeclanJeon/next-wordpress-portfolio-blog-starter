# One-click Production Setup Design

작성일: 2026-06-29  
대상: WordPress + Next.js 포트폴리오/블로그 스타터 운영 자동화

## 목표

이 저장소를 다른 사용자가 자신의 서버에서 한 번의 설치 명령으로 운영 가능한 블로그로 띄울 수 있게 만든다.

설치 후 사용자는 다음 상태를 얻어야 한다.

- 공개 방문자는 Next.js 포트폴리오/블로그 UI를 본다.
- 작성자/관리자는 같은 도메인의 WordPress 관리 화면과 REST API를 사용할 수 있다.
- Nginx가 WordPress PHP 경로와 Next.js 앱 경로를 분리해서 라우팅한다.
- systemd가 Next.js standalone 서버를 관리한다.
- PHP-FPM/MariaDB/Nginx/Certbot 등 운영 필수 요소가 자동 구성된다.
- 도메인, 사이트명, 관리자 이메일, 포트, 설치 경로는 사용자가 바꿀 수 있다.
- 설치는 dry-run, idempotent 재실행, doctor 진단, rollback/backup 경로를 제공한다.

## 비목표

- 모든 호스팅 환경을 지원하지 않는다. 1차 대상은 Ubuntu 22.04/24.04 계열 VPS다.
- 멀티테넌트 SaaS를 만들지 않는다. 서버 하나에 사이트 하나를 설치하는 모델이다.
- 사용자의 DNS 설정은 자동화하지 않는다. CLI는 DNS가 현재 서버를 가리키는지만 확인한다.
- WordPress 테마/플러그인 마켓 전체를 관리하지 않는다. 최소 운영 가능한 WordPress + REST/API + 관리자 화면까지만 자동화한다.
- 운영자의 도메인/브랜드/콘텐츠 결정은 자동으로 만들지 않는다. `.env`와 설치 옵션으로 노출한다.

## 현재 근거

### 앱 구조

- Next.js는 `next.config.ts`에서 `output: "standalone"`을 사용한다.
- 빌드 스크립트는 `.next/standalone`, `.next/static`, `public`을 배포 산출물로 만든다.
- 앱 DB는 Prisma SQLite이며 `DATABASE_URL`로 경로를 제어한다.
- 현재 운영은 `/opt/ponslink-blog-next/releases/<timestamp>` + `current` symlink + `shared/db/custom.db` 구조다.

### 운영 구조

현재 운영 서버의 `blog.ponslink.com` Nginx는 다음처럼 동작한다.

- `/`, `/writing`, `/work`, `/api/*` 등은 `127.0.0.1:3011`의 Next.js로 프록시한다.
- `/wp-admin`, `/wp-login.php`, `/wp-json`, `/wp-content`, `/wp-includes`, `*.php`는 `/var/www/blog.ponslink.com`의 WordPress/PHP-FPM으로 보낸다.
- Next.js는 systemd 서비스 `ponslink-blog-next.service`로 실행된다.
- 서비스 env에 `DATABASE_URL=file:/opt/ponslink-blog-next/shared/db/custom.db`를 주입한다.

## 공식 문서 근거

- Next.js standalone output: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- WP-CLI core install: https://developer.wordpress.org/cli/commands/core/install/
- WP-CLI config create: https://developer.wordpress.org/cli/commands/config/create/
- Certbot Nginx installer: https://eff-certbot.readthedocs.io/en/latest/using.html
- Nginx WebSocket proxy headers: https://nginx.org/en/docs/http/websocket.html
- systemd service unit reference: https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html

## 설치 결과 토폴로지

```txt
Internet
  |
  v
Nginx :80/:443
  |-- /.well-known/acme-challenge/  -> Certbot challenge root
  |-- /wp-admin/, /wp-login.php     -> WordPress via PHP-FPM
  |-- /wp-json/                     -> WordPress REST via PHP-FPM
  |-- /wp-content/, /wp-includes/   -> WordPress static/PHP guard
  |-- /*                            -> Next.js standalone on 127.0.0.1:<appPort>

systemd
  |-- pons-blog-next.service -> /opt/<app>/current/server.js

storage
  |-- /opt/<app>/releases/<timestamp>    Next.js release
  |-- /opt/<app>/current                 symlink to active release
  |-- /opt/<app>/shared/db/custom.db     Next/Prisma SQLite DB
  |-- /opt/<app>/shared/uploads          optional app upload storage
  |-- /var/www/<domain>                  WordPress root
  |-- MariaDB                            WordPress DB
```

## CLI UX

### 외부 사용자 원클릭 설치

권장 공개 설치 명령은 다음 형태다.

```bash
curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/install.sh \
  | sudo bash -s -- \
    --domain blog.example.com \
    --email admin@example.com \
    --site-name "My Field Notes" \
    --admin-user admin
```

`install.sh`는 최소 bootstrap만 담당한다.

1. OS/권한 확인
2. git, curl, ca-certificates 설치
3. repo clone 또는 release tarball 다운로드
4. Bun/Node 실행 환경 준비
5. repo 안의 실제 CLI 실행

### repo 내부 CLI

```bash
sudo bun run setup:production -- \
  --domain blog.example.com \
  --email admin@example.com \
  --site-name "My Field Notes" \
  --admin-user admin \
  --install-dir /opt/pons-blog \
  --wordpress-dir /var/www/blog.example.com \
  --app-port 3011
```

### 운영 명령

```bash
sudo bun run setup:production -- --dry-run ...
sudo bun run setup:production -- --yes ...
sudo bun run setup:production -- --skip-certbot ...
sudo bun run setup:production -- --no-wordpress ... # Next-only dev/proxy mode
sudo bun run doctor:production -- --domain blog.example.com
sudo bun run backup:production -- --target /var/backups/pons-blog
sudo bun run deploy:production -- --release current-build
```

## CLI 옵션

| 옵션 | 기본값 | 설명 |
|---|---:|---|
| `--domain` | 필수 | 공개 도메인 |
| `--email` | 필수 | Certbot/WordPress 관리자 이메일 |
| `--site-name` | `Pons Field Notes` | 사이트 이름 |
| `--admin-user` | `admin` | WordPress 관리자 ID |
| `--admin-password` | 자동 생성 | 미지정 시 랜덤 생성 후 root-only 파일에 저장 |
| `--install-dir` | `/opt/pons-blog` | Next 앱 설치 루트 |
| `--wordpress-dir` | `/var/www/<domain>` | WordPress 설치 루트 |
| `--app-port` | `3011` | Next local port |
| `--php-fpm-socket` | 자동 탐지 | `/run/php/php*-fpm.sock` |
| `--db-name` | 도메인 기반 | WordPress DB 이름 |
| `--db-user` | 도메인 기반 | WordPress DB 유저 |
| `--db-password` | 자동 생성 | WordPress DB 비밀번호 |
| `--skip-certbot` | false | TLS 자동 발급 생략 |
| `--dry-run` | false | 실행 계획만 출력 |
| `--yes` | false | 확인 프롬프트 생략 |

## 내부 모듈 설계

```txt
install.sh
scripts/setup-production.ts
scripts/setup/
  cli.ts                  옵션 파싱/Zod 검증
  context.ts              설치 컨텍스트/경로/이름 계산
  runner.ts               command runner, dry-run, redaction
  preflight.ts            OS/root/DNS/port/package manager 검사
  packages.ts             apt 패키지 설치
  secrets.ts              암호 생성/0600 env 저장
  wordpress.ts            MariaDB + WP-CLI + WordPress 설치
  next-app.ts             Bun install/build/Prisma/systemd release 배치
  nginx.ts                Nginx 템플릿 렌더링/test/reload
  certbot.ts              TLS 발급/갱신 확인
  doctor.ts               health check
  rollback.ts             symlink/service/nginx rollback
  templates/
    nginx-site.conf
    systemd.service
    env.production
    wordpress-wp-config-extra.php
```

## 설치 단계

### 1. Preflight

검사 항목:

- root 권한 또는 sudo 가능 여부
- Ubuntu/Debian 계열 여부
- `domain`의 A/AAAA 레코드가 현재 서버 IP를 가리키는지
- 80/443 포트 사용 가능 여부
- app port 충돌 여부
- `/opt/<app>`, `/var/www/<domain>` 기존 상태
- git worktree가 설치 원본으로 안전한지
- `.env` 또는 운영 DB가 repo에 커밋될 위험이 없는지

실패 시 설치를 멈추고 수정 명령을 출력한다.

### 2. System packages

설치 대상:

```txt
nginx
mariadb-server
php-fpm
php-cli
php-mysql
php-xml
php-mbstring
php-curl
php-gd
php-zip
unzip
curl
git
certbot
python3-certbot-nginx
```

PHP-FPM socket은 배포판별 버전 차이를 감안해 자동 탐지한다.

### 3. WordPress

WP-CLI를 통해 다음을 수행한다.

1. MariaDB DB/user/password 생성
2. WordPress core 다운로드
3. `wp-config.php` 생성
4. `wp core install`
5. permalink 설정
6. REST API 확인
7. 보안 기본값 적용
   - `xmlrpc.php` 차단 옵션
   - PHP 직접 실행 제한
   - `wp-content/updraft` 등 backup 디렉터리 차단

### 4. Next.js app

1. repo 의존성 설치
2. `bun run build`
3. release 디렉터리 생성
4. `.next/standalone`, `.next/static`, `public` 복사
5. `/opt/<app>/shared/db/custom.db` 생성 또는 유지
6. `prisma db push` / seed admin 수행
7. `current` symlink 전환
8. systemd unit 설치/daemon-reload/restart

중요 원칙:

- 운영 DB는 release 안에 넣지 않는다.
- release는 불변 산출물로 취급한다.
- `shared`만 상태를 가진다.

### 5. Nginx

Nginx 템플릿은 현재 운영 구조를 일반화한다.

핵심 location:

```nginx
location = /wp-admin { return 301 /wp-admin/; }
location = /wp-json { return 301 /wp-json/; }
location /wp-admin/ { ... php-fpm ... }
location ^~ /wp-json/ { ... php-fpm ... }
location /wp-content/ { ... static + cache ... }
location /wp-includes/ { ... static + cache ... }
location = /wp-login.php { ... php-fpm ... }
location ~ \.php$ { ... php-fpm ... }
location / { proxy_pass http://127.0.0.1:<appPort>; ... }
```

Nginx 적용 순서:

1. `sites-available/<domain>` 작성
2. `sites-enabled/<domain>` symlink
3. `nginx -t`
4. 성공 시 reload
5. 실패 시 이전 config 유지

### 6. TLS

기본은 Certbot Nginx 플러그인을 사용한다.

- DNS가 서버를 가리키지 않으면 TLS 단계 중단
- `--skip-certbot`이면 HTTP config까지만 설치
- 성공 후 auto-renew timer 확인

### 7. Health check

검증 항목:

- systemd service active
- `curl http://127.0.0.1:<appPort>` 성공
- `curl https://<domain>` 성공
- `curl https://<domain>/writing` 성공
- `curl https://<domain>/wp-json/` 성공
- `curl https://<domain>/wp-login.php` 200/302
- Nginx error log에 신규 fatal 없음

## Idempotency

CLI는 `/opt/<app>/shared/setup-state.json`을 둔다.

각 단계는 다음 방식으로 재실행 가능해야 한다.

- 패키지 설치: 이미 설치되어 있으면 skip
- WordPress: `wp core is-installed`면 core install skip
- DB: user/database 존재 시 권한만 보정
- Nginx: 템플릿 hash가 다를 때만 갱신
- systemd: unit diff가 있을 때만 reload/restart
- Certbot: 인증서 존재/만료일 확인 후 필요할 때만 실행

## Rollback / backup

### 자동 백업

설치/업그레이드 전:

- `/opt/<app>/shared/db/custom.db`
- `/var/www/<domain>`
- MariaDB WordPress DB dump
- Nginx site config
- systemd unit

### 롤백

- Next 앱: 이전 release symlink로 되돌리고 service restart
- Nginx: 이전 config 복원 후 `nginx -t && reload`
- WordPress: DB dump + wp root archive 복원은 명시적 `restore` 명령에서만 수행

## 보안 설계

- 생성된 비밀번호는 `/etc/pons-blog/<domain>.env`에 0600으로 저장한다.
- CLI 로그에는 password/token을 redaction한다.
- repo에는 `.env`, 운영 DB, WordPress credentials를 커밋하지 않는다.
- WordPress PHP 실행은 필요한 경로로 제한한다.
- `/wp-content/**/*.php`, `/wp-includes/**/*.php` 직접 실행은 차단한다.
- Nginx에 기본 보안 헤더를 둔다.
- `client_max_body_size`는 기본 32m, 옵션으로 조정한다.

## GitHub 공개 전략

현재 GitHub 계정에서 확인된 관련 repo:

- `DeclanJeon/ponslink-blog-next-frontend` — private, 현재 코드와 가장 가까워 보임
- `DeclanJeon/wordpress_main_1` — public, WordPress 블로그 설명이 있으나 현재 Next standalone 구조와 직접 일치한다고 단정하기 어려움

다른 사용자가 쓸 수 있게 하려면 새 public repo를 만드는 전략이 안전하다.

권장 repo 이름:

```txt
next-wordpress-portfolio-blog-starter
```

공개 전 정리해야 할 것:

- `.env` 제외
- 운영 `db/custom.db` 제외 또는 sample DB로 대체
- 개인 도메인/AdSense/Google verification 기본값 제거
- `README.md`에 원클릭 설치 명령 추가
- `.env.example` 추가
- `LICENSE` 추가
- setup CLI를 통해 generic site name/domain으로 생성되게 변경

## 구현 파도

### Wave 1 — 공개 배포 안전장치

- `.gitignore` 정리
- `.env.example` 작성
- production DB/개인 산출물 커밋 제외 정책 확정
- README 초안 작성

### Wave 2 — CLI 골격

- `install.sh`
- `scripts/setup-production.ts`
- 옵션 파싱/Zod 검증
- dry-run runner
- 로그 redaction

### Wave 3 — 템플릿과 preflight

- Nginx template
- systemd template
- env template
- OS/root/DNS/port/PHP-FPM socket 검사

### Wave 4 — WordPress 자동화

- apt 패키지 설치
- WP-CLI 설치
- MariaDB DB/user 생성
- WordPress core install
- REST/wp-login 검증

### Wave 5 — Next app 자동화

- build/release/current/shared 구조화
- Prisma DB 생성/seed
- systemd install/restart
- app health check

### Wave 6 — TLS/doctor/rollback

- Certbot 연동
- doctor 명령
- backup/rollback 명령
- e2e smoke script

### Wave 7 — GitHub publish

- 관련 변경만 atomic commit
- public repo 생성 또는 기존 repo 연결
- push
- README의 설치 명령이 실제 public URL을 가리키도록 갱신

## Acceptance criteria

구현 완료 조건:

1. 깨끗한 Ubuntu VPS에서 설치 명령 한 번으로 완료된다.
2. 설치 후 `https://<domain>`에서 Next 블로그가 열린다.
3. `https://<domain>/wp-login.php`에서 WordPress 로그인 화면이 열린다.
4. `https://<domain>/wp-json/`에서 WordPress REST 응답이 나온다.
5. `systemctl status <service>`가 active다.
6. `nginx -t`가 통과한다.
7. `certbot certificates`에서 도메인 인증서가 확인된다. (`--skip-certbot` 제외)
8. 재실행해도 기존 콘텐츠/DB를 덮어쓰지 않는다.
9. 실패 시 어느 단계에서 실패했는지 명확히 나오고, 기존 Nginx/systemd 상태가 깨지지 않는다.
10. public repo에는 개인 `.env`, production DB, private token이 없다.
