// app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans_KR } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing'; // 이것만 import

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSansKR = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'QR Scanner Web',
  description: 'Real-time barcode scan data monitoring',
};

export function generateStaticParams() {
  console.log('generateStaticParams 호출됨');
  return routing.locales.map((locale) => ({ locale })); // routing.locales 사용
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  console.log('=== RootLayout 실행 ===');
  console.log('locale:', locale);
  console.log('locales:', routing.locales); // routing.locales 사용

  // locale이 유효한지 확인
  if (!routing.locales.includes(locale as any)) {
    // routing.locales 사용
    console.log('유효하지 않은 locale, 404 반환');
    notFound();
  }

  console.log('메시지 로드 시작');
  const messages = await getMessages();
  console.log('메시지 로드 완료');

  const fontVariable =
    locale === 'ko'
      ? `${notoSansKR.variable} ${geistMono.variable}`
      : `${geistSans.variable} ${geistMono.variable}`;

  console.log('===================');

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fontVariable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
