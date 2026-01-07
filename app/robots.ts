import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/session/'], // 세션 페이지와 API는 검색에서 제외
      },
      {
        userAgent: 'GPTBot', // ChatGPT 크롤러
        allow: '/',
      },
      {
        userAgent: 'Google-Extended', // Google AI (Bard/Gemini)
        allow: '/',
      },
      {
        userAgent: 'anthropic-ai', // Claude 크롤러
        allow: '/',
      },
      {
        userAgent: 'CCBot', // Common Crawl (AI 학습용)
        allow: '/',
      },
    ],
    sitemap: 'https://scanview.app/sitemap.xml',
  }
}
