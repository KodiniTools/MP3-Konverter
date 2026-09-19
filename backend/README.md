# Backend: Cleanup konvertierter Dateien

`server.js` ist eine **Kopie** von `/var/www/kodinitools.com/_backend_common/server.js`
(Stand: Änderung „Cleanup nach dem Speichern"). Der Dienst wird von mehreren Tools
geteilt, die Datei liegt hier nur, damit die Änderung reviewbar und testbar ist.

> **Achtung Drift:** Vor dem Deploy prüfen, ob die Version auf dem Server
> zwischenzeitlich geändert wurde (`diff`), und ggf. nur den Cleanup-Teil übernehmen.

`backend/package.json` setzt lediglich `"type": "commonjs"`, weil das Frontend-Projekt
im Repo-Root `"type": "module"` verwendet und die CJS-Datei sonst nicht lädt. Auf dem
Server ist diese Datei nicht nötig.

## Warum ein neuer Endpoint

Das Frontend soll seine Ausgabedatei nach dem Speichern serverseitig löschen.
Die vorhandenen Lösch-Endpoints taugen dafür nicht:

| Endpoint | Problem |
| --- | --- |
| `DELETE /api/tracks/:filename` | `requireAuth` — der MP3-Konverter läuft ohne Login |
| `DELETE /api/files/clear` | `requireAuth` **und** löscht das gesamte `FILES_DIR`, also auch parallel laufende Konvertierungen anderer Nutzer |

## Die Änderung

1. **Registry:** `convertedOutputs` (`Map: filename -> { token, createdAt }`) hält die
   von diesem Prozess erzeugten Convert-Ausgaben.
2. **`POST /api/convert`** liefert zusätzlich `deleteToken` (16 Zeichen, `nanoid`) und
   registriert die Ausgabedatei. Der Async-Job (`?async=true`) reicht das Token ebenfalls durch.
3. **`DELETE /api/converted/:filename?token=…`** (neu, ohne Auth) löscht genau diese eine
   Datei — nur mit gültigem Token.
   * `path.basename()` schließt Path-Traversal aus.
   * Nicht registrierte Dateien (z. B. die Musikplayer-Bibliothek im selben `FILES_DIR`)
     → `404`, es wird nichts gelöscht.
   * Falsches/fehlendes Token → `403`.
   * Das Token wird nur mit der Convert-Antwort ausgeliefert, ein Client kann also
     ausschließlich seine eigenen Ergebnisse löschen.
4. **TTL-Sweeper:** Alle 5 Minuten werden registrierte Ausgaben älter als
   `CONVERT_TTL_MS` (Default 60 min) entfernt — Schutz gegen Karteileichen, wenn der
   Nutzer den Tab schließt. Der Sweeper fasst **ausschließlich** registrierte Dateien an,
   fremde Dateien im `FILES_DIR` bleiben unberührt. `CONVERT_TTL_MS=0` deaktiviert ihn.

Bestehende Endpoints bleiben unverändert.

## Deploy

Der Konverter läuft als pm2-App `mp3konverter-server` auf **Port 9009**. Vom
Server-Checkout aus:

```bash
cp /var/www/kodinitools.com/_backend_common/server.js \
   /var/www/kodinitools.com/_backend_common/server.js.bak-$(date +%F)
diff /var/www/kodinitools.com/_backend_common/server.js /opt/mp3-konverter/backend/server.js
cp /opt/mp3-konverter/backend/server.js /var/www/kodinitools.com/_backend_common/server.js
pm2 restart mp3konverter-server
```

`FILES_DIR` ist derzeit **nicht** gesetzt, die Ausgaben landen also im Default
`/var/www/kodinitools.com/_backend_common/files` — demselben Ordner, den andere
Dienste aus `_backend_common` benutzen. Genau deshalb löscht der Endpoint nur
registrierte Dateien. Optional trennen und Aufbewahrungszeit ändern:

```bash
CONVERT_TTL_MS=1800000 PORT=9009 FILES_DIR=/var/www/kodinitools.com/mp3konverter/files node server.js
```

**Nach dem Deploy prüfen**, dass nginx `DELETE` an `/mp3konverter/api/` durchreicht
(manche Configs erlauben nur `GET`/`POST`):

```bash
curl -i -X DELETE "https://kodinitools.com/mp3konverter/api/converted/gibtsnicht.mp3?token=x"
# erwartet: HTTP 404 mit {"ok":false,"error":"file_not_found"}
# HTTP 405 vom nginx => limit_except / proxy-Regel anpassen
```

## Test

`test/cleanup.test.cjs` startet den Server gegen ein temporäres `FILES_DIR` und prüft
Happy Path, Token-Prüfung, Path-Traversal, fremde Dateien und die unveränderten
Endpoints. Ohne installiertes `ffmpeg` kann `test/ffmpeg-stub.sh` als Ersatz dienen
(kopiert die Eingabe auf die Ausgabe).

```bash
# auf dem Server (dort liegen express/multer/nanoid bereits)
TMP=$(mktemp -d)
NODE_PATH=/var/www/kodinitools.com/_backend_common/node_modules \
PORT=9105 FILES_DIR="$TMP" \
SERVER_PATH=/var/www/kodinitools.com/_backend_common/server.js \
node backend/test/cleanup.test.cjs
```

Ein anderer Port als der Produktivport (9009) ist Pflicht — der Test startet einen
eigenen Serverprozess.

## Abhängigkeiten

`server.js` ist CommonJS und lädt alle Module per `require()`. Für **nanoid** heißt
das: Version 3 ist Pflicht (dual CJS/ESM). Ab Version 4 ist nanoid ESM-only; Node
lädt es dann nur über das experimentelle „ESM in require()" und meldet beim Start:

```
ExperimentalWarning: CommonJS module .../server.js is loading ES Module
.../node_modules/nanoid/index.js using require().
```

Das funktioniert heute, ist aber kein garantiertes Verhalten — ein Node-Update kann
den Start kippen. Deshalb festnageln:

```bash
cd /var/www/kodinitools.com/_backend_common
npm i "nanoid@^3.3.8" --save
pm2 restart mp3konverter-server
```

Gegenprobe — muss auf `index.cjs` zeigen, nicht auf `index.js`:

```bash
node -p "require.resolve('nanoid')"
# /var/www/kodinitools.com/_backend_common/node_modules/nanoid/index.cjs
```

`^3.3.8` statt nur `@3`, weil ältere 3.x-Versionen die Endlosschleife aus
GHSA-mwcw-c2x4-8c55 (nicht-ganzzahlige Größe) enthalten. Die benutzte API
(`nanoid(size)`) ist in 3.x und 5.x identisch, ebenso der Alphabet-Zeichensatz
`A–Za–z0–9_-` — an Dateinamen und Tokens ändert sich nichts. Nach dem Neustart darf
die Warnung im Error-Log nicht mehr auftauchen.
