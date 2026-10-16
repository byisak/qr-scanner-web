# Vercel + Supabase 이전 가이드

작성일: 2026-10-16 · 브랜치: `feat/vercel-supabase`
관련 계약: 모바일 앱 레포 `docs/REALTIME_REST_CONTRACT.md` (앱은 이 계약대로만 동작한다)

## 0. 무엇이 바뀌었나

| 항목 | Vultr (지금) | Vercel + Supabase (이전 후) |
|---|---|---|
| 서버 | `server.ts`(tsx) + Socket.IO 상시 실행 | `next build` → Vercel 서버리스 함수 (server.ts 사용 안 함) |
| DB | Vultr Postgres (`POSTGRES_*`) | Supabase Postgres (`DATABASE_URL`, 서울 리전) |
| 앱 → 서버 | Socket.IO `create-session`/`scan-data` | REST `POST /api/sessions`, `POST /api/sessions/{id}/scans` |
| 서버 → 웹 화면 | Socket.IO 방 `new-scan` | Supabase Realtime Broadcast `scans:{sessionId}:{realtimeKey}` / `new-scan` |
| 정기 정리 | (없음, 관리자가 수동 호출) | Vercel Cron → `GET /api/cron/cleanup` 매일 03:00 KST |

전환 기간 동안 같은 코드가 Vultr 에서도 동작한다.
- REST API 는 Vultr 에서도 그대로 동작하고, 스캔 저장 시 Socket.IO 방에도 `new-scan` 을 보낸다(기존 웹 화면·구버전 앱 호환).
- Vultr 에 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` 를 넣으면 Supabase 로도 동시에 보낸다.
- 웹 화면은 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 **빌드 시** 있으면 Supabase, 없으면 Socket.IO 로 받는다.

### 새/변경 API

| 메서드·경로 | 설명 |
|---|---|
| `POST /api/sessions` | 세션 생성(201)/이어 쓰기(200). Bearer 필수. 본문에 없는 항목(이름·비밀번호·공개 여부)은 그대로 둔다(부분 업데이트). 소유자·관리자 외 403 (소유자 없는 옛 공개·무비밀번호 세션은 요청자가 소유자가 됨) |
| `POST /api/sessions/{id}/scans` | 스캔 저장(201). Bearer 필수. 세션 없음 404 `SESSION_NOT_FOUND`, 소유자·관리자 아님 403 `FORBIDDEN`, code 없음 400 `INVALID_CODE`, 4096자 초과 400 `CODE_TOO_LONG` |
| `POST /api/sessions/{id}/join` | 웹 세션 화면용(소켓 `join-session` 대체). 열람 권한 확인 후 `{ existingData, settings, realtimeKey }`. 거부 시 403 `PRIVATE`/`PASSWORD_REQUIRED` |
| `GET /api/sessions/{id}/settings` | 기존 응답에 `realtimeKey` 추가 — 공개 세션은 누구나, 비밀번호 세션은 `X-Session-Access-Token` 헤더가 유효할 때, 비공개는 소유자·관리자만. 그 외 `null` |
| `POST /api/sessions/{id}/settings` (비밀번호 확인) | 성공 응답에 `realtimeKey` 추가 |
| `PUT /api/sessions/{id}/settings` | 변경 없음 (Next API 라우트라 Vercel 에서 그대로 동작, Bearer 인증) |
| `GET /api/cron/cleanup` | `Authorization: Bearer <CRON_SECRET>` 필수. 삭제 후 30일 지난 세션·스캔 영구 삭제 |

실패 응답 형식(새 API): `{ "success": false, "error": "<메시지>", "code": "<ERROR_CODE>" }`.

## 1. 환경 변수 (이름만 — 값은 Vercel/서버에서 직접 입력)

### Vercel 에 넣을 것

| 이름 | 용도 | 비고 |
|---|---|---|
| `DATABASE_URL` | Supabase Postgres 연결 문자열 | **트랜잭션 풀러(포트 6543)** 주소 권장. `sslmode` 쿼리는 코드가 지우고 SSL 을 직접 켠다 |
| `DATABASE_SSL_CA` | (선택) Supabase CA 인증서 PEM | 넣으면 인증서까지 검증. 없으면 암호화만 (`\n` 이스케이프 허용) |
| `DATABASE_POOL_MAX` | (선택) 함수 인스턴스당 최대 연결 수 | 기본: Vercel 3, 그 외 10 |
| `DATABASE_SSL` | (선택) `false` 면 SSL 끔 | 로컬 Postgres 테스트용. Supabase 에서는 넣지 않는다 |
| `JWT_SECRET` | 로그인 토큰 서명 | **Vultr 와 같은 값** (다르면 기존 로그인·앱 토큰 전부 무효) |
| `SUPABASE_URL` | 서버 → Realtime 브로드캐스트 | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | 브로드캐스트 인증 | 서버 전용. 절대 `NEXT_PUBLIC_` 으로 만들지 않는다 |
| `NEXT_PUBLIC_SUPABASE_URL` | 웹 화면 Realtime 구독 | 빌드 시 박힘 → 바꾸면 재배포 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 웹 화면 Realtime 구독 | 공개 키. 아래 2-4 의 RLS 잠금 필수 |
| `CRON_SECRET` | 크론 엔드포인트 보호 | Vercel Cron 이 자동으로 Bearer 헤더에 넣는다. 충분히 긴 무작위 값 |
| `NEXT_PUBLIC_BASE_URL` | 메일 링크 등 | `https://scanview.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_IDS` | 구글 로그인 | Vultr 와 같은 값 |
| `NEXT_PUBLIC_APPLE_CLIENT_ID`, `APPLE_CLIENT_IDS` | 애플 로그인 | Vultr 와 같은 값 |
| `RESEND_API_KEY` (또는 `SMTP_PASS`) | 메일 발송 | |
| `EMAIL_FROM` (또는 `SMTP_FROM`) | 보내는 사람 | |

### Vercel 에 넣지 않는 것
`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (DATABASE_URL 이 우선),
`NEXT_PUBLIC_SOCKET_URL`, `PORT`, `HOSTNAME` (server.ts 전용).
`VERCEL` 은 Vercel 이 자동으로 넣는다(풀 크기 판단에 사용).

## 2. Supabase 준비

1. Supabase 새 프로젝트 생성 — **Region: Northeast Asia (Seoul) `ap-northeast-2`**. DB 비밀번호는 비밀번호 관리자에 보관.
2. Project Settings → Database → Connection string 에서 두 주소를 확인한다.
   - Direct connection (5432): 스키마·데이터 이전(psql/pg_dump)용 → 아래에서 `$SUPABASE_DIRECT_URL` 로 부른다
   - Transaction pooler (6543): 앱 런타임용 → Vercel `DATABASE_URL`
   (Direct 가 IPv6 전용이라 접속이 안 되면 Session pooler(5432) 주소를 대신 쓴다)
3. **새로 시작(데이터 이전 없음)이면 `scripts/supabase-init.sql` 하나만 실행한다.**
   Supabase 대시보드 → SQL Editor 에 파일 내용을 통째로 붙여 넣고 Run (또는
   `psql "$SUPABASE_DIRECT_URL" -v ON_ERROR_STOP=1 -f scripts/supabase-init.sql`).
   - 스키마 전체(schema.sql 에 빠져 있던 `refresh_tokens.device_id` 포함) + legal_documents + realtime_key
     + 약관 시드(개인정보 처리방침 ko/en, 계정 삭제 안내 5개 언어) + Data API 잠금(4단계 내용)까지 한 번에 한다.
   - 여러 번 실행해도 안전하다. 약관 시드는 이미 있는 행을 덮어쓰지 않는다.
   - **이용약관(terms)은 시드가 없다** → 관리자 화면(약관 관리)에서 작성·발행해야 `/legal/terms` 가 열린다.
   - 이 경우 아래 3단계 나머지, 4단계, 3절(데이터 이전)은 건너뛴다(5·6단계는 그대로 한다).

   데이터를 Vultr 에서 옮기는 경우에만 아래처럼 개별 실행한다 (빈 DB 기준)
   ```bash
   psql "$SUPABASE_DIRECT_URL" -v ON_ERROR_STOP=1 -f schema.sql
   psql "$SUPABASE_DIRECT_URL" -v ON_ERROR_STOP=1 -f scripts/migrate-legal-documents.sql   # 테이블만 만든다
   psql "$SUPABASE_DIRECT_URL" -v ON_ERROR_STOP=1 -f scripts/migrate-realtime-key.sql
   ```
   - 약관 본문(`migrate-legal-account-deletion.sql`, `migrate-legal-privacy-*.sql`)은 **여기서 실행하지 않는다** —
     3절에서 Vultr 의 legal_documents 행이 그대로 옮겨진다(먼저 넣으면 데이터 복원 시 키 충돌).
   - 3절의 "전체 덤프"(방법 B)로 옮길 때는 이 단계를 건너뛰고 복원 후 `migrate-realtime-key.sql` 만 실행.
4. **Data API 잠금 (필수)** — anon 키가 웹에 공개되므로 public 테이블에 RLS 를 켠다.
   ```bash
   psql "$SUPABASE_DIRECT_URL" -f scripts/supabase-lockdown.sql
   ```
   추가로 Project Settings → API → Exposed schemas 에서 `public` 을 빼도 된다(이 앱은 Data API 를 쓰지 않는다).
5. Realtime 설정: Project Settings → Realtime 에서 **공개 채널 허용**("Allow public access" 켜짐 / private-only 꺼짐).
   웹 화면은 로그인 없이 anon 키로 공개 채널 `scans:{sessionId}:{realtimeKey}` 를 구독한다.
6. API 키 확인: Project Settings → API 의 `anon` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY`.

## 3. 데이터 이전 (Vultr → Supabase)

변수: `$VULTR_DB_URL` = Vultr Postgres 접속 문자열(서버에서 실행하거나 SSH 터널), `$SUPABASE_DIRECT_URL`.
Supabase 쪽 psql/pg_dump 버전은 서버 버전(17 이상)과 맞춘다.

### 방법 A (권장): 스키마는 schema.sql, 데이터만 덤프
```bash
# 0) 쓰기 멈추기: 이전 직전에 Vultr 앱을 점검 모드로(또는 pm2 stop) — 이후 스캔이 유실되지 않게
# 1) Vultr 에서도 먼저 새 컬럼 맞추기 (양쪽 스키마 동일하게)
psql "$VULTR_DB_URL" -f scripts/migrate-realtime-key.sql
# 2) 데이터만 덤프 (소유자·권한 제외)
pg_dump "$VULTR_DB_URL" --data-only --no-owner --no-privileges \
  --disable-triggers -Fc -f scanview-data.dump
# 3) Supabase 에 2절 3단계까지 끝낸 상태에서 복원
pg_restore -d "$SUPABASE_DIRECT_URL" --data-only --no-owner --no-privileges \
  --disable-triggers scanview-data.dump
#    (--disable-triggers 가 권한 문제로 실패하면 빼고 다시: 테이블 순서는 pg_restore 가 FK 기준으로 맞춘다)
# 4) SERIAL 시퀀스 맞추기 (데이터만 넣으면 시퀀스가 1부터라 INSERT 충돌)
psql "$SUPABASE_DIRECT_URL" <<'SQL'
DO $$
DECLARE r record; m bigint;
BEGIN
  FOR r IN SELECT table_name, column_name FROM information_schema.columns
           WHERE table_schema='public' AND column_default LIKE 'nextval(%' LOOP
    EXECUTE format('SELECT COALESCE(MAX(%I),0) FROM public.%I', r.column_name, r.table_name) INTO m;
    PERFORM setval(pg_get_serial_sequence('public.'||r.table_name, r.column_name), GREATEST(m,1), m > 0);
  END LOOP;
END $$;
SQL
# 5) 검증: 테이블별 행 수 비교
for t in users refresh_tokens password_reset_tokens sessions scan_data session_settings user_ad_records audit_logs legal_documents; do
  echo "$t vultr=$(psql "$VULTR_DB_URL" -Atc "select count(*) from $t" 2>/dev/null) supabase=$(psql "$SUPABASE_DIRECT_URL" -Atc "select count(*) from $t" 2>/dev/null)"
done
# 6) 잠금 다시 실행 (덤프로 생긴 테이블 포함)
psql "$SUPABASE_DIRECT_URL" -f scripts/supabase-lockdown.sql
```

### 방법 B: 스키마+데이터 전체 덤프
운영 DB 에 schema.sql 에 없는 수동 변경이 있었다면 이쪽이 안전하다.
```bash
pg_dump "$VULTR_DB_URL" --no-owner --no-privileges --schema=public -Fc -f scanview-full.dump
pg_restore -d "$SUPABASE_DIRECT_URL" --no-owner --no-privileges scanview-full.dump
psql "$SUPABASE_DIRECT_URL" -f scripts/migrate-realtime-key.sql   # 이미 했다면 그대로 통과
psql "$SUPABASE_DIRECT_URL" -f scripts/supabase-lockdown.sql
```
Supabase 기본 스키마와 겹치는 확장/객체 오류(`already exists`)는 무시해도 되지만, 테이블 오류는 확인한다.

덤프 파일에는 개인정보(이메일·비밀번호 해시)가 들어 있다 → 이전이 끝나면 즉시 삭제.

## 4. Vercel 프로젝트 설정

1. Vercel → Add New Project → GitHub 레포 연결, Framework: Next.js (자동 인식).
   - Build Command: `next build` (기본, `npm run build`) / Output: 기본 / Install: `npm install`
   - `server.ts` 는 사용하지 않는다 (`npm start` 무시). 로컬에서 같은 경로 확인: `npm run build && npm run start:next`
2. Settings → Functions → Region: **Seoul (icn1)** (vercel.json `regions` 에도 지정됨, Supabase 서울과 같은 곳).
3. Settings → Environment Variables: 1절 목록을 Production(+Preview 필요 시)에 입력.
   Preview 배포가 운영 DB 를 쓰지 않도록 Preview 에는 별도 Supabase 프로젝트나 브랜치 DB 를 권장.
4. 배포 후 `https://<project>.vercel.app` 로 점검:
   - 로그인 / 대시보드 / 세션 화면 열기
   - 앱(새 버전)에서 세션 만들고 스캔 → 웹 세션 화면에 실시간 표시
   - 비밀번호 세션: 비밀번호 입력 전 데이터 안 보임, 입력 후 실시간 수신
   - `curl -H "Authorization: Bearer $CRON_SECRET" https://<project>.vercel.app/api/cron/cleanup`
5. Settings → Cron Jobs 에서 `/api/cron/cleanup` (매일 18:00 UTC = 03:00 KST) 등록 확인.
6. Settings → Domains 에 `scanview.app`(+ `www`) 추가 → Vercel 이 알려주는 DNS 값 확인.

## 5. Cloudflare DNS 전환

1. 하루 전: Cloudflare DNS 에서 `scanview.app` 레코드 TTL 을 낮춘다(프록시 꺼진 레코드는 Auto→60~300초).
2. 전환 시: Vercel 이 안내한 값으로 바꾼다.
   - Apex `scanview.app`: `A 76.76.21.21` (또는 Vercel 이 표시한 값)
   - `www`: `CNAME cname.vercel-dns.com`
   - **Proxy status 는 DNS only(회색 구름)** 권장 — 주황 구름(프록시)이면 Vercel 인증서 발급·캐시가 꼬일 수 있다.
     프록시를 꼭 써야 하면 SSL/TLS 모드를 Full (strict) 로 하고 캐시 규칙에서 `/api/*` 를 Bypass.
3. Vercel Domains 화면에서 "Valid Configuration" + 인증서 발급 확인.
4. 기존 Vultr 레코드 값은 메모해 둔다(롤백용).

## 6. 전환(컷오버) 체크리스트

사전 (D-1 이전)
- [ ] 새 버전 앱(REST 계약 사용)이 스토어에 배포·보급됨 — 구버전 iOS 앱은 전환 후 **실시간 전송만** 멈춘다(2026-10-16 결정)
- [ ] Vultr 에 이 브랜치 배포 + `migrate-realtime-key.sql` 실행 → 새 앱이 Vultr 에서 REST 로 정상 동작 확인
- [ ] Supabase 프로젝트·스키마·잠금(RLS)·Realtime 공개 채널 설정 완료
- [ ] Vercel 프로젝트·환경 변수·Preview 점검 완료 (리허설로 데이터 한 번 이전해 보기)
- [ ] Cloudflare TTL 낮춤

당일
- [ ] Vultr 쓰기 중단(점검 모드) 시각 기록
- [ ] 3절 데이터 이전 + 행 수 비교 + 시퀀스 맞추기 + 잠금 재실행
- [ ] Vercel Production 재배포(환경 변수 최종 확인) → `*.vercel.app` 으로 로그인·스캔·실시간 점검
- [ ] Cloudflare DNS 를 Vercel 로 변경 → 인증서 확인
- [ ] `https://scanview.app` 에서 다시 점검: 로그인, 앱 스캔 → 웹 실시간, 비밀번호/비공개 세션 차단, 내보내기, 법률 문서(`/legal/...`)
- [ ] `HEAD https://scanview.app` 응답 확인 (앱의 서버 도달 확인용)
- [ ] Vultr 는 바로 끄지 말고 최소 1~2주 읽기 전용 대기(롤백용)

롤백
- [ ] Cloudflare DNS 를 메모해 둔 Vultr 값으로 되돌림 (TTL 이 낮으면 수 분 내 복귀)
- [ ] 전환 후 Supabase 에 새로 쌓인 데이터를 Vultr 로 되돌릴지 결정:
      `pg_dump "$SUPABASE_DIRECT_URL" --data-only -t scan_data -t sessions -t session_settings ...` 로 전환 시각 이후 행만 골라 옮김
      (id 충돌 주의 — scan_data 는 `WHERE created_at >= '<전환시각>'` 으로 뽑아 id 없이 INSERT)
- [ ] Vultr 앱 재시작(`npm start` = server.ts). REST API·Socket.IO 둘 다 동작하므로 새 앱도 계속 쓸 수 있다.

## 7. Vercel 에서 달라지는 점 / 알려진 제한

- **비밀번호 시도 제한이 인스턴스별 메모리**: `lib/session-guard.ts` 의 10분 10회 제한은 서버리스 인스턴스마다 따로 센다 → 제한이 약해진다. 강하게 하려면 DB 테이블(또는 Upstash 등)로 옮겨야 한다(미구현).
- **응답 크기 4.5MB 제한**: `GET /api/sessions/{id}/export`(CSV/XLSX)가 아주 큰 세션이면 Vercel 함수 응답 한도에 걸릴 수 있다.
- **realtimeKey 회전 없음**: 공개 세션을 나중에 비밀번호/비공개로 바꿔도 키는 그대로라, 이전에 키를 받은 사람은 이후 새 스캔 알림(스캔 내용)을 계속 받을 수 있다. 필요하면 설정 변경 시 키를 새로 만들도록 개선.
- **공개 Broadcast 채널**: 키를 아는 사람은 같은 채널에 가짜 `new-scan` 을 보낼 수 있다(화면에만 보이고 DB 에는 저장되지 않음, 새로고침 시 사라짐). 막으려면 Supabase 비공개 채널 + realtime.messages RLS(= Supabase Auth JWT 필요)로 바꿔야 한다.
- **구버전 iOS 앱**: Socket.IO 를 쓰므로 Vercel 전환 후 실시간 전송만 동작하지 않는다(계약 4절).
- **탈퇴 회원 영구 삭제**: `scripts/purge-withdrawn-users.sql` 은 아직 수동 실행이다(개인정보 처리방침의 "30일 이내 삭제"를 지키려면 월 1회 실행하거나 크론에 추가 결정 필요). 크론에는 넣지 않았다.
- **개인정보 처리방침**: 처리 위탁·국외 이전 항목에 Vercel(호스팅)·Supabase(DB·실시간, 서울 리전) 반영이 필요한지 확인한다(현재 문서는 Vultr 기준일 수 있음).
- `middleware.ts` 는 Next 16 에서 "Proxy" 로 이름이 바뀌었지만 현재 빌드에서 그대로 동작한다.
- DB 연결: Supabase 트랜잭션 풀러(6543)는 세션 단위 기능(LISTEN/NOTIFY, 세션 변수, 이름 있는 prepared statement)을 못 쓴다. 현재 코드는 이런 기능을 쓰지 않는다. 트랜잭션(BEGIN/COMMIT)은 한 연결 안에서 처리하므로 문제없다.
- 같은 코드로 Vultr 에서 실행할 때는 `DATABASE_URL` 을 넣지 않으면 기존 `POSTGRES_*` 를 그대로 쓴다.
