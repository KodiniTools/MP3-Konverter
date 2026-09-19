// Integrationstest für das eigenständige MP3-Konverter-Backend.
//
// Start (Aufrufbeispiel siehe backend/README.md):
//   PORT=9105 FILES_DIR=$(mktemp -d) node backend/test/cleanup.test.cjs
//
// Ohne installiertes ffmpeg kann backend/test/ffmpeg-stub.sh als Ersatz in den
// PATH gelegt werden (kopiert die Eingabe auf die Ausgabe).
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const FILES_DIR = process.env.FILES_DIR
const BASE = 'http://127.0.0.1:' + process.env.PORT

require(process.env.SERVER_PATH || path.join(__dirname, '..', 'server.js'))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

;(async () => {
  await sleep(500)

  // 1) Konvertieren -> Antwort enthält deleteToken, Datei liegt im FILES_DIR
  const fd = new FormData()
  fd.append('file', new Blob([Buffer.alloc(2048)], { type: 'audio/wav' }), 'ROCK 1.wav')
  fd.append('format', 'mp3')
  fd.append('bitrate', '192k')
  const conv = await (await fetch(BASE + '/api/convert', { method: 'POST', body: fd })).json()
  assert.strictEqual(conv.ok, true, 'convert ok')
  assert.ok(conv.deleteToken, 'deleteToken vorhanden')
  const file = conv.filename
  assert.ok(fs.existsSync(path.join(FILES_DIR, file)), 'Datei erzeugt')
  console.log('[1] convert ok ->', file, '| token', conv.deleteToken)

  // 2) Ergebnis ist über /files abrufbar (so holt das Frontend das Blob)
  let r = await fetch(`${BASE}/files/${encodeURIComponent(file)}`)
  assert.strictEqual(r.status, 200, '/files liefert die Datei')
  const bytes = Buffer.from(await r.arrayBuffer())
  assert.strictEqual(bytes.length, conv.size, 'Groesse stimmt mit der Convert-Antwort ueberein')
  console.log('[2] /files/<name> -> 200,', bytes.length, 'Bytes')

  // 3) Ungültige Parameter werden abgewiesen
  const badFd = new FormData()
  badFd.append('file', new Blob([Buffer.alloc(64)]), 'x.wav')
  badFd.append('format', 'exe')
  r = await fetch(BASE + '/api/convert', { method: 'POST', body: badFd })
  assert.strictEqual(r.status, 400, 'unerlaubtes Format -> 400')
  console.log('[3] unerlaubtes Format -> 400')

  // 4) DELETE ohne Token -> 403, Datei bleibt
  r = await fetch(`${BASE}/api/converted/${encodeURIComponent(file)}`, { method: 'DELETE' })
  assert.strictEqual(r.status, 403, 'ohne Token 403')
  assert.ok(fs.existsSync(path.join(FILES_DIR, file)), 'Datei unangetastet')
  console.log('[4] ohne Token -> 403')

  // 5) DELETE mit falschem Token -> 403, Datei bleibt
  r = await fetch(`${BASE}/api/converted/${encodeURIComponent(file)}?token=falsch`, {
    method: 'DELETE',
  })
  assert.strictEqual(r.status, 403, 'falsches Token 403')
  assert.ok(fs.existsSync(path.join(FILES_DIR, file)), 'Datei unangetastet')
  console.log('[5] falsches Token -> 403')

  // 6) Fremde Datei im FILES_DIR ist nicht löschbar
  const foreign = path.join(FILES_DIR, 'fremde-datei.mp3')
  fs.writeFileSync(foreign, 'x')
  r = await fetch(`${BASE}/api/converted/fremde-datei.mp3?token=${conv.deleteToken}`, {
    method: 'DELETE',
  })
  assert.strictEqual(r.status, 404, 'unregistrierte Datei 404')
  assert.ok(fs.existsSync(foreign), 'fremde Datei unangetastet')
  console.log('[6] fremde Datei -> 404, bleibt erhalten')

  // 7) Path-Traversal läuft ins Leere
  const outside = path.join(FILES_DIR, '..', 'nicht-loeschen.txt')
  fs.writeFileSync(outside, 'x')
  r = await fetch(
    `${BASE}/api/converted/${encodeURIComponent('../nicht-loeschen.txt')}?token=${conv.deleteToken}`,
    { method: 'DELETE' }
  )
  assert.strictEqual(r.status, 404, 'traversal 404')
  assert.ok(fs.existsSync(outside), 'Datei ausserhalb unangetastet')
  console.log('[7] Path-Traversal -> 404, Datei ausserhalb bleibt')

  // 8) DELETE mit korrektem Token -> 200, Datei weg und nicht mehr abrufbar
  r = await fetch(
    `${BASE}/api/converted/${encodeURIComponent(file)}?token=${encodeURIComponent(conv.deleteToken)}`,
    { method: 'DELETE' }
  )
  assert.strictEqual(r.status, 200, 'korrektes Token 200')
  assert.ok(!fs.existsSync(path.join(FILES_DIR, file)), 'Datei geloescht')
  r = await fetch(`${BASE}/files/${encodeURIComponent(file)}`)
  assert.strictEqual(r.status, 404, '/files liefert sie nicht mehr')
  console.log('[8] korrektes Token -> 200, Datei geloescht und nicht mehr abrufbar')

  // 9) Zweiter DELETE -> 404 (aus Client-Sicht idempotent)
  r = await fetch(
    `${BASE}/api/converted/${encodeURIComponent(file)}?token=${encodeURIComponent(conv.deleteToken)}`,
    { method: 'DELETE' }
  )
  assert.strictEqual(r.status, 404, 'zweiter Delete 404')
  console.log('[9] zweiter DELETE -> 404')

  // 10) Health
  const health = await (await fetch(BASE + '/health')).json()
  assert.strictEqual(health.ok, true, 'health ok')
  assert.strictEqual(health.service, 'mp3konverter', 'health nennt den Dienst')
  console.log('[10] health ok')

  // 11) Die Endpunkte des gemeinsamen Backends existieren hier nicht mehr.
  // /api/tracks gab früher die Dateinamen aller Konvertierungen preis.
  const entfernt = [
    ['GET', '/api/tracks'],
    ['DELETE', '/api/files/clear'],
    ['POST', '/api/login'],
    ['GET', '/api/playlists'],
    ['GET', '/api/player/state'],
    ['POST', '/api/upload'],
    ['GET', '/api/job/abc'],
  ]
  for (const [method, route] of entfernt) {
    const resp = await fetch(BASE + route, { method })
    assert.strictEqual(resp.status, 404, `${method} ${route} -> 404`)
    const body = await resp.text()
    assert.ok(!body.includes('fremde-datei'), `${route} gibt keine Dateinamen preis`)
  }
  console.log('[11] entfernte Endpunkte ->', entfernt.length + 'x 404')

  console.log('\nAlle Backend-Checks bestanden.')
  process.exit(0)
})().catch((e) => {
  console.error('FEHLGESCHLAGEN:', e.message)
  process.exit(1)
})
