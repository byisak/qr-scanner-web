-- 실시간 채널 키(realtime_key) 추가 + 스캔 값 길이 확대
--
-- 왜 필요한가: Vercel + Supabase로 옮기면 웹 화면은 Supabase Realtime Broadcast 채널
--   scans:{sessionId}:{realtimeKey} 로 새 스캔을 받는다. 세션 ID만 아는 사람이 채널을 엿듣지 못하도록
--   세션마다 추측 불가능한 키를 두고, 열람 권한이 확인된 사람에게만 세션 조회 API로 돌려준다.
--   (docs/REALTIME_REST_CONTRACT.md 3절)
-- 스캔 값: REST 계약상 최대 4096자. 기존 컬럼은 VARCHAR(1000)이라 넓힌다(축소가 아니므로 데이터 영향 없음).
--
-- 여러 번 실행해도 안전하다(idempotent). PostgreSQL 13+ (gen_random_uuid 내장) 필요.
-- 실행: psql "$DATABASE_URL" -f scripts/migrate-realtime-key.sql
-- 순서: 이 SQL을 먼저 실행한 뒤 새 코드를 배포한다 (새 코드는 realtime_key 컬럼을 읽고 쓴다).

BEGIN;

ALTER TABLE session_settings ADD COLUMN IF NOT EXISTS realtime_key VARCHAR(64);

-- 64자리 16진수(약 244비트 난수). pgcrypto 확장 없이 동작하도록 gen_random_uuid() 두 개를 이어 붙인다.
ALTER TABLE session_settings
  ALTER COLUMN realtime_key
  SET DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

-- 기존 설정 행 백필
UPDATE session_settings
SET realtime_key = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE realtime_key IS NULL;

-- 설정 행이 없는 옛 세션에도 행을 만들어 키를 준다 (없을 때의 기본값과 같은 공개/비밀번호 없음 상태)
INSERT INTO session_settings (session_id, realtime_key)
SELECT s.session_id, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
FROM sessions s
LEFT JOIN session_settings ss ON ss.session_id = s.session_id
WHERE ss.session_id IS NULL
ON CONFLICT (session_id) DO NOTHING;

-- 스캔 값 최대 길이 1000 → 4096 (이미 넓으면 그대로)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scan_data' AND column_name = 'code'
      AND character_maximum_length IS NOT NULL AND character_maximum_length < 4096
  ) THEN
    ALTER TABLE scan_data ALTER COLUMN code TYPE VARCHAR(4096);
  END IF;
END $$;

COMMIT;
