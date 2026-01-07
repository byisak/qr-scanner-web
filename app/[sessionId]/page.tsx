import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ sessionId: string }>;
}

// 짧은 URL (/{sessionId})을 세션 페이지로 리다이렉트
export default async function ShortUrlRedirect({ params }: Props) {
  const { sessionId } = await params;

  // 예약된 경로는 리다이렉트하지 않음
  const reservedPaths = ['dashboard', 'session', 'api', 'login', 'register', 'blog', 'en', 'ko'];
  if (reservedPaths.includes(sessionId)) {
    return null;
  }

  redirect(`/session/${sessionId}`);
}
