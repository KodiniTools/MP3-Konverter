import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Eigene Konfiguration, damit vite.config.js (Build) unveraendert bleibt.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    // jsdom wird benoetigt: i18n/locale lesen beim Import localStorage,
    // der Speichern-Pfad nutzt window/document.
    environment: 'jsdom',
    include: ['tests/**/*.spec.js'],
    restoreMocks: true
  }
})
