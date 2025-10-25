import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/mp3konverter/',
  plugins: [vue()],
  
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
