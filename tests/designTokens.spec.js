/**
 * Regressionsschutz für die Oberfläche auf den KodiniTools-Tokens v2.
 *
 * Nach dem Vorbild von KodiniTools/Collage-Maker (src/tests/designTokens.spec.ts), angepasst an den
 * MP3 Konverter (SCSS statt Tailwind): verhindert die Rückkehr der alten Navy/Gold-Variablen, fester
 * Farbwerte, von Verläufen, Unschärfe und Karten-Schatten; prüft, dass jede referenzierte --ds-*
 * Variable existiert, Supreme in allen genutzten Gewichten gebündelt wird und die Partial-Angleichung
 * des Collage Makers vorhanden ist.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseBlock } from './design-system/tokenTestUtils'

const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'src')
const styles = readFileSync(join(SRC, 'assets/styles/main.scss'), 'utf8')
const stylesNoComments = styles.replace(/\/\*[\s\S]*?\*\//g, '')
const tokensCss = readFileSync(join(SRC, 'design-system/tokens-v2.css'), 'utf8')
const rootBlock = parseBlock(tokensCss, ':root', 'tokens-v2.css')
// Ergänzung aus dem Playlist Generator (Tokens, die der Collage Maker noch nicht hat)
const pgTokensCss = readFileSync(join(SRC, 'design-system/tokens-playlist-generator.css'), 'utf8')
const pgRootBlock = parseBlock(pgTokensCss, ':root', 'tokens-playlist-generator.css')
const PG_TOKENS = [
  '--ds-accent-fill',
  '--ds-accent-fill-hover',
  '--ds-on-accent-fill',
  '--ds-heading-accent',
  '--ds-app-glow',
  '--ds-landing-glow',
  '--ds-card-gradient'
]

function collectFiles(dir, ext, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) collectFiles(full, ext, out)
    else if (entry.endsWith(ext)) out.push(full)
  }
  return out
}

/** Alle Zeilen (Datei:Zeile) in Vue-Dateien, die auf das Muster passen. */
function findInVueFiles(pattern) {
  return collectFiles(SRC, '.vue').flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, index) => (pattern.test(line) ? [`${relative(SRC, file)}:${index + 1}`] : []))
  )
}

const LEGACY_VARIABLES =
  /var\(--(?:primary-color|primary-hover|primary-solid|primary-dark|secondary-color|success-color|error-color|warning-color|background|background-secondary|surface|surface-tint|text-primary|text-secondary|border|border-strong|border-focus|on-primary|shadow-card|shadow-bar|radius|radius-lg|radius-pill|transition|font-main|font-heading|font-size-[a-z0-9]+|line-height-[a-z]+|letter-spacing-[a-z]+)\)/

describe('main.scss auf Tokens v2', () => {
  it('nutzt keine Variablen der alten Palette mehr', () => {
    expect(stylesNoComments.match(new RegExp(LEGACY_VARIABLES, 'g')) ?? []).toEqual([])
  })

  it('definiert keine eigenen Farb-Variablen (Tokens kommen aus src/design-system)', () => {
    expect(stylesNoComments.match(/^\s*--[\w-]+\s*:/gm) ?? []).toEqual([])
  })

  it('enthält keine festen Farbwerte (Hex, rgb(), hsl())', () => {
    expect(stylesNoComments.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g) ?? []).toEqual([])
  })

  it('referenziert nur --ds-* Variablen, die tokens-v2.css oder die Playlist-Generator-Ergänzung definiert', () => {
    const referenced = [...new Set([...stylesNoComments.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
    expect(referenced.length).toBeGreaterThan(40)
    expect(
      referenced.filter((variable) => rootBlock[variable] === undefined && pgRootBlock[variable] === undefined)
    ).toEqual([])
  })

  it('die Playlist-Generator-Ergänzung definiert nur fehlende Tokens, in jedem Theme vollständig', () => {
    expect(Object.keys(pgRootBlock).sort()).toEqual([...PG_TOKENS].sort())
    expect(PG_TOKENS.filter((token) => rootBlock[token] !== undefined)).toEqual([])
    for (const selector of ['.light-theme', ":root[data-theme='contrast-dark']"]) {
      const block = parseBlock(pgTokensCss, selector, 'tokens-playlist-generator.css')
      expect(Object.keys(block).sort()).toEqual([...PG_TOKENS].sort())
    }
  })

  it('Landingpage-Button und gefüllte Goldflächen wie im Playlist Generator (dunkles Gold, weiße Schrift)', () => {
    expect(pgRootBlock['--ds-accent-fill']).toBe('#8f6320')
    expect(pgRootBlock['--ds-on-accent-fill']).toBe('#ffffff')
    expect(styles).toMatch(/body \.landing-page \.hero-cta \{[^}]*background: var\(--ds-accent-fill\);[^}]*color: var\(--ds-on-accent-fill\);/)
    expect(styles).toMatch(/html body \.landing-page \*[^{]*\{[^}]*font-weight: var\(--ds-weight-regular\);/)
    expect(styles).toMatch(/body \.landing-page \{[^}]*background-image: var\(--ds-landing-glow\);/)
  })

  it('nutzt keine Verläufe, keine Unschärfe, kein color-mix und keine eigenen Schatten', () => {
    expect(stylesNoComments.match(/gradient\(|backdrop-filter|filter:\s*blur|color-mix\(/g) ?? []).toEqual([])
    const shadows = [...stylesNoComments.matchAll(/box-shadow:\s*([^;]+);/g)].map((m) => m[1].trim())
    expect(shadows.filter((value) => !['var(--ds-focus-ring)', 'var(--ds-shadow-overlay)', 'none'].includes(value))).toEqual([])
  })

  it('hebt oder skaliert bei Hover nichts (Hover ändert nur Farbe)', () => {
    const hoverBlocks = [...stylesNoComments.matchAll(/:hover[^{]*\{([^}]*)\}/g)].map((m) => m[1])
    expect(hoverBlocks.filter((block) => /transform|translate|scale/.test(block))).toEqual([])
  })

  it('nutzt nur die Token-Radien (oder 50 % für Slider-Daumen)', () => {
    const radii = [...stylesNoComments.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim())
    expect(radii.filter((value) => !/^(var\(--ds-radius-(sm|md|lg|full)\)( var\(--ds-radius-(sm|md|lg|full)\))*|50%)$/.test(value))).toEqual([])
  })

  it('setzt die Grundgröße des Body wie Collage Maker und Playlist Generator auf --ds-text-lg', () => {
    expect(styles).toMatch(/body \{[^}]*font-size: var\(--ds-text-lg\)/)
    expect(styles).toMatch(/body \{[^}]*font-family: var\(--ds-font-sans\)/)
  })

  it('setzt color-scheme für alle vier Themes', () => {
    expect(styles).toMatch(/:root\[data-theme='dark'\],\s*:root\[data-theme='contrast-dark'\] \{\s*color-scheme: dark;/)
    expect(styles).toMatch(/:root\[data-theme='light'\],\s*:root\[data-theme='contrast-light'\] \{\s*color-scheme: light;/)
  })
})

describe('UI-Schrift Supreme (gebündelt wie im Collage Maker)', () => {
  it('setzt als Schrift nur Supreme (--ds-font-sans) oder inherit, keine Monospace- oder Systemschrift', () => {
    const outsideFontFace = stylesNoComments.replace(/@font-face\s*{[^}]*}/g, '')
    const families = [...outsideFontFace.matchAll(/font-family:\s*([^;]+);/g)].map((m) => m[1].trim())
    expect(families.length).toBeGreaterThan(0)
    expect(families.filter((value) => !['var(--ds-font-sans)', 'inherit'].includes(value))).toEqual([])
    expect(outsideFontFace).not.toMatch(/--ds-font-mono/)
  })

  it.each([
    [400, 'Regular'],
    [500, 'Medium'],
    [700, 'Bold']
  ])('deklariert @font-face für Gewicht %i aus src/assets/fonts', (weight, cut) => {
    const faces = styles.match(/@font-face\s*{[^}]*}/g) ?? []
    const face = faces.find((f) => /font-family:\s*'Supreme'/.test(f) && new RegExp(`font-weight:\\s*${weight}\\b`).test(f))
    expect(face, `Kein @font-face für Supreme ${weight}`).toBeDefined()
    expect(face).toContain(`url('../fonts/Supreme-${cut}.woff2')`)
    expect(existsSync(join(SRC, `assets/fonts/Supreme-${cut}.woff2`))).toBe(true)
  })
})

describe('Partial-Angleichung aus dem Collage Maker', () => {
  it('macht Nav und Footer transparent, nimmt den Cookie-Banner aus', () => {
    expect(styles).toContain(
      "body > :not(#app):not(script):not(.cookie-banner):not(.cookie-consent):not([class*='cookie']) {\n  background-color: transparent !important;"
    )
  })

  it('gibt Dropdowns und dem geöffneten mobilen Menü eine feste Fläche', () => {
    expect(styles).toMatch(/\[class\*='drop'\],[\s\S]*?background-color: var\(--ds-surface-1\) !important;/)
    expect(styles).toMatch(/\.global-nav-links\.is-open \{\s*background-color: var\(--ds-surface-1\) !important;/)
  })

  it('färbt Texte, Links und Link-Hover der Partials aus den Tokens', () => {
    expect(styles).toMatch(/color: var\(--ds-text\) !important;/)
    expect(styles).toMatch(/color: var\(--ds-link\) !important;/)
    expect(styles).toMatch(/a:hover[^{]*\{\s*color: var\(--ds-accent\) !important;/)
  })

  it('nimmt Cookie-Elemente von den span/svg-Regeln aus (Schalter bleiben unterscheidbar)', () => {
    expect(styles).toMatch(/body > :not\(#app\):not\(script\):not\(\[class\*='cookie'\]\) span:empty \{/)
    expect(styles).not.toMatch(/body > :not\(#app\):not\(script\) span:empty \{/)
  })

  it('zeigt die aktive Sprache als Primärfläche', () => {
    expect(styles).toMatch(/\.global-nav-lang-btn\.active \{\s*background-color: var\(--ds-accent\) !important;\s*color: var\(--ds-on-accent\) !important;/)
  })

  it('hält den Cookie-Banner über Navigation und Dropdowns', () => {
    expect(styles).toMatch(/\.cookie-banner,[\s\S]*?z-index: 10000 !important;\s*position: fixed !important;/)
  })
})

describe('Vue-Komponenten', () => {
  it('haben keine eigenen Styles und keine Inline-Farben', () => {
    expect(findInVueFiles(/<style/)).toEqual([])
    expect(findInVueFiles(/style="[^"]*(?:#[0-9a-fA-F]{3,8}|rgb|color)/)).toEqual([])
  })

  it('setzen data-theme nicht mehr selbst (nur der Theme-Store auf <html>)', () => {
    expect(findInVueFiles(/:data-theme=/)).toEqual([])
  })
})
