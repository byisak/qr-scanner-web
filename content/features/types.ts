// 기능 소개 페이지 내용의 모양. 언어별 파일(ko.ts, en.ts …)이 이 타입을 채운다.
// 빠진 항목은 타입 검사에서 걸리도록 필수로 둔다.

export const FEATURE_GROUPS = ['scan', 'organize', 'work', 'create', 'secure', 'web'] as const;
export type FeatureGroup = (typeof FEATURE_GROUPS)[number];

// 페이지 순서 = 왼쪽 목록 순서 = 이전·다음 순서
export const FEATURE_SLUGS = [
  'continuous-scan',
  'multi-code',
  'image-scan',
  'scan-area',
  'hardware-keys',
  'history',
  'scan-rules',
  'stocktake',
  'live-pc-sync',
  'export',
  'generator',
  'pin-lock',
  'web-session',
] as const;
export type FeatureSlug = (typeof FEATURE_SLUGS)[number];

export interface Screenshot {
  // public/features/<언어>/ 아래 파일 이름 (예: continuous-scan-1.webp)
  file: string;
  alt: string;
  // 앱 화면(phone) 또는 웹 화면(browser)
  frame: 'phone' | 'browser';
}

export interface FeatureContent {
  group: FeatureGroup;
  title: string;
  // 목록·카드에 쓰는 한 줄
  summary: string;
  // 상세 페이지 첫 문단 (1~2문장)
  lead: string;
  steps: { title: string; body: string }[];
  settings: { name: string; value: string }[];
  // 알아둘 점 (한계도 그대로)
  notes: string[];
  faq: { q: string; a: string }[];
  related: FeatureSlug[];
  screenshots: Screenshot[];
  // 개요 페이지 대표 기능 여부
  highlight?: boolean;
}

export interface FeaturesLocale {
  meta: { title: string; description: string };
  ui: {
    navTitle: string;
    onThisPage: string;
    howTo: string;
    settings: string;
    settingName: string;
    settingValue: string;
    notes: string;
    faq: string;
    related: string;
    prev: string;
    next: string;
    allFeatures: string;
    fallbackNotice: string;
    heroTitle: string;
    heroLead: string;
    groupsTitle: string;
    highlightsTitle: string;
    learnMore: string;
    useCasesTitle: string;
    faqTitle: string;
    ctaTitle: string;
    ctaLead: string;
    appStore: string;
    googlePlay: string;
    menu: string;
  };
  groups: Record<FeatureGroup, { title: string; description: string }>;
  features: Partial<Record<FeatureSlug, FeatureContent>>;
  faq: { q: string; a: string }[];
}
