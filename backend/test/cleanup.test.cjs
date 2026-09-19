// Integrationstest für DELETE /api/converted/:filename
//
// Start (Aufrufbeispiel siehe backend/README.md):
//   NODE_PATH=<pfad>/node_modules PORT=9105 FILES_DIR=<tmp> \
//   SERVER_PATH=<pfad>/server.js node backend/test/cleanup.test.cjs
//
// Ohne installiertes ffmpeg kann backend/test/ffmpeg-stub.sh als Ersatz in den
// PATH gelegt werden (kopiert die Eingabe auf die Ausgabe).
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const FILES_DIR = process.env.FILES_DIR
const BASE = 'http://127.0.0.1:' + process.env.PORT

require(process.env.SERVER_PATH)

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

  // 2) DELETE ohne Token -> 403, Datei bleibt
  let r = await fetch(`${BASE}/api/converted/${encodeURIComponent(file)}`, { method: 'DELETE' })
  assert.strictEqual(r.status, 403, 'ohne Token 403')
  assert.ok(fs.existsSync(path.join(FILES_DIR, file)), 'Datei unangetastet')
  console.log('[2] ohne Token -> 403')

  // 3) DELETE mit falschem Token -> 403, Datei bleibt
  r = await fetch(`${BASE}/api/converted/${encodeURIComponent(file)}?token=falsch`, { method: 'DELETE' })
  assert.strictEqual(r.status, 403, 'falsches Token 403')
  assert.ok(fs.existsSync(path.join(FILES_DIR, file)), 'Datei unangetastet')
  console.log('[3] falsches Token -> 403')

  // 4) Fremde Datei im FILES_DIR (z. B. Musikplayer-Bibliothek) ist nicht löschbar
  const foreign = path.join(FILES_DIR, 'fremde-datei.mp3')
  fs.writeFileSync(foreign, 'x')
  r = await fetch(`${BASE}/api/converted/fremde-datei.mp3?token=${conv.deleteToken}`, { method: 'DELETE' })
  assert.strictEqual(r.status, 404, 'unregistrierte Datei 404')
  assert.ok(fs.existsSync(foreign), 'fremde Datei unangetastet')
  console.log('[4] fremde Datei -> 404, bleibt erhalten')

  // 5) Path-Traversal läuft ins Leere
  const outside = path.join(FILES_DIR, '..', 'nicht-löschen.txt')
  fs.writeFileSync(outside, 'x')
  r = await fetch(`${BASE}/api/converted/${encodeURIComponent('../nicht-löschen.txt')}?token=${conv.deleteToken}`, { method: 'DELETE' })
  assert.strictEqual(r.status, 404, 'traversal 404')
  assert.ok(fs.existsSync(outside), 'Datei ausserhalb unangetastet')
  console.log('[5] Path-Traversal -> 404, Datei ausserhalb bleibt')

  // 6) DELETE mit korrektem Token -> 200 und Datei ist weg
  r = await fetch(`${BASE}/api/converted/${encodeURIComponent(file)}?token=${encodeURIComponent(conv.deleteToken)}`, { method: 'DELETE' })
  assert.strictEqual(r.status, 200, 'korrektes Token 200')
  assert.ok(!fs.existsSync(path.join(FILES_DIR, file)), 'Datei gelöscht')
  console.log('[6] korrektes Token -> 200, Datei gelöscht')

  // 7) Zweiter DELETE -> 404 (idempotent aus Client-Sicht)
  r = await fetch(`${BASE}/api/converted/${encodeURIComponent(file)}?token=${encodeURIComponent(conv.deleteToken)}`, { method: 'DELETE' })
  assert.strictEqual(r.status, 404, 'zweiter Delete 404')
  console.log('[7] zweiter DELETE -> 404')

  // 8) Bestehende Endpoints unverändert erreichbar
  const health = await (await fetch(BASE + '/health')).json()
  assert.strictEqual(health.ok, true, 'health ok')
  const tracks = await (await fetch(BASE + '/api/tracks')).json()
  assert.strictEqual(tracks.ok, true, 'tracks ok')
  r = await fetch(BASE + '/api/files/clear', { method: 'DELETE' })
  assert.strictEqual(r.status, 401, '/api/files/clear weiterhin auth-geschuetzt')
  console.log('[8] health/tracks ok, /api/files/clear weiterhin 401')

  console.log('\nAlle Backend-Checks bestanden.')
  process.exit(0)
})().catch((e) => {
  console.error('FEHLGESCHLAGEN:', e.message)
  process.exit(1)
})
