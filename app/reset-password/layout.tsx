import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { pretendard, themeColor } from '@/lib/fonts';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor,
};

export const metadata: Metadata = {
  title: 'Reset Password - QR Scanner',
  description: 'Reset your QR Scanner account password',
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={pretendard.variable} suppressHydrationWarning>
      <head>
        {/* ThemeProvider 가 없는 화면: 저장된 테마(next-themes 'theme') 또는 시스템 설정을 따라 어두운 모드 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
