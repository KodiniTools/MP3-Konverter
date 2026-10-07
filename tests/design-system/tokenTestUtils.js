/**
 * Hilfsfunktionen für die Token-Tests: CSS-Blöcke parsen, JSON-Tokens einsammeln,
 * WCAG-Kontrast berechnen. Portierung von KodiniTools/Collage-Maker
 * (src/design-system/__tests__/tokenTestUtils.ts). Keine Testdatei (kein .spec-Suffix).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const normalize = (value) => value.replace(/\s+/g, ' ').trim()

export function readRelative(baseUrl, relative) {
  return readFileSync(fileURLToPath(new URL(relative, baseUrl)), 'utf8')
}

/**
 * Liest alle Custom Properties eines Blocks mit exakt diesem Selektor(-Anfang).
 * Der Selektor muss am Zeilenanfang stehen; eine Selektorliste wird über ihren ersten Eintrag gefunden.
 * @returns {Record<string, string>}
 */
export function parseBlock(css, selector, fileName = 'CSS') {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = withoutComments.match(new RegExp(`(^|\\n)${escaped}[^{]*\\{([^}]*)\\}`))
  if (!match) throw new Error(`Block "${selector}" nicht in ${fileName} gefunden`)

  const declarations = {}
  for (const [, name, value] of (match[2] ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    declarations[name] = normalize(value)
  }
  return declarations
}

/** Sammelt alle Token-Blätter ($value) aus einem Token-JSON mit ihrem Pfad. */
export function collectTokens(node, path = []) {
  if (typeof node !== 'object' || node === null) return []
  if ('$value' in node) {
    return [{ path: path.join('.'), value: String(node.$value), cssVar: node.$extensions?.css }]
  }
  return Object.entries(node)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => collectTokens(child, [...path, key]))
}

/** Relative Leuchtdichte nach WCAG 2.x für #rrggbb. */
export function relativeLuminance(hex) {
  const digits = hex.trim().match(/^#([0-9a-f]{6})$/i)?.[1]
  if (digits === undefined) throw new Error(`Kein #rrggbb-Wert: ${hex}`)
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const value = parseInt(digits.slice(offset, offset + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG-Kontrastverhältnis zweier #rrggbb-Farben (1 bis 21). */
export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const [lighter, darker] = a > b ? [a, b] : [b, a]
  return (lighter + 0.05) / (darker + 0.05)
}
