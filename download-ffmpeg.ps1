# FFmpeg lokale Installation - FALLBACK falls CDN nicht funktioniert
# PowerShell Skript für Windows

Write-Host "📦 Lade FFmpeg-Dateien lokal herunter..." -ForegroundColor Cyan

# Erstelle public/ffmpeg Verzeichnis
New-Item -ItemType Directory -Force -Path "public/ffmpeg" | Out-Null

# Download FFmpeg Core Dateien
Write-Host "⬇️  Lade ffmpeg-core.js..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js" -OutFile "public/ffmpeg/ffmpeg-core.js"

Write-Host "⬇️  Lade ffmpeg-core.wasm..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm" -OutFile "public/ffmpeg/ffmpeg-core.wasm"

Write-Host "⬇️  Lade ffmpeg-core.worker.js..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js" -OutFile "public/ffmpeg/ffmpeg-core.worker.js"

Write-Host ""
Write-Host "✅ FFmpeg-Dateien erfolgreich heruntergeladen!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Nächster Schritt:" -ForegroundColor Cyan
Write-Host "Ändere in src/stores/converter.js die URLs von:"
Write-Host "  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'" -ForegroundColor White
Write-Host "zu:"
Write-Host "  const baseURL = '/ffmpeg'" -ForegroundColor Green
Write-Host ""
Write-Host "Dann: npm run dev"
