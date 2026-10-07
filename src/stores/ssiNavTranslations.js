/**
 * Übersetzungen der globalen SSI-Navigation (nav.html auf kodinitools.com).
 * Schlüssel = data-i18n-, data-i18n-aria- und data-i18n-title-Attribute der Navigation.
 * Übernommen aus dem Collage Maker (src/stores/settings.ts, ssiNavTranslations), damit die
 * Navigation auf allen KodiniTools-Seiten dieselben Texte zeigt.
 */
export const SSI_NAV_TRANSLATIONS = Object.freeze({
  de: {
    'nav.audioTools': 'Audiotools',
    'nav.mp3Converter': 'MP3 Konverter',
    'nav.audioEqualizer': 'Interaktiver Audio Equalizer',
    'nav.modernPlayer': 'Moderner Musikplayer',
    'nav.ultimatePlayer': 'Ultimativer Musikplayer',
    'nav.playlistGenerator': 'Wiedergabeliste Generator',
    'nav.playlistConverter': 'Wiedergabeliste Konverter',
    'nav.alarmTool': 'Alarmtool',
    'nav.audioNormalizer': 'Audio Normalizer',
    'nav.visualizer': 'Visualizer',
    'nav.equalizer19': '19-Band Equalizer',
    'nav.audioConverter': 'Audio Konverter',
    'nav.imageTools': 'Bildtools',
    'nav.imageConverter': 'Bildkonverter',
    'nav.batchImageEditor': 'Bildserie bearbeiten',
    'nav.photoCollage': 'Fotocollage',
    'nav.tools': 'Tools',
    'nav.colorExtractor': 'Kodini Farbextraktor',
    'nav.videoConverter': 'Videokonverter',
    'nav.contact': 'Kontakt',
    'aria.toggleTheme': 'Theme wechseln',
    'aria.selectLanguage': 'Sprache wählen',
    'aria.menuOpen': 'Menü öffnen',
    'aria.menuClose': 'Menü schliessen',
    'aria.mainNav': 'Hauptnavigation'
  },
  en: {
    'nav.audioTools': 'Audio Tools',
    'nav.mp3Converter': 'MP3 Converter',
    'nav.audioEqualizer': 'Interactive Audio Equalizer',
    'nav.modernPlayer': 'Modern Music Player',
    'nav.ultimatePlayer': 'Ultimate Music Player',
    'nav.playlistGenerator': 'Audio Playlist Generator',
    'nav.playlistConverter': 'Playlist to WebM Converter',
    'nav.alarmTool': 'Alarm Tool',
    'nav.audioNormalizer': 'Audio Normalizer',
    'nav.visualizer': 'Visualizer',
    'nav.equalizer19': '19-Band Equalizer',
    'nav.audioConverter': 'Audio Converter',
    'nav.imageTools': 'Image Tools',
    'nav.imageConverter': 'Image Converter',
    'nav.batchImageEditor': 'Batch Image Editor',
    'nav.photoCollage': 'Photo Collage',
    'nav.tools': 'Tools',
    'nav.colorExtractor': 'Kodini Color Extractor',
    'nav.videoConverter': 'Video Converter',
    'nav.contact': 'Contact',
    'aria.toggleTheme': 'Toggle theme',
    'aria.selectLanguage': 'Select language',
    'aria.menuOpen': 'Open menu',
    'aria.menuClose': 'Close menu',
    'aria.mainNav': 'Main navigation'
  }
})

/**
 * Übersetzt alle Elemente der globalen Navigation mit data-i18n-Attributen.
 * Unbekannte Schlüssel bleiben unverändert; ohne Navigation passiert nichts.
 * @param {string} lang 'de' | 'en' (andere Werte fallen auf 'de')
 * @param {ParentNode} [root=document]
 */
export function translateSsiNav(lang, root = document) {
  const t = SSI_NAV_TRANSLATIONS[lang] || SSI_NAV_TRANSLATIONS.de
  const nav = root.querySelector('.global-nav')
  if (!nav) return

  nav.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    if (key && t[key]) el.textContent = t[key]
  })

  nav.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria')
    if (key && t[key]) el.setAttribute('aria-label', t[key])
  })

  nav.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title')
    if (key && t[key]) el.setAttribute('title', t[key])
  })
}

/**
 * Hält die active-Klasse der Sprachbuttons der Navigation synchron.
 * @param {string} lang
 * @param {ParentNode} [root=document]
 */
export function syncNavLangButtons(lang, root = document) {
  root.querySelectorAll('.global-nav-lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang)
  })
}
