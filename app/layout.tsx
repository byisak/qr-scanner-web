import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e293b',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://scanview.app'),
  title: {
    default: 'QR Scanner Pro - 전문가용 QR코드 바코드 스캐너 앱',
    template: '%s | QR Scanner Pro',
  },
  description: '재고관리, 물류, 창고 업무에 최적화된 전문가용 QR코드 바코드 스캐너. 대량 스캔, 실시간 PC 전송, CSV 내보내기 지원.',
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
    locale: 'ko_KR',
    url: 'https://scanview.app',
    siteName: 'QR Scanner Pro',
  },
  twitter: {
    card: 'summary_large_image',
  },
  category: 'business',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
