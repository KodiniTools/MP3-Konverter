# Backend Status Check - MP3 Konverter (Port 9005)
# Prueft ob das Backend auf Port 9005 laeuft

$SERVER = "root@145.223.81.100"
$PORT = 9005

Write-Host ""
Write-Host "Backend Status Check - MP3 Konverter" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Port laeuft?
Write-Host "[1/3] Pruefe Port $PORT..." -ForegroundColor Yellow
$portCheck = ssh $SERVER "lsof -Pi :$PORT -sTCP:LISTEN -t 2>/dev/null"
if ($portCheck) {
    Write-Host "[OK] Backend Prozess laeuft (PID: $portCheck)" -ForegroundColor Green
} else {
    Write-Host "[FEHLER] Kein Prozess auf Port $PORT!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backend starten mit:" -ForegroundColor Yellow
    Write-Host "ssh $SERVER" -ForegroundColor Gray
    Write-Host "cd /var/www/kodinitools.com/_backend_common" -ForegroundColor Gray
    Write-Host "PORT=$PORT FILES_DIR=/var/www/kodinitools.com/mp3konverter/files node server.js &" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Oder mit PM2:" -ForegroundColor Yellow
    Write-Host "pm2 start server.js --name mp3konverter -- --port $PORT" -ForegroundColor Gray
    exit 1
}

# Test 2: Health Endpoint (direkt)
Write-Host ""
Write-Host "[2/3] Teste Health Endpoint (direkt)..." -ForegroundColor Yellow
$healthCheck = ssh $SERVER "curl -s http://127.0.0.1:$PORT/health"
if ($healthCheck -match '"ok":true') {
    Write-Host "[OK] Backend antwortet" -ForegroundColor Green
    Write-Host "Response: $healthCheck" -ForegroundColor Gray
} else {
    Write-Host "[FEHLER] Backend antwortet nicht korrekt" -ForegroundColor Red
    Write-Host "Response: $healthCheck" -ForegroundColor Gray
}

# Test 3: Nginx Proxy
Write-Host ""
Write-Host "[3/3] Teste Nginx Proxy..." -ForegroundColor Yellow
$proxyCheck = ssh $SERVER "curl -s https://kodinitools.com/mp3konverter/health"
if ($proxyCheck -match '"ok":true') {
    Write-Host "[OK] Nginx Proxy funktioniert" -ForegroundColor Green
} else {
    Write-Host "[WARNUNG] Nginx Proxy Problem" -ForegroundColor Yellow
    Write-Host "Response: $proxyCheck" -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Status Check abgeschlossen" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Teste die App unter:" -ForegroundColor Cyan
Write-Host "https://kodinitools.com/mp3konverter/" -ForegroundColor White
Write-Host ""
