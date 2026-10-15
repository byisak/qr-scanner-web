-- 탈퇴한 회원의 남은 데이터를 영구 삭제
--
-- 왜 필요한가: 회원 탈퇴 API(app/api/auth/withdraw)는 지금 아래만 한다.
--   - refresh_tokens 삭제
--   - users.deleted_at 설정(soft delete) → 이메일·이름·프로필 사진 주소·소셜 ID 행은 남음
--   - sessions.user_id 를 NULL 로 변경 → 세션과 스캔 데이터(scan_data)는 남음(공개 세션은 링크로 계속 열림)
--   - user_ad_records 는 그대로 남음
-- 계정 삭제 안내(/legal/account-deletion)와 개인정보 처리방침은 "탈퇴 후 30일 이내 영구 삭제"라고 안내하므로,
-- 이 스크립트를 최소 월 1회 실행하거나 탈퇴 API가 바로 지우도록 고쳐야 문서와 실제가 일치한다.
-- 이메일로 삭제 요청을 받은 경우: 관리자 화면에서 해당 회원을 삭제(soft delete)한 뒤 이 스크립트를 실행한다.
--
-- 대상: deleted_at 이 설정된 일반 회원(role = 'user'). 관리자 계정은 제외한다.
-- 실행: psql "$DATABASE_URL" -f scripts/purge-withdrawn-users.sql
-- 미리 보기만 하려면 맨 끝의 COMMIT 을 ROLLBACK 으로 바꿔 실행한다.

BEGIN;

CREATE TEMP TABLE purge_users ON COMMIT DROP AS
  SELECT id FROM users
  WHERE deleted_at IS NOT NULL
    AND COALESCE(role, 'user') = 'user';

-- 지울 세션
--  1) 아직 user_id 로 연결된 세션
--  2) 탈퇴 API가 user_id 를 NULL 로 바꾼 세션 중, 탈퇴자의 스캔이 들어 있고 다른(남아 있는) 회원의 스캔은 없는 세션
CREATE TEMP TABLE purge_sessions ON COMMIT DROP AS
  SELECT s.session_id FROM sessions s
  WHERE s.user_id IN (SELECT id FROM purge_users)
  UNION
  SELECT s.session_id FROM sessions s
  WHERE s.user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM scan_data d
      WHERE d.session_id = s.session_id AND d.user_id IN (SELECT id FROM purge_users)
    )
    AND NOT EXISTS (
      SELECT 1 FROM scan_data d
      WHERE d.session_id = s.session_id
        AND d.user_id IS NOT NULL
        AND d.user_id NOT IN (SELECT id FROM purge_users)
    );

-- 미리 보기
SELECT
  (SELECT COUNT(*) FROM purge_users) AS users_to_delete,
  (SELECT COUNT(*) FROM purge_sessions) AS sessions_to_delete,
  (SELECT COUNT(*) FROM scan_data
     WHERE user_id IN (SELECT id FROM purge_users)
        OR session_id IN (SELECT session_id FROM purge_sessions)) AS scans_to_delete;

-- 탈퇴자가 다른 사람 세션에 보낸 스캔 포함
DELETE FROM scan_data
  WHERE user_id IN (SELECT id FROM purge_users)
     OR session_id IN (SELECT session_id FROM purge_sessions);
DELETE FROM session_settings WHERE session_id IN (SELECT session_id FROM purge_sessions);
DELETE FROM sessions WHERE session_id IN (SELECT session_id FROM purge_sessions);

-- FK CASCADE 가 운영 DB에 없을 수도 있어 명시적으로 지운다
DELETE FROM user_ad_records WHERE user_id IN (SELECT id FROM purge_users);
DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM purge_users);
DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM purge_users);

DELETE FROM users WHERE id IN (SELECT id FROM purge_users);

COMMIT;
