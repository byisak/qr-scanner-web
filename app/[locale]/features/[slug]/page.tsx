import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { ArrowLeft, ArrowRight, CircleAlert } from 'lucide-react'

import { SiteHeader, SiteFooter } from '@/components/site-header'
import { FeatureNav } from '@/components/features/feature-nav'
import { Shot } from '@/components/features/frames'
import { getFeaturesLocale, listFeatures, FEATURE_SLUGS, type FeatureSlug } from '@/content/features'

export function generateStaticParams() {
  return FEATURE_SLUGS.map((slug) => ({ slug }))
}

function isSlug(s: string): s is FeatureSlug {
  return (FEATURE_SLUGS as readonly string[]).includes(s)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { data, locale } = getFeaturesLocale(await getLocale())
  const f = isSlug(slug) ? data.features[slug] : undefined
  if (!f) return {}
  const title = `${f.title} · ${data.meta.title}`
  const image = `https://scanview.app/api/og/features/${slug}?lang=${locale}`
  return {
    title,
    description: f.summary,
    alternates: { canonical: `https://scanview.app/features/${slug}` },
    openGraph: { title, description: f.summary, url: `https://scanview.app/features/${slug}`, type: 'article', images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description: f.summary, images: [image] },
  }
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const { data, isFallback } = getFeaturesLocale(locale)
  if (!isSlug(slug)) notFound()
  const f = data.features[slug]
  if (!f) notFound()

  const all = listFeatures(data)
  const idx = all.findIndex((i) => i.slug === slug)
  const prev = idx > 0 ? all[idx - 1] : null
  const next = idx < all.length - 1 ? all[idx + 1] : null

  const toc = [
    { id: 'how-to', label: data.ui.howTo, show: f.steps.length > 0 },
    { id: 'settings', label: data.ui.settings, show: f.settings.length > 0 },
    { id: 'notes', label: data.ui.notes, show: f.notes.length > 0 },
    { id: 'faq', label: data.ui.faq, show: f.faq.length > 0 },
    { id: 'related', label: data.ui.related, show: f.related.length > 0 },
  ].filter((t) => t.show)

  const faqJsonLd = f.faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: f.faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
      }
    : null

  return (
    <>
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }} />
      )}
      <SiteHeader active="features" />
      <main id="main" className="page grid gap-8 pb-16 pt-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:pt-10 xl:grid-cols-[220px_minmax(0,1fr)_180px]">
        <aside className="min-w-0">
          <FeatureNav data={data} current={slug} />
        </aside>

        <article className="min-w-0 max-w-3xl">
          {isFallback && (
            <p role="note" className="mb-6 flex items-start gap-2 rounded-field bg-secondary p-3 text-13 text-muted-foreground">
              <CircleAlert className="mt-[2px] size-4 shrink-0" aria-hidden="true" />
              {data.ui.fallbackNotice}
            </p>
          )}
          <p className="text-13 font-bold text-muted-foreground">{data.groups[f.group].title}</p>
          <h1 className="mt-2 type-h1">{f.title}</h1>
          <p className="mt-3 type-lead">{f.lead}</p>

          {f.screenshots.length > 0 && (
            <div className={f.screenshots.some((s) => s.frame === 'browser') ? 'mt-8 grid gap-6' : 'mt-8 grid gap-6 sm:grid-cols-2'}>
              {f.screenshots.map((s, i) => (
                <Shot key={s.file} shot={s} locale={locale} priority={i === 0} />
              ))}
            </div>
          )}

          {f.steps.length > 0 && (
            <section id="how-to" aria-labelledby="how-to-title" className="mt-12 scroll-mt-24">
              <h2 id="how-to-title" className="type-h2">{data.ui.howTo}</h2>
              <ol className="mt-5 grid gap-3">
                {f.steps.map((s, i) => (
                  <li key={i} className="flex gap-4 rounded-card border bg-card p-5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-13 font-bold tabular" aria-hidden="true">{i + 1}</span>
                    <div className="min-w-0">
                      <h3 className="type-h3">{s.title}</h3>
                      {s.body && <p className="mt-1 type-body text-muted-foreground">{s.body}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {f.settings.length > 0 && (
            <section id="settings" aria-labelledby="settings-title" className="mt-12 scroll-mt-24">
              <h2 id="settings-title" className="type-h2">{data.ui.settings}</h2>
              <div className="mt-5 overflow-x-auto rounded-card border bg-card">
                <table className="w-full min-w-[420px] text-15">
                  <thead className="bg-muted text-left text-13 text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">{data.ui.settingName}</th>
                      <th scope="col" className="px-5 py-3 font-semibold">{data.ui.settingValue}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.settings.map((s) => (
                      <tr key={s.name} className="border-t align-top">
                        <th scope="row" className="px-5 py-3 text-left font-semibold">{s.name}</th>
                        <td className="px-5 py-3 text-muted-foreground">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {f.notes.length > 0 && (
            <section id="notes" aria-labelledby="notes-title" className="mt-12 scroll-mt-24">
              <h2 id="notes-title" className="type-h2">{data.ui.notes}</h2>
              <ul className="mt-5 grid list-disc gap-2 pl-5 type-body text-muted-foreground">
                {f.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </section>
          )}

          {f.faq.length > 0 && (
            <section id="faq" aria-labelledby="faq-title" className="mt-12 scroll-mt-24">
              <h2 id="faq-title" className="type-h2">{data.ui.faq}</h2>
              <dl className="mt-5 divide-y rounded-card border bg-card">
                {f.faq.map((q) => (
                  <div key={q.q} className="p-5">
                    <dt className="type-h3">{q.q}</dt>
                    <dd className="mt-1.5 type-body text-muted-foreground">{q.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {f.related.length > 0 && (
            <section id="related" aria-labelledby="related-title" className="mt-12 scroll-mt-24">
              <h2 id="related-title" className="type-h2">{data.ui.related}</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {f.related.map((r) => {
                  const rc = data.features[r]
                  if (!rc) return null
                  return (
                    <li key={r}>
                      <Link href={`/features/${r}`} className="lift block h-full rounded-card border bg-card p-5">
                        <span className="type-h3">{rc.title}</span>
                        <span className="mt-1 block type-body text-muted-foreground">{rc.summary}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <nav aria-label={data.ui.navTitle} className="mt-14 grid gap-3 border-t pt-8 sm:grid-cols-2">
            {prev ? (
              <Link href={`/features/${prev.slug}`} className="rounded-card border bg-card p-4 hover:bg-secondary">
                <span className="flex items-center gap-1 text-13 text-muted-foreground"><ArrowLeft className="size-4" aria-hidden="true" />{data.ui.prev}</span>
                <span className="mt-1 block font-semibold">{prev.content.title}</span>
              </Link>
            ) : <span />}
            {next && (
              <Link href={`/features/${next.slug}`} className="rounded-card border bg-card p-4 text-right hover:bg-secondary">
                <span className="flex items-center justify-end gap-1 text-13 text-muted-foreground">{data.ui.next}<ArrowRight className="size-4" aria-hidden="true" /></span>
                <span className="mt-1 block font-semibold">{next.content.title}</span>
              </Link>
            )}
          </nav>
        </article>

        {/* 이 페이지 목차 (넓은 화면) */}
        <aside className="hidden xl:block">
          <nav aria-label={data.ui.onThisPage} className="sticky top-[92px]">
            <p className="text-13 font-bold text-muted-foreground">{data.ui.onThisPage}</p>
            <ul className="mt-3 grid gap-2 text-13">
              {toc.map((t) => (
                <li key={t.id}><a href={`#${t.id}`} className="text-muted-foreground hover:text-foreground">{t.label}</a></li>
              ))}
            </ul>
          </nav>
        </aside>
      </main>
      <SiteFooter />
    </>
  )
}
