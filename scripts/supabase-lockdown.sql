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
