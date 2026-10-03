/**
 * Formatiert den Bitraten-Wert der Konvertierungsoptionen ('192k') für die Anzeige ('192 kbps').
 * Unbekannte Werte werden unverändert zurückgegeben.
 * @param {string} value
 * @returns {string}
 */
export function formatBitrate(value) {
  const match = /^(\d+)k$/i.exec(String(value ?? '').trim())
  return match ? `${match[1]} kbps` : String(value ?? '')
}
