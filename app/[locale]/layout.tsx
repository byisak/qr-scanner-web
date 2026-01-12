import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Toaster } from '@/components/ui/sonner';
import { LocaleSync } from '@/components/locale-sync';

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

  // 언어별 폰트 클래스
  const getFontClass = () => {
    switch (locale) {
      case 'ko': return 'font-pretendard';
      case 'ja': return 'font-noto-jp';
      case 'zh': return 'font-noto-sc';
      default: return 'font-inter'; // en, es
    }
  };

  // 언어별 CDN URL
  const getFontCDN = () => {
    switch (locale) {
      case 'ko':
        return 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';
      case 'ja':
        return 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap';
      case 'zh':
        return 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap';
      default: // en, es
        return 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    }
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* 언어별 폰트 CDN */}
        <link rel="stylesheet" href={getFontCDN()} />
      </head>
      <body className={`${getFontClass()} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <LocaleSync />
              {children}
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
