import type { Metadata, Viewport } from 'next';
import {
  Inter,
  IBM_Plex_Sans_KR,
  Zen_Kaku_Gothic_New,
  Noto_Sans_SC,
  JetBrains_Mono
} from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Toaster } from '@/components/ui/sonner';

// 영어/스페인어용 - 모던하고 깔끔한 산세리프
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// 한국어용 - IBM의 프로페셔널한 폰트
const ibmPlexSansKR = IBM_Plex_Sans_KR({
  variable: '--font-ibm-plex-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// 일본어용 - 모던하고 세련된 고딕체
const zenKakuGothic = Zen_Kaku_Gothic_New({
  variable: '--font-zen-kaku',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

// 중국어용 - 범용적이고 안정적인 폰트
const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sc',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

// 모노스페이스 - 코드/데이터 표시용
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e293b',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://scanview.app'),
  title: {
    default: 'QR Scanner Pro - Professional QR Code Barcode Scanner App',
    template: '%s | QR Scanner Pro',
  },
  description: 'Professional QR code barcode scanner for inventory management, logistics, and warehouse operations. Bulk scanning, real-time PC transfer, CSV export.',
  applicationName: 'QR Scanner Pro',
  authors: [{ name: 'ScanView', url: 'https://scanview.app' }],
  creator: 'ScanView',
  publisher: 'ScanView',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scanview.app',
    siteName: 'QR Scanner Pro',
  },
  twitter: {
    card: 'summary_large_image',
  },
  category: 'business',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  // 언어별 최적화된 폰트 적용
  const getFontVariables = () => {
    const mono = jetbrainsMono.variable;
    switch (locale) {
      case 'ko':
        return `${ibmPlexSansKR.variable} ${mono}`;
      case 'ja':
        return `${zenKakuGothic.variable} ${mono}`;
      case 'zh':
        return `${notoSansSC.variable} ${mono}`;
      default: // en, es 등 라틴 언어
        return `${inter.variable} ${mono}`;
    }
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${getFontVariables()} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
