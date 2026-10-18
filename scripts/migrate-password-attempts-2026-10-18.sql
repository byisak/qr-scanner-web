-- 세션 비밀번호 시도 기록 (2026-10-18). Vercel 은 요청마다 인스턴스가 달라 메모리 제한이 안 먹히므로 DB에 둔다.
-- key: "ip:<IP>:<세션ID>" (IP별) 또는 "session:<세션ID>" (세션 전체, 여러 IP 분산 대입 방지)
-- 다시 실행해도 안전 (IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS session_password_attempts (
    key VARCHAR(320) PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_password_attempts_reset ON session_password_attempts(reset_at);

ALTER TABLE public.session_password_attempts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.session_password_attempts FROM anon, authenticated;
  END IF;
END $$;

SELECT COUNT(*) AS session_password_attempts FROM session_password_attempts;
