// 언어별 기능 소개 내용을 고른다. 아직 번역이 없으면 영어, 영어도 없으면 한국어로 대신 보여 준다.
import type { FeatureContent, FeatureSlug, FeaturesLocale } from './types';
import { FEATURE_SLUGS } from './types';
import ko from './ko';
import en from './en';

const LOCALES: Record<string, FeaturesLocale | undefined> = { ko, en };
const FALLBACK_CHAIN = ['en', 'ko'];

export function getFeaturesLocale(locale: string): { data: FeaturesLocale; locale: string; isFallback: boolean } {
  for (const l of [locale, ...FALLBACK_CHAIN]) {
    const data = LOCALES[l];
    if (data) return { data, locale: l, isFallback: l !== locale };
  }
  return { data: ko, locale: 'ko', isFallback: locale !== 'ko' };
}

// 내용이 있는 기능만, 정해진 순서대로
export function listFeatures(data: FeaturesLocale): { slug: FeatureSlug; content: FeatureContent }[] {
  return FEATURE_SLUGS.flatMap((slug) => {
    const content = data.features[slug];
    return content ? [{ slug, content }] : [];
  });
}

export { FEATURE_SLUGS };
export type { FeatureSlug };
