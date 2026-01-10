-- QR Scanner Web - PostgreSQL Database Schema

-- ============================================
-- 사용자 인증 테이블
-- ============================================

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),           -- 소셜 로그인은 NULL
    name VARCHAR(100) NOT NULL,
    profile_image VARCHAR(500),
    provider VARCHAR(20) NOT NULL,        -- email, kakao, google, apple
    provider_id VARCHAR(255),             -- 소셜 로그인 고유 ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP                   -- Soft delete
);

-- 리프레시 토큰 테이블
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- 비밀번호 재설정 토큰 테이블
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP DEFAULT NULL,              -- 사용된 시간 (NULL이면 미사용)
    CONSTRAINT fk_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- 사용자 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_expires ON password_reset_tokens(expires_at);

-- ============================================
-- 세션 및 스캔 데이터 테이블
-- ============================================

-- 세션 테이블
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    socket_id VARCHAR(255),
    user_id VARCHAR(36),                  -- 세션 소유자 (로그인 사용자)
    session_name VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    deleted_at TIMESTAMP DEFAULT NULL,
    CONSTRAINT fk_session_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- 기존 테이블에 deleted_at 컬럼 추가 (마이그레이션용)
-- ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- 기존 테이블에 session_name 컬럼 추가 (마이그레이션용)
-- ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_name VARCHAR(255) DEFAULT NULL;

-- 기존 테이블에 user_id 컬럼 추가 (마이그레이션용)
-- ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) DEFAULT NULL;
-- ALTER TABLE sessions ADD CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 스캔 데이터 테이블
CREATE TABLE IF NOT EXISTS scan_data (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(36),                  -- 스캔을 전송한 사용자
    code VARCHAR(1000) NOT NULL,
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

-- 기존 테이블에 user_id 컬럼 추가 (마이그레이션용)
-- ALTER TABLE scan_data ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);
-- ALTER TABLE scan_data ADD CONSTRAINT fk_scan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_scan_session ON scan_data(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_user ON scan_data(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_created ON scan_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_activity ON sessions(last_activity DESC);

-- ============================================
-- 세션 설정 테이블
-- ============================================

-- 세션 설정 테이블 (비밀번호, 공개여부 등)
CREATE TABLE IF NOT EXISTS session_settings (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),              -- 비밀번호 (해시)
    is_public BOOLEAN DEFAULT true,          -- 공개 여부
    access_code VARCHAR(20),                 -- 짧은 접근 코드 (예: ABC123)
    max_participants INTEGER DEFAULT NULL,   -- 최대 참가자 수
    allow_anonymous BOOLEAN DEFAULT true,    -- 비로그인 참가 허용
    expires_at TIMESTAMP DEFAULT NULL,       -- 만료 시간
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_settings
        FOREIGN KEY (session_id)
        REFERENCES sessions(session_id)
        ON DELETE CASCADE
);

-- 세션 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_session_settings_session ON session_settings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_settings_access_code ON session_settings(access_code);
CREATE INDEX IF NOT EXISTS idx_session_settings_public ON session_settings(is_public);
