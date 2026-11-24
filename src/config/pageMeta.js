// Titel und Beschreibung je Sprache, ohne Laufzeit-Abhängigkeiten (kein Pinia, kein DOM),
// damit auch der Build (vite.config.js) sie importieren kann.

/** Öffentliche URL der deutschen Hauptfassung (Englisch: `?lang=en`). */
export const SITE_URL = 'https://kodinitools.com/mp3konverter/'

/**
 * Deutsch steht zusätzlich statisch in index.html, Englisch schreibt der Build in
 * dist/index.en.html (siehe utils/localizeHtml.js).
 */
export const PAGE_META = {
  de: {
    title: 'MP3 Konverter online – WAV, FLAC, M4A in MP3 umwandeln | KodiniTools',
    description:
      'Audiodateien kostenlos in MP3 umwandeln: WAV, FLAC, M4A, OGG und AAC bis 100 MB. Ohne Registrierung, Verarbeitung auf DSGVO-konformen Servern.'
  },
  en: {
    title: 'Online MP3 Converter – Convert WAV, FLAC, M4A to MP3 | KodiniTools',
    description:
      'Convert audio files to MP3 for free: WAV, FLAC, M4A, OGG and AAC up to 100 MB. No sign-up, processed on GDPR-compliant servers.'
  }
}

/** Öffentliche URL der Konvertierungsanwendung (Route /app/). */
export const APP_URL = `${SITE_URL}app/`

/** Titel und Beschreibung der Anwendung unter /app/ (Build: dist/app/index.html, index.en.html). */
export const APP_PAGE_META = {
  de: {
    title: 'MP3 Konverter – Audiodateien jetzt in MP3 umwandeln | KodiniTools',
    description:
      'Dateien hochladen, Bitrate wählen, MP3 speichern: WAV, FLAC, M4A, OGG und AAC bis 100 MB kostenlos umwandeln, ohne Registrierung und DSGVO-konform.'
  },
  en: {
    title: 'MP3 Converter – Convert Audio Files to MP3 Now | KodiniTools',
    description:
      'Upload files, pick a bitrate, save your MP3: convert WAV, FLAC, M4A, OGG and AAC up to 100 MB for free, without sign-up and GDPR-compliant.'
  }
}

/** Seiten mit eigener URL und eigenem Head; Schlüssel entsprechen `meta.page` im Router. */
export const PAGES = {
  landing: { url: SITE_URL, meta: PAGE_META },
  app: { url: APP_URL, meta: APP_PAGE_META }
}
