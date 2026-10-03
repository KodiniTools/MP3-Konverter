# 🚀 Getting Started - MP3 Konverter Vue

## Sofort loslegen in 3 Schritten

### 1️⃣ Dependencies installieren

```bash
cd mp3-konverter-vue
npm install
```

⏱️ **Dauer:** ~2-3 Minuten

### 2️⃣ Development Server starten

```bash
npm run dev
```

✅ **Fertig!** Die App läuft auf: `http://localhost:5173`

### 3️⃣ Im Browser öffnen

Öffne `http://localhost:5173` und teste:
- Datei hochladen (Drag & Drop oder Button)
- Codec & Bitrate wählen
- "Konvertieren" klicken
- Konvertierte Datei herunterladen

---

## 🎨 Schnelle Anpassungen

### Schrift Supreme

Die App nutzt Supreme (Indian Type Foundry, kostenlos über Fontshare) in 400, 500 und 700. Die Dateien liegen nicht im Repository, sondern zentral unter `/fonts/` auf dem Server:

- `/fonts/Supreme-Regular.woff2`
- `/fonts/Supreme-Medium.woff2`
- `/fonts/Supreme-Bold.woff2`

Fehlt ein Schnitt, fällt der Browser für dieses Gewicht auf die Systemschrift zurück. Download und Lizenz (Fontshare Free Font License): https://www.fontshare.com/fonts/supreme

### Theme ändern
- Klicke auf 🌙/☀️ Button im Header (Hell/Dunkel, `localStorage.theme`)
- „Hoher Kontrast“ oben rechts schaltet die Kontrast-Themes `contrast-light`/`contrast-dark` (`localStorage.mp3-converter-contrast`); ohne Wahl gilt `prefers-contrast: more`
- Oder ändere Standard in `src/stores/theme.js`

### Sprache ändern
- Klicke auf DE/EN Button im Header
- Übersetzungen in `src/locales/*.json`

### Farben anpassen
- Öffne `src/assets/styles/main.scss`
- Ändere CSS-Variablen in `:root`

```scss
:root {
  --primary-color: #2563eb; // Deine Farbe
  --success-color: #16a34a; // Deine Farbe
}
```

---

## 🏗️ Production Build

### Build erstellen

```bash
npm run build
```

Build-Ausgabe: `dist/` Ordner

### Build testen

```bash
npm run preview
```

Vorschau auf: `http://localhost:4173`

---

## 🆘 Häufige Probleme

### Problem: FFmpeg lädt nicht

**Lösung:**
- Prüfe Internetverbindung (FFmpeg lädt von CDN)
- Prüfe Browser-Console auf Fehler
- Verwende modernen Browser (Chrome 92+, Firefox 89+)

### Problem: Styles fehlen

**Lösung:**
```bash
npm install sass --save-dev
```

### Problem: Dependencies veraltet

**Lösung:**
```bash
npm update
```

---

## 📚 Nächste Schritte

1. **Code erkunden:** Starte mit `src/App.vue`
2. **README lesen:** Vollständige Doku in `README.md`
3. **Komponenten anpassen:** In `src/components/`
4. **Store erweitern:** In `src/stores/`

---

## 🔥 Profi-Tipps

### Hot Module Replacement (HMR)
Änderungen werden sofort im Browser sichtbar - kein Reload nötig!

### Vue DevTools
Installiere die [Vue DevTools Browser Extension](https://devtools.vuejs.org/) für besseres Debugging.

### VSCode Extensions
- **Volar** - Vue Language Support
- **ESLint** - Code Quality
- **Prettier** - Code Formatting

---

**Happy Coding! 🎉**

Bei Fragen → README.md lesen oder Issue erstellen
