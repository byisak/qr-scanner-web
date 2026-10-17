-- 크론 실행 기록 (2026-10-18). 관리 대시보드의 "운영 상태"와 "크론 이력"에서 읽는다.
-- 다시 실행해도 안전 (IF NOT EXISTS). 실행 후 Supabase Data API 잠금도 함께 적용한다.
CREATE TABLE IF NOT EXISTS cron_runs (
    id BIGSERIAL PRIMARY KEY,
    job VARCHAR(50) NOT NULL,             -- 예: cleanup
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ok BOOLEAN NOT NULL,
    details JSONB,                        -- 지운 건수 등
    error TEXT                            -- 실패 사유 (짧게)
);
CREATE INDEX IF NOT EXISTS idx_cron_runs_job_started ON cron_runs(job, started_at DESC);

-- Data API(anon/authenticated)로는 못 읽게 잠근다 (supabase-lockdown.sql 과 같은 방식)
ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.cron_runs FROM anon, authenticated;
    REVOKE ALL ON SEQUENCE public.cron_runs_id_seq FROM anon, authenticated;
  END IF;
END $$;

SELECT COUNT(*) AS cron_runs FROM cron_runs;
