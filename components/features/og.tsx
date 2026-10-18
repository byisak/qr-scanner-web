import { ImageResponse } from 'next/og'

// 기능 소개 공유 이미지 (1200×630). 그래파이트 색, 큰 제목 하나.
// 한글은 기본 글꼴에 없어서 Google Fonts 에서 쓰는 글자만 받아 온다 (실패하면 영어로)
export const OG_SIZE = { width: 1200, height: 630 }

async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@800&text=${encodeURIComponent(text)}`)
    ).text()
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
    if (!url) return null
    return await (await fetch(url)).arrayBuffer()
  } catch {
    return null
  }
}

export async function renderFeatureOg(opts: { eyebrow: string; title: string; summary: string; path: string }) {
  const text = `QR Scanner Pro${opts.eyebrow}${opts.title}${opts.summary}${opts.path}`
  const font = await loadFont(text)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f4f4f5',
          padding: 72,
          fontFamily: font ? 'NotoSansKR' : undefined,
          color: '#18181b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 22, border: '4px solid #fafafa', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>QR Scanner Pro</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#71717a' }}>{opts.eyebrow}</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>{opts.title}</div>
          <div style={{ fontSize: 32, color: '#52525b', lineHeight: 1.4, maxWidth: 980 }}>{opts.summary}</div>
        </div>
        <div style={{ fontSize: 26, color: '#71717a' }}>{opts.path}</div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: font ? [{ name: 'NotoSansKR', data: font, weight: 800, style: 'normal' }] : undefined,
    }
  )
}
