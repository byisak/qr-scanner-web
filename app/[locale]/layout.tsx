import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, IBM_Plex_Sans_KR } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// 한국어용 - IBM의 프로페셔널한 폰트
const ibmPlexSansKR = IBM_Plex_Sans_KR({
  variable: '--font-ibm-plex-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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

  // Use Korean font for Korean locale
  const fontVariable =
    locale === 'ko'
      ? `${ibmPlexSansKR.variable} ${geistMono.variable}`
      : `${geistSans.variable} ${geistMono.variable}`;

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
