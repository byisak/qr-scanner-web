import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  ...routing,
  // Disable browser language detection - always use cookie or default
  localeDetection: false
});

export default function middleware(request: NextRequest) {
  // Check for saved locale cookie
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;

  // If no cookie is set and it's a first-time visit, the defaultLocale (en) will be used
  // If cookie is set, next-intl will use it
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - _vercel (Vercel internals)
  // - Static files (files with extensions)
  // - reset-password (password reset page - no locale needed)
  matcher: [
    '/((?!api|_next|_vercel|reset-password|.*\\..*).*)'
  ]
};
