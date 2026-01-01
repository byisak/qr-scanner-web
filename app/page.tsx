"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { QrCode, Loader2 } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <QrCode className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold mb-2">QR Scanner Web</CardTitle>
          <CardDescription className="text-lg">
            실시간 바코드 스캔 데이터 모니터링
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              모바일 앱에서 스캔한 바코드 데이터를 실시간으로 확인하세요.
            </p>

            {isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {user?.name || user?.email}님, 환영합니다!
                </p>
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    대시보드로 이동
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    로그인
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    회원가입
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-semibold text-lg">사용 방법</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium mb-1">URL 직접 접속</h4>
                <p className="text-xs text-muted-foreground">
                  앱에서 공유된 세션 URL로 바로 접속 (로그인 불필요)
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium mb-1">로그인 후 대시보드</h4>
                <p className="text-xs text-muted-foreground">
                  내가 생성한 모든 세션을 한눈에 관리
                </p>
              </div>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="text-center pt-4">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
                세션 ID로 직접 접속하기
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
