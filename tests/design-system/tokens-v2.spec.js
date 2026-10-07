/**
 * Tokens v2 (aus dem Collage Maker übernommen) und die Kontrast-Erweiterung des MP3 Konverters.
 * Portierung von KodiniTools/Collage-Maker (src/design-system/__tests__/tokens-v2.spec.ts),
 * ergänzt um die Kontrast-Themes und die Einbindung über src/main.js.
 */
import { describe, expect, it } from 'vitest'
import tokens from '../../src/design-system/tokens-v2.json'
import {
  breakpointsV2,
  colorCssVarV2,
  colorTokenV2,
  controlSizesV2,
  cssVarV2,
  themeColorsV2
} from '../../src/design-system/tokens-v2'
import { collectTokens, contrastRatio, normalize, parseBlock, readRelative } from './tokenTestUtils'

const base = import.meta.url
const v2Css = readRelative(base, '../../src/design-system/tokens-v2.css')
const contrastCss = readRelative(base, '../../src/design-system/tokens-contrast.css')
const mainJs = readRelative(base, '../../src/main.js')

const rootBlock = parseBlock(v2Css, ':root', 'tokens-v2.css')
const lightBlock = parseBlock(v2Css, '.light-theme', 'tokens-v2.css')
const dataThemeLightBlock = parseBlock(v2Css, ":root[data-theme='light']", 'tokens-v2.css')
const contrastLightBlock = parseBlock(contrastCss, ":root[data-theme='contrast-light']", 'tokens-contrast.css')
const contrastDarkBlock = parseBlock(contrastCss, ":root[data-theme='contrast-dark']", 'tokens-contrast.css')
const allTokens = collectTokens(tokens)
const withCss = allTokens.filter((token) => token.cssVar !== undefined)

const THEMES = ['dark', 'light']
const TEXT_TOKENS = ['text', 'text2', 'text3']
const SURFACE_TOKENS = ['surface0', 'surface1', 'surface2']
const STATUS_TOKENS = ['success', 'warning', 'danger', 'info', 'link']
const AA = 4.5
const AAA = 7
const NON_TEXT = 3

/** Farbkarte eines Kontrast-Themes: Basis-Theme plus Überschreibungen aus tokens-contrast.css. */
function contrastColors(baseTheme, block) {
  const colors = { ...themeColorsV2(baseTheme) }
  for (const key of Object.keys(colors)) {
    const value = block[colorCssVarV2(key)]
    if (value !== undefined) colors[key] = value
  }
  return colors
}
const CONTRAST_THEMES = {
  'contrast-light': contrastColors('light', contrastLightBlock),
  'contrast-dark': contrastColors('dark', contrastDarkBlock)
}

describe('tokens-v2.json ↔ tokens-v2.css', () => {
  it('definiert jedes Token mit CSS-Variable im passenden Block mit identischem Wert', () => {
    expect(withCss.length).toBeGreaterThan(80)
    const mismatches = withCss.flatMap((token) => {
      const block = token.path.includes('light') ? lightBlock : rootBlock
      const actual = block[token.cssVar]
      const expected = normalize(token.value)
      return actual === expected ? [] : [`${token.path} (${token.cssVar}): css=${actual} json=${expected}`]
    })
    expect(mismatches).toEqual([])
  })

  it('hat in :root keine Variable ohne JSON-Eintrag', () => {
    const declared = new Set(withCss.map((token) => token.cssVar))
    expect(Object.keys(rootBlock).filter((variable) => !declared.has(variable))).toEqual([])
  })

  it('hat für Dark und Light dieselben Farb- und Effekt-Tokens', () => {
    expect(Object.keys(tokens.color.light).sort()).toEqual(Object.keys(tokens.color.dark).sort())
    expect(Object.keys(tokens.effect.light).sort()).toEqual(Object.keys(tokens.effect.dark).sort())
  })

  it('spiegelt html[data-theme=light] vollständig aus .light-theme', () => {
    expect(dataThemeLightBlock).toEqual(lightBlock)
  })

  it('deklariert Composite-Tokens mit var(--ds-…) auch in .light-theme', () => {
    const composites = Object.entries(rootBlock).filter(([, value]) => value.includes('var(--ds-'))
    expect(composites.length).toBeGreaterThan(0)
    expect(composites.filter(([variable]) => lightBlock[variable] === undefined).map(([v]) => v)).toEqual([])
  })
})

describe('Kontrast-Erweiterung (tokens-contrast.css)', () => {
  it('nutzt nur bekannte --ds-* Variablen', () => {
    const unknown = [...Object.keys(contrastLightBlock), ...Object.keys(contrastDarkBlock)].filter(
      (variable) => rootBlock[variable] === undefined
    )
    expect(unknown).toEqual([])
  })

  it('deklariert in Hell · Kontrast den vollständigen Farb- und Effektsatz (die Basis :root ist dunkel)', () => {
    expect(Object.keys(contrastLightBlock).sort()).toEqual(Object.keys(lightBlock).sort())
  })

  it('setzt Composite-Tokens mit var() in beiden Kontrast-Blöcken erneut', () => {
    expect(contrastLightBlock['--ds-focus-ring']).toContain('var(--ds-')
    expect(contrastDarkBlock['--ds-focus-ring']).toContain('var(--ds-')
  })

  it('gewinnt auch gegen ein fremdes body.light-theme (zweiter Selektor)', () => {
    expect(contrastCss).toMatch(/:root\[data-theme='contrast-light'\],\s*\n:root\[data-theme='contrast-light'\] \.light-theme \{/)
  })

  it.each(Object.keys(CONTRAST_THEMES))('%s: Text 1–3, Status und Link ≥ 7:1 auf Fläche 0–2', (theme) => {
    const colors = CONTRAST_THEMES[theme]
    const failures = [...TEXT_TOKENS, ...STATUS_TOKENS].flatMap((text) =>
      SURFACE_TOKENS.flatMap((surface) => {
        const ratio = contrastRatio(colors[text], colors[surface])
        return ratio >= AAA ? [] : [`${text} auf ${surface}: ${ratio.toFixed(2)}`]
      })
    )
    expect(failures).toEqual([])
  })

  it.each(Object.keys(CONTRAST_THEMES))('%s: Text auf Akzent und Akzent-Hover ≥ 7:1', (theme) => {
    const colors = CONTRAST_THEMES[theme]
    expect(contrastRatio(colors.onAccent, colors.accent)).toBeGreaterThanOrEqual(AAA)
    expect(contrastRatio(colors.onAccent, colors.accentHover)).toBeGreaterThanOrEqual(AAA)
  })

  it.each(Object.keys(CONTRAST_THEMES))('%s: Rahmen und Akzent ≥ 3:1 zu Fläche 0–2', (theme) => {
    const colors = CONTRAST_THEMES[theme]
    const failures = ['border', 'borderStrong', 'accent'].flatMap((token) =>
      SURFACE_TOKENS.flatMap((surface) => {
        const ratio = contrastRatio(colors[token], colors[surface])
        return ratio >= NON_TEXT ? [] : [`${token} auf ${surface}: ${ratio.toFixed(2)}`]
      })
    )
    expect(failures).toEqual([])
  })
})

describe('Namespace und Einbindung', () => {
  it('nutzt ausschließlich --ds-* Variablen', () => {
    const variables = [...Object.keys(rootBlock), ...Object.keys(lightBlock)]
    expect(variables.filter((variable) => !variable.startsWith('--ds-'))).toEqual([])
  })

  it('lädt Tokens, Kontrast-Erweiterung und Styles in dieser Reihenfolge in src/main.js', () => {
    const tokensIndex = mainJs.indexOf("import './design-system/tokens-v2.css'")
    const contrastIndex = mainJs.indexOf("import './design-system/tokens-contrast.css'")
    const stylesIndex = mainJs.indexOf("import './assets/styles/main.scss'")
    expect(tokensIndex).toBeGreaterThanOrEqual(0)
    expect(contrastIndex).toBeGreaterThan(tokensIndex)
    expect(stylesIndex).toBeGreaterThan(contrastIndex)
  })
})

describe('Kontrast (WCAG AA, mindestens 4.5:1) der Standard-Themes', () => {
  it.each(THEMES)('%s: Text 1–3 auf Fläche 0–2', (theme) => {
    const colors = themeColorsV2(theme)
    const failures = TEXT_TOKENS.flatMap((text) =>
      SURFACE_TOKENS.flatMap((surface) => {
        const ratio = contrastRatio(colors[text], colors[surface])
        return ratio >= AA ? [] : [`${text} auf ${surface}: ${ratio.toFixed(2)}`]
      })
    )
    expect(failures).toEqual([])
  })

  it.each(THEMES)('%s: Text auf Akzent und Akzent-Hover', (theme) => {
    const colors = themeColorsV2(theme)
    expect(contrastRatio(colors.onAccent, colors.accent)).toBeGreaterThanOrEqual(AA)
    expect(contrastRatio(colors.onAccent, colors.accentHover)).toBeGreaterThanOrEqual(AA)
  })

  it.each(THEMES)('%s: Status- und Linkfarben als Text auf Panel', (theme) => {
    const colors = themeColorsV2(theme)
    const failures = STATUS_TOKENS.flatMap((status) => {
      const ratio = contrastRatio(colors[status], colors.surface1)
      return ratio >= AA ? [] : [`${status} auf surface1: ${ratio.toFixed(2)}`]
    })
    expect(failures).toEqual([])
  })
})

describe('tokens-v2.js', () => {
  it('liefert Farbwerte, Variablennamen und var()-Ausdrücke', () => {
    expect(colorTokenV2('dark', 'accent')).toBe('#d4a257')
    expect(colorTokenV2('light', 'accent')).toBe('#c9984d')
    expect(colorCssVarV2('text2')).toBe('--ds-text-2')
    expect(cssVarV2('text2')).toBe('var(--ds-text-2)')
    expect(cssVarV2('surface1', '#111d33')).toBe('var(--ds-surface-1, #111d33)')
  })

  it('liefert eine flache Farbkarte je Theme', () => {
    expect(Object.keys(themeColorsV2('dark'))).toEqual(Object.keys(tokens.color.dark))
    expect(themeColorsV2('light').surface0).toBe('#f6f5f1')
  })

  it('wirft bei unbekannten Tokens und Themes', () => {
    expect(() => colorTokenV2('sepia', 'accent')).toThrow()
    expect(() => colorCssVarV2('gibtsnicht')).toThrow()
    expect(() => themeColorsV2('sepia')).toThrow()
  })

  it('liefert Größen und Breakpoints als Zahlen', () => {
    expect(controlSizesV2).toEqual({ sm: 28, md: 36, lg: 40, row: 44 })
    expect(breakpointsV2).toEqual({ phone: 480, tablet: 768, desktop: 1024 })
  })
})
