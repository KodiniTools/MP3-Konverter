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

```bash
scp backend/server.js root@145.223.81.100:/var/www/kodinitools.com/_backend_common/server.js
ssh root@145.223.81.100 "pm2 restart mp3konverter"   # bzw. den Prozess auf Port 9005 neu starten
```

Optional andere Aufbewahrungszeit:

```bash
CONVERT_TTL_MS=1800000 PORT=9005 FILES_DIR=/var/www/kodinitools.com/mp3konverter/files node server.js
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

Ein anderer Port als der Produktivport (9005) ist Pflicht — der Test startet einen
eigenen Serverprozess.
