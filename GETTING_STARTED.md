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

Die App nutzt Supreme (Indian Type Foundry, kostenlos über Fontshare, ITF Free Font License) in 400, 500 und 700. Die Dateien liegen wie im Collage Maker im Repository unter `src/assets/fonts/` und werden von Vite mitgebündelt; der Server braucht keinen eigenen `/fonts/`-Ordner mehr.

### Design-System

Die Oberfläche läuft auf den gemeinsamen KodiniTools-Tokens v2 (`--ds-*`), übernommen aus dem Collage Maker. Einstieg: `src/design-system/README.md`.

### Theme ändern
- Klicke auf 🌙/☀️ in der globalen Navigation (Hell/Dunkel, `localStorage.theme`); Standard ist Hell
- Die Kontrast-Themes `contrast-light`/`contrast-dark` greifen automatisch, wenn das Betriebssystem mehr Kontrast verlangt (`prefers-contrast: more`); es gibt keinen Schalter in der App
- Theme-Logik: `src/stores/theme.js`, Vorab-Theme vor dem ersten Paint: Inline-Skript in `index.html`

### Sprache ändern
- Klicke auf DE/EN in der globalen Navigation
- Übersetzungen der App in `src/locales/*.json`, der Navigation in `src/stores/ssiNavTranslations.js`

### Farben anpassen
- Farben, Radien, Schriftgrade und Abstände kommen aus `src/design-system/tokens-v2.css`
- Diese Datei ist eine Kopie der gemeinsamen KodiniTools-Tokens: Werte im Playlist Generator ändern und hierher übernehmen, damit alle Apps gleich bleiben
- In `src/assets/styles/main.scss` keine festen Farbwerte verwenden, nur `var(--ds-*)` (prüft `tests/designTokens.spec.js`)

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
