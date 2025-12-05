'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Session } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('세션 목록 로드 실패:', err);
    }
  };

  const viewSession = (sessionId: string) => {
    router.push(`/session/${sessionId}`);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">활성 세션 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              활성 세션이 없습니다. 앱에서 세션을 생성하세요.
            </p>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Card key={session.session_id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-semibold">{session.session_id}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          스캔 수: {session.scan_count} | 생성: {new Date(session.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <Button onClick={() => viewSession(session.session_id)}>
                        보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
