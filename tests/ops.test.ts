// 관제실 Ops Contract v1 라우트: DB 풀을 가짜로 바꿔 인증·형식 확인
import { afterEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  query: vi.fn(),
  getConnection: vi.fn(),
}));
vi.mock('@/lib/db', () => db);

const req = (auth?: string) =>
  new Request('https://scanview.test/api/ops/summary', { headers: auth ? { authorization: auth } : {} });

afterEach(() => {
  delete process.env.OPS_TOKEN;
  vi.clearAllMocks();
});

describe('health', () => {
  it('DB 정상이면 200 ok, no-store', async () => {
    const release = vi.fn();
    db.getConnection.mockResolvedValue({ query: vi.fn().mockResolvedValue({ rows: [] }), release });
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.checks[0]).toMatchObject({ name: 'db', ok: true });
    expect(release).toHaveBeenCalled();
  });

  it('DB 실패면 503 down, 오류 문구 노출 없음', async () => {
    db.getConnection.mockRejectedValue(new Error('connect ECONNREFUSED secret-host'));
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(JSON.parse(text).status).toBe('down');
    expect(text).not.toContain('secret-host');
  });
});

describe('ops summary', () => {
  it('토큰 미설정 503, 없거나 틀리면 401, 맞으면 계약 형식', async () => {
    db.query.mockResolvedValue({
      rows: [{ signups: '3', active_users: '10', scans: '42', sessions_new: '5', ad_unlocks: '2', deleted_users: '0' }],
    });
    const { GET } = await import('@/app/api/ops/summary/route');
    expect((await GET(req('Bearer x'))).status).toBe(503);
    process.env.OPS_TOKEN = 't0ken';
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req('Bearer wrong'))).status).toBe(401);
    expect(db.query).not.toHaveBeenCalled();

    const ok = await GET(req('Bearer t0ken'));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('cache-control')).toBe('no-store');
    expect(await ok.json()).toMatchObject({
      contract: 'ops/v1',
      service: 'scanview',
      kpi: { signups: 3, active_users: 10, scans: 42, sessions_new: 5, ad_unlocks: 2, deleted_users: 0 },
    });
    expect(db.query.mock.calls[0][1][0]).toBeInstanceOf(Date);
  });

  it('DB 오류면 500, 내부 문구 노출 없음', async () => {
    process.env.OPS_TOKEN = 't0ken';
    db.query.mockRejectedValue(new Error('relation secret_table does not exist'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { GET } = await import('@/app/api/ops/summary/route');
    const res = await GET(req('Bearer t0ken'));
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain('secret_table');
  });
});
