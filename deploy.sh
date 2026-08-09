#!/usr/bin/env bash
#
# MP3 Konverter - Deploy (Server-seitig, direkt aus main)
# -------------------------------------------------------
# Baut den Branch (Default: main) DIREKT auf dem Server und deployt das
# Ergebnis nach /var/www/kodinitools.com/mp3konverter.
#
# Die Build-/Git-Arbeitskopie liegt unter /opt/mp3-konverter (NICHT im Webroot).
# Nur das fertige dist/ wird per rsync ins Webroot gespiegelt.
#
# Einmalig (Klon anlegen):
#   git clone https://github.com/KodiniTools/MP3-Konverter.git /opt/mp3-konverter
#
# Danach bei jedem Deploy:
#   cd /opt/mp3-konverter && bash deploy.sh
# (Das Skript aktualisiert seine eigene Arbeitskopie auf origin/main, baut und deployt.)
#
# Konfiguration per Umgebungsvariablen (optional):
#   REPO_URL   Git-Repository (Default: GitHub-Repo)
#   BRANCH     Zu bauender Branch (Default: main)
#   SRC_DIR    Arbeitskopie/Checkout auf dem Server (Default: /opt/mp3-konverter)
#   DEPLOY_DIR Zielordner / Webroot des Tools
#   OWNER      chown-Ziel für das Webroot (Default: www-data:www-data; leeren mit OWNER="")
#
set -euo pipefail

# ---------- Konfiguration ----------
REPO_URL="${REPO_URL:-https://github.com/KodiniTools/MP3-Konverter.git}"
BRANCH="${BRANCH:-main}"
SRC_DIR="${SRC_DIR:-/opt/mp3-konverter}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/kodinitools.com/mp3konverter}"
OWNER="${OWNER:-www-data:www-data}"

# Pfade, die beim Deploy NICHT gelöscht/überschrieben werden (relativ zu DEPLOY_DIR).
# "files" wird in der Nginx-Config an das Backend (:9009) geproxied und ist im
# Webroot normalerweise leer – bleibt defensiv erhalten, falls doch etwas darin liegt.
KEEP=("files")

# ---------- Hilfsfunktionen ----------
log()  { printf '\033[36m[DEPLOY]\033[0m %s\n' "$*"; }
ok()   { printf '\033[32m[OK]\033[0m %s\n' "$*"; }
warn() { printf '\033[33m[WARN]\033[0m %s\n' "$*"; }
err()  { printf '\033[31m[FEHLER]\033[0m %s\n' "$*" >&2; }

require() {
  command -v "$1" >/dev/null 2>&1 || { err "'$1' nicht gefunden. Bitte installieren."; exit 1; }
}

# ---------- Vorbedingungen prüfen ----------
log "Prüfe benötigte Programme..."
require git
require node
require npm
command -v rsync >/dev/null 2>&1 || { err "'rsync' nicht gefunden. Installieren mit: apt-get install -y rsync"; exit 1; }

log "Node: $(node -v)  |  npm: $(npm -v)"

# ---------- Quellcode holen / aktualisieren ----------
if [ -d "$SRC_DIR/.git" ]; then
  log "Aktualisiere vorhandene Arbeitskopie in $SRC_DIR"
  # Verhindert 'dubious ownership', falls Skript und Repo unterschiedlichen Nutzern gehören
  git config --global --add safe.directory "$SRC_DIR" 2>/dev/null || true
  git -C "$SRC_DIR" fetch --prune origin
else
  log "Klone Repository nach $SRC_DIR"
  mkdir -p "$(dirname "$SRC_DIR")"
  git clone "$REPO_URL" "$SRC_DIR"
  git config --global --add safe.directory "$SRC_DIR" 2>/dev/null || true
fi

log "Checke Branch '$BRANCH' aus und setze auf origin/$BRANCH"
git -C "$SRC_DIR" checkout -B "$BRANCH" "origin/$BRANCH"
git -C "$SRC_DIR" reset --hard "origin/$BRANCH"
COMMIT="$(git -C "$SRC_DIR" rev-parse --short HEAD)"
ok "Stand: $BRANCH @ $COMMIT"

# ---------- Abhängigkeiten & Build ----------
log "Installiere Abhängigkeiten (npm ci)..."
if ! npm --prefix "$SRC_DIR" ci; then
  warn "npm ci fehlgeschlagen, versuche npm install..."
  npm --prefix "$SRC_DIR" install
fi

log "Baue Production-Build (npm run build)..."
npm --prefix "$SRC_DIR" run build

if [ ! -d "$SRC_DIR/dist" ]; then
  err "Build-Ausgabe '$SRC_DIR/dist' nicht gefunden."
  exit 1
fi
ok "Build erfolgreich."

# ---------- Deploy ----------
log "Deploye nach $DEPLOY_DIR (behalte: ${KEEP[*]})"
mkdir -p "$DEPLOY_DIR"

# rsync-Exclude-Argumente für zu erhaltende Pfade aufbauen
EXCLUDES=()
for path in "${KEEP[@]}"; do
  EXCLUDES+=(--exclude "/$path")
done

# --delete entfernt veraltete Build-Dateien, lässt aber die KEEP-Pfade in Ruhe.
rsync -a --delete "${EXCLUDES[@]}" "$SRC_DIR/dist/" "$DEPLOY_DIR/"

# Sicherstellen, dass der Laufzeit-Ordner existiert
for path in "${KEEP[@]}"; do
  mkdir -p "$DEPLOY_DIR/$path"
done

# ---------- Optional: Besitzer setzen ----------
if [ -n "$OWNER" ]; then
  log "Setze Besitzer auf $OWNER"
  chown -R "$OWNER" "$DEPLOY_DIR"
fi

ok "Deployment abgeschlossen: $BRANCH @ $COMMIT"
log "URL: https://kodinitools.com/mp3konverter/"
