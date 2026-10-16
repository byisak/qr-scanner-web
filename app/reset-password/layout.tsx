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
      <body className="min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}
