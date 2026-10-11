import { getConnection } from '@/lib/db';
import { healthResponse, timed } from '@/lib/ops-kit';

export const dynamic = 'force-dynamic';

// GET /api/health - 헬스체크 (인증 불필요, 민감 정보 노출 없음)
// 관제실 Ops Contract v1 형식: DB 실패 시 503 + status "down"
export async function GET() {
  const db = await timed('db', async () => {
    const client = await getConnection();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  });
  return healthResponse([db]);
}
