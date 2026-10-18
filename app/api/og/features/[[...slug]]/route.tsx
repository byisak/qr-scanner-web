// GET /api/og/features[/<slug>]?lang=ko - 기능 소개 공유 이미지 (1200×630 PNG)
// 페이지 주소에 언어가 없어서(localePrefix: never) 언어를 쿼리로 받는다
import { getFeaturesLocale, FEATURE_SLUGS, type FeatureSlug } from '@/content/features'
import { renderFeatureOg } from '@/components/features/og'

export async function GET(request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const lang = new URL(request.url).searchParams.get('lang') || 'en'
  const { data } = getFeaturesLocale(lang)
  const s = slug?.[0]
  const f = s && (FEATURE_SLUGS as readonly string[]).includes(s) ? data.features[s as FeatureSlug] : undefined
  const res = await renderFeatureOg(
    f
      ? { eyebrow: data.groups[f.group].title, title: f.title, summary: f.summary, path: `scanview.app/features/${s}` }
      : { eyebrow: data.meta.title, title: data.ui.heroTitle, summary: data.meta.description, path: 'scanview.app/features' }
  )
  res.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800')
  return res
}
