# MP3 Konverter — eigenständiges Backend

`server.js` ist das Backend des MP3 Konverters. Es löst die Nutzung der geteilten
Datei `/var/www/kodinitools.com/_backend_common/server.js` ab und liegt jetzt im
Repository — damit wird es versioniert, getestet und von `deploy.sh` mitdeployt.

## Warum eigenständig

`_backend_common/server.js` wurde von `mp3konverter-server` **und**
`audiokonverter-server` geladen. Das hatte in der Praxis diese Folgen:

- Eine Änderung für den MP3 Konverter (TTL-Sweeper für Konvertierungs-Ergebnisse)
  wäre beim nächsten Neustart ungewollt im Audiokonverter gelandet und musste
  dort per `CONVERT_TTL_MS=0` entschärft werden.
- Der MP3 Konverter erbte Endpunkte, die er nie brauchte — darunter
  `GET /api/tracks` ohne Auth, das Dateiname, Größe und URL **jeder** Datei im
  `FILES_DIR` auslieferte. Zusammen mit der statischen Auslieferung von `/files/`
  waren damit die Konvertierungen fremder Nutzer auflistbar und herunterladbar.
- Die Datei lag in keinem Repository: kein Review, kein Test, Deploy nur per
  Hand mit vorherigem `diff`.

## Was drin ist — und was bewusst fehlt

| Endpunkt | Zweck |
| --- | --- |
| `GET /health` | Statusprobe für nginx und Monitoring |
| `GET /files/<name>` | Ergebnis abholen (statisch, kein Verzeichnis-Listing) |
| `POST /api/convert` | Datei konvertieren, liefert `url`, `filename`, `size`, `deleteToken` |
| `DELETE /api/converted/<name>?token=…` | Ergebnis wieder löschen |

Entfernt, weil die Oberfläche sie nie aufgerufen hat: Login/Auth, Playlists,
Player-State, `/api/tracks`, `/api/upload`, `/api/files/*`, der Async-Job-Modus
(`?async=true` inkl. `GET /api/job/:id`) und der Konvertier-Zweig über `file_url`.
Der Integrationstest prüft, dass diese Routen nicht mehr existieren.

Die Konvertierung selbst ist unverändert: dieselben ffmpeg-Argumente je Format,
dieselbe Namensbildung (`<basis>-<nanoid6>.<ext>`), dasselbe Upload-Limit.

### Cleanup-Konzept

Jede Ausgabe wird in einer Map registriert und bekommt ein Delete-Token, das nur
mit der Convert-Antwort ausgeliefert wird. Ein Client kann damit ausschließlich
seine eigenen Ergebnisse löschen. Ein TTL-Sweeper räumt nicht abgeholte
Ergebnisse nach `CONVERT_TTL_MS` (Default 60 min) ab und fasst dabei
ausschließlich selbst registrierte Dateien an.

## Konfiguration

| Variable | Default | Bedeutung |
| --- | --- | --- |
| `PORT` | `9009` | nginx proxied `/mp3konverter/` hierher |
| `FILES_DIR` | `<dieser Ordner>/files` | Ablage der Ergebnisse |
| `CONVERT_TTL_MS` | `3600000` | Aufbewahrung; `0` schaltet den Sweeper ab |
| `FFMPEG_TIMEOUT_MS` | `120000` | Abbruch langer Konvertierungen |
| `MAX_UPLOAD_BYTES` | `314572800` | 300 MB |

## Migration (einmalig)

Der Port bleibt **9009**, die nginx-Konfiguration muss also nicht angefasst
werden. Am besten in einer ruhigen Minute: Mit dem Wechsel des `FILES_DIR` sind
Ergebnisse, die noch im alten Ordner liegen, nicht mehr über
`/mp3konverter/files/…` erreichbar.

```bash
# 1) Repo-Stand holen
cd /opt/mp3-konverter
git fetch origin main && git reset --hard origin/main

# 2) Backend an seinen neuen Ort bringen
BACKEND_DIR=/var/www/kodinitools.com/mp3konverter-backend
mkdir -p "$BACKEND_DIR"
rsync -a --exclude '/node_modules' --exclude '/files' /opt/mp3-konverter/backend/ "$BACKEND_DIR/"
npm --prefix "$BACKEND_DIR" ci --omit=dev

# 3) Eventuelle Restdateien übernehmen (der Ordner gehört allein dem Konverter)
mkdir -p /var/www/kodinitools.com/mp3konverter/files
cp -n /var/www/kodinitools.com/_backend_common/files/* \
      /var/www/kodinitools.com/mp3konverter/files/ 2>/dev/null || true

# 4) pm2 auf das neue Backend umstellen
pm2 delete mp3konverter-server
cd "$BACKEND_DIR"
PORT=9009 FILES_DIR=/var/www/kodinitools.com/mp3konverter/files \
  pm2 start server.js --name mp3konverter-server --update-env
pm2 save
```

Verifizieren:

```bash
curl -s http://127.0.0.1:9009/health
# {"ok":true,"port":9009,"filesDir":"…/mp3konverter/files","service":"mp3konverter"}

curl -s -o /dev/null -w '%{http_code}\n' https://kodinitools.com/mp3konverter/api/tracks
# 404 – der Endpunkt existiert hier nicht mehr
```

Danach im Browser einmal konvertieren und speichern: Balken und Liste müssen
verschwinden, im Log steht `[convert cleanup] <datei>`.

### Rollback

```bash
pm2 delete mp3konverter-server
cd /var/www/kodinitools.com/_backend_common
PORT=9009 pm2 start server.js --name mp3konverter-server --update-env
pm2 save
```

## Deploy danach

`deploy.sh` übernimmt das Backend automatisch, sobald `BACKEND_DIR` existiert
(`DEPLOY_BACKEND=auto`): rsync ohne `node_modules` und `files/`, `npm ci --omit=dev`,
`pm2 restart`. Vor der Migration wird der Schritt übersprungen — das Skript fasst
fremden Code nie an. Steuerbar über `DEPLOY_BACKEND` (`auto`/`1`/`0`),
`BACKEND_DIR` und `BACKEND_APP`.

```bash
cd /opt/mp3-konverter && bash deploy.sh
```

## Test

`test/cleanup.test.cjs` startet den Server gegen ein temporäres `FILES_DIR` und
prüft Convert, Abruf über `/files`, Parametervalidierung, Token-Prüfung,
Path-Traversal, fremde Dateien und dass die entfernten Endpunkte 404 liefern.

```bash
npm --prefix backend ci
PORT=9105 FILES_DIR=$(mktemp -d) node backend/test/cleanup.test.cjs
```

Ein anderer Port als der Produktivport (9009) ist Pflicht — der Test startet
einen eigenen Serverprozess. Ohne installiertes `ffmpeg` kann
`test/ffmpeg-stub.sh` als Ersatz in den `PATH` gelegt werden (kopiert die
Eingabe auf die Ausgabe).

## Abhängigkeiten

`server.js` ist CommonJS und lädt alles per `require()`. Für **nanoid** heißt das:
Version 3 ist Pflicht (dual CJS/ESM). Ab Version 4 ist nanoid ESM-only; Node lädt
es dann nur über das experimentelle „ESM in require()" und warnt beim Start —
ein Node-Update kann den Start dann kippen. `package.json` pinnt deshalb
`^3.3.19`; ältere 3.x-Versionen als 3.3.8 enthalten zudem die Endlosschleife aus
GHSA-mwcw-c2x4-8c55.

Gegenprobe — muss auf `index.cjs` zeigen, nicht auf `index.js`:

```bash
node -p "require.resolve('nanoid')"
```

`mime-types` wird nicht mehr gebraucht (hing nur an `/api/upload`).

## Der Audiokonverter

`audiokonverter-server` läuft weiterhin aus `_backend_common` und hat dort
weiterhin das offene `GET /api/tracks`. Der Auth-Fix dafür liegt in der
Repo-History:

```bash
git show 7ce7f97:backend/server.js > /tmp/_backend_common.server.js
diff /var/www/kodinitools.com/_backend_common/server.js /tmp/_backend_common.server.js
```

Der saubere Weg ist, den Audiokonverter analog auf ein eigenes Backend
umzustellen; danach kann `_backend_common` verschwinden.
