import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-2">QR Scanner Web</CardTitle>
          <CardDescription className="text-lg">
            실시간 바코드 스캔 데이터 모니터링
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              모바일 앱에서 스캔한 바코드 데이터를 실시간으로 확인하세요.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  대시보드로 이동
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 space-y-4 pt-6 border-t">
            <h3 className="font-semibold text-lg">사용 방법</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>모바일 앱에서 세션을 생성합니다</li>
              <li>웹 대시보드에서 생성된 세션을 확인합니다</li>
              <li>세션을 클릭하여 실시간 스캔 데이터를 모니터링합니다</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
