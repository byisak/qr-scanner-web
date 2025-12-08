// i18n.ts
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  console.log('=== i18n.ts ===');
  console.log('requestLocale:', locale);

  // locale이 유효한지 확인
  if (!locale || !routing.locales.includes(locale as any)) {
    console.log('유효하지 않은 locale, 기본값 사용');
    locale = routing.defaultLocale;
  }

  console.log('최종 locale:', locale);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
