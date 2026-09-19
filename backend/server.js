/**
 * MP3 Konverter — eigenständiges Backend
 * =======================================
 *
 * Ersetzt die Nutzung von /var/www/kodinitools.com/_backend_common/server.js.
 * Enthält ausschließlich, was die Konverter-Oberfläche tatsächlich aufruft:
 *
 *   GET    /health                            Statusprobe (nginx, Monitoring)
 *   GET    /files/<name>                      Ergebnis abholen (statisch)
 *   POST   /api/convert                       Datei konvertieren
 *   DELETE /api/converted/<name>?token=…      Ergebnis wieder löschen
 *
 * Bewusst NICHT enthalten (steckte im gemeinsamen Backend, wurde hier nie
 * benutzt): Login/Auth, Playlists, Player-State, /api/tracks, /api/upload,
 * /api/files/*, der Async-Job-Modus und der Konvertier-Zweig über file_url.
 * Jeder dieser Endpunkte war Angriffsfläche ohne Gegenwert — /api/tracks etwa
 * gab die Dateinamen aller Konvertierungen preis.
 *
 * Konfiguration (Umgebungsvariablen):
 *   PORT               Default 9009
 *   FILES_DIR          Ablage der Ergebnisse, Default <dieser Ordner>/files
 *   CONVERT_TTL_MS     Aufbewahrung nicht abgeholter Ergebnisse, Default 60 min,
 *                      0 schaltet den Sweeper ab
 *   FFMPEG_TIMEOUT_MS  Default 120000
 *   MAX_UPLOAD_BYTES   Default 314572800 (300 MB)
 */

const express = require('express')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')
const multer = require('multer')
const { nanoid } = require('nanoid')

const app = express()
app.disable('x-powered-by')

const PORT = Number(process.env.PORT) || 9009
const FILES_DIR = process.env.FILES_DIR || path.join(__dirname, 'files')
const CONVERT_TTL_MS =
  process.env.CONVERT_TTL_MS === undefined ? 60 * 60 * 1000 : Number(process.env.CONVERT_TTL_MS)
const FFMPEG_TIMEOUT_MS = Number(process.env.FFMPEG_TIMEOUT_MS) || 120000
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 300 * 1024 * 1024

// Nur kleine JSON-Bodies nötig (optionales Delete-Token). Die Audiodaten kommen
// als multipart und laufen an dieser Stelle vorbei.
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
})

// ---- Utils ----
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function safeUnlink(p) {
  try {
    fs.unlinkSync(p)
  } catch (_) {}
}

function sanitizeOutputName(base, wantedExt) {
  const cleanBase = String(base)
    .replace(/[^a-z0-9_\-.]+/gi, '_')
    .replace(/\.+/g, '.')
  const ext = (wantedExt || '').replace(/[^a-z0-9]/gi, '')
  return ext ? cleanBase + '.' + ext : cleanBase
}

function isAllowedFormat(fmt) {
  return ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff'].includes(
    String(fmt || '').toLowerCase()
  )
}

function validateBitrate(br) {
  return typeof br === 'string' && /^[1-9]\d{1,3}k$/i.test(br)
}

function validateSampleRate(sr) {
  const n = Number(sr)
  return Number.isInteger(n) && n >= 8000 && n <= 192000
}

function validateChannels(ch) {
  const n = Number(ch)
  return Number.isInteger(n) && n >= 1 && n <= 8
}

function qualityToBitrate(quality, format) {
  const q = Math.max(1, Math.min(10, Number(quality) || 5))
  if (format === 'opus') {
    const rates = [32, 48, 64, 96, 128, 160, 192, 256, 320, 510]
    return (rates[q - 1] || 128) + 'k'
  }
  const rates = [64, 96, 128, 160, 192, 224, 256, 320, 320, 320]
  return (rates[q - 1] || 192) + 'k'
}

/** Codec-Argumente je Zielformat. Identisch zum gemeinsamen Backend. */
function audioCodecArgs(fmt, bitrate, quality) {
  switch (fmt) {
    case 'mp3':
      return ['-codec:a', 'libmp3lame', '-b:a', bitrate || '192k']
    case 'aac':
      return ['-codec:a', 'aac', '-b:a', bitrate || '192k']
    case 'm4a':
      return ['-vn', '-codec:a', 'aac', '-b:a', bitrate || '192k', '-movflags', '+faststart']
    case 'ogg':
      return quality
        ? ['-codec:a', 'libvorbis', '-q:a', String(quality)]
        : ['-codec:a', 'libvorbis', '-b:a', bitrate || '192k']
    case 'flac': {
      const comprLevel = quality ? Math.min(8, Math.max(0, quality - 2)) : 5
      return ['-codec:a', 'flac', '-compression_level', String(comprLevel)]
    }
    case 'wav': {
      const codec =
        quality && quality > 7 ? 'pcm_f32le' : quality && quality > 4 ? 'pcm_s24le' : 'pcm_s16le'
      return ['-codec:a', codec]
    }
    case 'wma':
      return ['-codec:a', 'wmav2', '-b:a', bitrate || '192k']
    case 'opus':
      return ['-codec:a', 'libopus', '-b:a', bitrate || '128k']
    case 'aiff': {
      const codec =
        quality && quality > 7 ? 'pcm_s32be' : quality && quality > 4 ? 'pcm_s24be' : 'pcm_s16be'
      return ['-codec:a', codec]
    }
    default:
      return []
  }
}

function runFfmpeg(args, timeoutMs = FFMPEG_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', ['-nostdin', ...args], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    let killedByTimeout = false

    const timer = setTimeout(() => {
      killedByTimeout = true
      try {
        ff.kill('SIGKILL')
      } catch (_) {}
    }, timeoutMs)

    ff.stderr.on('data', (d) => (stderr += d.toString()))
    ff.on('error', (e) => {
      clearTimeout(timer)
      reject(new Error('ffmpeg_spawn_failed: ' + e.message))
    })
    ff.on('close', (code) => {
      clearTimeout(timer)
      if (killedByTimeout) return reject(new Error('ffmpeg_timeout'))
      code === 0 ? resolve() : reject(new Error(stderr || 'ffmpeg_exit_' + code))
    })
  })
}

// Von diesem Prozess erzeugte Ergebnisse: filename -> { token, createdAt }
//
// Das Delete-Token wird nur mit der Convert-Antwort ausgeliefert. Ein Client kann
// damit ausschließlich seine eigenen Ergebnisse löschen, fremde Dateien im
// FILES_DIR bleiben unantastbar.
const convertedOutputs = new Map()

ensureDir(FILES_DIR)

// ---- Routen ----

app.get('/health', (_req, res) =>
  res.json({ ok: true, port: PORT, filesDir: FILES_DIR, service: 'mp3konverter' })
)

// Ergebnis abholen. Kein Verzeichnis-Listing; die Namen tragen eine nanoid und
// sind damit nicht erratbar.
app.use('/files', express.static(FILES_DIR, { index: false, dotfiles: 'deny' }))

// Eine bereits gelöschte Datei erneut anzufragen ist der Normalfall (Reload nach
// dem Speichern). Deshalb ein eigener 404 statt express.static mit
// fallthrough:false — das protokolliert sonst bei jedem Treffer einen
// ENOENT-Stacktrace.
app.use('/files', (_req, res) => res.status(404).json({ ok: false, error: 'file_not_found' }))

app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('no_input')

    const fmt = String(req.body.format || '').toLowerCase()
    if (!isAllowedFormat(fmt)) throw new Error('bad_format')

    const quality = req.body.quality ? Math.max(1, Math.min(10, Number(req.body.quality))) : null
    const bitrate = req.body.bitrate || (quality ? qualityToBitrate(quality, fmt) : null)
    const { samplerate, channels } = req.body
    const normalize = String(req.body.normalize || 'false').toLowerCase() === 'true'

    if (bitrate && !validateBitrate(bitrate)) throw new Error('bad_bitrate')
    if (samplerate && !validateSampleRate(samplerate)) throw new Error('bad_samplerate')
    if (channels && !validateChannels(channels)) throw new Error('bad_channels')

    const base = (path.parse(req.file.originalname || 'audio').name || 'audio').replace(
      /[^a-z0-9_\-.]+/gi,
      '_'
    )
    const outName = sanitizeOutputName(base + '-' + nanoid(6), fmt)
    const outPath = path.join(FILES_DIR, outName)

    const args = ['-y', '-i', req.file.path]
    if (samplerate) args.push('-ar', String(samplerate))
    if (channels) args.push('-ac', String(channels))
    if (normalize) args.push('-filter:a', 'loudnorm=I=-16:TP=-1.5:LRA=11')
    args.push(...audioCodecArgs(fmt, bitrate, quality), outPath)

    console.log('[convert start]', { fmt, bitrate, samplerate, channels, normalize, out: outName })
    await runFfmpeg(args)

    const stats = fs.statSync(outPath)
    const deleteToken = nanoid(16)
    convertedOutputs.set(outName, { token: deleteToken, createdAt: Date.now() })

    console.log('[convert ok]', outName, stats.size + 'B')
    res.json({
      ok: true,
      url: '/files/' + outName,
      filename: outName,
      format: fmt,
      size: stats.size,
      deleteToken,
    })
  } catch (e) {
    console.error('[convert err]', e.message)
    const code = e.message === 'ffmpeg_timeout' ? 504 : e.message.startsWith('bad_') ? 400 : 500
    res.status(code).json({ ok: false, error: e.message })
  } finally {
    if (req.file && fs.existsSync(req.file.path)) safeUnlink(req.file.path)
  }
})

// Ergebnis wieder löschen. Ohne Login, aber nur mit dem Token aus der
// Convert-Antwort.
app.delete('/api/converted/:filename', (req, res) => {
  try {
    // basename() macht Path-Traversal ("../") unmöglich
    const filename = path.basename(String(req.params.filename || ''))
    const token = String((req.query && req.query.token) || (req.body && req.body.token) || '')

    const entry = convertedOutputs.get(filename)
    if (!entry) {
      // Bereits gelöscht oder nie von diesem Prozess erzeugt -> nichts zu tun
      return res.status(404).json({ ok: false, error: 'file_not_found' })
    }
    if (!token || token !== entry.token) {
      return res.status(403).json({ ok: false, error: 'invalid_token' })
    }

    convertedOutputs.delete(filename)
    safeUnlink(path.join(FILES_DIR, filename))
    console.log('[convert cleanup]', filename)
    res.json({ ok: true, filename })
  } catch (e) {
    console.error('[convert cleanup err]', e.message)
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Abgelaufene Ergebnisse aufräumen. Berührt ausschließlich Dateien, die dieser
// Prozess selbst erzeugt und registriert hat.
function sweepConvertedOutputs() {
  const now = Date.now()
  for (const [filename, entry] of convertedOutputs) {
    if (now - entry.createdAt < CONVERT_TTL_MS) continue
    convertedOutputs.delete(filename)
    safeUnlink(path.join(FILES_DIR, filename))
    console.log('[convert sweep]', filename)
  }
}

if (CONVERT_TTL_MS > 0) {
  const sweepTimer = setInterval(sweepConvertedOutputs, 5 * 60 * 1000)
  // Der Timer darf den Prozess nicht am Beenden hindern
  if (typeof sweepTimer.unref === 'function') sweepTimer.unref()
}

app.listen(PORT, '127.0.0.1', () => {
  console.log('MP3 Konverter Backend auf http://127.0.0.1:' + PORT + ' (FILES_DIR=' + FILES_DIR + ')')
})
