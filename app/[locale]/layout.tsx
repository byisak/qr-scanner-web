import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { FontSizeProvider } from '@/components/font-size-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Toaster } from '@/components/ui/sonner';
import { pretendard, themeColor } from '@/lib/fonts';

// 키보드 사용자를 위한 "본문으로 바로가기" (번역 키를 늘리지 않으려고 여기서 바로 고름)
const SKIP_LINK: Record<string, string> = {
  ko: '본문으로 바로가기',
  en: 'Skip to main content',
  ja: 'メインコンテンツへ移動',
  zh: '跳到主要内容',
  es: 'Saltar al contenido principal',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor,
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

  return (
    <html lang={locale} className={pretendard.variable} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-background"
        >
          {SKIP_LINK[locale] ?? SKIP_LINK.en}
        </a>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <SettingsProvider>
                <FontSizeProvider>
                  {children}
                  <Toaster position="bottom-center" />
                </FontSizeProvider>
              </SettingsProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
