// 약관 HTML 정화: 관리자 편집기(Tiptap)가 만드는 태그만 남기고 스크립트·이벤트 속성은 지운다.
// 관리자 계정이 털려도 공개 약관 페이지에 스크립트를 심을 수 없게, 저장할 때와 내보낼 때 모두 거친다.
import sanitizeHtml from 'sanitize-html';

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'span', 'a',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    '*': ['style'],
  },
  allowedStyles: {
    '*': {
      'text-align': [/^(left|right|center|justify)$/],
      'font-family': [/^[\w\s,"'-]+$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    // 새 창 링크는 opener를 끊는다
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === '_blank'
        ? { ...attribs, rel: 'noopener noreferrer' }
        : attribs,
    }),
  },
};

export function sanitizeLegalHtml(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, OPTIONS);
}
