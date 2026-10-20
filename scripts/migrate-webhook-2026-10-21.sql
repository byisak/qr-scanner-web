-- 세션 스캔을 외부 주소(구글 시트 Apps Script 등)로 보내기 (2026-10-21)
-- 다시 실행해도 안전 (IF NOT EXISTS).
ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(64);
ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS webhook_last_status VARCHAR(120);
ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS webhook_last_at TIMESTAMP;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'session_settings' AND column_name LIKE 'webhook%';
