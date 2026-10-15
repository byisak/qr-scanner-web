// 법적 고지 문서(legal_documents) 공통 상수
// 새 문서 종류를 추가할 때는 여기만 고치면 공개 API·공개 페이지·관리자 API·관리자 화면에 함께 반영된다.

export const LEGAL_DOCUMENT_TYPES = ['terms', 'privacy', 'account-deletion'] as const;
export type LegalDocumentType = (typeof LEGAL_DOCUMENT_TYPES)[number];

export const LEGAL_LOCALES = ['ko', 'en', 'ja', 'zh', 'es'] as const;

export function isLegalDocumentType(value: string): value is LegalDocumentType {
  return (LEGAL_DOCUMENT_TYPES as readonly string[]).includes(value);
}

// 문서가 아직 없을 때 쓰는 기본 제목
const DEFAULT_TITLES: Record<LegalDocumentType, { ko: string; en: string }> = {
  terms: { ko: '서비스 이용약관', en: 'Terms of Service' },
  privacy: { ko: '개인정보 처리방침', en: 'Privacy Policy' },
  'account-deletion': { ko: '계정 및 데이터 삭제 안내', en: 'Account & Data Deletion' },
};

export function getDefaultLegalTitle(type: LegalDocumentType, locale: string): string {
  return locale === 'ko' ? DEFAULT_TITLES[type].ko : DEFAULT_TITLES[type].en;
}
