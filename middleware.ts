import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware({
  ...routing,
  // Enable locale detection from cookie (NEXT_LOCALE)
  localeDetection: true
});

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
