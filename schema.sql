-- QR Scanner Web - Oracle Database Schema

-- 세션 테이블
CREATE TABLE sessions (
    session_id VARCHAR2(255) PRIMARY KEY,
    socket_id VARCHAR2(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR2(50) DEFAULT 'ACTIVE',
    deleted_at TIMESTAMP DEFAULT NULL
);

-- 기존 테이블에 deleted_at 컬럼 추가 (마이그레이션용)
-- ALTER TABLE sessions ADD deleted_at TIMESTAMP DEFAULT NULL;

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
