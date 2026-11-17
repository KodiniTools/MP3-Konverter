import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { localizeHtml } from './src/utils/localizeHtml.js'
import { PAGE_META, SITE_URL } from './src/config/pageMeta.js'

/**
 * Schreibt neben dist/index.html eine englische Fassung dist/index.en.html mit
 * englischem <html lang>, Titel, Description, Canonical (?lang=en) sowie og:* und twitter:*.
 * nginx liefert sie für /mp3konverter/?lang=en aus, damit Crawler ohne JavaScript schon im
 * HTML Englisch sehen. Laufzeit-i18n und die deutsche index.html bleiben unverändert.
 */
function localizedIndexHtml() {
  return {
    name: 'localized-index-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const index = bundle['index.html']
      if (!index || index.type !== 'asset') {
        this.error('localized-index-html: index.html fehlt im Bundle')
      }
      const html =
        typeof index.source === 'string' ? index.source : new TextDecoder().decode(index.source)
      this.emitFile({
        type: 'asset',
        fileName: 'index.en.html',
        source: localizeHtml(html, { lang: 'en', ...PAGE_META.en, canonical: `${SITE_URL}?lang=en` }),
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/mp3konverter/',
  plugins: [vue(), localizedIndexHtml()],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // Wichtig für FFmpeg.wasm Support
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    fs: {
      // Allow serving files from node_modules
      allow: ['..']
    }
  },

  // Optimierungen für Production Build
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'ffmpeg-core': ['@ffmpeg/ffmpeg', '@ffmpeg/util']
        }
      }
    }
  },

  // Optimistic dependency pre-bundling
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    esbuildOptions: {
      target: 'esnext'
    }
  },

  // Worker-Support für FFmpeg
  worker: {
    format: 'es'
  }
})
