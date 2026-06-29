# Production Installation Notes

작성일: 2026-06-29  
대상 저장소: `next-wordpress-portfolio-blog-starter`  
목적: 원클릭 운영 설치를 실제 서버에 적용하기 전 알아야 할 주의사항, 검증 결과, 운영 체크리스트를 문서화한다.

## 1. 최종 상태 요약

현재 원클릭 설치는 다음 구성까지 자동화한다.

- Ubuntu 22.04/24.04 계열 서버 bootstrap
- Bun 설치 및 repository clone/pull
- Nginx 설치 및 site config 생성
- MariaDB 설치 및 WordPress DB/user 생성
- PHP-FPM 및 WordPress 필수 PHP 확장 설치
- WP-CLI 다운로드 및 WordPress core 설치
- Next.js standalone build/release 배치
- Prisma SQLite DB 초기화
- Next 로컬 관리자 생성
- systemd service 등록 및 기동
- Nginx reload/restart
- HTTP readiness health check
- 선택적 Certbot TLS 발급

## 2. 격리 검증 결과

호스트 OS에는 WordPress/Nginx/MariaDB를 설치하지 않았다. 검증은 Docker systemd Ubuntu 24.04 컨테이너에서만 수행했고, 검증 후 컨테이너·테스트 이미지·임시 디렉터리를 삭제했다.

검증 명령 형태:

```bash
curl -fsSL https://raw.githubusercontent.com/DeclanJeon/next-wordpress-portfolio-blog-starter/main/install.sh \
  | bash -s -- \
    --domain local.test \
    --email admin@example.com \
    --site-name "Local Starter Test" \
    --admin-user owner \
    --admin-password "<test-password>" \
    --db-password "<test-db-password>" \
    --skip-certbot \
    --yes
```

검증된 항목:

| 항목 | 확인 내용 |
|---|---|
| `local_test-next.service` | `systemctl is-active` 결과 `active` |
| `nginx` | `systemctl is-active` 결과 `active` |
| `mariadb` | `systemctl is-active` 결과 `active` |
| `php8.3-fpm` | `systemctl is-active` 결과 `active` |
| Next direct HTTP | `curl http://127.0.0.1:3011/` 성공 |
| Nginx routed HTTP | `curl -H 'Host: local.test' http://127.0.0.1/` 성공 |
| WordPress REST | `/wp-json/` 응답에서 `Local Starter Test` 확인 |
| Sitemap | `/sitemap.xml` XML 응답 확인 |
| 주요 파일 | env, Nginx site, standalone `server.js`, SQLite DB 생성 확인 |

## 3. 실운영 적용 전 필수 체크리스트

### 3.1 DNS

- `--domain`으로 지정한 도메인의 A/AAAA 레코드가 설치 대상 서버 IP를 가리켜야 한다.
- DNS 전파가 끝나기 전 Certbot을 실행하면 인증서 발급이 실패할 수 있다.
- 테스트처럼 `/etc/hosts`를 쓰는 환경에서는 `--skip-certbot`을 사용한다.

### 3.2 방화벽과 포트

- 외부에서 80/443 포트 접근이 가능해야 한다.
- 내부 Next 포트 기본값은 `3011`이다. 이미 사용 중이면 `--app-port`를 바꾼다.
- Nginx가 이미 다른 site를 default로 받고 있다면 `server_name`과 enabled site 충돌을 확인한다.

### 3.3 TLS / Certbot

- 로컬 컨테이너 검증은 `--skip-certbot`으로 수행했다.
- 실운영에서 `--skip-certbot`을 빼면 Certbot Nginx plugin으로 인증서 발급을 시도한다.
- 인증서 발급 실패 시 DNS, 80 포트, 기존 Nginx config, rate limit을 먼저 확인한다.

### 3.4 기존 서버에 설치할 때

깨끗한 VPS가 가장 안전하다. 기존에 다음이 있으면 충돌 가능성이 있다.

- 기존 Nginx server block
- 기존 WordPress document root
- 기존 MariaDB database/user
- 기존 `/opt/next-wordpress-blog`
- 기존 systemd service 이름
- 같은 app port를 쓰는 프로세스

설치 전 `--dry-run`으로 실행 계획을 확인하고, 충돌 경로를 발견하면 옵션으로 경로/포트/도메인을 바꾼다.

## 4. 생성되는 민감 파일

다음 파일은 절대 Git에 커밋하지 않는다.

```txt
/etc/next-wordpress-blog/<domain>.env
/etc/next-wordpress-blog/<domain>.credentials
/opt/next-wordpress-blog/shared/db/custom.db
/opt/next-wordpress-blog/backups/*
/var/www/<domain>/wp-config.php
```

저장소도 `.env`, DB, 백업, 로그를 추적하지 않도록 구성되어 있다. 그래도 운영 서버에서 수동 복사할 때는 반드시 확인한다.

## 5. 설치 중 실제로 발견해 보강한 문제

컨테이너 검증 과정에서 다음 문제가 실제로 발생했고 수정했다.

1. `apt` 설치 후 MariaDB/PHP-FPM/Nginx가 자동 시작되지 않음
   - `systemctl enable --now mariadb php8.3-fpm nginx`로 보강.
2. 공백이 포함된 env 값이 shell source 시 깨짐
   - `NEXT_PUBLIC_SITE_TOPICS`를 quote 처리.
3. Prisma schema 초기화 전에 Next build가 먼저 실행됨
   - `prisma db push`를 build 전에 실행하도록 순서 조정.
4. noninteractive shell에서 `bunx`가 없음
   - `bun x prisma db push`로 변경.
5. Bun tarball integrity/download 실패
   - Bun install 실패 시 cache 삭제 후 1회 재시도.
6. fresh Ubuntu에 `node`가 없음
   - systemd runtime을 installer가 보장하는 `bun`으로 통일.
7. WP-CLI phar 다운로드가 일시적으로 400 실패
   - retry 옵션과 fallback URL 추가.
8. installer 재실행 시 `/usr/local/bin/bun` symlink loop 발생
   - symlink 생성 로직을 idempotent하게 수정.
9. systemd `active` 직후 HTTP listener가 아직 열리지 않음
   - 30초 readiness loop 추가.

## 6. 재실행 정책

설치 중 외부 네트워크나 package mirror 문제로 실패할 수 있다. 현재 스크립트는 다음 상황에서 재실행 가능하도록 설계했다.

- repo가 이미 clone되어 있으면 `git pull --ff-only`
- package가 이미 설치되어 있으면 apt가 no-op 처리
- WordPress가 이미 있으면 core download/config/install을 조건부 실행
- Prisma DB가 이미 있으면 schema sync 확인
- systemd/Nginx config는 다시 쓰고 reload/restart
- health check는 HTTP readiness를 기다림

단, 사용자가 수동으로 파일을 반쯤 바꾸거나 DB를 삭제한 경우에는 backup 후 상태를 확인해야 한다.

## 7. 운영 후 확인 명령

```bash
sudo systemctl is-active <domain_with_underscore>-next.service
sudo systemctl is-active nginx
sudo systemctl is-active mariadb
sudo systemctl is-active php8.3-fpm

curl -fsS https://<domain>/ >/dev/null
curl -fsS https://<domain>/wp-json/ >/dev/null
curl -fsS https://<domain>/sitemap.xml
```

로컬 HTTP만 확인할 때:

```bash
curl -fsS http://127.0.0.1:3011/ >/dev/null
curl -fsS -H 'Host: <domain>' http://127.0.0.1/ >/dev/null
```

## 8. 장애 대응 힌트

| 증상 | 우선 확인 |
|---|---|
| Certbot 실패 | DNS, 80 포트, Nginx config, rate limit |
| `/wp-json/` 실패 | PHP-FPM socket, WordPress root, Nginx `wp-json` location |
| Next 502 | systemd service status, `/etc/next-wordpress-blog/<domain>.env`, app port |
| build 실패 | `DATABASE_URL`, Prisma schema, Bun install 상태 |
| Nginx default page 노출 | Host header/server_name/DNS 확인 |
| 재실행 중 symlink 문제 | `/usr/local/bin/bun`, `/root/.bun/bin/bun` 확인 |

## 9. 삭제/정리 주의

테스트 서버를 정리할 때는 다음 범위를 구분한다.

- 앱 릴리즈: `/opt/next-wordpress-blog`
- WordPress 파일: `/var/www/<domain>`
- Nginx site: `/etc/nginx/sites-available/<domain>`, `/etc/nginx/sites-enabled/<domain>`
- systemd service: `/etc/systemd/system/<domain>-next.service`
- MariaDB DB/user: 설치 시 생성된 domain 기반 이름
- 운영 env/credential: `/etc/next-wordpress-blog/<domain>.*`

실운영 데이터가 들어간 뒤에는 삭제 전에 반드시 백업한다.

## 10. 현재 남은 외부 의존성

- GitHub raw/repo 접근
- Bun install endpoint
- Ubuntu apt mirror
- WP-CLI phar host
- WordPress core download host
- Certbot/Let's Encrypt

이 외부 의존성 중 하나가 일시 장애이면 설치가 실패할 수 있다. 일부는 retry/fallback을 넣었지만, Certbot/DNS/apt mirror는 환경 영향을 받을 수 있다.
