'use client';

import { useSocket } from '@/hooks/use-socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { scans, isConnected } = useSocket(sessionId);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">세션: {sessionId}</CardTitle>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? '연결됨' : '연결 끊김'}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              총 스캔 수: <span className="font-bold">{scans.length}</span>
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">번호</TableHead>
                <TableHead>바코드 값</TableHead>
                <TableHead>스캔 시간</TableHead>
                <TableHead className="text-right">저장 시간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    스캔된 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                scans.map((scan, index) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono">{scan.code}</TableCell>
                    <TableCell>
                      {new Date(scan.scan_timestamp).toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(scan.createdAt).toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
