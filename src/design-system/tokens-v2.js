/**
 * Tokens v2: Zugriff auf tokens-v2.json für JavaScript.
 * CSS-Namespace --ds-*, Laufzeit-Quelle tokens-v2.css. Portierung von
 * KodiniTools/Collage-Maker (src/design-system/tokens-v2.ts) nach JS.
 */
import tokens from './tokens-v2.json'

/** @typedef {'dark' | 'light'} ThemeName */

/** Die kompletten v2-Tokens, Struktur siehe tokens-v2.json. */
export const designTokensV2 = tokens

/**
 * Farbwert eines v2-Tokens für ein Theme, z. B. colorTokenV2('dark', 'accent') → '#d4a257'.
 * @param {ThemeName} theme
 * @param {string} name
 * @returns {string}
 */
export function colorTokenV2(theme, name) {
  const token = tokens.color[theme]?.[name]
  if (!token) throw new Error(`Unbekanntes Farb-Token: ${theme}.${name}`)
  return token.$value
}

/**
 * Flache Farbkarte eines Themes, z. B. für Kontrastprüfungen.
 * @param {ThemeName} theme
 * @returns {Readonly<Record<string, string>>}
 */
export function themeColorsV2(theme) {
  const source = tokens.color[theme]
  if (!source) throw new Error(`Unbekanntes Theme: ${theme}`)
  return Object.freeze(Object.fromEntries(Object.entries(source).map(([key, token]) => [key, token.$value])))
}

/**
 * CSS-Variablenname eines v2-Farb-Tokens, z. B. colorCssVarV2('accent') → '--ds-accent'.
 * @param {string} name
 */
export function colorCssVarV2(name) {
  const token = tokens.color.dark[name]
  if (!token) throw new Error(`Unbekanntes Farb-Token: ${name}`)
  return token.$extensions.css
}

/**
 * var()-Ausdruck mit optionalem Fallback: cssVarV2('text2') → 'var(--ds-text-2)'.
 * @param {string} name
 * @param {string} [fallback]
 */
export function cssVarV2(name, fallback) {
  const variable = colorCssVarV2(name)
  return fallback === undefined ? `var(${variable})` : `var(${variable}, ${fallback})`
}

/** Control-Höhen in px. */
export const controlSizesV2 = Object.freeze({
  sm: parseInt(tokens.size.control.sm.$value, 10),
  md: parseInt(tokens.size.control.md.$value, 10),
  lg: parseInt(tokens.size.control.lg.$value, 10),
  row: parseInt(tokens.size.row.$value, 10)
})

/** Breakpoints in px für window.matchMedia. */
export const breakpointsV2 = Object.freeze({
  phone: parseInt(tokens.layout.breakpoint.phone.$value, 10),
  tablet: parseInt(tokens.layout.breakpoint.tablet.$value, 10),
  desktop: parseInt(tokens.layout.breakpoint.desktop.$value, 10)
})
