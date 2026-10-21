-- 3단계 (2026-10-21): 계정 품목 마스터 + 여러 명이 함께 하는 재고 실사
-- 다시 실행해도 안전 (IF NOT EXISTS).

-- 계정별 품목 마스터. code_key 는 앱과 같은 규칙 (숫자만이면 앞자리 0 제거, 아니면 대문자)
CREATE TABLE IF NOT EXISTS item_master (
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_key VARCHAR(256) NOT NULL,
    code VARCHAR(256) NOT NULL,
    name VARCHAR(300) NOT NULL,
    spec VARCHAR(300) NOT NULL DEFAULT '',
    unit VARCHAR(50) NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT '',
    location VARCHAR(100) NOT NULL DEFAULT '',
    alt_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    memo TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, code_key)
);

-- 공유 실사: 만든 사람이 참여 코드(6자리)를 나눠 주면 다른 계정이 함께 스캔한다
CREATE TABLE IF NOT EXISTS shared_stocktakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    join_code CHAR(6) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS shared_stocktake_items (
    stocktake_id UUID NOT NULL REFERENCES shared_stocktakes(id) ON DELETE CASCADE,
    code_key VARCHAR(256) NOT NULL,
    code VARCHAR(256) NOT NULL,
    name VARCHAR(300) NOT NULL DEFAULT '',
    expected INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (stocktake_id, code_key)
);

-- 스캔은 덮어쓰지 않고 쌓는다 (여럿이 동시에 찍어도 합계가 꼬이지 않게). 수량 고치기는 +/- 기록.
-- client_id 로 같은 기록이 두 번 들어오지 않게 한다 (오프라인 재전송)
CREATE TABLE IF NOT EXISTS shared_stocktake_scans (
    id BIGSERIAL PRIMARY KEY,
    stocktake_id UUID NOT NULL REFERENCES shared_stocktakes(id) ON DELETE CASCADE,
    client_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    code VARCHAR(4096) NOT NULL,
    code_key VARCHAR(256) NOT NULL,
    qty INTEGER NOT NULL,
    scanned_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (stocktake_id, client_id)
);
CREATE INDEX IF NOT EXISTS idx_shared_stocktake_scans_key ON shared_stocktake_scans(stocktake_id, code_key);

CREATE TABLE IF NOT EXISTS shared_stocktake_members (
    stocktake_id UUID NOT NULL REFERENCES shared_stocktakes(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (stocktake_id, user_id)
);

-- 서버(API)만 쓴다: 브라우저용 anon 키로는 못 읽게
ALTER TABLE public.item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_stocktakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_stocktake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_stocktake_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_stocktake_members ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.item_master, public.shared_stocktakes, public.shared_stocktake_items,
      public.shared_stocktake_scans, public.shared_stocktake_members FROM anon, authenticated;
  END IF;
END $$;

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('item_master', 'shared_stocktakes', 'shared_stocktake_items', 'shared_stocktake_scans', 'shared_stocktake_members')
ORDER BY table_name;
