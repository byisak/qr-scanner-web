import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'ko'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: locale === 'ko' ? 'Asia/Seoul' : 'UTC',
    now: new Date()
  };
});
