# MP3 Konverter - Deployment Script
# Automatisches Build und Upload zum Server

param(
    [switch]$BuildOnly,
    [switch]$DeployOnly,
    [switch]$SkipConfirm
)

$SERVER = "root@145.223.81.100"
$REMOTE_PATH = "/var/www/kodinitools.com/mp3konverter/"
$LOCAL_DIST = "dist"

Write-Host ""
Write-Host "MP3 Konverter Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Pruefe ob scp verfuegbar ist
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "[FEHLER] scp nicht gefunden!" -ForegroundColor Red
    Write-Host "         Installiere OpenSSH oder Git Bash" -ForegroundColor Yellow
    exit 1
}

# BUILD PHASE
if (-not $DeployOnly) {
    Write-Host "[BUILD] Starte Build..." -ForegroundColor Yellow
    
    # Loesche alten dist Ordner
    if (Test-Path $LOCAL_DIST) {
        Write-Host "[INFO] Loesche alten dist Ordner..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $LOCAL_DIST
    }
    
    # Build ausfuehren
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[FEHLER] Build fehlgeschlagen!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[OK] Build erfolgreich!" -ForegroundColor Green
    Write-Host ""
    
    if ($BuildOnly) {
        Write-Host "[INFO] Build-Only Modus - Kein Deployment" -ForegroundColor Cyan
        exit 0
    }
}

# DEPLOY PHASE
if (-not $BuildOnly) {
    # Pruefe ob dist existiert
    if (-not (Test-Path $LOCAL_DIST)) {
        Write-Host "[FEHLER] dist Ordner nicht gefunden!" -ForegroundColor Red
        Write-Host "        Fuehre erst 'npm run build' aus" -ForegroundColor Yellow
        exit 1
    }
    
    # Bestaetigung (ausser mit -SkipConfirm)
    if (-not $SkipConfirm) {
        Write-Host "[DEPLOY] Bereit zum Upload:" -ForegroundColor Yellow
        Write-Host "         Von: ./$LOCAL_DIST/*" -ForegroundColor Gray
        Write-Host "         Nach: $SERVER`:$REMOTE_PATH" -ForegroundColor Gray
        Write-Host ""
        
        $confirm = Read-Host "Fortfahren? (j/n)"
        if ($confirm -notmatch "^[jJyY]$") {
            Write-Host "[ABBRUCH] Deployment abgebrochen" -ForegroundColor Red
            exit 0
        }
    }
    
    Write-Host ""
    Write-Host "[UPLOAD] Uploade zum Server..." -ForegroundColor Yellow
    
    # SCP Upload
    scp -r "$LOCAL_DIST/*" "${SERVER}:${REMOTE_PATH}"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[FEHLER] Upload fehlgeschlagen!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "[OK] Deployment erfolgreich!" -ForegroundColor Green
    Write-Host "[URL] https://kodinitools.com/mp3konverter/" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "Fertig!" -ForegroundColor Green
Write-Host ""
