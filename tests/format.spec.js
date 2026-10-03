import { describe, expect, it } from 'vitest'
import { formatBitrate } from '../src/utils/format'

describe('formatBitrate', () => {
  it('wandelt Store-Werte in die Anzeige um', () => {
    expect(formatBitrate('192k')).toBe('192 kbps')
    expect(formatBitrate('320K')).toBe('320 kbps')
  })

  it('lässt unbekannte Werte unverändert', () => {
    expect(formatBitrate('vbr')).toBe('vbr')
    expect(formatBitrate('')).toBe('')
    expect(formatBitrate(undefined)).toBe('')
  })
})
