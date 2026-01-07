import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // Supported locales
  locales: ['en', 'ko'],

  // Default locale (English)
  defaultLocale: 'en',

  // Never show locale in URL
  localePrefix: 'never'
});

// Navigation APIs that consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
