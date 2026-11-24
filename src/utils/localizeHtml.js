// Erzeugt beim Build aus der fertigen HTML-Datei eine Sprachfassung (z. B. index.en.html),
// deren Head schon ohne JavaScript stimmt: <html lang>, <title>, Description, Canonical,
// og:* und twitter:*. nginx liefert sie für ?lang=en aus, damit Crawler ohne JavaScript
// Englisch sehen. Arbeitet bewusst auf dem String (kein DOM im Node-Build) und bricht ab,
// wenn ein erwartetes Tag fehlt oder doppelt vorkommt: lieber ein roter Build als ein
// falscher Head.

/**
 * @typedef {object} LocalizedHead
 * @property {string} lang Wert für `<html lang>`, z. B. `en`.
 * @property {string} title
 * @property {string} description
 * @property {string} canonical Absolute kanonische URL dieser Sprachfassung.
 * @property {Array<{hreflang: string, href: string}>} [alternates] Optional: hreflang-Ziele,
 *   z. B. für eine Unterseite (/app/). Jedes genannte hreflang muss genau einmal vorkommen.
 */

/** @type {Record<string, string>} */
const ESCAPES = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;',
}

/**
 * Maskiert Text für HTML-Attribute und Elementinhalt.
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return value.replace(/[&"<>]/g, (ch) => ESCAPES[ch] ?? ch)
}

/** @param {string} value */
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Setzt `attr` in genau dem Tag, das `tagPattern` trifft.
 * `required`: das Tag muss genau einmal vorkommen; sonst höchstens einmal.
 * @param {string} html
 * @param {RegExp} tagPattern
 * @param {string} attr
 * @param {string} value
 * @param {boolean} required
 * @param {string} label
 * @returns {string}
 */
function setTagAttr(html, tagPattern, attr, value, required, label) {
  const matches = html.match(new RegExp(tagPattern.source, 'gi')) ?? []
  if (matches.length > 1 || (required && matches.length === 0)) {
    throw new Error(`localizeHtml: ${label} kommt ${matches.length}× vor, erwartet genau 1×`)
  }
  const tag = matches[0]
  if (tag === undefined) return html

  const attrPattern = new RegExp(`(\\s${escapeRegExp(attr)}=)"[^"]*"`, 'i')
  if (!attrPattern.test(tag)) {
    throw new Error(`localizeHtml: ${label} hat kein Attribut ${attr}="…"`)
  }
  const replaced = tag.replace(attrPattern, (_m, prefix) => `${prefix}"${escapeHtml(value)}"`)
  return html.replace(tag, () => replaced)
}

/**
 * `<meta name="…">` bzw. `<meta property="…">` (beide Schreibweisen kommen vor).
 * @param {string} name
 */
const metaTag = (name) =>
  new RegExp(`<meta\\b[^>]*\\s(?:name|property)="${escapeRegExp(name)}"[^>]*>`)

/**
 * Liefert `html` mit dem Head für `head.lang`. Pflicht: `<html lang>`, `<title>`,
 * meta description und canonical. og:* und twitter:title/description werden angepasst,
 * wenn vorhanden. hreflang-Links ändern sich nur mit `head.alternates`; der Body bleibt unverändert.
 * @param {string} html
 * @param {LocalizedHead} head
 * @returns {string}
 */
export function localizeHtml(html, head) {
  // Nur bis </head> bearbeiten: <title> in einem SVG im Body darf nicht getroffen werden.
  const headEnd = html.search(/<\/head>/i)
  if (headEnd < 0) throw new Error('localizeHtml: </head> fehlt')
  const rest = html.slice(headEnd)

  let out = setTagAttr(html.slice(0, headEnd), /<html\b[^>]*>/, 'lang', head.lang, true, '<html>')

  const titles = out.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) ?? []
  const title = titles[0]
  if (titles.length !== 1 || title === undefined) {
    throw new Error(`localizeHtml: <title> kommt ${titles.length}× vor, erwartet genau 1×`)
  }
  out = out.replace(title, () => `<title>${escapeHtml(head.title)}</title>`)

  out = setTagAttr(
    out,
    metaTag('description'),
    'content',
    head.description,
    true,
    'meta description',
  )
  out = setTagAttr(
    out,
    /<link\b[^>]*\srel="canonical"[^>]*>/,
    'href',
    head.canonical,
    true,
    'link canonical',
  )

  const english = head.lang === 'en'
  /** @type {Array<[string, string]>} */
  const optional = [
    ['og:title', head.title],
    ['og:description', head.description],
    ['og:url', head.canonical],
    ['og:locale', english ? 'en_US' : 'de_DE'],
    ['og:locale:alternate', english ? 'de_DE' : 'en_US'],
    ['twitter:title', head.title],
    ['twitter:description', head.description],
    ['twitter:url', head.canonical],
  ]
  for (const [name, value] of optional) {
    out = setTagAttr(out, metaTag(name), 'content', value, false, `meta ${name}`)
  }
  for (const { hreflang, href } of head.alternates ?? []) {
    out = setTagAttr(
      out,
      new RegExp(`<link\\b[^>]*\\shreflang="${escapeRegExp(hreflang)}"[^>]*>`),
      'href',
      href,
      true,
      `link hreflang=${hreflang}`,
    )
  }
  return out + rest
}
