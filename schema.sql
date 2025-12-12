-- QR Scanner Web - Oracle Database Schema

-- ============================================
-- 사용자 인증 테이블
-- ============================================

-- 사용자 테이블
CREATE TABLE users (
    id VARCHAR2(36) PRIMARY KEY,
    email VARCHAR2(255) NOT NULL UNIQUE,
    password_hash VARCHAR2(255),           -- 소셜 로그인은 NULL
    name VARCHAR2(100) NOT NULL,
    profile_image VARCHAR2(500),
    provider VARCHAR2(20) NOT NULL,        -- email, kakao, google, apple
    provider_id VARCHAR2(255),             -- 소셜 로그인 고유 ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP                   -- Soft delete
);

-- 리프레시 토큰 테이블
CREATE TABLE refresh_tokens (
    id VARCHAR2(36) PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    token VARCHAR2(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- 사용자 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_refresh_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);

-- ============================================
-- 세션 및 스캔 데이터 테이블
-- ============================================

-- 세션 테이블
CREATE TABLE sessions (
    session_id VARCHAR2(255) PRIMARY KEY,
    socket_id VARCHAR2(255),
    user_id VARCHAR2(36),                  -- 세션 소유자 (로그인 사용자)
    session_name VARCHAR2(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR2(50) DEFAULT 'ACTIVE',
    deleted_at TIMESTAMP DEFAULT NULL,
    CONSTRAINT fk_session_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- 기존 테이블에 deleted_at 컬럼 추가 (마이그레이션용)
-- ALTER TABLE sessions ADD deleted_at TIMESTAMP DEFAULT NULL;

-- 기존 테이블에 session_name 컬럼 추가 (마이그레이션용)
-- ALTER TABLE sessions ADD session_name VARCHAR2(255) DEFAULT NULL;

-- 기존 테이블에 user_id 컬럼 추가 (마이그레이션용)
-- ALTER TABLE sessions ADD user_id VARCHAR2(36) DEFAULT NULL;
-- ALTER TABLE sessions ADD CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 스캔 데이터 테이블
CREATE TABLE scan_data (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id VARCHAR2(255) NOT NULL,
    code VARCHAR2(1000) NOT NULL,
    scan_timestamp NUMBER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session
        FOREIGN KEY (session_id)
        REFERENCES sessions(session_id)
        ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_scan_session ON scan_data(session_id);
CREATE INDEX idx_scan_created ON scan_data(created_at DESC);
CREATE INDEX idx_session_activity ON sessions(last_activity DESC);

-- 시퀀스는 IDENTITY로 자동 생성되므로 별도 생성 불필요

COMMIT;
