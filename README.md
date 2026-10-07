# 🎵 MP3 Konverter 

Eine moderne Vue 3-Anwendung für Browser-basierte MP3-Konvertierung mit FFmpeg.wasm.

## 📋 Features

✅ **Vue 3 Composition API** - Modern und wartbar  
✅ **Pinia State Management** - Zentralisierte Zustandsverwaltung  
✅ **Vue I18n** - Mehrsprachigkeit (DE/EN)  
✅ **Vite** - Blitzschnelles Development & Build  
✅ **FFmpeg.wasm** - Browser-basierte Audio-Konvertierung  
✅ **Design-System** - KodiniTools-Tokens v2 (`--ds-*`) wie Collage Maker und Playlist Generator  
✅ **Dark/Light Theme** - Standard Hell, automatische Persistierung  
✅ **Kontrast-Themes** - `contrast-light`/`contrast-dark` (Text ≥ 7:1) greifen automatisch bei `prefers-contrast: more`  
✅ **Responsive Design** - Mobile-first Ansatz  
✅ **Drag & Drop** - Intuitive Dateiauswahl  
✅ **Accessibility** - ARIA-Labels und Keyboard-Navigation  

## 🚀 Quick Start

### 1. Installation

```bash
cd mp3-konverter-vue
npm install
```

### 2. Development Server

```bash
npm run dev
```

Die Anwendung läuft auf `http://localhost:5173`

### 3. Production Build

```bash
npm run build
npm run preview
```

## 📁 Projektstruktur

```
mp3-konverter-vue/
├── index.html                    # HTML Entry Point
├── package.json                  # Dependencies
├── vite.config.js               # Vite Konfiguration
├── src/
│   ├── main.js                  # Vue App Entry
│   ├── App.vue                  # Haupt-Komponente
│   ├── design-system/           # Tokens v2 (Kopie aus dem Collage Maker) + Kontrast-Erweiterung
│   ├── assets/
│   │   ├── fonts/               # Supreme 400/500/700 (woff2)
│   │   └── styles/
│   │       └── main.scss        # Globale Styles auf --ds-* Tokens
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue    # Header mit Theme/Language Toggle
│   │   │   └── HeroSection.vue  # Hero Banner
│   │   ├── converter/
│   │   │   ├── FileUpload.vue   # Drag & Drop Upload
│   │   │   ├── FileList.vue     # Dateiliste
│   │   │   ├── ConversionOptions.vue  # Codec/Bitrate Optionen
│   │   │   ├── ActionButtons.vue      # Convert/Retry Buttons
│   │   │   ├── ProgressSection.vue    # Progress Bar
│   │   │   └── StatusMessage.vue      # Status Anzeige
│   │   └── sections/
│   │       ├── FeaturesSection.vue    # Features Grid
│   │       ├── OtherToolsSection.vue  # Andere Tools
│   │       └── FAQSection.vue         # FAQ Accordion
│   ├── stores/
│   │   ├── converter.js         # Konverter State & Logic
│   │   ├── theme.js             # Theme Management
│   │   ├── locale.js            # Sprache + Abgleich mit der globalen Navigation
│   │   └── ssiNavTranslations.js # Texte der globalen Navigation (wie Collage Maker)
│   └── locales/
│       ├── de.json               # Deutsche Übersetzungen
│       └── en.json               # Englische Übersetzungen
```

## 🎯 Migrations-Guide

### Von Vanilla JS zu Vue 3

#### 1. **State Management** (main.js → Pinia Stores)

**Vorher (Vanilla JS):**
```javascript
let selectedFiles = [];
let isFFmpegLoaded = false;
let progress = 0;
```

**Nachher (Vue + Pinia):**
```javascript
// stores/converter.js
export const useConverterStore = defineStore('converter', () => {
  const files = ref([])
  const isFFmpegLoaded = ref(false)
  const progress = ref(0)
  
  return { files, isFFmpegLoaded, progress }
})
```

#### 2. **Event Handling** (DOM → Vue Events)

**Vorher:**
```javascript
document.getElementById('convertBtn').addEventListener('click', startConversion)
```

**Nachher:**
```vue
<button @click="startConversion">Convert</button>
```

#### 3. **UI Updates** (Imperativ → Reaktiv)

**Vorher:**
```javascript
function updateProgress(percentage) {
  document.getElementById('progressBar').style.width = percentage + '%'
}
```

**Nachher:**
```vue
<template>
  <div class="progress-bar" :style="{ width: progress + '%' }">
    {{ progress }}%
  </div>
</template>

<script setup>
const progress = ref(0)
</script>
```

#### 4. **FFmpeg Integration**

Die FFmpeg-Logik wurde vollständig in den Pinia Store integriert:

```javascript
// stores/converter.js
async function initializeFFmpeg() {
  ffmpegInstance.value = new FFmpeg()
  
  ffmpegInstance.value.on('progress', ({ progress: p }) => {
    progress.value = Math.round(p * 100)
  })
  
  await ffmpegInstance.value.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  })
  
  isFFmpegLoaded.value = true
}
```

## 🔧 Komponenten-Übersicht

### Layout-Komponenten

#### AppHeader.vue
- Theme Toggle (Light/Dark) über die globale Navigation; Kontrast-Themes folgen der Systemeinstellung
- Language Toggle (DE/EN)
- Responsive Navigation

#### HeroSection.vue
- Hero Title & Subtitle
- Trust Badges (Sicher, Schnell, Kostenlos, DSGVO)

### Converter-Komponenten

#### FileUpload.vue
- Drag & Drop Funktionalität
- File Input Button
- Keyboard Accessibility

#### FileList.vue
- Liste ausgewählter Dateien
- Dateigröße Formatierung
- Datei-Entfernen Funktion

#### ConversionOptions.vue
- Codec-Auswahl (MP3/AAC)
- Bitrate-Auswahl (128k-320k)
- Output-Format Anzeige

#### ActionButtons.vue
- Convert Button (mit disabled State)
- Retry Button (conditional)

#### ProgressSection.vue
- Animierte Progress Bar
- Prozent-Anzeige
- ARIA Accessibility

#### StatusMessage.vue
- Status-Typen: info, success, error, warning
- ARIA Live Regions

### Section-Komponenten

#### FeaturesSection.vue
- 6 Feature Cards
- Flache Karten auf den Design-Tokens
- Responsive Grid

#### OtherToolsSection.vue
- Verlinkung zu anderen Tools
- External Links mit noopener

#### FAQSection.vue
- Accordion-Funktionalität
- Smooth Toggle Animation

## 🎨 Styling

Die Styles liegen in `src/assets/styles/main.scss` und nutzen ausschließlich die KodiniTools-Tokens v2
aus `src/design-system/` (übernommen aus dem Collage Maker):

- **Flache Flächen**: Seite, Karte, Eingabe, Hover in vier Stufen; ein Rahmen, drei Radien
- **Ein Akzent**: Gold nur für die Primäraktion, Fokus und aktive Zustände
- **Hell, Dunkel und zwei Kontrast-Themes** über `html[data-theme]`
- **SSI-Partials** werden per CSS an die Tokens angeglichen (wie im Collage Maker)
- **Accessibility**: Fokus-Ring, reduzierte Bewegung, Kontrast-Themes (Text ≥ 7:1)

## 🌐 Internationalisierung (i18n)

### Sprache wechseln

```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

function toggleLanguage() {
  locale.value = locale.value === 'de' ? 'en' : 'de'
}
</script>

<template>
  <p>{{ t('hero.title') }}</p>
</template>
```

### Neue Übersetzungen hinzufügen

Bearbeite `src/locales/de.json` und `src/locales/en.json`:

```json
{
  "neuerBereich": {
    "title": "Mein Titel",
    "description": "Meine Beschreibung"
  }
}
```

## 🔌 FFmpeg.wasm Setup

### Wichtige Konfiguration

Die `vite.config.js` enthält notwendige Headers für FFmpeg:

```javascript
server: {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
}
```

### Browser-Kompatibilität

FFmpeg.wasm benötigt:
- ✅ SharedArrayBuffer Support
- ✅ WebAssembly Support
- ✅ Moderne Browser (Chrome 92+, Firefox 89+, Safari 15.2+)

## 📦 Dependencies

### Production
- `vue@^3.4.0` - Vue Framework
- `pinia@^2.1.7` - State Management
- `vue-i18n@^9.9.0` - Internationalisierung
- `@ffmpeg/ffmpeg@^0.12.10` - FFmpeg WebAssembly
- `@ffmpeg/util@^0.12.1` - FFmpeg Utilities

### Development
- `@vitejs/plugin-vue@^5.0.0` - Vue Plugin für Vite
- `vite@^5.0.0` - Build Tool
- `sass@^1.69.5` - SCSS Support

## 🚀 Deployment

### Production Build erstellen

```bash
npm run build
```

Der Build wird in `dist/` erstellt und kann auf jedem Static Hosting deployed werden.

### Wichtig für Production

1. **Headers setzen** für FFmpeg (COOP/COEP)
2. **HTTPS verwenden** (für SharedArrayBuffer)
3. **Caching konfigurieren** für FFmpeg WASM-Dateien

### Beispiel: Netlify `_headers`

```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

## 🧪 Testing

### Unit Tests hinzufügen (optional)

```bash
npm install -D vitest @vue/test-utils
```

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom'
  }
})
```

## 🎯 Next Steps

### Weitere Verbesserungen

1. **TypeScript** hinzufügen für Type Safety
2. **Vue Router** für Multi-Page Navigation
3. **Composables** auslagern für Wiederverwendbarkeit
4. **Error Boundary** für besseres Error Handling
5. **Service Worker** für Offline-Funktionalität
6. **Web Vitals** Tracking implementieren

## 📚 Ressourcen

- [Vue 3 Dokumentation](https://vuejs.org/)
- [Pinia Dokumentation](https://pinia.vuejs.org/)
- [Vue I18n Dokumentation](https://vue-i18n.intlify.dev/)
- [Vite Dokumentation](https://vitejs.dev/)
- [FFmpeg.wasm Dokumentation](https://ffmpegwasm.netlify.app/)

## 🤝 Migration Checklist

- [x] Vue 3 Setup mit Vite
- [x] Pinia Store für State Management
- [x] Alle Komponenten in Vue konvertiert
- [x] FFmpeg.wasm Integration
- [x] i18n Implementation
- [x] Theme-Switching
- [x] Drag & Drop Funktionalität
- [x] Progress Tracking
- [x] Responsive Design
- [x] Accessibility Features
- [x] Error Handling

## 💡 Tipps

### Performance
- Lazy Loading für Komponenten nutzen
- FFmpeg WASM-Dateien cachen
- Code Splitting optimieren

### Debugging
```javascript
// FFmpeg Debug-Modus
ffmpegInstance.value.on('log', ({ message }) => {
  console.log('FFmpeg:', message)
})
```

### Custom Hooks erstellen
```javascript
// composables/useFileUpload.js
export function useFileUpload() {
  const files = ref([])
  
  function addFiles(newFiles) {
    files.value.push(...newFiles)
  }
  
  return { files, addFiles }
}
```

## 📝 Lizenz
 
MIT Lizenz

---

**Viel Erfolg mit der Vue.js-Migration! 🚀**

Bei Fragen oder Problemen: Dokumentation lesen oder Community fragen!

## Autor
Dinko Ramić Kodini Tools kodinitools.com
