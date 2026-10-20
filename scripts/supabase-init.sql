-- ScanView (QR Scanner Web) - Supabase 새 DB 초기화 (한 파일)
--
-- 빈 Supabase Postgres(15+)에 지금 코드가 쓰는 스키마 전체를 만든다. 데이터 이전은 하지 않는다.
-- 사용법: Supabase 대시보드 → SQL Editor 에 이 파일 내용을 통째로 붙여 넣고 Run.
--         (또는 psql "$SUPABASE_DIRECT_URL" -f scripts/supabase-init.sql)
-- 여러 번 실행해도 안전하다(idempotent): IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / ON CONFLICT DO NOTHING.
--   약관 시드는 이미 있는 (type, locale) 행을 덮어쓰지 않는다(관리자 화면에서 고친 내용 보존).
--
-- 구성 (순서대로)
--   1. schema.sql (갱신본) - schema.sql 에 빠져 있던 것까지 반영
--      - refresh_tokens.device_id (다중 기기 로그인, 커밋 3b06528 에서 코드만 바뀌고 스키마엔 없던 컬럼)
--      - audit_logs.admin_id NOT NULL 제거 (ON DELETE SET NULL 과 모순 → 관리자 영구 삭제 시 실패)
--   2. scripts/migrate-legal-documents.sql   (legal_documents + updated_at 트리거)
--   3. scripts/migrate-realtime-key.sql      (session_settings.realtime_key, scan_data.code 4096자)
--   4. 약관 시드: scripts/migrate-legal-privacy-2026-10-16.sql (privacy ko/en),
--                scripts/migrate-legal-account-deletion.sql (account-deletion ko/en/ja/zh/es)
--      ※ 이용약관(terms) 시드 SQL 은 저장소에 없다 → 관리자 화면(약관 관리)에서 작성·발행해야 /legal/terms 가 열린다.
--   5. scripts/supabase-lockdown.sql (public 테이블 RLS 켜기 + anon/authenticated 권한 회수) - 맨 끝

BEGIN;

SET LOCAL client_min_messages = warning;  -- "이미 있음, 건너뜀" 알림 숨김

-- ============================================
-- 1. 사용자 인증
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,           -- uuid v4 (앱에서 생성)
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),           -- 소셜 로그인은 NULL (scrypt "salt:hash")
    name VARCHAR(100) NOT NULL,
    profile_image VARCHAR(500),
    provider VARCHAR(20) NOT NULL,        -- email, kakao, google, apple
    provider_id VARCHAR(255),             -- 소셜 로그인 고유 ID
    role VARCHAR(20) DEFAULT 'user',      -- user, admin, super_admin
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP                  -- soft delete (회원 탈퇴)
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 리프레시 토큰 (기기별: 같은 user_id + device_id 의 토큰만 교체/삭제)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL,          -- 128자 hex
    device_id VARCHAR(255) DEFAULT 'web', -- 'web' | 앱 기기 ID
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS device_id VARCHAR(255) DEFAULT 'web';

-- 비밀번호 재설정 토큰
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP DEFAULT NULL,       -- NULL 이면 미사용
    CONSTRAINT fk_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_user_device ON refresh_tokens(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_refresh_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_expires ON password_reset_tokens(expires_at);

-- ============================================
-- 2. 세션 및 스캔 데이터
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    socket_id VARCHAR(255),
    user_id VARCHAR(36),                  -- 세션 소유자
    session_name VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE | DELETED (휴지통)
    deleted_at TIMESTAMP DEFAULT NULL,
    CONSTRAINT fk_session_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS scan_data (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(36),                  -- 스캔을 보낸 사용자
    code VARCHAR(4096) NOT NULL,
    scan_timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session
        FOREIGN KEY (session_id)
        REFERENCES sessions(session_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_scan_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scan_session ON scan_data(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_user ON scan_data(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_created ON scan_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_activity ON sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status_deleted ON sessions(status, deleted_at);

-- ============================================
-- 3. 세션 설정 (비밀번호, 공개 여부, 실시간 채널 키)
-- ============================================

CREATE TABLE IF NOT EXISTS session_settings (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,   -- ON CONFLICT (session_id) 대상
    password_hash VARCHAR(255),
    is_public BOOLEAN DEFAULT true,
    access_code VARCHAR(20),
    max_participants INTEGER DEFAULT NULL,
    allow_anonymous BOOLEAN DEFAULT true,
    expires_at TIMESTAMP DEFAULT NULL,
    realtime_key VARCHAR(64) DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_settings
        FOREIGN KEY (session_id)
        REFERENCES sessions(session_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_settings_session ON session_settings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_settings_access_code ON session_settings(access_code);
-- 외부 주소(구글 시트 등)로 스캔 보내기 (scripts/migrate-webhook-2026-10-21.sql)
ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(64);
ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS webhook_last_status VARCHAR(120);
ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS webhook_last_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_session_settings_public ON session_settings(is_public);

-- ============================================
-- 4. 사용자 광고 기록 (모바일 앱 동기화)
-- ============================================

CREATE TABLE IF NOT EXISTS user_ad_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,              -- ON CONFLICT (user_id) 대상
    unlocked_features JSONB DEFAULT '[]'::jsonb,
    ad_watch_counts JSONB DEFAULT '{}'::jsonb,
    banner_settings JSONB DEFAULT '{}'::jsonb,
    admin_removed_features JSONB DEFAULT '[]'::jsonb,
    last_synced_at TIMESTAMP,
    admin_modified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ad_records_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
ALTER TABLE user_ad_records ADD COLUMN IF NOT EXISTS admin_removed_features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_ad_records ADD COLUMN IF NOT EXISTS admin_modified_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_ad_records_user ON user_ad_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_records_synced ON user_ad_records(last_synced_at);

-- ============================================
-- 5. 감사 로그 (관리자 활동)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(36),                      -- 관리자 계정이 지워지면 NULL (ON DELETE SET NULL)
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(36),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);
-- 옛 schema.sql 은 NOT NULL + ON DELETE SET NULL 이라 감사 로그가 있는 관리자를 영구 삭제하면 실패했다
ALTER TABLE audit_logs ALTER COLUMN admin_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- 6. 약관 문서 (scripts/migrate-legal-documents.sql)
--    type: 'terms' | 'privacy' | 'account-deletion' (lib/legal.ts), locale: ko|en|ja|zh|es
-- ============================================

CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- 작성한 관리자가 영구 삭제돼도 문서는 남도록 SET NULL (원본 스크립트는 NO ACTION 이라 삭제가 막혔다)
  created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(type, locale)                     -- ON CONFLICT (type, locale) 대상
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_locale ON legal_documents(locale);
CREATE INDEX IF NOT EXISTS idx_legal_documents_published ON legal_documents(is_published);

CREATE OR REPLACE FUNCTION update_legal_documents_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_legal_documents_updated_at ON legal_documents;
CREATE TRIGGER trigger_legal_documents_updated_at
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_legal_documents_updated_at();

-- ============================================
-- 7. 실시간 채널 키 (scripts/migrate-realtime-key.sql)
--    새 DB 는 위 CREATE TABLE 에 이미 들어 있다. 옛 테이블 위에 다시 실행해도 맞춰지도록 남겨 둔다.
-- ============================================

ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS realtime_key VARCHAR(64);
ALTER TABLE session_settings
  ALTER COLUMN realtime_key
  SET DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

UPDATE session_settings
SET realtime_key = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE realtime_key IS NULL;

INSERT INTO session_settings (session_id, realtime_key)
SELECT s.session_id, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
FROM sessions s
LEFT JOIN session_settings ss ON ss.session_id = s.session_id
WHERE ss.session_id IS NULL
ON CONFLICT (session_id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scan_data' AND column_name = 'code'
      AND character_maximum_length IS NOT NULL AND character_maximum_length < 4096
  ) THEN
    ALTER TABLE scan_data ALTER COLUMN code TYPE VARCHAR(4096);
  END IF;
END $$;

-- ============================================
-- 8. 약관 시드 (이미 있는 행은 건드리지 않음)
-- ============================================

-- ---- privacy (scripts/migrate-legal-privacy-2026-10-16.sql) ----
-- privacy / ko
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'privacy', 'ko',
  $title$QR 스캐너 개인정보 처리방침$title$,
  $body$<p>큐비온(이하 "회사")은 QR 스캐너 앱(Android·iOS, 이하 "앱")과 실시간 스캔 확인 웹 서비스 scanview.app(이하 앱과 함께 "서비스")을 이용하는 분의 개인정보를 「개인정보 보호법」 등 관련 법령에 따라 처리하고 보호합니다. 이 방침은 앱 1.3.0 버전 기준이며 2026년 10월 16일부터 시행합니다.</p>
<h2>1. 한눈에 보기</h2>
<ul>
<li><p>회원가입 없이 스캔, 코드 생성, 기록 관리 등 대부분의 기능을 쓸 수 있습니다. 이때 스캔 기록, 만든 코드, 스캔 사진, 설정은 <strong>기기 안에만</strong> 저장되고 회사 서버로 전송되지 않습니다.</p>
</li>
<li><p>앱에는 <strong>광고가 없으며 광고 ID를 수집하지 않습니다.</strong></p>
</li>
<li><p>회사 서버(scanview.app)로 정보가 가는 경우는 ① 회원가입·로그인을 할 때, ② 로그인한 상태에서 <strong>실시간 서버 전송</strong>을 직접 켰을 때뿐입니다.</p>
</li>
<li><p>사용 분석(Firebase Analytics)은 Android에서 기본으로 켜져 있고 iOS에서는 기본으로 꺼져 있습니다. <strong>설정 → 앱 정보 및 지원 → 사용 분석 동의</strong>에서 언제든 끄거나 켤 수 있습니다.</p>
</li>
<li><p>계정과 서버 데이터는 앱에서 바로 탈퇴하거나 <a href="https://scanview.app/legal/account-deletion" target="_blank" rel="noopener noreferrer">계정 및 데이터 삭제 안내</a> 페이지의 방법으로 삭제를 요청할 수 있습니다.</p>
</li>
</ul>
<h2>2. 처리하는 개인정보 항목과 수집 방법</h2>
<h3>2-1. 회원가입·로그인 (선택)</h3>
<p>회원가입은 선택 사항이며, 실시간 서버 전송 기능을 쓰려면 로그인이 필요합니다.</p>
<ul>
<li><p><strong>이메일 가입:</strong> 이메일 주소, 비밀번호, 이름(닉네임). 비밀번호는 복원할 수 없는 방식(솔트를 더한 scrypt 해시)으로만 저장합니다.</p>
</li>
<li><p><strong>Google 로그인:</strong> Google 계정의 이메일 주소, 이름, 프로필 사진 주소, Google 계정 고유 식별자</p>
</li>
<li><p><strong>Apple로 로그인(iOS):</strong> Apple이 전달하는 이메일 주소(사용자가 선택한 경우 Apple의 비공개 중계 주소), 이름(제공한 경우), Apple 계정 고유 식별자</p>
</li>
<li><p><strong>자동 생성 정보:</strong> 회원 번호, 로그인 유지용 인증 토큰, 앱이 만든 무작위 기기 식별자(로그인 기기 구분용이며 광고 ID나 하드웨어 식별자가 아님), 가입일, 마지막 로그인·접속 일시, 기능 잠금 해제 상태 기록</p>
</li>
</ul>
<h3>2-2. 실시간 서버 전송 (선택, 로그인 필요)</h3>
<p>설정 → 실시간 서버 전송을 켠 경우에만, 스캔할 때마다 다음 정보가 scanview.app 서버로 전송·저장됩니다.</p>
<ul>
<li><p>스캔한 코드의 내용(값), 스캔 시각, 회원 번호</p>
</li>
<li><p>세션 정보: 세션 ID, 세션 이름, 공개 여부, 세션 비밀번호(설정한 경우, 해시로 저장), 생성·최근 활동 일시</p>
</li>
</ul>
<p><strong>주의:</strong> 새 세션은 기본으로 <strong>공개</strong>입니다. 공개 세션은 세션 주소(링크)를 아는 사람이면 누구나 웹에서 스캔 내용을 볼 수 있습니다. 개인정보나 민감한 내용이 담긴 코드를 전송할 때는 세션을 비공개로 바꾸거나 비밀번호를 설정해 주세요.</p>
<h3>2-3. 사용 분석 (Firebase Analytics)</h3>
<p>앱 개선을 위해 Google의 Firebase Analytics로 다음 정보를 수집합니다.</p>
<ul>
<li><p>앱 인스턴스 ID(앱 설치마다 Firebase가 만드는 식별자), 화면 조회, 기능 사용 이벤트(예: 스캔·생성한 코드의 <strong>종류</strong>와 형식, 저장·공유 방법, 설정 변경, 오류 유형)</p>
</li>
<li><p>Firebase가 자동으로 수집하는 기기 모델, 운영체제와 버전, 앱 버전, 언어, 대략적인 국가·지역(IP 주소 기반), 첫 실행·세션 정보</p>
</li>
</ul>
<p>스캔하거나 만든 코드의 <strong>내용</strong>, 이메일, 이름은 분석 정보로 보내지 않으며, 광고 ID는 수집하지 않습니다. Android에서는 기본으로 켜져 있고, iOS에서는 사용자가 켜기 전까지 수집하지 않습니다. 설정 → 앱 정보 및 지원 → 사용 분석 동의에서 끄면 그때부터 수집을 멈춥니다.</p>
<h3>2-4. 위치 (선택)</h3>
<ul>
<li><p><strong>위치 QR 코드 만들기:</strong> 지도 화면에서 '현재 위치'를 누를 때만 위치 권한을 요청하고, 앱이 화면을 보고 있는 동안에만 기기의 현재 위치를 확인합니다. 백그라운드 위치는 사용하지 않습니다. 이 위치는 지도와 사용자가 만드는 QR 코드에만 쓰이며 회사 서버로 보내지 않습니다.</p>
</li>
<li><p><strong>장소 검색:</strong> 지도에서 장소를 검색하면 검색어와 현재 지도 중심 좌표(현재 위치일 수 있음)가 Google Maps Platform(Places·Geocoding)으로 전송됩니다. 좌표를 주소로 바꾸는 기능은 기기의 기본 위치 서비스(Android는 Google, iOS는 Apple)를 이용합니다.</p>
</li>
<li><p><strong>Wi-Fi QR로 연결(Android):</strong> Android가 Wi-Fi 연결에 위치 권한을 요구하기 때문에 요청하며, 앱은 이때 위치 정보를 수집하지 않습니다.</p>
</li>
</ul>
<h3>2-5. 기기 권한과 기기 안에서만 처리하는 정보</h3>
<p>다음 권한은 해당 기능을 쓸 때만 요청하며, 거부해도 나머지 기능은 쓸 수 있습니다. 아래 정보는 회사 서버로 전송하지 않습니다(실시간 서버 전송을 켠 경우의 스캔 값은 2-2 참고).</p>
<ul>
<li><p><strong>카메라:</strong> QR·바코드 스캔. 카메라 영상은 기기에서 바로 분석합니다. '스캔 사진 저장' 설정이 켜져 있으면 스캔 순간의 사진을 앱 내부 저장 공간에만 보관하며, 설정에서 끌 수 있습니다.</p>
</li>
<li><p><strong>사진:</strong> 만든 QR 코드나 스캔 이미지를 갤러리에 <strong>저장</strong>할 때만 사용합니다. 이미지에서 코드를 읽을 때는 시스템 사진 선택기로 사용자가 고른 사진만 기기에서 분석하며, 사진 보관함 전체를 읽지 않습니다.</p>
</li>
<li><p><strong>연락처:</strong> 연락처(vCard) QR을 사용자가 선택해 연락처에 추가할 때만 사용합니다. 기존 연락처를 읽거나 외부로 보내지 않습니다.</p>
</li>
<li><p><strong>캘린더:</strong> 일정 QR을 사용자가 선택해 캘린더에 추가할 때, 추가할 수 있는 캘린더 목록을 확인하고 일정을 씁니다. 일정 내용을 외부로 보내지 않습니다.</p>
</li>
<li><p><strong>NFC:</strong> NFC 태그를 읽어 스캔 기록에 저장합니다.</p>
</li>
<li><p><strong>알림:</strong> 복권 추첨일 알림 등 기기에서 예약하는 알림에만 사용합니다.</p>
</li>
<li><p><strong>생체 인증(Face ID·지문):</strong> 앱 잠금 해제에 운영체제 기능을 이용하며, 앱은 생체 정보를 받지도 저장하지도 않습니다.</p>
</li>
<li><p><strong>Wi-Fi 상태 확인·변경:</strong> Wi-Fi QR로 네트워크에 연결할 때 사용합니다.</p>
</li>
</ul>
<h3>2-6. 백업 (선택)</h3>
<ul>
<li><p><strong>Google 드라이브 백업:</strong> 사용자가 백업·복원을 실행할 때 사용자 본인의 Google 드라이브에 설정과 스캔 기록 백업 파일(JSON)을 저장하고, 복원할 때 그 백업 파일을 찾아 읽습니다. 백업 파일은 회사 서버를 거치지 않으며 회사는 그 내용에 접근하지 않습니다.</p>
</li>
<li><p><strong>iCloud(iOS):</strong> iCloud를 사용 중이면 앱 데이터가 사용자 본인의 iCloud에 동기화·백업될 수 있습니다. 이 역시 회사 서버를 거치지 않습니다.</p>
</li>
</ul>
<h3>2-7. 사용자가 직접 설정한 외부 전송</h3>
<ul>
<li><p><strong>스캔 URL 연동·상품 검색:</strong> 사용자가 이 기능을 켜고 주소나 검색 사이트를 지정하면, 스캔한 코드 값이 그 웹사이트로 전달됩니다. 전달된 정보는 해당 웹사이트의 개인정보 처리방침을 따릅니다.</p>
</li>
<li><p><strong>복권 당첨 확인:</strong> 동행복권 웹사이트에 회차 번호만 조회하며 개인정보는 보내지 않습니다.</p>
</li>
</ul>
<h3>2-8. 서비스 이용 중 자동으로 생성되는 정보</h3>
<p>서버에 접속하는 과정에서 IP 주소, 접속 일시, 요청 기록 등 접속 기록이 서버 운영 환경에 남을 수 있습니다. 이 정보는 보안과 장애 대응에만 사용합니다.</p>
<h2>3. 개인정보의 처리 목적</h2>
<ul>
<li><p>회원 식별, 로그인 유지, 계정 관리와 본인 확인(비밀번호 재설정 메일 발송 포함)</p>
</li>
<li><p>실시간 서버 전송 세션 생성과 스캔 데이터 표시·관리</p>
</li>
<li><p>기능 잠금 해제 상태를 기기 간에 유지</p>
</li>
<li><p>앱 사용 통계 분석, 오류 파악과 서비스 개선(사용 분석에 동의한 경우)</p>
</li>
<li><p>위치 QR 코드 생성을 위한 장소 검색과 지도 표시</p>
</li>
<li><p>부정 이용 방지, 보안, 문의 응대</p>
</li>
</ul>
<h2>4. 보유 및 이용 기간</h2>
<ul>
<li><p><strong>회원 정보:</strong> 회원 탈퇴 시까지 보유합니다. 탈퇴하면 즉시 로그인이 차단되고 로그인 토큰이 삭제되며, 남은 계정 정보는 탈퇴일로부터 30일 이내에 영구 삭제합니다.</p>
</li>
<li><p><strong>실시간 서버 전송 데이터(세션·스캔 값):</strong> 사용자가 세션이나 스캔을 삭제할 때까지 보유합니다. 웹 대시보드에서 삭제한 세션은 휴지통에 30일간 보관되어 그 사이 복구할 수 있고, 이후 영구 삭제할 수 있습니다. 회원 탈퇴 시에는 탈퇴일로부터 30일 이내에 함께 영구 삭제합니다.</p>
</li>
<li><p><strong>기능 잠금 해제 기록:</strong> 회원 탈퇴 시까지 보유하며, 탈퇴일로부터 30일 이내에 삭제합니다.</p>
</li>
<li><p><strong>사용 분석 정보:</strong> Firebase(Google 애널리틱스)에 설정된 보존 기간이 지나면 자동으로 삭제됩니다.</p>
</li>
<li><p><strong>기기 안의 정보(스캔 기록·사진·설정):</strong> 사용자가 앱에서 삭제하거나 앱을 삭제할 때까지 기기에 남습니다. 회사는 이 정보에 접근할 수 없습니다.</p>
</li>
<li><p>관계 법령에 따라 보존해야 하는 정보가 있으면 그 법령이 정한 기간 동안만 분리해 보관합니다.</p>
</li>
</ul>
<h2>5. 개인정보의 파기 절차와 방법</h2>
<p>보유 기간이 끝나거나 처리 목적을 달성한 개인정보는 지체 없이 파기합니다. 서버 데이터베이스에 저장된 정보는 복구할 수 없도록 삭제하며, 종이 문서로 출력한 개인정보는 없습니다.</p>
<h2>6. 개인정보의 제3자 제공</h2>
<p>회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 이용자가 직접 공개로 설정한 실시간 세션은 링크를 아는 사람이 볼 수 있으며, 법령에 따라 수사기관 등이 적법한 절차로 요구하는 경우에는 예외로 합니다.</p>
<h2>7. 개인정보 처리 위탁과 국외 이전</h2>
<p>회사는 서비스 제공을 위해 다음 업체의 서비스를 이용합니다. 아래 업체로 정보가 전송될 때는 앱 이용 중 암호화된 네트워크(HTTPS)로 전송됩니다.</p>
<ul>
<li><p><strong>Google LLC (미국)</strong></p>
<ul>
<li><p>Firebase Analytics: 2-3의 사용 분석 정보 / 앱 사용 분석 / 보존 기간 설정에 따라 삭제</p>
</li>
<li><p>Google Maps Platform: 장소 검색어, 지도 중심 좌표 / 장소 검색과 지도 표시 / 요청 처리 후 Google 정책에 따름</p>
</li>
<li><p>Google 로그인: 2-1의 Google 계정 정보 / 로그인 인증 / 회원 탈퇴 시까지</p>
</li>
<li><p>문의처: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 개인정보처리방침</a></p>
</li>
</ul>
</li>
<li><p><strong>Apple Inc. (미국, iOS)</strong></p>
<ul>
<li><p>Apple로 로그인: 2-1의 Apple 계정 정보 / 로그인 인증 / 회원 탈퇴 시까지</p>
</li>
<li><p>문의처: <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Apple 개인정보처리방침</a></p>
</li>
</ul>
</li>
<li><p><strong>서버 호스팅 사업자:</strong> scanview.app 서버와 데이터베이스 운영(회원 정보, 실시간 서버 전송 데이터 보관) / 위탁 계약 종료 또는 회원 탈퇴 시까지</p>
</li>
</ul>
<p>이용자는 사용 분석을 끄거나 해당 기능(로그인, 장소 검색)을 쓰지 않는 방법으로 국외 이전을 거부할 수 있습니다. 이 경우 해당 기능만 쓸 수 없고 나머지 기능은 그대로 쓸 수 있습니다.</p>
<h2>8. 이용자의 권리와 행사 방법</h2>
<p>이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요구할 수 있습니다.</p>
<ul>
<li><p><strong>열람·정정:</strong> 앱의 설정 → 프로필(계정 설정)에서 이름(닉네임)을 확인·수정하고 비밀번호를 바꿀 수 있습니다.</p>
</li>
<li><p><strong>삭제(회원 탈퇴):</strong> 설정 → 프로필(계정 설정) → 위험 영역 → 회원탈퇴. 앱을 쓸 수 없으면 <a href="https://scanview.app/legal/account-deletion" target="_blank" rel="noopener noreferrer">계정 및 데이터 삭제 안내</a>에 따라 이메일로 요청할 수 있습니다.</p>
</li>
<li><p><strong>사용 분석 거부:</strong> 설정 → 앱 정보 및 지원 → 사용 분석 동의를 끕니다.</p>
</li>
<li><p><strong>권한 철회:</strong> 기기 설정에서 카메라·위치·사진·연락처·캘린더·알림 권한을 언제든 끌 수 있습니다.</p>
</li>
<li><p>그 밖의 요청은 아래 이메일로 보내 주시면 본인 확인 후 지체 없이(늦어도 10일 이내) 조치 결과를 알려 드립니다. 법정대리인이나 위임을 받은 사람을 통해서도 요청할 수 있습니다.</p>
</li>
</ul>
<h2>9. 만 14세 미만 아동</h2>
<p>서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 만 14세 미만 아동의 개인정보를 알면서 수집하지 않습니다. 만 14세 미만 아동이 회원가입한 사실을 알게 되면 해당 계정과 정보를 지체 없이 삭제합니다.</p>
<h2>10. 개인정보의 안전성 확보 조치</h2>
<ul>
<li><p>앱과 서버 사이의 모든 통신을 HTTPS·WSS로 암호화</p>
</li>
<li><p>비밀번호와 세션 비밀번호는 복원할 수 없는 해시로만 저장</p>
</li>
<li><p>기기에 저장하는 로그인 정보는 운영체제의 보안 저장소(Keychain·Keystore)에 보관</p>
</li>
<li><p>관리자 기능은 권한이 있는 담당자만 쓸 수 있도록 제한하고, 관리자 작업 기록을 남김</p>
</li>
</ul>
<h2>11. 개인정보 자동 수집 장치</h2>
<p>앱은 쿠키를 사용하지 않습니다. scanview.app 웹사이트는 로그인 상태 유지와 화면 설정 저장을 위해 브라우저 저장소(localStorage)를, 언어 설정 유지를 위해 쿠키를 사용하며, 브라우저 설정에서 삭제할 수 있습니다. 광고·추적 목적의 쿠키는 사용하지 않습니다.</p>
<h2>12. 개인정보 보호책임자와 문의처</h2>
<ul>
<li><p>운영자: 큐비온</p>
</li>
<li><p>개인정보 보호책임자: 큐비온 대표</p>
</li>
<li><p>이메일: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<p>개인정보 침해에 대한 신고나 상담이 필요하면 아래 기관에 문의할 수 있습니다.</p>
<ul>
<li><p>개인정보침해신고센터: (국번 없이) 118, privacy.kisa.or.kr</p>
</li>
<li><p>개인정보분쟁조정위원회: 1833-6972, www.kopico.go.kr</p>
</li>
<li><p>대검찰청 사이버수사과: (국번 없이) 1301, www.spo.go.kr</p>
</li>
<li><p>경찰청 사이버수사국: (국번 없이) 182, ecrm.police.go.kr</p>
</li>
</ul>
<h2>13. 방침의 변경</h2>
<p>이 방침의 내용이 바뀌면 시행 7일 전부터 이 페이지와 앱을 통해 알립니다. 이용자 권리에 중요한 변경이 있으면 시행 30일 전부터 알립니다.</p>
<ul>
<li><p>시행일: 2026년 10월 16일</p>
</li>
</ul>$body$,
  '2.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO NOTHING;

-- privacy / en
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'privacy', 'en',
  $title$QR Scanner Privacy Policy$title$,
  $body$<p>Cubion (큐비온, "we", "us") processes and protects the personal information of people who use the QR Scanner app for Android and iOS (the "App") and the scanview.app real-time scan viewer (together with the App, the "Service") in accordance with the Personal Information Protection Act of Korea and other applicable laws. This policy describes App version 1.3.0 and takes effect on October 16, 2026.</p>
<h2>1. Summary</h2>
<ul>
<li><p>Most features (scanning, creating codes, managing history) work without an account. In that case your scan history, created codes, scan photos and settings are stored <strong>only on your device</strong> and are never sent to our server.</p>
</li>
<li><p>The App <strong>contains no ads and does not collect the advertising ID.</strong></p>
</li>
<li><p>Information reaches our server (scanview.app) only when you (1) sign up or sign in, or (2) turn on <strong>Realtime Server Sync</strong> yourself while signed in.</p>
</li>
<li><p>Usage analytics (Firebase Analytics) is on by default on Android and off by default on iOS. You can turn it on or off at any time under <strong>Settings → App Info &amp; Support → Usage Analytics</strong>.</p>
</li>
<li><p>You can delete your account and server data from within the App, or request deletion as described on the <a href="https://scanview.app/legal/account-deletion?lang=en" target="_blank" rel="noopener noreferrer">Account &amp; Data Deletion</a> page.</p>
</li>
</ul>
<h2>2. Information we process and how we collect it</h2>
<h3>2-1. Sign-up and sign-in (optional)</h3>
<p>An account is optional. Realtime Server Sync requires signing in.</p>
<ul>
<li><p><strong>Email sign-up:</strong> email address, password and name (nickname). Passwords are stored only as a salted scrypt hash that cannot be reversed.</p>
</li>
<li><p><strong>Sign in with Google:</strong> your Google account's email address, name, profile photo URL and unique Google account ID</p>
</li>
<li><p><strong>Sign in with Apple (iOS):</strong> the email address Apple provides (or Apple's private relay address if you choose it), your name (if shared) and unique Apple account ID</p>
</li>
<li><p><strong>Generated automatically:</strong> member ID, authentication tokens that keep you signed in, a random device identifier created by the App (used only to tell your signed-in devices apart; it is not the advertising ID or a hardware ID), sign-up date, last sign-in/activity time, and feature-unlock status</p>
</li>
</ul>
<h3>2-2. Realtime Server Sync (optional, sign-in required)</h3>
<p>Only when you turn on Settings → Realtime Server Sync, the following is sent to and stored on the scanview.app server each time you scan:</p>
<ul>
<li><p>The content (value) of the scanned code, the scan time and your member ID</p>
</li>
<li><p>Session information: session ID, session name, public/private setting, session password (if set, stored as a hash), creation and last-activity times</p>
</li>
</ul>
<p><strong>Important:</strong> new sessions are <strong>public</strong> by default. Anyone who has the session link can view its scans on the web. If you send codes containing personal or sensitive information, make the session private or set a password.</p>
<h3>2-3. Usage analytics (Firebase Analytics)</h3>
<p>To improve the App we use Google's Firebase Analytics to collect:</p>
<ul>
<li><p>The app instance ID (an identifier Firebase creates for each installation), screen views and feature events (for example, the <strong>type</strong> and format of codes you scan or create, how you save or share, settings changes and error types)</p>
</li>
<li><p>Information Firebase collects automatically: device model, operating system and version, App version, language, approximate country/region (derived from IP address), first-open and session information</p>
</li>
</ul>
<p>We never send the <strong>content</strong> of codes you scan or create, your email or your name as analytics, and we do not collect the advertising ID. Analytics is on by default on Android; on iOS nothing is collected until you turn it on. Turning off Settings → App Info &amp; Support → Usage Analytics stops collection from that point.</p>
<h3>2-4. Location (optional)</h3>
<ul>
<li><p><strong>Creating a location QR code:</strong> we ask for location permission only when you tap "current location" on the map screen, and read your device's location only while the App is in use. We never use background location. The location is used only for the map and the QR code you create, and is not sent to our server.</p>
</li>
<li><p><strong>Place search:</strong> when you search for a place on the map, the search text and the current map center coordinates (which may be your current location) are sent to Google Maps Platform (Places and Geocoding). Converting coordinates to an address uses your device's built-in location service (Google on Android, Apple on iOS).</p>
</li>
<li><p><strong>Connecting to Wi-Fi from a QR code (Android):</strong> Android requires location permission to connect to Wi-Fi networks; the App does not collect your location in this case.</p>
</li>
</ul>
<h3>2-5. Device permissions and information that stays on your device</h3>
<p>We request each permission only when you use the related feature; you can deny it and keep using everything else. The following is not sent to our server (see 2-2 for scan values when Realtime Server Sync is on).</p>
<ul>
<li><p><strong>Camera:</strong> scanning QR codes and barcodes. Camera frames are analyzed on the device. If "Save Scan Photo" is on, the photo taken at the moment of scanning is kept only in the App's private storage; you can turn this off in Settings.</p>
</li>
<li><p><strong>Photos:</strong> used only to <strong>save</strong> created QR codes or scan images to your gallery. To read a code from an image, only the photo you pick in the system photo picker is analyzed on the device; the App does not read your whole photo library.</p>
</li>
<li><p><strong>Contacts:</strong> used only when you choose to add a contact (vCard) from a QR code. The App does not read your existing contacts or send them anywhere.</p>
</li>
<li><p><strong>Calendar:</strong> used only when you choose to add an event from a QR code; the App looks up which calendars can be written to and writes the event. Event details are not sent anywhere.</p>
</li>
<li><p><strong>NFC:</strong> reading NFC tags and saving them to your scan history.</p>
</li>
<li><p><strong>Notifications:</strong> only for notifications scheduled on the device, such as lottery draw reminders.</p>
</li>
<li><p><strong>Biometrics (Face ID / fingerprint):</strong> used to unlock the App through the operating system. The App never receives or stores biometric data.</p>
</li>
<li><p><strong>Wi-Fi state:</strong> used to connect to a network from a Wi-Fi QR code.</p>
</li>
</ul>
<h3>2-6. Backup (optional)</h3>
<ul>
<li><p><strong>Google Drive backup:</strong> when you run backup or restore, the App saves a backup file (JSON) of your settings and scan history to <strong>your own</strong> Google Drive, and on restore finds and reads that backup file. Backups do not pass through our server and we cannot access them.</p>
</li>
<li><p><strong>iCloud (iOS):</strong> if you use iCloud, App data may be synced and backed up to your own iCloud. This also does not pass through our server.</p>
</li>
</ul>
<h3>2-7. Transfers you set up yourself</h3>
<ul>
<li><p><strong>Scan URL integration and product search:</strong> if you turn these on and choose an address or search site, scanned values are sent to that website and are governed by that website's privacy policy.</p>
</li>
<li><p><strong>Lottery result check:</strong> the App queries the Korean lottery operator's (dhlottery.co.kr) website with the draw number only; no personal information is sent.</p>
</li>
</ul>
<h3>2-8. Information generated while using the Service</h3>
<p>When the App or a browser connects to our server, connection records such as IP address, access time and request logs may be kept by the server environment. We use them only for security and troubleshooting.</p>
<h2>3. Why we process your information</h2>
<ul>
<li><p>Identifying members, keeping you signed in, account management and verification (including password-reset emails)</p>
</li>
<li><p>Creating Realtime Server Sync sessions and showing and managing their scans</p>
</li>
<li><p>Keeping feature-unlock status across your devices</p>
</li>
<li><p>Usage statistics, error detection and service improvement (when analytics is on)</p>
</li>
<li><p>Place search and map display for creating location QR codes</p>
</li>
<li><p>Preventing abuse, security and answering inquiries</p>
</li>
</ul>
<h2>4. How long we keep it</h2>
<ul>
<li><p><strong>Account information:</strong> kept until you delete your account. On deletion, sign-in is blocked and sign-in tokens are deleted immediately, and the remaining account information is permanently deleted within 30 days.</p>
</li>
<li><p><strong>Realtime Server Sync data (sessions and scan values):</strong> kept until you delete the session or scans. Sessions deleted on the web dashboard stay in the trash for 30 days so they can be restored, and can then be permanently deleted. When you delete your account, they are permanently deleted within 30 days.</p>
</li>
<li><p><strong>Feature-unlock records:</strong> kept until you delete your account and deleted within 30 days after that.</p>
</li>
<li><p><strong>Analytics data:</strong> deleted automatically when the retention period configured in Firebase (Google Analytics) expires.</p>
</li>
<li><p><strong>On-device data (scan history, photos, settings):</strong> stays on your device until you delete it in the App or uninstall the App. We cannot access it.</p>
</li>
<li><p>If a law requires us to keep certain information, we keep it separately and only for the period the law requires.</p>
</li>
</ul>
<h2>5. How we destroy information</h2>
<p>When the retention period ends or the purpose has been achieved, we destroy the information without delay. Information in our server database is deleted so that it cannot be recovered. We do not keep personal information on paper.</p>
<h2>6. Disclosure to third parties</h2>
<p>We do not provide your personal information to third parties. Exceptions: sessions you make public can be viewed by anyone with the link, and we may disclose information when lawfully required by investigative authorities or other legal process.</p>
<h2>7. Service providers and international transfers</h2>
<p>We use the following providers to run the Service. Data sent to them is transmitted over encrypted connections (HTTPS) while you use the App.</p>
<ul>
<li><p><strong>Google LLC (United States)</strong></p>
<ul>
<li><p>Firebase Analytics: analytics data in 2-3 / app usage analysis / deleted per the configured retention period</p>
</li>
<li><p>Google Maps Platform: place search text, map center coordinates / place search and map display / per Google's policies after processing</p>
</li>
<li><p>Sign in with Google: Google account information in 2-1 / authentication / until account deletion</p>
</li>
<li><p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></p>
</li>
</ul>
</li>
<li><p><strong>Apple Inc. (United States, iOS)</strong></p>
<ul>
<li><p>Sign in with Apple: Apple account information in 2-1 / authentication / until account deletion</p>
</li>
<li><p><a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Apple Privacy Policy</a></p>
</li>
</ul>
</li>
<li><p><strong>Server hosting provider:</strong> operating the scanview.app server and database (account information and Realtime Server Sync data) / until the service contract ends or you delete your account</p>
</li>
</ul>
<p>You can refuse these transfers by turning off analytics or by not using the related features (sign-in, place search). Only those features become unavailable; everything else keeps working.</p>
<h2>8. Your rights</h2>
<p>You may at any time access, correct or delete your personal information, or ask us to stop processing it.</p>
<ul>
<li><p><strong>Access and correction:</strong> in the App, go to Settings → your profile (Account Settings) to view and edit your name (nickname) and change your password.</p>
</li>
<li><p><strong>Deletion (delete account):</strong> Settings → your profile (Account Settings) → Danger Zone → Delete Account. If you cannot use the App, request deletion by email as described on the <a href="https://scanview.app/legal/account-deletion?lang=en" target="_blank" rel="noopener noreferrer">Account &amp; Data Deletion</a> page.</p>
</li>
<li><p><strong>Opting out of analytics:</strong> turn off Settings → App Info &amp; Support → Usage Analytics.</p>
</li>
<li><p><strong>Withdrawing permissions:</strong> you can turn off camera, location, photos, contacts, calendar and notification permissions in your device settings at any time.</p>
</li>
<li><p>For other requests, email us at the address below. After verifying your identity we will respond without delay (within 10 days at the latest). You may also make requests through a legal representative or an authorized agent.</p>
</li>
</ul>
<h2>9. Children</h2>
<p>The Service is not directed to children under 14 (or under 13 where that is the applicable age), and we do not knowingly collect their personal information. If we learn that such a child has created an account, we will delete the account and its information without delay.</p>
<h2>10. Security measures</h2>
<ul>
<li><p>All communication between the App and our server is encrypted with HTTPS/WSS</p>
</li>
<li><p>Account and session passwords are stored only as irreversible hashes</p>
</li>
<li><p>Sign-in information on the device is kept in the operating system's secure storage (Keychain/Keystore)</p>
</li>
<li><p>Admin functions are restricted to authorized staff and admin actions are logged</p>
</li>
</ul>
<h2>11. Cookies and similar technologies</h2>
<p>The App does not use cookies. The scanview.app website uses browser storage (localStorage) to keep you signed in and remember display settings, and a cookie to remember your language. You can clear them in your browser settings. We do not use advertising or tracking cookies.</p>
<h2>12. Privacy officer and contact</h2>
<ul>
<li><p>Operator: Cubion (큐비온)</p>
</li>
<li><p>Privacy officer: Representative of Cubion</p>
</li>
<li><p>Email: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<p>If you need to report or get advice on a privacy violation, you can also contact the Korean authorities below.</p>
<ul>
<li><p>Personal Information Infringement Report Center: 118 (in Korea), privacy.kisa.or.kr</p>
</li>
<li><p>Personal Information Dispute Mediation Committee: 1833-6972, www.kopico.go.kr</p>
</li>
</ul>
<h2>13. Changes to this policy</h2>
<p>We will announce changes on this page and in the App at least 7 days before they take effect, or at least 30 days before for changes that significantly affect your rights.</p>
<ul>
<li><p>Effective date: October 16, 2026</p>
</li>
</ul>$body$,
  '2.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO NOTHING;

-- ---- account-deletion (scripts/migrate-legal-account-deletion.sql) ----
-- account-deletion / ko
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'ko',
  $title$계정 및 데이터 삭제 안내$title$,
  $body$<p>이 페이지는 큐비온이 운영하는 <strong>QR 스캐너(QR Scanner)</strong> 앱(Android·iOS)과 scanview.app 서비스의 계정 및 데이터를 삭제하는 방법을 안내합니다.</p>
<ul>
<li><p>앱 이름: QR 스캐너 (QR Scanner)</p>
</li>
<li><p>개발자: 큐비온</p>
</li>
<li><p>문의: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. 앱에서 바로 삭제하기 (회원 탈퇴)</h2>
<ol>
<li><p>앱을 열고 하단의 <strong>설정</strong> 탭으로 이동합니다.</p>
</li>
<li><p>맨 위의 <strong>프로필(이름이 표시된 카드)</strong>을 눌러 <strong>계정 설정</strong> 화면을 엽니다.</p>
</li>
<li><p>아래쪽 <strong>위험 영역</strong>에서 <strong>회원탈퇴</strong>를 누릅니다.</p>
</li>
<li><p>확인 창에서 <strong>확인</strong>을 누르면 탈퇴가 완료되고 자동으로 로그아웃됩니다.</p>
</li>
</ol>
<h2>2. 앱 없이 이메일로 요청하기</h2>
<p>앱을 삭제했거나 로그인할 수 없는 경우 이메일로 삭제를 요청할 수 있습니다.</p>
<ul>
<li><p>받는 주소: <a href="mailto:support@scanview.app?subject=%5B%EA%B3%84%EC%A0%95%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD%5D%20QR%20%EC%8A%A4%EC%BA%90%EB%84%88" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>제목: <strong>[계정 삭제 요청] QR 스캐너</strong></p>
</li>
<li><p>본문: 가입한 이메일 주소, 가입 방법(이메일·Google·Apple), 삭제를 원한다는 내용</p>
</li>
<li><p>본인 확인을 위해 <strong>가입한 이메일 주소로</strong> 보내 주세요. Apple의 '나의 이메일 가리기'로 가입했다면 그 주소로 보낸 메일이 전달되는 Apple ID 이메일에서 보내 주시고, 가능한 경우 가입 시 표시된 중계 주소도 적어 주세요.</p>
</li>
<li><p>다른 주소에서 보내면 본인 확인을 위해 추가 확인을 요청할 수 있습니다.</p>
</li>
</ul>
<p>요청을 받으면 본인 확인 후 영업일 기준 7일 이내에 처리 결과를 회신하며, 늦어도 요청일로부터 30일 이내에 삭제를 마칩니다.</p>
<h2>3. 삭제되는 데이터</h2>
<p>탈퇴하거나 삭제 요청이 처리되면 다음 데이터가 삭제됩니다.</p>
<ul>
<li><p><strong>계정 정보:</strong> 이메일 주소, 이름(닉네임), 비밀번호(해시), 프로필 사진 주소, Google·Apple 로그인 연결 정보(계정 고유 식별자), 가입·마지막 로그인 일시</p>
</li>
<li><p><strong>로그인 정보:</strong> 로그인 유지용 인증 토큰과 기기 식별자, 비밀번호 재설정 기록</p>
</li>
<li><p><strong>실시간 서버 전송 데이터:</strong> 만든 세션(세션 이름, 공개 여부, 비밀번호 등 설정)과 그 세션으로 전송된 스캔 값·스캔 시각</p>
</li>
<li><p><strong>기능 잠금 해제 기록:</strong> 계정에 연결된 기능 잠금 해제 상태와 관련 기록</p>
</li>
</ul>
<h3>삭제 시점</h3>
<ul>
<li><p><strong>즉시:</strong> 로그인이 차단되고 모든 기기의 로그인 토큰이 삭제됩니다. 같은 계정으로 다시 로그인할 수 없습니다.</p>
</li>
<li><p><strong>30일 이내:</strong> 서버에 남아 있는 위 데이터 전체를 영구 삭제합니다. 삭제된 데이터는 복구할 수 없습니다.</p>
</li>
</ul>
<p>공개로 설정한 실시간 세션은 영구 삭제 전까지 링크로 열릴 수 있습니다. 바로 볼 수 없게 하려면 탈퇴하기 전에 앱의 <strong>설정 → 실시간 서버 전송</strong> 또는 scanview.app 대시보드에서 세션을 삭제하거나 비공개로 바꿔 주세요.</p>
<h2>4. 보관되는 데이터</h2>
<ul>
<li><p>회사 서버에는 탈퇴 후 30일이 지나면 위 데이터를 남기지 않습니다.</p>
</li>
<li><p>관계 법령에 따라 보존해야 하는 정보가 생기는 경우(예: 수사기관의 적법한 요청)에만 그 법령이 정한 기간 동안 분리해 보관합니다.</p>
</li>
<li><p>사용 분석 정보(Firebase Analytics)는 계정과 연결되지 않은 앱 설치 단위 정보이며, Firebase에 설정된 보존 기간이 지나면 자동으로 삭제됩니다. 앱의 <strong>설정 → 앱 정보 및 지원 → 사용 분석 동의</strong>를 끄면 더 이상 수집하지 않습니다.</p>
</li>
</ul>
<h2>5. 기기에 저장된 데이터</h2>
<p>스캔 기록, 만든 코드, 스캔 사진, 설정은 회사 서버가 아닌 <strong>사용자 기기에만</strong> 저장되므로 회원 탈퇴로 지워지지 않습니다.</p>
<ul>
<li><p>앱의 <strong>기록</strong> 화면에서 항목을 지우거나 <strong>전체 삭제</strong>로 한 번에 지울 수 있습니다.</p>
</li>
<li><p>앱을 삭제(제거)하면 기기에 저장된 앱 데이터가 모두 지워집니다.</p>
</li>
<li><p>Google 드라이브나 iCloud에 직접 만든 백업 파일은 사용자 본인 저장소에 있으므로 해당 서비스에서 직접 삭제해 주세요.</p>
</li>
</ul>
<h2>6. 관련 문서</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy" target="_blank" rel="noopener noreferrer">개인정보 처리방침</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms" target="_blank" rel="noopener noreferrer">서비스 이용약관</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO NOTHING;

-- account-deletion / en
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'en',
  $title$Account & Data Deletion$title$,
  $body$<p>This page explains how to delete your account and data for the <strong>QR Scanner (QR 스캐너)</strong> app for Android and iOS and the scanview.app service, operated by Cubion (큐비온).</p>
<ul>
<li><p>App name: QR Scanner (QR 스캐너)</p>
</li>
<li><p>Developer: Cubion (큐비온)</p>
</li>
<li><p>Contact: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. Delete your account in the app</h2>
<ol>
<li><p>Open the app and go to the <strong>Settings</strong> tab at the bottom.</p>
</li>
<li><p>Tap your <strong>profile card</strong> (showing your name) at the top to open <strong>Account Settings</strong>.</p>
</li>
<li><p>Under <strong>Danger Zone</strong>, tap <strong>Delete Account</strong>.</p>
</li>
<li><p>Tap <strong>Confirm</strong>. Your account is deleted and you are signed out.</p>
</li>
</ol>
<h2>2. Request deletion by email (without the app)</h2>
<p>If you have uninstalled the app or cannot sign in, you can request deletion by email.</p>
<ul>
<li><p>To: <a href="mailto:support@scanview.app?subject=%5BAccount%20Deletion%20Request%5D%20QR%20Scanner" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>Subject: <strong>[Account Deletion Request] QR Scanner</strong></p>
</li>
<li><p>Body: the email address you signed up with, how you signed up (email, Google or Apple), and that you want your account deleted</p>
</li>
<li><p>To verify that the request is yours, please send it <strong>from the email address registered to your account</strong>. If you used Apple's "Hide My Email", send it from the Apple ID email that receives mail forwarded from that relay address and include the relay address if you can.</p>
</li>
<li><p>If you write from a different address, we may ask for additional verification.</p>
</li>
</ul>
<p>After verifying your identity we will reply within 7 business days, and deletion will be completed within 30 days of your request at the latest.</p>
<h2>3. What is deleted</h2>
<p>When you delete your account or your request is processed, the following data is deleted:</p>
<ul>
<li><p><strong>Account information:</strong> email address, name (nickname), password (hash), profile photo URL, Google/Apple sign-in links (account identifiers), sign-up and last sign-in times</p>
</li>
<li><p><strong>Sign-in data:</strong> authentication tokens, device identifiers and password-reset records</p>
</li>
<li><p><strong>Realtime Server Sync data:</strong> sessions you created (session name, public/private setting, password and other settings) and the scan values and times sent to them</p>
</li>
<li><p><strong>Feature-unlock records:</strong> feature-unlock status and related records linked to your account</p>
</li>
</ul>
<h3>When it is deleted</h3>
<ul>
<li><p><strong>Immediately:</strong> sign-in is blocked and sign-in tokens on all devices are deleted. You can no longer sign in to the account.</p>
</li>
<li><p><strong>Within 30 days:</strong> all of the remaining data above is permanently deleted from our server. Deleted data cannot be recovered.</p>
</li>
</ul>
<p>A session you made public may still open from its link until it is permanently deleted. To make it unavailable right away, delete the session or make it private before deleting your account, in the app under <strong>Settings → Realtime Server Sync</strong> or on the scanview.app dashboard.</p>
<h2>4. What is kept</h2>
<ul>
<li><p>After 30 days from deletion, none of the data above remains on our server.</p>
</li>
<li><p>Only if a law requires us to keep certain information (for example, a lawful request from investigative authorities) will we keep it separately, for the period that law requires.</p>
</li>
<li><p>Usage analytics (Firebase Analytics) is tied to the app installation, not to your account, and is deleted automatically when the retention period configured in Firebase expires. Turn off <strong>Settings → App Info &amp; Support → Usage Analytics</strong> in the app to stop collection.</p>
</li>
</ul>
<h2>5. Data stored on your device</h2>
<p>Your scan history, created codes, scan photos and settings are stored <strong>only on your device</strong>, not on our server, so deleting your account does not remove them.</p>
<ul>
<li><p>Delete individual items in the app's <strong>History</strong> screen, or use <strong>Delete All</strong> to remove everything.</p>
</li>
<li><p>Uninstalling the app removes all app data stored on the device.</p>
</li>
<li><p>Backup files you created in Google Drive or iCloud are in your own storage; please delete them there.</p>
</li>
</ul>
<h2>6. Related documents</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy?lang=en" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms?lang=en" target="_blank" rel="noopener noreferrer">Terms of Service</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO NOTHING;

-- account-deletion / ja
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'ja',
  $title$アカウントとデータの削除について$title$,
  $body$<p>このページでは、큐비온（Cubion）が運営する <strong>QR Scanner（QR 스캐너）</strong> アプリ（Android・iOS）と scanview.app サービスのアカウントおよびデータを削除する方法をご案内します。</p>
<ul>
<li><p>アプリ名：QR Scanner（QR 스캐너）</p>
</li>
<li><p>開発者：큐비온（Cubion）</p>
</li>
<li><p>お問い合わせ：<a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. アプリで削除する（退会）</h2>
<ol>
<li><p>アプリを開き、下部の <strong>設定</strong> タブに移動します。</p>
</li>
<li><p>上部の <strong>プロフィール（名前が表示されたカード）</strong> をタップして <strong>アカウント設定</strong> を開きます。</p>
</li>
<li><p><strong>危険な操作</strong> の <strong>退会</strong> をタップします。</p>
</li>
<li><p>確認画面で <strong>確認</strong> をタップすると退会が完了し、自動的にログアウトされます。</p>
</li>
</ol>
<h2>2. アプリを使わずにメールで依頼する</h2>
<ul>
<li><p>宛先：<a href="mailto:support@scanview.app?subject=%5BAccount%20Deletion%20Request%5D%20QR%20Scanner" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>件名：<strong>[Account Deletion Request] QR Scanner</strong></p>
</li>
<li><p>本文：登録したメールアドレス、登録方法（メール・Google・Apple）、削除を希望する旨</p>
</li>
<li><p>本人確認のため、<strong>登録したメールアドレスから</strong> 送信してください。別のアドレスから送信された場合は追加の確認をお願いすることがあります。</p>
</li>
</ul>
<p>本人確認後、7営業日以内に返信し、遅くとも依頼日から30日以内に削除を完了します。</p>
<h2>3. 削除されるデータ</h2>
<ul>
<li><p><strong>アカウント情報：</strong> メールアドレス、名前（ニックネーム）、パスワード（ハッシュ）、プロフィール写真のURL、Google・Appleログインの連携情報、登録日時・最終ログイン日時</p>
</li>
<li><p><strong>ログイン情報：</strong> 認証トークン、端末識別子、パスワード再設定の記録</p>
</li>
<li><p><strong>リアルタイムサーバー送信のデータ：</strong> 作成したセッション（名前・公開設定・パスワードなど）と、そこに送信されたスキャン値・スキャン日時</p>
</li>
<li><p><strong>機能ロック解除の記録</strong></p>
</li>
</ul>
<p>退会と同時にログインが遮断され、すべての端末の認証トークンが削除されます。残りのデータは <strong>30日以内</strong> にサーバーから完全に削除され、復元できません。公開セッションは完全削除まではリンクから閲覧できる場合があるため、すぐに非公開にしたい場合は退会前に <strong>設定 → リアルタイムサーバー送信</strong> または scanview.app のダッシュボードでセッションを削除するか非公開にしてください。</p>
<h2>4. 保持されるデータ</h2>
<p>退会から30日を過ぎると、上記のデータはサーバーに残りません。法令により保存が必要な場合に限り、その法令が定める期間だけ分離して保管します。使用分析（Firebase Analytics）のデータはアカウントではなくアプリのインストール単位の情報で、Firebaseで設定された保存期間を過ぎると自動的に削除されます。アプリの <strong>設定 → アプリ情報とサポート → 使用分析の同意</strong> をオフにすると収集を停止します。</p>
<h2>5. 端末に保存されたデータ</h2>
<p>スキャン履歴、作成したコード、スキャン写真、設定は <strong>端末にのみ</strong> 保存されるため、退会しても削除されません。アプリの <strong>履歴</strong> 画面で個別に、または <strong>すべて削除</strong> でまとめて削除できます。アプリをアンインストールすると、端末内のアプリデータはすべて削除されます。Googleドライブや iCloud に作成したバックアップは、ご自身で各サービスから削除してください。</p>
<h2>6. 関連文書</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy?lang=ja" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms?lang=ja" target="_blank" rel="noopener noreferrer">利用規約</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO NOTHING;

-- account-deletion / zh
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'zh',
  $title$账户与数据删除说明$title$,
  $body$<p>本页面说明如何删除由 큐비온（Cubion）运营的 <strong>QR Scanner（QR 스캐너）</strong> 应用（Android、iOS）及 scanview.app 服务中的账户和数据。</p>
<ul>
<li><p>应用名称：QR Scanner（QR 스캐너）</p>
</li>
<li><p>开发者：큐비온（Cubion）</p>
</li>
<li><p>联系方式：<a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. 在应用中删除（注销账户）</h2>
<ol>
<li><p>打开应用，进入底部的 <strong>设置</strong> 标签。</p>
</li>
<li><p>点击顶部的 <strong>个人资料卡片（显示您的名字）</strong>，打开 <strong>账户设置</strong>。</p>
</li>
<li><p>在 <strong>危险区域</strong> 中点击 <strong>注销账户</strong>。</p>
</li>
<li><p>在确认窗口中点击 <strong>确认</strong>，即完成注销并自动退出登录。</p>
</li>
</ol>
<h2>2. 不使用应用，通过电子邮件申请</h2>
<ul>
<li><p>收件人：<a href="mailto:support@scanview.app?subject=%5BAccount%20Deletion%20Request%5D%20QR%20Scanner" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>主题：<strong>[Account Deletion Request] QR Scanner</strong></p>
</li>
<li><p>正文：注册时使用的电子邮件地址、注册方式（电子邮件、Google、Apple），以及希望删除账户的说明</p>
</li>
<li><p>为确认是您本人，请 <strong>使用注册时的电子邮件地址</strong> 发送。如从其他地址发送，我们可能会要求进一步确认。</p>
</li>
</ul>
<p>确认身份后，我们将在 7 个工作日内回复，并最迟在收到申请后 30 天内完成删除。</p>
<h2>3. 将被删除的数据</h2>
<ul>
<li><p><strong>账户信息：</strong> 电子邮件地址、名字（昵称）、密码（哈希）、头像地址、Google/Apple 登录关联信息、注册及最后登录时间</p>
</li>
<li><p><strong>登录信息：</strong> 认证令牌、设备标识符、密码重置记录</p>
</li>
<li><p><strong>实时服务器传输数据：</strong> 您创建的会话（名称、公开设置、密码等）及发送到这些会话的扫描内容和扫描时间</p>
</li>
<li><p><strong>功能解锁记录</strong></p>
</li>
</ul>
<p>注销后会立即阻止登录，并删除所有设备上的认证令牌。其余数据将在 <strong>30 天内</strong> 从服务器永久删除，且无法恢复。公开会话在永久删除前仍可能通过链接查看；如需立即隐藏，请在注销前通过 <strong>设置 → 实时服务器传输</strong> 或 scanview.app 控制台删除会话或将其设为非公开。</p>
<h2>4. 保留的数据</h2>
<p>注销 30 天后，上述数据不会保留在服务器上。仅在法律要求保存时，才会在法律规定的期限内单独保管。使用分析（Firebase Analytics）数据以应用安装为单位、不与账户关联，超过 Firebase 中设置的保留期限后自动删除。关闭应用中的 <strong>设置 → 应用信息和支持 → 使用分析同意</strong> 即可停止收集。</p>
<h2>5. 设备上保存的数据</h2>
<p>扫描历史、创建的代码、扫描照片和设置 <strong>仅保存在您的设备上</strong>，注销账户不会删除它们。您可以在应用的 <strong>历史</strong> 页面逐条删除，或使用 <strong>全部删除</strong> 一次性删除。卸载应用会删除设备上的全部应用数据。您在 Google 云端硬盘或 iCloud 中创建的备份文件，请在相应服务中自行删除。</p>
<h2>6. 相关文件</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy?lang=zh" target="_blank" rel="noopener noreferrer">隐私政策</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms?lang=zh" target="_blank" rel="noopener noreferrer">服务条款</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO NOTHING;

-- account-deletion / es
INSERT INTO legal_documents (type, locale, title, content, version, is_published, published_at)
VALUES (
  'account-deletion', 'es',
  $title$Eliminación de cuenta y datos$title$,
  $body$<p>Esta página explica cómo eliminar tu cuenta y tus datos de la aplicación <strong>QR Scanner (QR 스캐너)</strong> para Android e iOS y del servicio scanview.app, operados por Cubion (큐비온).</p>
<ul>
<li><p>Nombre de la aplicación: QR Scanner (QR 스캐너)</p>
</li>
<li><p>Desarrollador: Cubion (큐비온)</p>
</li>
<li><p>Contacto: <a href="mailto:support@scanview.app" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
</ul>
<h2>1. Eliminar la cuenta desde la aplicación</h2>
<ol>
<li><p>Abre la aplicación y ve a la pestaña <strong>Configuración</strong> en la parte inferior.</p>
</li>
<li><p>Toca la <strong>tarjeta de perfil</strong> (con tu nombre) en la parte superior para abrir <strong>Configuración de cuenta</strong>.</p>
</li>
<li><p>En <strong>Zona de peligro</strong>, toca <strong>Eliminar cuenta</strong>.</p>
</li>
<li><p>Toca <strong>Confirmar</strong>. La cuenta se elimina y se cierra la sesión automáticamente.</p>
</li>
</ol>
<h2>2. Solicitar la eliminación por correo electrónico (sin la aplicación)</h2>
<ul>
<li><p>Para: <a href="mailto:support@scanview.app?subject=%5BAccount%20Deletion%20Request%5D%20QR%20Scanner" target="_blank" rel="noopener noreferrer">support@scanview.app</a></p>
</li>
<li><p>Asunto: <strong>[Account Deletion Request] QR Scanner</strong></p>
</li>
<li><p>Mensaje: la dirección de correo con la que te registraste, el método de registro (correo, Google o Apple) y que deseas eliminar tu cuenta</p>
</li>
<li><p>Para verificar tu identidad, envía el mensaje <strong>desde la dirección de correo registrada</strong>. Si escribes desde otra dirección, podemos pedirte una verificación adicional.</p>
</li>
</ul>
<p>Tras verificar tu identidad responderemos en un plazo de 7 días hábiles y completaremos la eliminación como máximo 30 días después de tu solicitud.</p>
<h2>3. Datos que se eliminan</h2>
<ul>
<li><p><strong>Información de la cuenta:</strong> correo electrónico, nombre (apodo), contraseña (hash), URL de la foto de perfil, vínculos de inicio de sesión con Google/Apple, fechas de registro y de último inicio de sesión</p>
</li>
<li><p><strong>Datos de inicio de sesión:</strong> tokens de autenticación, identificadores de dispositivo y registros de restablecimiento de contraseña</p>
</li>
<li><p><strong>Datos de sincronización en tiempo real:</strong> las sesiones que creaste (nombre, visibilidad, contraseña y otros ajustes) y los valores y horas de escaneo enviados a ellas</p>
</li>
<li><p><strong>Registros de desbloqueo de funciones</strong></p>
</li>
</ul>
<p>Al eliminar la cuenta, el inicio de sesión se bloquea y los tokens de todos los dispositivos se eliminan de inmediato. El resto de los datos se elimina de forma permanente del servidor <strong>en un plazo de 30 días</strong> y no se puede recuperar. Una sesión pública puede seguir abriéndose desde su enlace hasta su eliminación definitiva; para ocultarla de inmediato, elimínala o hazla privada antes de eliminar la cuenta en <strong>Configuración → Sincronización en tiempo real</strong> o en el panel de scanview.app.</p>
<h2>4. Datos que se conservan</h2>
<p>Pasados 30 días desde la eliminación, ninguno de los datos anteriores permanece en nuestro servidor. Solo si una ley nos obliga a conservar cierta información la guardaremos por separado y durante el plazo que dicha ley establezca. Los datos de análisis de uso (Firebase Analytics) están asociados a la instalación de la aplicación, no a tu cuenta, y se eliminan automáticamente al vencer el plazo de conservación configurado en Firebase. Desactiva <strong>Configuración → Información y soporte → Consentimiento de análisis</strong> para dejar de recopilarlos.</p>
<h2>5. Datos guardados en tu dispositivo</h2>
<p>El historial de escaneos, los códigos creados, las fotos de escaneo y los ajustes se guardan <strong>solo en tu dispositivo</strong>, por lo que eliminar la cuenta no los borra. Puedes borrarlos uno a uno en la pantalla <strong>Historial</strong> de la aplicación o todos a la vez con <strong>Eliminar todo</strong>. Al desinstalar la aplicación se eliminan todos sus datos del dispositivo. Las copias de seguridad que hayas creado en Google Drive o iCloud están en tu propio almacenamiento; elimínalas desde esos servicios.</p>
<h2>6. Documentos relacionados</h2>
<ul>
<li><p><a href="https://scanview.app/legal/privacy?lang=es" target="_blank" rel="noopener noreferrer">Política de privacidad</a></p>
</li>
<li><p><a href="https://scanview.app/legal/terms?lang=es" target="_blank" rel="noopener noreferrer">Términos del servicio</a></p>
</li>
</ul>$body$,
  '1.0', true, TIMESTAMPTZ '2026-10-16 00:00:00+09'
)
ON CONFLICT (type, locale) DO NOTHING;

COMMIT;

-- ============================================
-- 8-1. 크론 실행 기록 (scripts/migrate-cron-runs-2026-10-18.sql)
-- ============================================
CREATE TABLE IF NOT EXISTS cron_runs (
    id BIGSERIAL PRIMARY KEY,
    job VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ok BOOLEAN NOT NULL,
    details JSONB,
    error TEXT
);
CREATE INDEX IF NOT EXISTS idx_cron_runs_job_started ON cron_runs(job, started_at DESC);

-- ============================================
-- 8-2. 세션 비밀번호 시도 기록 (scripts/migrate-password-attempts-2026-10-18.sql)
-- ============================================
CREATE TABLE IF NOT EXISTS session_password_attempts (
    key VARCHAR(320) PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_password_attempts_reset ON session_password_attempts(reset_at);

-- ============================================
-- 9. Supabase Data API 잠금 (scripts/supabase-lockdown.sql) - 반드시 마지막
-- ============================================

-- Supabase Data API(PostgREST) 차단: public 스키마의 모든 테이블에 RLS 켜기
--
-- 왜 필요한가: Supabase 는 public 스키마 테이블을 anon 키로 REST 조회할 수 있게 노출한다.
--   웹 화면에는 Realtime 구독용으로 NEXT_PUBLIC_SUPABASE_ANON_KEY 가 공개되므로,
--   RLS 가 꺼져 있으면 누구나 users(비밀번호 해시·이메일), scan_data 등을 읽고 쓸 수 있다.
--   이 앱은 DB 를 서버(DATABASE_URL, 테이블 소유자 postgres)로만 접근하므로 정책 없이 RLS 만 켜면
--   anon/authenticated 역할은 아무것도 못 하고, 서버 쿼리는 영향이 없다(소유자는 RLS 우회).
--
-- 여러 번 실행해도 안전하다. 새 테이블을 만들면 다시 실행한다.
-- 실행: psql "$SUPABASE_DIRECT_URL" -f scripts/supabase-lockdown.sql

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t.tablename);
  END LOOP;
END $$;

-- 시퀀스도 막는다
DO $$
DECLARE
  s record;
BEGIN
  FOR s IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM anon, authenticated', s.sequence_name);
  END LOOP;
END $$;

-- 확인: rowsecurity 가 모두 true 여야 한다
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
