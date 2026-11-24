// @vitest-environment node
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { escapeHtml, localizeHtml } from '../src/utils/localizeHtml.js'
import { PAGE_META, SITE_URL } from '../src/config/pageMeta.js'

// Prüft die englische Sprachfassung, die der Build als dist/index.en.html schreibt
// (nginx liefert sie für ?lang=en aus), gegen die echte index.html.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const DE = PAGE_META.de
const EN = PAGE_META.en
const DE_URL = SITE_URL
const EN_URL = `${DE_URL}?lang=en`

const unescape = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
const pick = (source, pattern) => unescape(source.match(pattern)?.[1] ?? '')
const headOf = (source) => source.slice(0, source.search(/<\/head>/i))
const title = (source) => pick(headOf(source), /<title[^>]*>([\s\S]*?)<\/title>/i)
const lang = (source) => pick(source, /<html\b[^>]*\slang="([^"]*)"/i)
const meta = (source, name) =>
  pick(
    headOf(source).match(new RegExp(`<meta\\b[^>]*\\s(?:name|property)="${name}"[^>]*>`, 'i'))?.[0] ??
      '',
    /\scontent="([^"]*)"/i,
  )
const canonical = (source) =>
  pick(headOf(source).match(/<link\b[^>]*\srel="canonical"[^>]*>/i)?.[0] ?? '', /\shref="([^"]*)"/i)
const hreflangs = (source) =>
  headOf(source).match(/<link\b[^>]*\shreflang="[^"]*"[^>]*>/gi) ?? []

const en = localizeHtml(html, { lang: 'en', ...EN, canonical: EN_URL })

test('englische Fassung: lang, Titel, Description und Canonical', () => {
  assert.equal(lang(en), 'en')
  assert.equal(title(en), EN.title)
  assert.equal(meta(en, 'description'), EN.description)
  assert.equal(canonical(en), EN_URL)
})

test('englische Fassung: Open Graph und Twitter folgen, soweit vorhanden', () => {
  for (const name of ['og:title', 'twitter:title']) {
    if (meta(html, name)) assert.equal(meta(en, name), EN.title)
  }
  for (const name of ['og:description', 'twitter:description']) {
    if (meta(html, name)) assert.equal(meta(en, name), EN.description)
  }
  for (const name of ['og:url', 'twitter:url']) {
    if (meta(html, name)) assert.equal(meta(en, name), EN_URL)
  }
  if (meta(html, 'og:locale')) assert.equal(meta(en, 'og:locale'), 'en_US')
})

test('hreflang, Body und SSI-Includes bleiben unverändert', () => {
  assert.equal(hreflangs(html).length, 3)
  assert.deepEqual(hreflangs(en), hreflangs(html))
  assert.equal(en.slice(en.search(/<\/head>/i)), html.slice(html.search(/<\/head>/i)))
  const includes = (source) => source.match(/<!--\s*#include [^>]*-->/g) ?? []
  assert.deepEqual(includes(en), includes(html))
})

test('deutscher Head der Quelldatei stimmt mit den Metadaten überein', () => {
  assert.equal(lang(html), 'de')
  assert.equal(title(html), DE.title)
  assert.equal(meta(html, 'description'), DE.description)
  assert.equal(canonical(html), DE_URL)
})

test('englische Metadaten halten die SEO-Längen ein', () => {
  assert.ok(EN.title.length <= 70, `Titel ${EN.title.length} Zeichen`)
  assert.ok(EN.description.length >= 100 && EN.description.length <= 165)
})

test('maskiert Sonderzeichen und bricht bei fehlenden oder doppelten Pflicht-Tags ab', () => {
  const minimal = (extra = '') =>
    `<!doctype html><html lang="de"><head><title>T</title>` +
    `<meta name="description" content="D"><link rel="canonical" href="${DE_URL}">${extra}` +
    `</head><body><svg><title>Icon</title></svg></body></html>`
  const head = { lang: 'en', title: 'A & "B" <C>', description: 'x > y & z', canonical: EN_URL }
  const out = localizeHtml(minimal(), head)
  assert.ok(out.includes('<title>A &amp; &quot;B&quot; &lt;C&gt;</title>'))
  assert.ok(out.includes('content="x &gt; y &amp; z"'))
  assert.ok(out.includes('<svg><title>Icon</title></svg>'))
  assert.equal(escapeHtml('$&'), '$&amp;')
  assert.throws(() => localizeHtml(minimal().replace(/<link[^>]*>/, ''), head), /canonical/)
  assert.throws(
    () => localizeHtml(minimal('<meta name="description" content="E">'), head),
    /description/,
  )
  assert.throws(() => localizeHtml('<html lang="de"><title>x</title>', head), /head/)
})

test('App-Seite (/app/): eigener Head und hreflang-Ziele, Body unverändert', async () => {
  const { APP_PAGE_META, APP_URL } = await import('../src/config/pageMeta.js')
  const { localeUrls } = await import('../src/utils/localeSeo.js')
  for (const locale of ['de', 'en']) {
    const { canonical: url, alternates } = localeUrls(APP_URL, locale)
    const out = localizeHtml(html, { lang: locale, ...APP_PAGE_META[locale], canonical: url, alternates })
    assert.equal(lang(out), locale)
    assert.equal(title(out), APP_PAGE_META[locale].title)
    assert.equal(canonical(out), url)
    assert.equal(meta(out, 'og:url'), url)
    const hrefs = hreflangs(out).map((tag) => tag.match(/\shref="([^"]*)"/)[1])
    assert.deepEqual(hrefs.sort(), [APP_URL, APP_URL, `${APP_URL}?lang=en`].sort())
    assert.equal(out.slice(out.search(/<\/head>/i)), html.slice(html.search(/<\/head>/i)))
    assert.ok(APP_PAGE_META[locale].title.length <= 70)
    assert.ok(APP_PAGE_META[locale].description.length >= 120 && APP_PAGE_META[locale].description.length <= 160)
  }
})

test('alternates: fehlendes hreflang bricht ab', () => {
  assert.throws(
    () => localizeHtml(html, { lang: 'en', ...EN, canonical: EN_URL, alternates: [{ hreflang: 'fr', href: 'x' }] }),
    /hreflang=fr/,
  )
})
