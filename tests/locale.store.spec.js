import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { LOCALES, useLocaleStore } from '../src/stores/locale'
import { SSI_NAV_TRANSLATIONS, syncNavLangButtons, translateSsiNav } from '../src/stores/ssiNavTranslations'
import i18n from '../src/i18n'

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** Minimale globale Navigation wie nav.html (Desktop- und Mobil-Sprachbuttons). */
const NAV = `
  <nav class="global-nav" data-i18n-aria="aria.mainNav" aria-label="Hauptnavigation">
    <button class="global-nav-dropdown-toggle"><span data-i18n="nav.audioTools">Audiotools</span></button>
    <a data-i18n="nav.playlistGenerator">Audioplaylist Generator</a>
    <a data-i18n="nav.unbekannt">bleibt</a>
    <button class="global-nav-theme-toggle" data-i18n-aria="aria.toggleTheme" aria-label="Theme wechseln"></button>
    <button class="global-nav-hamburger" data-i18n-title="aria.menuOpen" title="Menü öffnen"></button>
    <button class="global-nav-lang-btn" data-lang="de">DE</button>
    <button class="global-nav-lang-btn" data-lang="en">EN</button>
    <button class="global-nav-lang-btn" data-lang="de">DE</button>
    <button class="global-nav-lang-btn" data-lang="en">EN</button>
  </nav>
  <span data-lang-de="Datenschutz" data-lang-en="Privacy">Datenschutz</span>`

describe('SSI-Navigation: Übersetzungen (aus dem Collage Maker)', () => {
  beforeEach(() => {
    document.body.innerHTML = NAV
  })

  it('haben für DE und EN dieselben Schlüssel', () => {
    expect(Object.keys(SSI_NAV_TRANSLATIONS.de).sort()).toEqual(Object.keys(SSI_NAV_TRANSLATIONS.en).sort())
  })

  it('übersetzen Text, aria-label und title; unbekannte Schlüssel bleiben', () => {
    translateSsiNav('en')
    expect(document.querySelector('[data-i18n="nav.audioTools"]').textContent).toBe('Audio Tools')
    expect(document.querySelector('[data-i18n="nav.playlistGenerator"]').textContent).toBe('Audio Playlist Generator')
    expect(document.querySelector('[data-i18n="nav.unbekannt"]').textContent).toBe('bleibt')
    expect(document.querySelector('.global-nav').getAttribute('aria-label')).toBe('Hauptnavigation') // Wurzel selbst nicht
    expect(document.querySelector('.global-nav-theme-toggle').getAttribute('aria-label')).toBe('Toggle theme')
    expect(document.querySelector('.global-nav-hamburger').getAttribute('title')).toBe('Open menu')

    translateSsiNav('de')
    expect(document.querySelector('[data-i18n="nav.playlistGenerator"]').textContent).toBe('Wiedergabeliste Generator')
  })

  it('fallen bei unbekannter Sprache auf Deutsch und tun ohne Navigation nichts', () => {
    translateSsiNav('fr')
    expect(document.querySelector('[data-i18n="nav.audioTools"]').textContent).toBe('Audiotools')
    document.body.innerHTML = ''
    expect(() => translateSsiNav('en')).not.toThrow()
  })

  it('markieren alle Sprachbuttons der gewählten Sprache als aktiv', () => {
    syncNavLangButtons('en')
    const active = [...document.querySelectorAll('.global-nav-lang-btn.active')].map((b) => b.dataset.lang)
    expect(active).toEqual(['en', 'en'])
  })
})

describe('Locale-Store', () => {
  let store

  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = NAV
    document.documentElement.removeAttribute('lang')
    setActivePinia(createPinia())
  })

  afterEach(() => {
    store?.cleanup()
  })

  it('startet ohne Speicher auf Deutsch und gleicht Nav, html lang und i18n ab', () => {
    store = useLocaleStore()
    expect(store.locale).toBe('de')
    expect(document.documentElement.lang).toBe('de')
    expect(i18n.global.locale.value).toBe('de')
    expect([...document.querySelectorAll('.global-nav-lang-btn.active')].map((b) => b.dataset.lang)).toEqual(['de', 'de'])
    expect(document.querySelector('[data-i18n="nav.playlistGenerator"]').textContent).toBe('Wiedergabeliste Generator')
  })

  it('ignoriert unbekannte gespeicherte Sprachen', () => {
    localStorage.setItem('locale', 'fr')
    store = useLocaleStore()
    expect(store.locale).toBe('de')
  })

  it('übernimmt das Event locale-changed der Navigation', async () => {
    store = useLocaleStore()
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: 'en' } }))
    await flush()
    expect(store.locale).toBe('en')
    expect(localStorage.getItem('locale')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.querySelector('[data-i18n="nav.audioTools"]').textContent).toBe('Audio Tools')
    expect(document.querySelector('[data-lang-de]').textContent).toBe('Privacy')
  })

  it('übernimmt Klicks auf die Sprachbuttons (Navigation ohne Event)', async () => {
    store = useLocaleStore()
    document.querySelectorAll('.global-nav-lang-btn')[1].click()
    await flush()
    expect(store.locale).toBe('en')
  })

  it('ignoriert ungültige Werte aus Event und setLocale', async () => {
    store = useLocaleStore()
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: 'xx' } }))
    store.setLocale('xx')
    await flush()
    expect(store.locale).toBe('de')
    expect(LOCALES).toEqual(['de', 'en'])
  })

  it('entfernt die Listener bei cleanup', async () => {
    store = useLocaleStore()
    store.cleanup()
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: 'en' } }))
    document.querySelectorAll('.global-nav-lang-btn')[1].click()
    await flush()
    expect(store.locale).toBe('de')
  })
})
