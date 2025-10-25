#!/bin/bash
# FFmpeg lokale Installation - FALLBACK falls CDN nicht funktioniert

echo "📦 Lade FFmpeg-Dateien lokal herunter..."

# Erstelle public/ffmpeg Verzeichnis
mkdir -p public/ffmpeg

# Download FFmpeg Core Dateien
echo "⬇️  Lade ffmpeg-core.js..."
curl -L "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js" -o public/ffmpeg/ffmpeg-core.js

echo "⬇️  Lade ffmpeg-core.wasm..."
curl -L "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm" -o public/ffmpeg/ffmpeg-core.wasm

echo "⬇️  Lade ffmpeg-core.worker.js..."
curl -L "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js" -o public/ffmpeg/ffmpeg-core.worker.js

echo "✅ FFmpeg-Dateien erfolgreich heruntergeladen!"
echo ""
echo "📝 Nächster Schritt:"
echo "Ändere in src/stores/converter.js die URLs von:"
echo "  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'"
echo "zu:"
echo "  const baseURL = '/ffmpeg'"
echo ""
echo "Dann: npm run dev"
