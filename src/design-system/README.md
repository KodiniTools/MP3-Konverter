# Design-System · Tokens v2

Design-Tokens des MP3 Konverters. `tokens-v2.css` und `tokens-v2.json` sind unveränderte Kopien aus dem
Collage Maker (`KodiniTools/Collage-Maker`, `src/design-system/`, Stand `9dc4eca`), der sie wiederum
aus dem Playlist Generator übernimmt (`KodiniTools/Playlist-Generator`, Stand `89bb48e`). So teilen
alle drei Apps auf kodinitools.com dieselbe Palette, dieselben Radien und dieselbe Motion. Werte werden
im Playlist Generator gepflegt und von dort übernommen.

## Dateien

| Datei | Zweck |
| --- | --- |
| `tokens-v2.css` | **Laufzeit-Quelle.** CSS Custom Properties `--ds-*`: Dunkel auf `:root`, Hell auf `.light-theme` und `:root[data-theme='light']`. Kopie, nicht hier ändern. |
| `tokens-v2.json` | Maschinenlesbare Fassung, `$extensions.css` nennt die Variable. Kopie, nicht hier ändern. |
| `tokens-contrast.css` | **MP3-Konverter-Ergänzung.** Kontrast-Themes `contrast-light` und `contrast-dark` auf denselben Variablen. |
| `tokens-v2.js` | Zugriff für JavaScript, z. B. `themeColorsV2('light')` (Portierung von `tokens-v2.ts`). |
| `../../tests/design-system/tokens-v2.spec.js` | Konsistenz JSON ↔ CSS, Light-Spiegelung, Namespace, Einbindung, Kontrast AA (Standard) und AAA (Kontrast-Themes). |
| `../../tests/designTokens.spec.js` | Regressionsschutz für `main.scss` und die Komponenten. |

`src/main.js` lädt `tokens-v2.css`, dann `tokens-contrast.css`, dann `src/assets/styles/main.scss`.

## Theme-Mechanik

Wie im Collage Maker: Ein Inline-Skript in `index.html` setzt `html[data-theme]` vor dem ersten Paint
aus `localStorage.theme`, Standard ist Hell. Der Theme-Store (`src/stores/theme.js`) übernimmt danach
und setzt zusätzlich `html.dark` (Altbestand für externe Skripte), `body.light-theme` (nur im
Standard-Hell, Parität zum Playlist Generator) und das Icon des Theme-Umschalters der globalen
Navigation (🌙 im hellen, ☀️ im dunklen Schema).

Ergänzung des MP3 Konverters: Verlangt das Betriebssystem mehr Kontrast (`prefers-contrast: more`),
wird daraus `contrast-light` bzw. `contrast-dark`. Ziele: Text 1–3, Status und Link ≥ 7:1 auf Fläche
0–2, Text auf Akzent ≥ 7:1, Rahmen und Akzent ≥ 3:1. Der Fokus-Ring nutzt dort die Textfarbe.
`localStorage.theme` enthält weiterhin nur `light` oder `dark`.

## Rollen in main.scss

Der MP3 Konverter nutzt kein Tailwind; `main.scss` referenziert die Variablen direkt. Die Rollen
entsprechen der Tailwind-Brücke des Collage Makers:

| Rolle | Variable |
| --- | --- |
| Seite, Panel/Karte, Eingabe/Chip, Hover | `--ds-surface-0` … `--ds-surface-3` |
| Rahmen, Feld- und Sekundär-Button-Rahmen | `--ds-border`, `--ds-border-strong` |
| Text 1–3 | `--ds-text`, `--ds-text-2`, `--ds-text-3` |
| Primäraktion (Konvertieren, Play/Pause im Player, aktive Zeile) | `--ds-accent`, `--ds-accent-hover`, `--ds-on-accent` |
| Auswahl, aktive Fläche | `--ds-accent-soft` mit Rahmen `--ds-accent` |
| Link, Status | `--ds-link`, `--ds-success`, `--ds-warning`, `--ds-danger`, `--ds-info` |
| Radien | `--ds-radius-sm` (6) · `-md` (10) · `-lg` (16) · `-full` |
| Schatten | `--ds-shadow-overlay` (nur Player-Leiste) · `--ds-focus-ring` |
| Motion | `--ds-duration` (150 ms) · `--ds-duration-slow` (250 ms) · `--ds-ease` |
| Schriftgrade | `--ds-text-xs` 12 · `sm` 13 · `md` 14 · `lg` 16 (Body) · `xl` 20 · `2xl` 24 · `3xl` 32 (Hero) |
| Steuerelemente | `--ds-control-sm` 28 · `-md` 36 · `-lg` 40 · `--ds-row-height` 44 |

Komponenten-Muster aus dem UI-Kit des Collage Makers, als Klassen in `main.scss` nachgebaut:
`UiButton` (`.action-btn` Primär, `.btn-secondary`/`.save-file-btn`/`.retry-btn` Sekundär,
`.cancel-btn` Danger), `UiIconButton` (`.play-file-btn`, `.remove-file-btn`, `.player-btn`),
`UiPanel` (`.converter-wrapper`), `UiSelect` (`.option-select` mit `.select-chevron`),
`UiCallout` (`.status`), `UiKbd` (`.kbd`).

Regeln: Gold ist Vollfläche nur für die Primäraktion, Fokus und aktive Zustände. Ein Rahmen (1 px),
drei Radien, Schatten nur für Overlays. Hover ändert Farbe, nie Größe. Destruktive Aktionen sind
textbasiert (`--ds-danger`) auf einer flachen Fläche. Keine festen Farbwerte, keine Verläufe, keine
Unschärfe in `main.scss` – `tests/designTokens.spec.js` prüft das.

## SSI-Partials

Wie im Collage Maker gleicht `main.scss` die globalen Partials (`nav.html`, `footer.html`,
`cookie-banner.html` von kodinitools.com) an die Tokens an, statt sie selbst zu stylen: Nav und Footer
transparent, Dropdowns auf `--ds-surface-1`, Texte `--ds-text`, Links `--ds-link`, Link-Hover
`--ds-accent`, Hamburger in `currentColor`, Cookie-Banner ausgenommen und immer im Vordergrund.
Der Locale-Store übersetzt die Navigation mit derselben Tabelle wie der Collage Maker
(`src/stores/ssiNavTranslations.js`) und hält die Sprachbuttons synchron.

Drei Ergänzungen gegenüber dem Collage Maker, weil die Angleichung dort Zustände unsichtbar macht:
das geöffnete mobile Menü bekommt `--ds-surface-1` (sonst scheint die Seite durch), die aktive Sprache
bleibt eine Primärfläche, und die span/svg-Regeln nehmen Cookie-Elemente aus (sonst sind die Schalter
im Cookie-Modal an und aus gleich gefärbt).

Die Partial-Kopien im Repository lesen dieselben Tokens über lokale Aliase (`--kt-*`) mit Fallbacks in
den Token-Werten, damit sie auch auf Seiten ohne Tokens passen.
