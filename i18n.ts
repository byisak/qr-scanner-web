import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { routing } from './i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // First try to get locale from cookie
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  // Use cookie locale if valid, otherwise use requestLocale or default
  let locale = cookieLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = await requestLocale;
  }

  // Final validation
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
